keerthana@Mac-136 auto-healing-cluster-poc % chmod +x final-poc.sh
keerthana@Mac-136 auto-healing-cluster-poc % ./final-poc.sh
==========================================
🚀 CAPI NODE AUTO-HEALING POC
==========================================
📦 Creating Kind cluster...
Creating cluster "capi-mgmt" ...
 ✓ Ensuring node image (kindest/node:v1.36.1) 🖼
 ✓ Preparing nodes 📦  
 ✓ Writing configuration 📜 
 ✓ Starting control-plane 🕹️ 
 ✓ Installing CNI 🔌 
 ✓ Installing StorageClass 💾 
Set kubectl context to "kind-capi-mgmt"
You can now use your cluster with:

kubectl cluster-info --context kind-capi-mgmt

Have a nice day! 👋
📦 Installing CAPI v1.12.0...
Fetching providers
Installing cert-manager version="v1.20.3"
Waiting for cert-manager to be available...
Installing provider="cluster-api" version="v1.12.0" targetNamespace="capi-system"
Installing provider="bootstrap-kubeadm" version="v1.12.0" targetNamespace="capi-kubeadm-bootstrap-system"
Installing provider="control-plane-kubeadm" version="v1.12.0" targetNamespace="capi-kubeadm-control-plane-system"
Installing provider="infrastructure-docker" version="v1.12.0" targetNamespace="capd-system"

Your management cluster has been initialized successfully!

You can now create your first workload cluster by running the following:

  clusterctl generate cluster [name] --kubernetes-version [version] | kubectl apply -f -

pod/capi-controller-manager-8975f4d9c-skj6z condition met
pod/capd-controller-manager-77f944d696-9cqrx condition met
📦 Creating workload cluster...
clusterclass.cluster.x-k8s.io/quick-start created
dockerclustertemplate.infrastructure.cluster.x-k8s.io/quick-start-cluster created
kubeadmcontrolplanetemplate.controlplane.cluster.x-k8s.io/quick-start-control-plane created
dockermachinetemplate.infrastructure.cluster.x-k8s.io/quick-start-control-plane created
dockermachinetemplate.infrastructure.cluster.x-k8s.io/quick-start-default-worker-machinetemplate created
dockermachinepooltemplate.infrastructure.cluster.x-k8s.io/quick-start-default-worker-machinepooltemplate created
kubeadmconfigtemplate.bootstrap.cluster.x-k8s.io/quick-start-default-worker-bootstraptemplate created
cluster.cluster.x-k8s.io/my-cluster created
📦 Creating workers...
Warning: cluster.x-k8s.io/v1beta1 MachineDeployment is deprecated; use cluster.x-k8s.io/v1beta2 MachineDeployment
machinedeployment.cluster.x-k8s.io/my-cluster-md-0 created
Warning: bootstrap.cluster.x-k8s.io/v1beta1 KubeadmConfigTemplate is deprecated; use bootstrap.cluster.x-k8s.io/v1beta2 KubeadmConfigTemplate
kubeadmconfigtemplate.bootstrap.cluster.x-k8s.io/my-cluster-md-0 created
Warning: infrastructure.cluster.x-k8s.io/v1beta1 DockerMachineTemplate is deprecated; use infrastructure.cluster.x-k8s.io/v1beta2 DockerMachineTemplate
dockermachinetemplate.infrastructure.cluster.x-k8s.io/my-cluster-md-0 created
📦 Getting kubeconfig...
📦 Installing Calico...
📦 Installing MachineHealthCheck...
Warning: cluster.x-k8s.io/v1beta1 MachineHealthCheck is deprecated; use cluster.x-k8s.io/v1beta2 MachineHealthCheck
machinehealthcheck.cluster.x-k8s.io/worker-health-check created

==========================================
✅ SETUP COMPLETE!
==========================================

📊 Watch nodes become Ready:
  kubectl --kubeconfig workload-kubeconfig.yaml get nodes -w

🔧 Test auto-healing (after nodes are Ready):
  WORKER=$(docker ps --filter 'name=my-cluster-md-0' --format '{{.Names}}' | head -1)
  docker stop $WORKER
  kubectl get machines -w

