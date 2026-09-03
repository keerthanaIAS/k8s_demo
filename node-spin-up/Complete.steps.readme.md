# Cluster Autoscaler + CAPI + CAPD — Complete POC Steps

## 1. Check versions

```bash
kubectl version --client
kind version
clusterctl version
helm version
docker version
```

Expected versions from our setup:

```text
kubectl      v1.32.2
kind         v0.32.0
clusterctl   v1.13.4
helm         v4.2.4
CAPI         v1.14.0
Kubernetes   v1.35.1
```

---

# 2. Verify existing CAPI management cluster

```bash
kind get clusters
kubectl config get-contexts
kubectl --context=kind-capi-management get nodes
kubectl --context=kind-capi-management get pods -A
clusterctl get providers
```

Management cluster should be healthy.

---

# 3. Initialize CAPI + CAPD

If starting completely fresh:

```bash
clusterctl init --infrastructure docker
```

Verify:

```bash
kubectl --context=kind-capi-management get pods -A
clusterctl get providers
```

We already had this completed, so **do not rerun it on the existing setup**.

---

# 4. Create the workload cluster

Generate the workload cluster using the development flavor:

```bash
clusterctl generate cluster node-spinup \
  --flavor development \
  --kubernetes-version v1.35.1 \
  --control-plane-machine-count=1 \
  --worker-machine-count=1 \
  > node-spinup.yaml
```

Apply it:

```bash
kubectl --context=kind-capi-management apply -f node-spinup.yaml
```

Check:

```bash
kubectl --context=kind-capi-management get cluster
kubectl --context=kind-capi-management get machinedeployment -A
kubectl --context=kind-capi-management get machines -A
```

---

# 5. Get workload-cluster kubeconfig

```bash
clusterctl get kubeconfig node-spinup > node-spinup-kubeconfig.yaml
```

Check the workload cluster:

```bash
kubectl --kubeconfig=node-spinup-kubeconfig.yaml get nodes
```

---

# 6. Configure workload API endpoint

Because the workload cluster is running inside Docker/kind, we used the published load-balancer port.

First find it:

```bash
docker ps --format 'table {{.Names}}\t{{.Ports}}' | grep node-spinup
```

Our final workload API port was:

```text
55009 -> 6443
```

For the **Mac-side workload kubeconfig**, the server was:

```text
https://127.0.0.1:55009
```

with TLS verification disabled for this local POC.

The resulting kubeconfig was:

```text
node-spinup-kubeconfig.yaml
```

---

# 7. Install Calico CNI

```bash
kubectl --kubeconfig=node-spinup-kubeconfig.yaml apply --validate=false -f https://raw.githubusercontent.com/projectcalico/calico/v3.32.2/manifests/calico.yaml
```

Wait/check:

```bash
kubectl --kubeconfig=node-spinup-kubeconfig.yaml get pods -n kube-system
kubectl --kubeconfig=node-spinup-kubeconfig.yaml get nodes
```

Expected:

```text
control-plane   Ready
worker          Ready
```

---

# 8. Verify CAPI MachineDeployment

```bash
kubectl --context=kind-capi-management get machinedeployment -A
```

Our MachineDeployment:

```text
node-spinup-md-0-29lx6
```

Initial worker count:

```text
1
```

---

# 9. Add Cluster Autoscaler node-group annotations

```bash
kubectl --context=kind-capi-management annotate machinedeployment node-spinup-md-0-29lx6 \
  cluster.x-k8s.io/cluster-api-autoscaler-node-group-min-size=1 \
  cluster.x-k8s.io/cluster-api-autoscaler-node-group-max-size=3 \
  --overwrite
```

Verify:

```bash
kubectl --context=kind-capi-management get machinedeployment node-spinup-md-0-29lx6 -o yaml | grep cluster-api-autoscaler
```

---

# 10. Create a workload to test scheduling

We created a normal deployment with 10 replicas:

```bash
kubectl --kubeconfig=node-spinup-kubeconfig.yaml create deployment scale-test --image=nginx --replicas=10
```

Verify:

```bash
kubectl --kubeconfig=node-spinup-kubeconfig.yaml get pods -o wide
```

All 10 fit on the first worker, so this **did not trigger autoscaling**.

That was important: **pod count alone does not cause Cluster Autoscaler scale-up.**

The pod must be **unschedulable/Pending because of resource requests**.

---

# 11. Install Cluster Autoscaler Helm repository

```bash
helm repo add autoscaler https://kubernetes.github.io/autoscaler
helm repo update
helm search repo autoscaler/cluster-autoscaler
```

We used approximately:

```text
Chart: 9.59.0
Cluster Autoscaler: 1.35.0
```

---

# 12. Prepare workload kubeconfig for Cluster Autoscaler

The important difference:

### From Mac

```text
127.0.0.1:55009
```

