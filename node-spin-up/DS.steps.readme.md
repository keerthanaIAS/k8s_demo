# Cluster Autoscaler + CAPI + CAPD — Complete POC Reference

## Final Architecture
```
Pending Pod → Cluster Autoscaler → CAPI MachineDeployment (1→2) → CAPD → New Docker Worker → Node Ready → Pod Scheduled ✅
```

---

## 1. Version Check
```bash
kubectl version --client
kind version
clusterctl version
helm version
docker version
```
**Our versions:** kubectl v1.32.2, kind v0.32.0, clusterctl v1.13.4, helm v4.2.4, CAPI v1.14.0, K8s v1.35.1

---

## 2. Verify Management Cluster
```bash
kind get clusters
kubectl config get-contexts
kubectl --context=kind-capi-management get nodes
kubectl --context=kind-capi-management get pods -A
clusterctl get providers
```

---

## 3. Initialize CAPI + CAPD (if fresh)
```bash
clusterctl init --infrastructure docker
```

---

## 4. Create Workload Cluster
```bash
clusterctl generate cluster node-spinup \
  --flavor development \
  --kubernetes-version v1.35.1 \
  --control-plane-machine-count=1 \
  --worker-machine-count=1 \
  > node-spinup.yaml

kubectl --context=kind-capi-management apply -f node-spinup.yaml

kubectl --context=kind-capi-management get cluster,machinedeployment,machines -A
```

---

## 5. Get Workload Kubeconfig
```bash
clusterctl get kubeconfig node-spinup > node-spinup-kubeconfig.yaml
kubectl --kubeconfig=node-spinup-kubeconfig.yaml get nodes
```

---

## 6. Find Load Balancer Port & Fix Kubeconfig
```bash
docker ps --format 'table {{.Names}}\t{{.Ports}}' | grep node-spinup
# Found: 55009 -> 6443

# Update kubeconfig server to: https://127.0.0.1:55009
# Add: insecure-skip-tls-verify: true
```

---

## 7. Install Calico CNI
```bash
kubectl --kubeconfig=node-spinup-kubeconfig.yaml apply --validate=false -f https://raw.githubusercontent.com/projectcalico/calico/v3.32.2/manifests/calico.yaml

kubectl --kubeconfig=node-spinup-kubeconfig.yaml get nodes
# control-plane Ready, worker Ready
```

---

## 8. Annotate MachineDeployment for Autoscaler
```bash
# Get MachineDeployment name
kubectl --context=kind-capi-management get machinedeployment -A

# Annotate
kubectl --context=kind-capi-management annotate machinedeployment node-spinup-md-0-29lx6 \
  cluster.x-k8s.io/cluster-api-autoscaler-node-group-min-size=1 \
  cluster.x-k8s.io/cluster-api-autoscaler-node-group-max-size=3 \
  --overwrite
```

---

## 9. Create Autoscaler Kubeconfigs

### For workload (from inside container):
```yaml
# node-spinup-autoscaler-kubeconfig.yaml
server: https://host.docker.internal:55009
insecure-skip-tls-verify: true
```

### For management (from inside container):
```yaml
# capi-management-autoscaler-kubeconfig.yaml
server: https://host.docker.internal:51421
insecure-skip-tls-verify: true
```

---

## 10. Create Secrets in Management Cluster
```bash
# Management kubeconfig
kubectl --context=kind-capi-management -n kube-system create secret generic cluster-autoscaler-management-kubeconfig \
  --from-file=cluster-api.yaml=capi-management-autoscaler-kubeconfig.yaml

# Workload kubeconfig
kubectl --context=kind-capi-management -n kube-system create secret generic node-spinup-kubeconfig \
  --from-file=kubeconfig=node-spinup-autoscaler-kubeconfig.yaml \
  --from-file=value=node-spinup-autoscaler-kubeconfig.yaml
```

---