==========================================
keerthana@Mac-136 auto-healing-cluster-poc % WORKER=$(docker ps --filter 'name=my-cluster-md-0' --format '{{.Names}}' | head -1)
keerthana@Mac-136 auto-healing-cluster-poc % docker stop $WORKER
my-cluster-md-0-4mxn2-lxzhj
keerthana@Mac-136 auto-healing-cluster-poc % kubectl get machines -w
NAME                          CLUSTER      NODE NAME   READY     AVAILABLE   UP-TO-DATE   PHASE          AGE    VERSION
my-cluster-md-0-fp9xk-mcgfx   my-cluster               False     False       True         Pending        91s    v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster               False     False       True         Pending        91s    v1.28.0
my-cluster-p5zc9-qtpxx        my-cluster               Unknown   False       True         Provisioning   105s   v1.28.0
my-cluster-p5zc9-qtpxx        my-cluster               Unknown   False       True         Provisioning   4m     v1.28.0
my-cluster-p5zc9-qtpxx        my-cluster               Unknown   False       True         Provisioning   4m     v1.28.0
my-cluster-md-0-fp9xk-mcgfx   my-cluster               False     False       True         Pending        3m46s   v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster               False     False       True         Pending        3m46s   v1.28.0
my-cluster-p5zc9-qtpxx        my-cluster               Unknown   False       True         Provisioning   4m      v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster               False     False       True         Pending        3m47s   v1.28.0
my-cluster-md-0-fp9xk-mcgfx   my-cluster               False     False       True         Pending        3m47s   v1.28.0
my-cluster-md-0-fp9xk-mcgfx   my-cluster               False     False       True         Pending        3m47s   v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster               False     False       True         Pending        3m47s   v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster               False     False       True         Pending        3m47s   v1.28.0
my-cluster-p5zc9-qtpxx        my-cluster               False     False       True         Provisioning   4m1s    v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster               False     False       True         Provisioning   3m47s   v1.28.0
my-cluster-md-0-fp9xk-mcgfx   my-cluster               False     False       True         Pending        3m47s   v1.28.0
my-cluster-md-0-fp9xk-mcgfx   my-cluster               False     False       True         Provisioning   3m47s   v1.28.0
my-cluster-p5zc9-qtpxx        my-cluster               False     False       True         Provisioning   4m1s    v1.28.0
my-cluster-p5zc9-qtpxx        my-cluster   my-cluster-p5zc9-qtpxx   False     False       True         Running        4m1s    v1.28.0
my-cluster-md-0-fp9xk-mcgfx   my-cluster                            False     False       True         Provisioning   3m47s   v1.28.0
my-cluster-md-0-fp9xk-mcgfx   my-cluster                            False     False       True         Provisioning   3m47s   v1.28.0
my-cluster-p5zc9-qtpxx        my-cluster   my-cluster-p5zc9-qtpxx   False     False       True         Running        4m1s    v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster                            False     False       True         Provisioning   3m47s   v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster                            False     False       True         Provisioning   3m47s   v1.28.0
my-cluster-p5zc9-qtpxx        my-cluster   my-cluster-p5zc9-qtpxx   False     False       True         Running        4m1s    v1.28.0
my-cluster-p5zc9-qtpxx        my-cluster   my-cluster-p5zc9-qtpxx   False     False       True         Running        4m1s    v1.28.0
my-cluster-p5zc9-qtpxx        my-cluster   my-cluster-p5zc9-qtpxx   False     False       True         Running        4m1s    v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster                            False     False       True         Provisioning   3m59s   v1.28.0
my-cluster-md-0-fp9xk-mcgfx   my-cluster                            False     False       True         Provisioning   3m59s   v1.28.0
my-cluster-p5zc9-qtpxx        my-cluster   my-cluster-p5zc9-qtpxx   False     False       True         Running        4m17s   v1.28.0
my-cluster-p5zc9-qtpxx        my-cluster   my-cluster-p5zc9-qtpxx   False     False       True         Running        4m17s   v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster                            Unknown   False       True         Provisioning   4m15s   v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster                            False     False       True         Provisioning   4m15s   v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster                            False     False       True         Provisioning   4m15s   v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster   my-cluster-md-0-fp9xk-nm5js   False     False       True         Running        4m15s   v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster   my-cluster-md-0-fp9xk-nm5js   False     False       True         Running        4m15s   v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster   my-cluster-md-0-fp9xk-nm5js   False     False       True         Running        4m15s   v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster   my-cluster-md-0-fp9xk-nm5js   False     False       True         Running        4m25s   v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster   my-cluster-md-0-fp9xk-nm5js   False     False       True         Running        4m45s   v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster   my-cluster-md-0-fp9xk-nm5js   False     False       True         Running        4m45s   v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster   my-cluster-md-0-fp9xk-nm5js   False     False       True         Running        4m45s   v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster   my-cluster-md-0-fp9xk-nm5js   False     False       True         Running        4m45s   v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster   my-cluster-md-0-fp9xk-nm5js   False     False       True         Running        4m45s   v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster   my-cluster-md-0-fp9xk-nm5js   False     False       True         Running        4m45s   v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster   my-cluster-md-0-fp9xk-nm5js   False     False       True         Running        4m45s   v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster   my-cluster-md-0-fp9xk-nm5js   False     False       True         Running        4m45s   v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster   my-cluster-md-0-fp9xk-nm5js   False     False       True         Running        4m46s   v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster   my-cluster-md-0-fp9xk-nm5js   False     False       True         Deleting       4m46s   v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster   my-cluster-md-0-fp9xk-nm5js   False     False       True         Deleting       4m46s   v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster   my-cluster-md-0-fp9xk-nm5js   False     False       True         Deleting       4m47s   v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster   my-cluster-md-0-fp9xk-nm5js   False     False       True         Deleting       4m48s   v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster   my-cluster-md-0-fp9xk-nm5js   False     False       True         Deleting       4m48s   v1.28.0
my-cluster-md-0-fp9xk-nm5js   my-cluster   my-cluster-md-0-fp9xk-nm5js   False     False       True         Deleting       4m48s   v1.28.0
my-cluster-md-0-fp9xk-l82qj   my-cluster                                                                                   0s      v1.28.0
my-cluster-md-0-fp9xk-l82qj   my-cluster                                                                                   0s      v1.28.0
my-cluster-md-0-fp9xk-l82qj   my-cluster                                 False     False       True                        1s      v1.28.0
my-cluster-md-0-fp9xk-l82qj   my-cluster                                 False     False       True         Pending        1s      v1.28.0
my-cluster-md-0-fp9xk-l82qj   my-cluster                                 False     False       True         Pending        1s      v1.28.0
my-cluster-md-0-fp9xk-l82qj   my-cluster                                 False     False       True         Pending        1s      v1.28.0
my-cluster-md-0-fp9xk-l82qj   my-cluster                                 False     False       True         Pending        1s      v1.28.0
my-cluster-md-0-fp9xk-l82qj   my-cluster                                 False     False       True         Pending        1s      v1.28.0
my-cluster-md-0-fp9xk-l82qj   my-cluster                                 False     False       True         Provisioning   1s      v1.28.0
my-cluster-md-0-fp9xk-l82qj   my-cluster                                 False     False       True         Provisioning   1s      v1.28.0
my-cluster-md-0-fp9xk-l82qj   my-cluster                                 False     False       True         Provisioning   1s      v1.28.0
my-cluster-md-0-fp9xk-l82qj   my-cluster                                 False     False       True         Provisioning   8s      v1.28.0
my-cluster-p5zc9-qtpxx        my-cluster   my-cluster-p5zc9-qtpxx        False     False       True         Running        5m35s   v1.28.0
my-cluster-p5zc9-qtpxx        my-cluster   my-cluster-p5zc9-qtpxx        False     False       True         Running        5m35s   v1.28.0
my-cluster-p5zc9-qtpxx        my-cluster   my-cluster-p5zc9-qtpxx        False     False       True         Running        6m3s    v1.28.0
my-cluster-md-0-fp9xk-mcgfx   my-cluster                                 False     False       True         Provisioning   7m      v1.28.0
my-cluster-md-0-fp9xk-l82qj   my-cluster                                 False     False       True         Provisioning   3m8s    v1.28.0
my-cluster-md-0-fp9xk-l82qj   my-cluster                                 Unknown   False       True         Provisioning   3m25s   v1.28.0
my-cluster-md-0-fp9xk-l82qj   my-cluster                                 False     False       True         Provisioning   3m25s   v1.28.0
my-cluster-md-0-fp9xk-l82qj   my-cluster                                 False     False       True         Provisioning   3m25s   v1.28.0
my-cluster-md-0-fp9xk-l82qj   my-cluster   my-cluster-md-0-fp9xk-l82qj   False     False       True         Running        3m26s   v1.28.0
my-cluster-md-0-fp9xk-l82qj   my-cluster   my-cluster-md-0-fp9xk-l82qj   False     False       True         Running        3m26s   v1.28.0
my-cluster-md-0-fp9xk-l82qj   my-cluster   my-cluster-md-0-fp9xk-l82qj   False     False       True         Running        3m26s   v1.28.0
my-cluster-md-0-fp9xk-l82qj   my-cluster   my-cluster-md-0-fp9xk-l82qj   False     False       True         Running        3m35s   v1.28.0