### From inside the management-cluster container

```text
host.docker.internal:55009
```

So we created:

```text
node-spinup-autoscaler-kubeconfig.yaml
```

with:

```text
server: https://host.docker.internal:55009
```

and:

```text
insecure-skip-tls-verify: true
```

---

# 13. Prepare management-cluster kubeconfig

The Cluster Autoscaler needs access to the **management cluster** because CAPI MachineDeployment exists there.

Our management kubeconfig was:

```text
capi-management-autoscaler-kubeconfig.yaml
```

The management API was configured for the container-accessible endpoint:

```text
https://host.docker.internal:51421
```

with:

```text
insecure-skip-tls-verify: true
```

---

# 14. Create management kubeconfig Secret

```bash
kubectl --context=kind-capi-management -n kube-system create secret generic cluster-autoscaler-management-kubeconfig \
  --from-file=cluster-api.yaml=capi-management-autoscaler-kubeconfig.yaml \
  --dry-run=client -o yaml | kubectl --context=kind-capi-management apply -f -
```

---

# 15. Create workload kubeconfig Secret

We stored the workload kubeconfig in the management cluster:

```bash
kubectl --context=kind-capi-management -n kube-system create secret generic node-spinup-kubeconfig \
  --from-file=kubeconfig=node-spinup-autoscaler-kubeconfig.yaml \
  --from-file=value=node-spinup-autoscaler-kubeconfig.yaml \
  --dry-run=client -o yaml | kubectl --context=kind-capi-management apply -f -
```

---

# 16. Install Cluster Autoscaler

The important configuration was:

```text
cloud-provider=clusterapi
node-group-auto-discovery=clusterapi:clusterName=node-spinup
kubeconfig=/etc/kubernetes/value
cloud-config=/etc/kubernetes/management/mgmt-kubeconfig
cluster-api-cloud-config-authoritative=true
```

The Helm installation used the workload kubeconfig Secret and management kubeconfig Secret.

The resulting deployment:

```text
cluster-autoscaler-clusterapi-cluster-autoscaler
```

Check:

```bash
kubectl --context=kind-capi-management -n kube-system get pods | grep cluster-autoscaler
```

---

# 17. Verify Cluster Autoscaler initialization

```bash
kubectl --context=kind-capi-management -n kube-system logs deployment/cluster-autoscaler-clusterapi-cluster-autoscaler --tail=100
```

The critical successful log was:

```text
discovered node group:
MachineDeployment/default/node-spinup-md-0-29lx6
(min: 1, max: 3, replicas: 1)
```

This proved:

```text
Cluster Autoscaler
       ↓
CAPI MachineDeployment
```

was correctly connected.

---

# 18. Create the actual autoscaling trigger

We created 2 pods with large resource requests.

```bash
kubectl --kubeconfig=node-spinup-kubeconfig.yaml create deployment autoscale-trigger --image=nginx --replicas=2

kubectl --kubeconfig=node-spinup-kubeconfig.yaml set resources deployment autoscale-trigger \
  --requests=cpu=6,memory=4Gi
```

Check:

```bash
kubectl --kubeconfig=node-spinup-kubeconfig.yaml get pods -o wide
```

Initially:

```text
pod 1 → Running
pod 2 → Pending
```

Why?

The first worker could not satisfy the second pod's resource request.

Therefore:

```text
Pending pod
```

became the Cluster Autoscaler trigger.

---

# 19. Verify Cluster Autoscaler detected the Pending pod

```bash
kubectl --context=kind-capi-management -n kube-system logs deployment/cluster-autoscaler-clusterapi-cluster-autoscaler --tail=200 | grep -E "unschedulable|scale-up|Scale-up|node group"
```

The important logs were:

```text
Found ... pods in the cluster:
... 1 unschedulable
```

Then:

```text
Final scale-up plan:
MachineDeployment/default/node-spinup-md-0-29lx6
1->2
```

Then:

```text
Scale-up: setting group ... size to 2
```

This proved the **Cluster Autoscaler itself was working**.

---

# 20. First failure: Cluster Topology reverted 2 → 1

Initially the Cluster had:

```yaml
workers:
  machineDeployments:
  - class: default-worker
    name: md-0
    replicas: 1
```

Therefore:

```text
Cluster Autoscaler
1 → 2
      ↓
Cluster Topology controller
      ↓
2 → 1
```

The second Machine was deleted.

We diagnosed it using:

```bash
kubectl --context=kind-capi-management get machinedeployment node-spinup-md-0-29lx6 -o yaml
kubectl --context=kind-capi-management get cluster node-spinup -o yaml | sed -n '/topology:/,$p'
```

---

# 21. Final fix: remove fixed topology replicas

```bash
kubectl --context=kind-capi-management patch cluster node-spinup --type=json -p='[{"op":"remove","path":"/spec/topology/workers/machineDeployments/0/replicas"}]'
```

