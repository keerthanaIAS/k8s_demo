# Before start need to know:
What is a Namespace?
--------------------
- A virtual cluster inside your cluster
- Organizes resources (pods, services, configs)
- Isolates environments (dev, staging, prod)
- Groups resources by team or project

Key Points:
----------
✅ You can have many namespaces
✅ Default is default namespace
✅ Use -n <namespace> to specify
✅ Great for organization
⚠️ Not a security boundary (use RBAC for that)

Remember:
-----------
"Namespaces are for organizing WHAT runs, not WHO can run it."


# NODE SPIN-UP

1. Understand the concept:

There are two different things people often call “node spin-up”:

# A. Pod scaling

Traffic/Load
    ↓
HPA
    ↓
More Pods

This does not create a new node. Kubernetes simply schedules additional pods onto existing nodes.

# B. Node scaling

Traffic/Load
      ↓
     HPA
      ↓
More Pods
      ↓
Existing nodes don't have enough capacity
      ↓
Cluster Autoscaler
      ↓
New Node is created
      ↓
Pending Pods get scheduled

2. The POC we should build

Start with something simple:

                    Kubernetes Cluster
                           │
             ┌─────────────┴─────────────┐
             │                           │
          Node 1                      Node 2
             │                           │
        ┌────┴────┐                 ┌────┴────┐
        │ Pod     │                 │ Pod     │
        │ Pod     │                 │ Pod     │
        └─────────┘                 └─────────┘

                       ↓ insufficient capacity

              Cluster Autoscaler
                       ↓
                  Node 3 spins up
                       ↓
              Pending Pod → Node 3


Key Components Quick Reference:
------------------------------
Component	                                 Responsibility
----------                          --------------------------------------------
Scheduler	                      Finds nodes for pods, leaves pods Pending if no node fits
Cluster Autoscaler	                      Adds nodes when pods are Pending due to insufficient resources
Cloud Provider API	                      Provisions actual VMs (AWS, GCP, Azure, etc.)
kubelet	                      Runs on each node, starts pods, registers node
Node Bootstrap	                      Scripts that join a new node to the cluster

Think of it like this:
------------------------
Pod = Pending
    |
(**Cluster Autoscaler**)
    |
Node
    |
New Node
    |
Scheduler

## using cluster API the final flow we want:

                 MANAGEMENT CLUSTER
                       kind
                        │
                  Cluster API
                        │
                       CAPD
                        │
                        ▼
              WORKLOAD CLUSTER
          ┌─────────────┴─────────────┐
          │                           │
     worker-1                    worker-2
     Docker container             Docker container
                                      ↑
                                      │
                              automatically created
                                      │
                              Cluster Autoscaler

### Terminal log:
keerthana@Mac-356 node-spin-up % docker --version
Docker version 28.3.2, build 578ccf6
keerthana@Mac-356 node-spin-up % docker info
Client:
 Version:    28.3.2
 Context:    desktop-linux
 Debug Mode: false
 Plugins:
  ai: Docker AI Agent - Ask Gordon (Docker Inc.)
    Version:  v1.9.11
    Path:     /Users/keerthana/.docker/cli-plugins/docker-ai
  buildx: Docker Buildx (Docker Inc.)
    Version:  v0.26.1-desktop.1
    Path:     /Users/keerthana/.docker/cli-plugins/docker-buildx
  cloud: Docker Cloud (Docker Inc.)
    Version:  v0.4.18
    Path:     /Users/keerthana/.docker/cli-plugins/docker-cloud
  compose: Docker Compose (Docker Inc.)
    Version:  v2.39.1-desktop.1
    Path:     /Users/keerthana/.docker/cli-plugins/docker-compose
  debug: Get a shell into any image or container (Docker Inc.)
    Version:  0.0.42
    Path:     /Users/keerthana/.docker/cli-plugins/docker-debug
  desktop: Docker Desktop commands (Docker Inc.)
    Version:  v0.2.0
    Path:     /Users/keerthana/.docker/cli-plugins/docker-desktop
  extension: Manages Docker extensions (Docker Inc.)
    Version:  v0.2.29
    Path:     /Users/keerthana/.docker/cli-plugins/docker-extension
  init: Creates Docker-related starter files for your project (Docker Inc.)
    Version:  v1.4.0
    Path:     /Users/keerthana/.docker/cli-plugins/docker-init
  mcp: Docker MCP Plugin (Docker Inc.)
    Version:  v0.13.0
    Path:     /Users/keerthana/.docker/cli-plugins/docker-mcp
  model: Docker Model Runner (EXPERIMENTAL) (Docker Inc.)
    Version:  v0.1.36
    Path:     /Users/keerthana/.docker/cli-plugins/docker-model
  sbom: View the packaged-based Software Bill Of Materials (SBOM) for an image (Anchore Inc.)
    Version:  0.6.0
    Path:     /Users/keerthana/.docker/cli-plugins/docker-sbom
  scout: Docker Scout (Docker Inc.)
    Version:  v1.18.2
    Path:     /Users/keerthana/.docker/cli-plugins/docker-scout