## 11. Install Cluster Autoscaler via Helm
```bash
helm repo add autoscaler https://kubernetes.github.io/autoscaler
helm repo update

helm install cluster-autoscaler autoscaler/cluster-autoscaler \
  --namespace kube-system \
  --set cloudProvider=clusterapi \
  --set image.tag=v1.35.1 \
  --set replicaCount=1 \
  --set nodeGroupAutoDiscovery.clusterName=node-spinup \
  --set extraArgs.v=5 \
  --set extraArgs.logtostderr=true \
  --set extraArgs.stderrthreshold=info \
  --set extraArgs['cluster-api-cloud-config-authoritative']=true \
  --set extraVolumeMounts[0].name=workload-kubeconfig \
  --set extraVolumeMounts[0].mountPath=/etc/kubernetes \
  --set extraVolumeMounts[0].readOnly=true \
  --set extraVolumes[0].name=workload-kubeconfig \
  --set extraVolumes[0].secret.secretName=node-spinup-kubeconfig \
  --set extraVolumeMounts[1].name=management-kubeconfig \
  --set extraVolumeMounts[1].mountPath=/etc/kubernetes/management \
  --set extraVolumeMounts[1].readOnly=true \
  --set extraVolumes[1].name=management-kubeconfig \
  --set extraVolumes[1].secret.secretName=cluster-autoscaler-management-kubeconfig \
  --set extraArgs.kubeconfig=/etc/kubernetes/value \
  --set extraArgs.cloud-config=/etc/kubernetes/management/cluster-api.yaml
```

---

## 12. Verify Autoscaler Discovered Node Group
```bash
kubectl --context=kind-capi-management -n kube-system logs deployment/cluster-autoscaler-clusterapi-cluster-autoscaler --tail=100 | grep "discovered"
```
**Expected:** `discovered node group: MachineDeployment/default/node-spinup-md-0-29lx6 (min: 1, max: 3, replicas: 1)`

---

## 13. Create Resource-Constrained Deployment (Trigger)
```bash
kubectl --kubeconfig=node-spinup-kubeconfig.yaml create deployment autoscale-trigger --image=nginx --replicas=2
kubectl --kubeconfig=node-spinup-kubeconfig.yaml set resources deployment autoscale-trigger --requests=cpu=6,memory=4Gi
```

**Expected:** One pod Running, one Pending

---

## 14. Watch Autoscaler Detect & Scale
```bash
kubectl --context=kind-capi-management -n kube-system logs deployment/cluster-autoscaler-clusterapi-cluster-autoscaler --tail=200 | grep -E "unschedulable|scale-up|Scale-up"

# Expected logs:
# Found 1 unschedulable pods
# Final scale-up plan: MachineDeployment/default/node-spinup-md-0-29lx6 1->2
# Scale-up: setting group size to 2
```

---

## 15. ⚠️ CRITICAL FIX: Remove Topology Replicas (if reverting)
```bash
# If topology controller keeps reverting scale-up
kubectl --context=kind-capi-management patch cluster node-spinup --type=json -p='[{"op":"remove","path":"/spec/topology/workers/machineDeployments/0/replicas"}]'
```

---

## 16. Final Verification
```bash
# Check nodes
kubectl --kubeconfig=node-spinup-kubeconfig.yaml get nodes -o wide

# Check pods distribution
kubectl --kubeconfig=node-spinup-kubeconfig.yaml get pods -o wide | grep autoscale-trigger

# Check CAPI resources
kubectl --context=kind-capi-management get machinedeployment,machines -A

# Check Docker containers
docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep node-spinup
```

**Final Expected State:**
- 3 nodes total: 1 control-plane, 2 workers
- 2 autoscale-trigger pods, both Running, distributed across workers
- MachineDeployment: 2/2 ready

---

## What We Proved
✅ Cluster Autoscaler detects unschedulable pods  
✅ Autoscaler communicates with CAPI via MachineDeployment annotations  
✅ CAPI scales MachineDeployment 1→2  
✅ CAPD creates new Docker worker node  
✅ New node joins workload cluster  
✅ Pending pod scheduled and becomes Running  

---

## One-Liner Summary
> **Pending pod → Cluster Autoscaler → CAPI MachineDeployment (1→2) → CAPD → New Docker Worker → Node Ready → Pod Scheduled ✅**

---

**POC: COMPLETE ✅**