## 📍 EXACT STEP MAPPING

Here's exactly which part of your script corresponds to each step:

---

### 🟦 Step 1: Created a "Manager" (Management Cluster)

**This is the "Brain" that controls everything**

```bash
# Step 1: Create Kind cluster
echo "📦 Creating Kind cluster..."
kind delete cluster --name capi-mgmt 2>/dev/null

cat <<EOF > kind-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: capi-mgmt
nodes:
  - role: control-plane
    extraMounts:
      - hostPath: /var/run/docker.sock
        containerPath: /var/run/docker.sock
EOF

kind create cluster --name capi-mgmt --config kind-config.yaml
```

**What it does:**
- Creates a Kubernetes cluster called `capi-mgmt` using Kind
- This is the **Management Cluster** (the brain)
- Mounts Docker socket so it can create containers

---

### 🟩 Step 2: Installed "Robot Controllers" (CAPI + CAPD)

**CAPI: Decides when to replace broken robots**
**CAPD: Creates new robots (Docker containers)**

```bash
# Step 2: Install CAPI
echo "📦 Installing CAPI v1.12.0..."
export CLUSTER_TOPOLOGY=true
clusterctl init --infrastructure docker:v1.12.0 --core cluster-api:v1.12.0 --bootstrap kubeadm:v1.12.0 --control-plane kubeadm:v1.12.0

sleep 30
kubectl wait --for=condition=Ready pod -n capi-system --all --timeout=120s
kubectl wait --for=condition=Ready pod -n capd-system --all --timeout=120s
```