After this:

```yaml
workers:
  machineDeployments:
  - class: default-worker
    name: md-0
```

Now the topology controller no longer forces the worker count back to 1.

This was the **final blocker**.

---

# 22. Wait for CAPI cleanup

```bash
sleep 15

kubectl --context=kind-capi-management get cluster node-spinup
kubectl --context=kind-capi-management get machinedeployment node-spinup-md-0-29lx6
kubectl --context=kind-capi-management get machines -A -o wide
```

Final state became:

```text
Cluster workers: 2
MachineDeployment: 2 desired / 2 ready
Machines: 2 workers
```

---

# 23. Final verification from workload cluster

```bash
kubectl --kubeconfig=node-spinup-kubeconfig.yaml get nodes -o wide
kubectl --kubeconfig=node-spinup-kubeconfig.yaml get pods -o wide
kubectl --kubeconfig=node-spinup-kubeconfig.yaml get pods | grep autoscale-trigger
```

Final result:

```text
Control plane   Ready
Worker 1        Ready
Worker 2        Ready
```

And:

```text
autoscale-trigger   1/1 Running
autoscale-trigger   1/1 Running
```

Most importantly, the pods were distributed:

```text
Pod 1 → worker 1
Pod 2 → worker 2
```

---

# Final architecture

```text
                    Management Cluster
                    kind / CAPI
                         │
                         │
                Cluster Autoscaler
                         │
                         │ detects Pending Pod
                         ↓
                MachineDeployment
                  min=1 / max=3
                         │
                    scale 1 → 2
                         │
                         ↓
                Cluster API (CAPI)
                         │
                         ↓
                CAPD / DevMachine
                         │
                         ↓
                 Docker Worker 2
                         │
                         ↓
                Kubernetes Node Ready
                         │
                         ↓
                  Pending Pod
                         │
                         ↓
                    Running Pod
```

## The complete concept in one line

**Pending pod → Cluster Autoscaler detects insufficient capacity → CAPI MachineDeployment scales 1→2 → CAPD creates a new Docker worker → worker joins workload cluster → Pending pod gets scheduled.**

### POC demonstrated

> **Implemented and validated Kubernetes Cluster Autoscaling using Cluster Autoscaler with Cluster API (CAPI) and CAPD. A resource-constrained Pending pod automatically triggered MachineDeployment scaling from 1 to 2 workers, CAPI provisioned a new Docker-based worker node, the node joined the workload cluster successfully, and the Pending pod was automatically scheduled and became Running.**

**POC: COMPLETE ✅**

# POC steps — what and why

| Step | What                          | Why                                                               |
| ---- | ----------------------------- | ----------------------------------------------------------------- |
| 1    | Check versions                | Make sure required Kubernetes/CAPI tools are compatible           |
| 2    | Check management cluster      | Confirm CAPI control environment is healthy                       |
| 3    | Initialize CAPI + CAPD        | Install the controllers needed to manage/provision clusters       |
| 4    | Create workload cluster       | Create the Kubernetes cluster where we test autoscaling           |
| 5    | Get workload kubeconfig       | Allow us to access the workload cluster                           |
| 6    | Configure API endpoint        | Make the workload API reachable from the management cluster       |
| 7    | Install Calico                | Give the workload cluster pod networking                          |
| 8    | Check MachineDeployment       | Confirm the worker node is managed by CAPI                        |
| 9    | Add min/max annotations       | Tell Autoscaler the worker range is **1–3**                       |
| 10   | Create `scale-test`           | Initially test whether normal pod count causes scaling            |
| 11   | Add Autoscaler Helm repo      | Get the Cluster Autoscaler installation package                   |
| 12   | Prepare workload kubeconfig   | Let Autoscaler see workload-cluster nodes/pods                    |
| 13   | Prepare management kubeconfig | Let Autoscaler change the CAPI MachineDeployment                  |
| 14   | Create management Secret      | Give Autoscaler access to the management cluster                  |
| 15   | Create workload Secret        | Give Autoscaler access to the workload cluster                    |
| 16   | Install Cluster Autoscaler    | Start the component responsible for deciding when to add workers  |
| 17   | Check Autoscaler logs         | Confirm Autoscaler can communicate with both clusters             |
| 18   | Create `autoscale-trigger`    | Create resource pressure so one pod becomes Pending               |
| 19   | Check Pending pod             | Confirm there isn't enough worker capacity                        |
| 20   | Check Autoscaler              | Confirm it detects the Pending pod and requests **1 → 2 workers** |
| 21   | Fix topology replicas         | Stop CAPI Topology from forcing workers back to 1                 |
| 22   | Wait for CAPI                 | Allow CAPI/CAPD to create the second worker                       |
| 23   | Final verification            | Confirm new worker is Ready and Pending pod becomes Running       |