Server:
 Containers: 37
  Running: 18
  Paused: 0
  Stopped: 19
 Images: 21
 Server Version: 28.3.2
 Storage Driver: overlayfs
  driver-type: io.containerd.snapshotter.v1
 Logging Driver: json-file
 Cgroup Driver: cgroupfs
 Cgroup Version: 2
 Plugins:
  Volume: local
  Network: bridge host ipvlan macvlan null overlay
  Log: awslogs fluentd gcplogs gelf journald json-file local splunk syslog
 CDI spec directories:
  /etc/cdi
  /var/run/cdi
 Discovered Devices:
  cdi: docker.com/gpu=webgpu
 Swarm: inactive
 Runtimes: runc io.containerd.runc.v2
 Default Runtime: runc
 Init Binary: docker-init
 containerd version: 05044ec0a9a75232cad458027ca83437aae3f4da
 runc version: v1.2.5-0-g59923ef
 init version: de40ad0
 Security Options:
  seccomp
   Profile: builtin
  cgroupns
 Kernel Version: 6.10.14-linuxkit
 Operating System: Docker Desktop
 OSType: linux
 Architecture: aarch64
 CPUs: 10
 Total Memory: 7.654GiB
 Name: docker-desktop
 ID: 07874e0c-7daf-47eb-a164-189c2ef2e86e
 Docker Root Dir: /var/lib/docker
 Debug Mode: false
 HTTP Proxy: http.docker.internal:3128
 HTTPS Proxy: http.docker.internal:3128
 No Proxy: hubproxy.docker.internal
 Labels:
  com.docker.desktop.address=unix:///Users/keerthana/Library/Containers/com.docker.docker/Data/docker-cli.sock
 Experimental: false
 Insecure Registries:
  hubproxy.docker.internal:5555
  ::1/128
  127.0.0.0/8
 Live Restore Enabled: false

WARNING: DOCKER_INSECURE_NO_IPTABLES_RAW is set
keerthana@Mac-356 node-spin-up % kubectl version --client
Client Version: v1.32.2
Kustomize Version: v5.5.0
keerthana@Mac-356 node-spin-up % kind version
kind v0.32.0 go1.26.3 darwin/arm64
keerthana@Mac-356 node-spin-up % helm version
zsh: command not found: helm
keerthana@Mac-356 node-spin-up % clusterctl version
clusterctl version: &version.Info{Major:"1", Minor:"13", GitVersion:"v1.13.4", GitCommit:"Homebrew", GitTreeState:"clean", BuildDate:"2026-07-14T11:31:17Z", GoVersion:"go1.26.5", Compiler:"gc", Platform:"darwin/arm64"}
keerthana@Mac-356 node-spin-up % helm version      
version.BuildInfo{Version:"v4.2.4", GitCommit:"3900f434fd3ef2b84065dc04508df48f288dba00", GitTreeState:"clean", GoVersion:"go1.26.5", KubeClientVersion:"v1.36"}
keerthana@Mac-356 node-spin-up % kind get clusters
No kind clusters found.
keerthana@Mac-356 node-spin-up % kind create cluster --name capi-management
Creating cluster "capi-management" ...
 ✓ Ensuring node image (kindest/node:v1.36.1) 🖼
 ✓ Preparing nodes 📦  
 ✓ Writing configuration 📜 
 ✓ Starting control-plane 🕹️ 
 ✓ Installing CNI 🔌 
 ✓ Installing StorageClass 💾 