**What it does:**
- Installs CAPI controllers (the decision makers)
- Installs CAPD controllers (the Docker container creators)
- Waits for all controllers to be ready

---

### 🟨 Step 3: Created a "Factory" (Workload Cluster)

**This is where the robots work**

```bash
# Step 3: Create workload cluster
echo "📦 Creating workload cluster..."
clusterctl generate cluster my-cluster --flavor development --kubernetes-version v1.28.0 > workload-cluster.yaml
kubectl apply -f workload-cluster.yaml
```

**What it does:**
- Generates YAML for a new Kubernetes cluster called `my-cluster`
- Applies it to create the **Workload Cluster**
- This is the actual cluster where your apps will run

---

### 🟧 Step 4: Added 2 "Workers" (Robot Machines)

**These do the actual work**

```bash
# Step 4: Create workers
echo "📦 Creating workers..."
cat <<EOF | kubectl apply -f -
apiVersion: cluster.x-k8s.io/v1beta1
kind: MachineDeployment
metadata:
  name: my-cluster-md-0
  namespace: default
spec:
  clusterName: my-cluster
  replicas: 2
  selector:
    matchLabels:
      cluster.x-k8s.io/cluster-name: my-cluster
      cluster.x-k8s.io/role: worker
  template:
    metadata:
      labels:
        cluster.x-k8s.io/cluster-name: my-cluster
        cluster.x-k8s.io/role: worker
    spec:
      bootstrap:
        configRef:
          apiVersion: bootstrap.cluster.x-k8s.io/v1beta1
          kind: KubeadmConfigTemplate
          name: my-cluster-md-0
      clusterName: my-cluster
      infrastructureRef:
        apiVersion: infrastructure.cluster.x-k8s.io/v1beta1
        kind: DockerMachineTemplate
        name: my-cluster-md-0
      version: v1.28.0
---
apiVersion: bootstrap.cluster.x-k8s.io/v1beta1
kind: KubeadmConfigTemplate
metadata:
  name: my-cluster-md-0
  namespace: default
spec:
  template:
    spec:
      joinConfiguration:
        nodeRegistration:
          kubeletExtraArgs:
            cloud-provider: external
---
apiVersion: infrastructure.cluster.x-k8s.io/v1beta1
kind: DockerMachineTemplate
metadata:
  name: my-cluster-md-0
  namespace: default
spec:
  template:
    spec:
      extraMounts:
        - containerPath: /var/run/docker.sock
          hostPath: /var/run/docker.sock
EOF
```