Set kubectl context to "kind-capi-management"
You can now use your cluster with:

kubectl cluster-info --context kind-capi-management

Not sure what to do next? 😅  Check out https://kind.sigs.k8s.io/docs/user/quick-start/
keerthana@Mac-356 node-spin-up % kubectl get nodes
NAME                            STATUS   ROLES           AGE   VERSION
capi-management-control-plane   Ready    control-plane   50s   v1.36.1
keerthana@Mac-356 node-spin-up % kubectl config current-context
kind-capi-management
keerthana@Mac-356 node-spin-up % clusterctl init --infrastructure docker
Fetching providers
Installing cert-manager version="v1.20.3"
Waiting for cert-manager to be available...
Installing provider="cluster-api" version="v1.14.0" targetNamespace="capi-system"
Installing provider="bootstrap-kubeadm" version="v1.14.0" targetNamespace="capi-kubeadm-bootstrap-system"
Installing provider="control-plane-kubeadm" version="v1.14.0" targetNamespace="capi-kubeadm-control-plane-system"
Installing provider="infrastructure-docker" version="v1.14.0" targetNamespace="capd-system"

Your management cluster has been initialized successfully!

You can now create your first workload cluster by running the following:

  clusterctl generate cluster [name] --kubernetes-version [version] | kubectl apply -f -

keerthana@Mac-356 node-spin-up % 

* Right now:
------------
Docker Desktop
      │
      ▼
┌──────────────────────────────┐
│ kind-capi-management         │
│                              │
│  Cluster API                 │
│  Kubeadm Bootstrap           │
│  Kubeadm Control Plane       │
│  CAPD ◄──────────────┐       │
└───────────────────────┼──────┘
                        │
                        │ will create
                        ▼
                 Docker containers
                        │
                        ▼
                 Workload cluster



keerthana@Mac-356 node-spin-up % kubectl get pods -A
NAMESPACE                           NAME                                                             READY   STATUS    RESTARTS   AGE
capd-system                         capd-controller-manager-84569fcf67-jzsq9                         1/1     Running   0          96s
capi-kubeadm-bootstrap-system       capi-kubeadm-bootstrap-controller-manager-5774db566c-6n9rv       1/1     Running   0          97s
capi-kubeadm-control-plane-system   capi-kubeadm-control-plane-controller-manager-669648c68d-kksqh   1/1     Running   0          96s
capi-system                         capi-controller-manager-7b7465cf98-bls94                         1/1     Running   0          97s
cert-manager                        cert-manager-6f4d7cf4fc-pt2hn                                    1/1     Running   0          2m31s
cert-manager                        cert-manager-cainjector-7f4db9f785-6c6rp                         1/1     Running   0          2m31s
cert-manager                        cert-manager-webhook-7877c997b-4wgr9                             1/1     Running   0          2m31s
kube-system                         coredns-589f44dc88-hw7z6                                         1/1     Running   0          4m17s
kube-system                         coredns-589f44dc88-x9256                                         1/1     Running   0          4m17s
kube-system                         etcd-capi-management-control-plane                               1/1     Running   0          4m25s
kube-system                         kindnet-6fxpt                                                    1/1     Running   0          4m17s
kube-system                         kube-apiserver-capi-management-control-plane                     1/1     Running   0          4m25s
kube-system                         kube-controller-manager-capi-management-control-plane            1/1     Running   0          4m25s
kube-system                         kube-proxy-v27vm                                                 1/1     Running   0          4m17s
kube-system                         kube-scheduler-capi-management-control-plane                     1/1     Running   0          4m25s
local-path-storage                  local-path-provisioner-855c7b7774-gsmw9                          1/1     Running   0          4m17s
keerthana@Mac-356 node-spin-up % kubectl get pods -n capi-system
kubectl get pods -n capi-kubeadm-bootstrap-system
kubectl get pods -n capi-kubeadm-control-plane-system
kubectl get pods -n capd-system
NAME                                       READY   STATUS    RESTARTS   AGE
capi-controller-manager-7b7465cf98-bls94   1/1     Running   0          106s
NAME                                                         READY   STATUS    RESTARTS   AGE
capi-kubeadm-bootstrap-controller-manager-5774db566c-6n9rv   1/1     Running   0          106s
NAME                                                             READY   STATUS    RESTARTS   AGE
capi-kubeadm-control-plane-controller-manager-669648c68d-kksqh   1/1     Running   0          105s
NAME                                       READY   STATUS    RESTARTS   AGE
capd-controller-manager-84569fcf67-jzsq9   1/1     Running   0          105s
keerthana@Mac-356 node-spin-up % clusterctl get providers
Get info from a management or workload cluster

Usage:
  clusterctl get [command]

Available Commands:
  kubeconfig  Gets the kubeconfig file for accessing a workload cluster

Flags:
  -h, --help   help for get

Global Flags:
      --config $XDG_CONFIG_HOME/cluster-api/clusterctl.yaml   Path to clusterctl configuration (default is $XDG_CONFIG_HOME/cluster-api/clusterctl.yaml) or to a remote location (i.e. https://example.com/clusterctl.yaml)
  -v, --v int                                                 Set the log level verbosity. This overrides the CLUSTERCTL_LOG_LEVEL environment variable.

Use "clusterctl get [command] --help" for more information about a command.
keerthana@Mac-356 node-spin-up % 

* We're currently here:
-----------------------
                    MANAGEMENT CLUSTER
                    kind / v1.36.1
                           │
                    ┌──────┴──────┐
                    │ Cluster API │
                    └──────┬──────┘
                           │
                     ┌─────┴─────┐
                     │    CAPD   │
                     └─────┬─────┘
                           │
                     NOT CREATED YET
                           │
                           ▼
                    Workload Cluster

* Your POC flow:
----------------
                 CAPI Management Cluster
                         │
                         ▼
                  CAPI Controllers
                         │
                         ▼
                  Workload Cluster
                  ┌───────────────┐
                  │ Control Plane │
                  │    Ready ✅   │
                  └───────┬───────┘
                          │
                     Worker Node
                          │
                     Docker stop
                          │
                          ▼
                    Node Unhealthy
                          │
                          ▼
                  MachineHealthCheck
                          │
                          ▼
                  CAPI remediation
                          │
                          ▼
                 Old Machine deleted
                          │
                          ▼
                New Machine created
                          │
                          ▼
                  New Worker Ready ✅

# So remember this one line:
-----------------------------

1. Kind gives us a local Kubernetes environment
2. Docker provides the infrastructure
3. CAPI manages the Kubernetes machines
4. MachineHealthCheck automatically replaces unhealthy machines

## MachineHealthCheck noticed:

Machine is unhealthy

CAPI then:
-----------
delete unhealthy Machine
        ↓
MachineDeployment creates replacement
        ↓
Docker provider creates new container
        ↓
new Kubernetes node joins

### current POC is:

CAPI
 │
 ├── Control Plane Machine
 │
 └── Worker Machine
        │
        X  ← we stopped it
        │
        ↓
MachineHealthCheck detects failure
        │
        ↓
CAPI replaces Machine
        │
        ↓
New worker becomes Ready

#### Your next experiment is different:

MachineHealthCheck = "node died → replace it."

Scaling = "node/pod capacity is insufficient → add capacity."

**Step 1 — Check the worker capacity**

We first need to know how much CPU/memory the current worker has.

Run only this:

Pods become Pending because the worker has no capacity → Cluster Autoscaler increases the MachineDeployment replicas → CAPI creates a new Machine → CAPD creates a new Docker worker.