**What it does:**
- Creates a MachineDeployment with 2 replicas (workers)
- Defines how worker machines should be created
- Creates the templates needed for workers

---

### 🟪 Step 5: Installed "Network Cables" (Calico CNI)

**So robots can talk to each other**

```bash
# Step 5: Get kubeconfig
echo "📦 Getting kubeconfig..."
clusterctl get kubeconfig my-cluster > workload-kubeconfig.yaml
LB_PORT=$(docker port my-cluster-lb 6443 | cut -d: -f2)
sed -i '' "s|server: https://.*:6443|server: https://127.0.0.1:$LB_PORT|g" workload-kubeconfig.yaml

# Step 6: Install Calico
echo "📦 Installing Calico..."
kubectl --kubeconfig workload-kubeconfig.yaml apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.26.1/manifests/calico.yaml 2>/dev/null
```

**What it does:**
- Gets credentials to access the workload cluster
- Installs Calico CNI for pod networking
- Enables pods to communicate with each other

---

### 🟥 Step 6: Installed a "Health Monitor" (MachineHealthCheck)

**This watches for broken robots**

```bash
# Step 7: Install MachineHealthCheck
echo "📦 Installing MachineHealthCheck..."
cat <<EOF | kubectl apply -f -
apiVersion: cluster.x-k8s.io/v1beta1
kind: MachineHealthCheck
metadata:
  name: worker-health-check
spec:
  clusterName: my-cluster
  selector:
    matchLabels:
      cluster.x-k8s.io/cluster-name: my-cluster
      cluster.x-k8s.io/role: worker
  unhealthyConditions:
    - type: Ready
      status: Unknown
      timeout: 30s
    - type: Ready
      status: "False"
      timeout: 30s
  maxUnhealthy: 100%
  nodeStartupTimeout: 10m
EOF
```

**What it does:**
- Creates a health monitor for worker nodes
- If a worker is NotReady for 30 seconds → trigger remediation
- `maxUnhealthy: 100%` allows remediation even if all nodes are down

---

## 📊 QUICK REFERENCE TABLE

| Step | Script Section | What It Does | In Simple Terms |
|------|---------------|--------------|-----------------|
| **1** | `kind create cluster` | Creates Management Cluster | Creates the "Brain" |
| **2** | `clusterctl init` | Installs CAPI + CAPD | Installs "Robot Controllers" |
| **3** | `clusterctl generate` + `kubectl apply` | Creates Workload Cluster | Creates the "Factory" |
| **4** | `cat <<EOF | kubectl apply` | Creates Workers | Adds 2 "Robots" |
| **5** | `kubectl apply calico.yaml` | Installs Calico CNI | Installs "Network Cables" |
| **6** | `cat <<EOF | kubectl apply` | Installs MachineHealthCheck | Installs "Health Monitor" |

---

## 🎯 THE COMPLETE PICTURE

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WHAT WE BUILT                                      │
│                                                                         │
│  Step 1: Created a "Manager" (Management Cluster)                     │
│          → Line: kind create cluster --name capi-mgmt                 │
│                                                                         │
│  Step 2: Installed "Robot Controllers" (CAPI + CAPD)                 │
│          → Line: clusterctl init --infrastructure docker             │
│                                                                         │
│  Step 3: Created a "Factory" (Workload Cluster)                       │
│          → Line: clusterctl generate cluster my-cluster              │
│                                                                         │
│  Step 4: Added 2 "Workers" (Robot Machines)                           │
│          → Line: cat <<EOF | kubectl apply -f - MachineDeployment     │
│                                                                         │
│  Step 5: Installed "Network Cables" (Calico CNI)                      │
│          → Line: kubectl apply -f calico.yaml                         │
│                                                                         │
│  Step 6: Installed a "Health Monitor" (MachineHealthCheck)            │
│          → Line: cat <<EOF | kubectl apply -f - MachineHealthCheck    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```