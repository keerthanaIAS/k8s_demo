# if the node process is start and immediately exiting, use this check the command port is running or not:
* lsof -i :3000 --> *here you can mention which port is stopping immediately*
* kill -9 1701 --> *here the PID have to give which is list from above command*
* try to run again it will work

## Terminal Log:
* If you get problem like this:
keerthana@Mac-865 kubernetes-multinode-poc % curl http://localhost:3000/
curl: (52) Empty reply from server

* clean up the current container:
keerthana@Mac-865 kubernetes-multinode-poc % docker rm -f user-service-test
user-service-test
keerthana@Mac-865 kubernetes-multinode-poc % docker build --no-cache -t user-service:v1 .
[+] Building 4.6s (11/11) FINISHED      docker:desktop-linux
 => [internal] load build definition from Dockerfile    0.0s
 => => transferring dockerfile: 547B                    0.0s
 => [internal] load metadata for docker.io/library/nod  1.9s
 => [auth] library/node:pull token for registry-1.dock  0.0s
 => [internal] load .dockerignore                       0.0s
 => => transferring context: 2B                         0.0s
 => [1/5] FROM docker.io/library/node:22-alpine@sha256  0.0s
 => => resolve docker.io/library/node:22-alpine@sha256  0.0s
 => [internal] load build context                       0.0s
 => => transferring context: 43.27kB                    0.0s
 => CACHED [2/5] WORKDIR /app                           0.0s
 => [3/5] COPY app/package*.json ./                     0.0s
 => [4/5] RUN npm install --omit=dev                    2.0s
 => [5/5] COPY app/ .                                   0.1s
 => exporting to image                                  0.5s
 => => exporting layers                                 0.2s
 => => exporting manifest sha256:b55e2982a91a8755c9aca  0.0s
 => => exporting config sha256:c2e6295902974ca3e64f69d  0.0s
 => => exporting attestation manifest sha256:0fd1fc12e  0.0s
 => => exporting manifest list sha256:2c22cf68f3d9e886  0.0s
 => => naming to docker.io/library/user-service:v1      0.0s
 => => unpacking to docker.io/library/user-service:v1   0.2s

View build details: docker-desktop://dashboard/build/desktop-linux/desktop-linux/270ytb8gav73y5pe0ef2gb54q
keerthana@Mac-865 kubernetes-multinode-poc % docker run -d \
  --name user-service-test \
  -p 127.0.0.1:3000:3000 \
  user-service:v1
d418eed2d71d24ad7f0773aab12d0f2dd78f650f19716792262e918bd111963f
keerthana@Mac-865 kubernetes-multinode-poc % docker ps --format "table {{.Names}}\t{{.Ports}}"
NAMES               PORTS
user-service-test   127.0.0.1:3000->3000/tcp
keerthana@Mac-865 kubernetes-multinode-poc % curl http://127.0.0.1:3000/
{"message":"Hello from Kubernetes Multi-Node POC","pod":"d418eed2d71d","node":"unknown","app":"user-service","environment":"development"}%                                             
keerthana@Mac-865 kubernetes-multinode-poc % 

* Lastly stop the docker and switch the node - docker-desktop to check the minikube for multiple minikube nodes:
keerthana@Mac-865 kubernetes-multinode-poc % docker stop user-service-test
user-service-test
keerthana@Mac-865 kubernetes-multinode-poc % docker rm user-service-test
user-service-test


keerthana@Mac-865 kubernetes-multinode-poc % kubectl config current-context
docker-desktop
keerthana@Mac-865 kubernetes-multinode-poc % 
keerthana@Mac-865 kubernetes-multinode-poc % kubectl config use-context minikube
Switched to context "minikube".


keerthana@Mac-865 kubernetes-multinode-poc % minikube delete
🔥  Deleting "minikube" in docker ...
🔥  Deleting container "minikube" ...
🔥  Removing /Users/keerthana/.minikube/machines/minikube ...
💀  Removed all traces of the "minikube" cluster.
keerthana@Mac-865 kubernetes-multinode-poc % minikube start --nodes=2 --driver=docker   -->*Minikube itself runs as Docker containers.*
😄  minikube v1.38.1 on Darwin 26.4.1 (arm64)
✨  Using the docker driver based on user configuration
❗  Starting v1.39.0, minikube will default to "containerd" container runtime. See #21973 for more info.
📌  Using Docker Desktop driver with root privileges
👍  Starting "minikube" primary control-plane node in "minikube" cluster
🚜  Pulling base image v0.0.50 ...
🔥  Creating docker container (CPUs=2, Memory=3072MB) ...
🐳  Preparing Kubernetes v1.35.1 on Docker 29.2.1 ...
🔗  Configuring CNI (Container Networking Interface) ...
🔎  Verifying Kubernetes components...
    ▪ Using image gcr.io/k8s-minikube/storage-provisioner:v5
🌟  Enabled addons: storage-provisioner, default-storageclass

👍  Starting "minikube-m02" worker node in "minikube" cluster
🚜  Pulling base image v0.0.50 ...
🔥  Creating docker container (CPUs=2, Memory=3072MB) ...
🌐  Found network options:
    ▪ NO_PROXY=192.168.49.2
🐳  Preparing Kubernetes v1.35.1 on Docker 29.2.1 ...
    ▪ env NO_PROXY=192.168.49.2
🔎  Verifying Kubernetes components...

❗  /usr/local/bin/kubectl is version 1.32.2, which may haveincompatibilities with Kubernetes 1.35.1.
    ▪ Want kubectl v1.35.1? Try 'minikube kubectl -- get pods -A'
🏄  Done! kubectl is now configured to use "minikube" cluster and "default" namespace by default
keerthana@Mac-865 kubernetes-multinode-poc % kubectl get nodes
NAME           STATUS     ROLES           AGE   VERSION
minikube       NotReady   control-plane   26s   v1.35.1
minikube-m02   NotReady   <none>          5s    v1.35.1
keerthana@Mac-865 kubernetes-multinode-poc % 
keerthana@Mac-865 kubernetes-multinode-poc % kubectl get nodes
NAME           STATUS   ROLES           AGE   VERSION
minikube       Ready    control-plane   54s   v1.35.1
minikube-m02   Ready    <none>          33s   v1.35.1
keerthana@Mac-865 kubernetes-multinode-poc % kubectl get nodes -o wide
NAME           STATUS   ROLES           AGE   VERSION   INTERNAL-IP    EXTERNAL-IP   OS-IMAGE                         KERNEL-VERSION     CONTAINER-RUNTIME
minikube       Ready    control-plane   67s   v1.35.1   192.168.49.2   <none>        Debian GNU/Linux 12 (bookworm)   6.10.14-linuxkit   docker://29.2.1
minikube-m02   Ready    <none>          46s   v1.35.1   192.168.49.3   <none>        Debian GNU/Linux 12 (bookworm)   6.10.14-linuxkit   docker://29.2.1
keerthana@Mac-865 kubernetes-multinode-poc % 


### Deploy 4 replicas
* Our goal is to create:
Deployment: user-service
Replicas: 4

* The architecture:(The *Scheduler* decides where each Pod runs)
                    Deployment
                   user-service
                       │
                   replicas: 4
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
        Pod 1        Pod 2        Pod 3        Pod 4
          │            │            │            │
          └────────────┴────────────┴────────────┘
                       │
                Kubernetes Scheduler
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
       minikube             minikube-m02
       Node 1                 Node 2


keerthana@Mac-865 kubernetes-multinode-poc % minikube image load user-service:v1
keerthana@Mac-865 kubernetes-multinode-poc % minikube image ls | grep user-service
docker.io/library/user-service:v1 -->*Because this is a multi-node cluster, we need to make sure the image is available to the nodes that may run the Pods.*
keerthana@Mac-865 kubernetes-multinode-poc % 
keerthana@Mac-865 kubernetes-multinode-poc % minikube node list
minikube        192.168.49.2
minikube-m02    192.168.49.3
keerthana@Mac-865 kubernetes-multinode-poc % 

* After create deployment file:
eerthana@Mac-865 kubernetes-multinode-poc % kubectl apply -f k8s/deployment.yaml
deployment.apps/user-service created
keerthana@Mac-865 kubernetes-multinode-poc % kubectl get deployments
NAME           READY   UP-TO-DATE   AVAILABLE   AGE
user-service   4/4     4            4           8s
keerthana@Mac-865 kubernetes-multinode-poc % kubectl get pods 
NAME                            READY   STATUS    RESTARTS   AGE
user-service-64fff7786d-69d8v   1/1     Running   0          16s
user-service-64fff7786d-gm86v   1/1     Running   0          16s
user-service-64fff7786d-p8mlg   1/1     Running   0          16s
user-service-64fff7786d-rp5bk   1/1     Running   0          16s
keerthana@Mac-865 kubernetes-multinode-poc % 
keerthana@Mac-865 kubernetes-multinode-poc % kubectl get pods -o wide
NAME                            READY   STATUS    RESTARTSAGE   IP           NODE           NOMINATED NODE   READINESSGATES
user-service-64fff7786d-69d8v   1/1     Running   052s   10.244.1.3   minikube-m02   <none>           <none>
user-service-64fff7786d-gm86v   1/1     Running   052s   10.244.1.2   minikube-m02   <none>           <none>
user-service-64fff7786d-p8mlg   1/1     Running   052s   10.244.0.4   minikube       <none>           <none>
user-service-64fff7786d-rp5bk   1/1     Running   052s   10.244.0.3   minikube       <none>           <none>
keerthana@Mac-865 kubernetes-multinode-poc % 

You might get:
--------------
minikube       → 3 Pods
minikube-m02   → 1 Pod

or:

minikube       → 1 Pod
minikube-m02   → 3 Pods

or another distribution.

The important thing is: (*The Kubernetes Scheduler chooses the Node*)
------------------------
Pod
 │
 └── NODE
       │
       ├── minikube
       └── minikube-m02

The flow is:
------------
You
 │
 │ kubectl apply
 ▼
API Server
 │
 ▼
Deployment Controller
 │
 │ Creates ReplicaSet
 ▼
ReplicaSet
 │
 │ Creates 4 Pods
 ▼
Scheduler
 │
 │ Chooses Nodes
 ├───────────────┐
 ▼               ▼
minikube     minikube-m02
 │               │
 ▼               ▼
Pods            Pods
 │               │
 ▼               ▼
kubelet         kubelet
 │               │
 ▼               ▼
Container       Container

keerthana@Mac-865 kubernetes-multinode-poc % kubectl get pods -o wide
NAME                            READY   STATUS    RESTARTS   AGE     IP           NODE           NOMINATED NODE   READINESS GATES
user-service-64fff7786d-69d8v   1/1     Running   0          8m42s   10.244.1.3   minikube-m02   <none>           <none>
user-service-64fff7786d-gm86v   1/1     Running   0          8m42s   10.244.1.2   minikube-m02   <none>           <none>
user-service-64fff7786d-p8mlg   1/1     Running   0          8m42s   10.244.0.4   minikube       <none>           <none>
user-service-64fff7786d-rp5bk   1/1     Running   0          8m42s   10.244.0.3   minikube       <none>           <none>
keerthana@Mac-865 kubernetes-multinode-poc % 

So the actual architecture is:
------------------------------
Kubernetes Cluster
│
├── minikube
│   │
│   ├── user-service Pod 1
│   └── user-service Pod 2
│
└── minikube-m02
    │
    ├── user-service Pod 3
    └── user-service Pod 4

keerthana@Mac-865 kubernetes-multinode-poc % kubectl get pods -o custom-columns="POD:.metadata.name,NODE:.spec.nodeName"
POD                             NODE
user-service-64fff7786d-69d8v   minikube-m02
user-service-64fff7786d-gm86v   minikube-m02
user-service-64fff7786d-p8mlg   minikube
user-service-64fff7786d-rp5bk   minikube
keerthana@Mac-865 kubernetes-multinode-poc %     
keerthana@Mac-865 kubernetes-multinode-poc % kubectl get pods -o wide --field-selector spec.nodeName=minikube
NAME                            READY   STATUS    RESTARTS   AGE   IP           NODE       NOMINATED NODE   READINESS GATES
user-service-64fff7786d-p8mlg   1/1     Running   0          10m   10.244.0.4   minikube   <none>           <none>
user-service-64fff7786d-rp5bk   1/1     Running   0          10m   10.244.0.3   minikube   <none>           <none>
keerthana@Mac-865 kubernetes-multinode-poc % kubectl get pods -o wide --field-selector spec.nodeName=minikube-m02
NAME                            READY   STATUS    RESTARTS   AGE   IP           NODE           NOMINATED NODE   READINESS GATES
user-service-64fff7786d-69d8v   1/1     Running   0          10m   10.244.1.3   minikube-m02   <none>           <none>
user-service-64fff7786d-gm86v   1/1     Running   0          10m   10.244.1.2   minikube-m02   <none>           <none>
keerthana@Mac-865 kubernetes-multinode-poc % 

*So who chose the Node?*
Kubernetes Scheduler.

The flow is:
----------
Deployment
    │
    ▼
ReplicaSet
    │
    ▼
Creates Pods
    │
    │
    ▼
Pod has no node yet
    │
    ▼
Scheduler
    │
    ├──────────────┐
    ▼              ▼
minikube      minikube-m02
    │              │
    ▼              ▼
Pod 1            Pod 3
Pod 2            Pod 4
* The Scheduler evaluates available Nodes and assigns Pods to Nodes.

### One important correction
Don't expect Kubernetes to always distribute:

2 Pods → minikube
2 Pods → minikube-m02

Kubernetes does not promise equal distribution by default.

You might see:
--------------
minikube
├── Pod 1
├── Pod 2
└── Pod 3

minikube-m02
└── Pod 4

That's still completely valid.

The key concept is:
-------------------
The Scheduler decides *where an unscheduled Pod runs based on available resources and scheduling rules*.                -->*important notes*

Later, if we want to control placement, that's where NodeSelector, Node Affinity, and Pod Anti-Affinity come in.


#### Kill a Pod → observe automatic recreation:-
keerthana@Mac-865 kubernetes-multinode-poc % kubectl get pods -o wide
NAME                            READY   STATUS    RESTARTS   AGE   IP           NODE           NOMINATED NODE   READINESS GATES
user-service-64fff7786d-69d8v   1/1     Running   0          14m   10.244.1.3   minikube-m02   <none>           <none>
user-service-64fff7786d-gm86v   1/1     Running   0          14m   10.244.1.2   minikube-m02   <none>           <none>
user-service-64fff7786d-p8mlg   1/1     Running   0          14m   10.244.0.4   minikube       <none>           <none>
user-service-64fff7786d-rp5bk   1/1     Running   0          14m   10.244.0.3   minikube       <none>           <none>
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl delete pod user-service-64fff7786d-69d8v 
pod "user-service-64fff7786d-69d8v" deleted
keerthana@Mac-865 kubernetes-multinode-poc % kubectl get pods -o wide -w
NAME                            READY   STATUS    RESTARTS   AGE   IP           NODE           NOMINATED NODE   READINESS GATES
user-service-64fff7786d-69d8v   1/1     Running   0          14m   10.244.1.3   minikube-m02   <none>           <none>
user-service-64fff7786d-gm86v   1/1     Running   0          14m   10.244.1.2   minikube-m02   <none>           <none>
user-service-64fff7786d-p8mlg   1/1     Running   0          14m   10.244.0.4   minikube       <none>           <none>
user-service-64fff7786d-rp5bk   1/1     Running   0          14m   10.244.0.3   minikube       <none>           <none>
user-service-64fff7786d-69d8v   1/1     Terminating   0          14m   10.244.1.3   minikube-m02   <none>           <none>
user-service-64fff7786d-p7xbg   0/1     Pending       0          0s    <none>       <none>         <none>           <none>
user-service-64fff7786d-69d8v   1/1     Terminating   0          14m   10.244.1.3   minikube-m02   <none>           <none>
user-service-64fff7786d-p7xbg   0/1     Pending       0          0s    <none>       minikube-m02   <none>           <none>
user-service-64fff7786d-p7xbg   0/1     ContainerCreating   0          0s    <none>       minikube-m02   <none>           <none>
user-service-64fff7786d-p7xbg   1/1     Running             0          1s    10.244.1.4   minikube-m02   <none>           <none>
user-service-64fff7786d-69d8v   0/1     Error               0          15m   10.244.1.3   minikube-m02   <none>           <none>
user-service-64fff7786d-69d8v   0/1     Error               0          15m   10.244.1.3   minikube-m02   <none>           <none>
user-service-64fff7786d-69d8v   0/1     Error               0          15m   10.244.1.3   minikube-m02   <none>           <none>

You should observe something like:
---------------------------------
user-service-xxx-aaaaa   1/1   Terminating

Then:
----
user-service-xxx-aaaaa   0/1   Terminating

Then the Pod disappears.

At this moment:
-------------
Desired = 4
Actual  = 3

But your Deployment says:
------------------------
replicas: 4

So Kubernetes must create another Pod.

You should see a new Pod:
------------------------
user-service-xxx-eeeeee   0/1   Pending

Then:
----
user-service-xxx-eeeeee   1/1   Running

Eventually:
-----------
4 Pods Running


keerthana@Mac-865 kubernetes-multinode-poc % kubectl get pods -o wide
NAME                            READY   STATUS    RESTARTS   AGE     IP           NODE           NOMINATED NODE   READINESS GATES
user-service-64fff7786d-gm86v   1/1     Running   0          17m     10.244.1.2   minikube-m02   <none>           <none>
user-service-64fff7786d-p7xbg   1/1     Running   0          2m50s   10.244.1.4   minikube-m02   <none>           <none>
user-service-64fff7786d-p8mlg   1/1     Running   0          17m     10.244.0.4   minikube       <none>           <none>
user-service-64fff7786d-rp5bk   1/1     Running   0          17m     10.244.0.3   minikube       <none>           <none>
keerthana@Mac-865 kubernetes-multinode-poc % 

What actually happened internally?
---------------------------------
This is the most important part.

You deleted:
------------
Pod A ❌

The flow was:
-------------
Pod A deleted
      │
      ▼
ReplicaSet Controller
      │
      │ Detects:
      │ Desired = 4
      │ Current = 3
      │
      ▼
Creates new Pod
      │
      ▼
Pod has no Node
      │
      ▼
Scheduler
      │
      ▼
Selects a Node
      │
      ▼
Kubelet on selected Node
      │
      ▼
Container Runtime
      │
      ▼
Starts user-service:v1
      │
      ▼
New Pod Running

The complete architecture:
-------------------------
              Deployment
                   │
                   ▼
              ReplicaSet
                   │
            Desired = 4
                   │
       ┌───────────┼───────────┐
       │           │           │
       ▼           ▼           ▼
     Pod 1       Pod 2       Pod 3
                               │
                              Pod 4
                                │
                                X
                         Pod 4 deleted
                                │
                                ▼
                       ReplicaSet notices
                       only 3 Pods remain
                                │
                                ▼
                         Creates Pod 5
                                │
                                ▼
                           Scheduler
                                │
                         ┌──────┴──────┐
                         ▼             ▼
                      Node 1         Node 2
                         │             │
                         └──── Pod 5 ──┘


keerthana@Mac-865 kubernetes-multinode-poc % kubectl get rs
NAME                      DESIRED   CURRENT   READY   AGE
user-service-64fff7786d   4         4         4       19m
keerthana@Mac-865 kubernetes-multinode-poc % 

* The ReplicaSet's job is:
Always maintain 4 Pods.

* If you have:
4 Pods → Do nothing

* If you have:
3 Pods → Create 1

* If you have:
2 Pods → Create 2

* If you have:
5 Pods → Remove 1

This is the key idea behind *self-healing*.

The architecture is:
----------------------------
You declare:
Deployment replicas = 4
        │
        ▼
API Server
        │
        ▼
Deployment Controller
        │
        ▼
ReplicaSet
        │
        ▼
ReplicaSet Controller
        │
        │ Compares:
        │ Desired State = 4 Pods
        │ Actual State  = 3 Pods
        │
        ▼
Creates a replacement Pod
        │
        ▼
Scheduler
        │
        │ Pod has no Node assigned
        ▼
Selects a suitable Node
        │
        ▼
Kubelet
        │
        ▼
Container Runtime
        │
        ▼
Container starts

* The Controller Manager is the *control-loop engine*. It contains controllers such as the Deployment Controller and ReplicaSet Controller. They continuously compare the desired state with the actual state and take corrective action.
* The Scheduler does not maintain the desired replica count. Its job is to decide the unscheduled Pod should run on Node X.

##### We'll observe next node failover: 
Node failure
     ↓
Pods on failed Node become unavailable
     ↓
Kubernetes detects Node problem
     ↓
Replacement Pods are created
     ↓
Scheduler looks for healthy Node
     ↓
Pods are scheduled on healthy Node

Currently:
-------------------------------------------
                       Kubernetes Cluster
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
       Control Plane                     Worker Node
        minikube                        minikube-m02
              │                               │
              │                               │
     ┌────────┴────────┐              ┌───────┴────────┐
     │                 │              │                │
     ▼                 ▼              ▼                ▼
   Pod A             Pod B           Pod C            Pod D

keerthana@Mac-865 kubernetes-multinode-poc % kubectl get nodes -w
NAME           STATUS   ROLES           AGE   VERSION
minikube       Ready    control-plane   55m   v1.35.1                                                                   -->*important notes*
minikube-m02   Ready    <none>          55m   v1.35.1                                                                   -->*important notes*
minikube       Ready    control-plane   56m   v1.35.1

keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl get pods -o wide -w
NAME                            READY   STATUS    RESTARTS   AGE   IP           NODE           NOMINATED NODE   READINESS GATES
user-service-64fff7786d-gm86v   1/1     Running   0          26m   10.244.1.2   minikube-m02   <none>           <none>
user-service-64fff7786d-p7xbg   1/1     Running   0          11m   10.244.1.4   minikube-m02   <none>           <none>
user-service-64fff7786d-p8mlg   1/1     Running   0          26m   10.244.0.4   minikube       <none>           <none>
user-service-64fff7786d-rp5bk   1/1     Running   0          26m   10.244.0.3   minikube       <none>           <none>

keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % minikube node list 
minikube        192.168.49.2
minikube-m02    192.168.49.3
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % docker stop minikube-m02
minikube-m02
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % 


* Observe what happens:
1. node:
keerthana@Mac-865 kubernetes-multinode-poc % kubectl get nodes -w
NAME           STATUS   ROLES           AGE   VERSION
minikube       Ready    control-plane   55m   v1.35.1
minikube-m02   Ready    <none>          55m   v1.35.1
minikube       Ready    control-plane   56m   v1.35.1
minikube-m02   Ready    <none>          56m   v1.35.1
minikube-m02   NotReady   <none>          58m   v1.35.1
minikube-m02   NotReady   <none>          58m   v1.35.1
minikube-m02   NotReady   <none>          58m   v1.35.1
2. pod:
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl get pods -o wide -w
NAME                            READY   STATUS    RESTARTS   AGE   IP           NODE           NOMINATED NODE   READINESS GATES
user-service-64fff7786d-gm86v   1/1     Running   0          26m   10.244.1.2   minikube-m02   <none>           <none>
user-service-64fff7786d-p7xbg   1/1     Running   0          11m   10.244.1.4   minikube-m02   <none>           <none>
user-service-64fff7786d-p8mlg   1/1     Running   0          26m   10.244.0.4   minikube       <none>           <none>
user-service-64fff7786d-rp5bk   1/1     Running   0          26m   10.244.0.3   minikube       <none>           <none>
user-service-64fff7786d-gm86v   1/1     Running   0          29m   10.244.1.2   minikube-m02   <none>           <none>
user-service-64fff7786d-p7xbg   1/1     Running   0          14m   10.244.1.4   minikube-m02   <none>           <none>
user-service-64fff7786d-p7xbg   1/1     Running   0          19m   10.244.1.4   minikube-m02   <none>           <none>
user-service-64fff7786d-gm86v   1/1     Running   0          34m   10.244.1.2   minikube-m02   <none>           <none>
user-service-64fff7786d-p7xbg   1/1     Terminating   0          19m   10.244.1.4   minikube-m02   <none>           <none>
user-service-64fff7786d-gm86v   1/1     Terminating   0          34m   10.244.1.2   minikube-m02   <none>           <none>
user-service-64fff7786d-fxnj5   0/1     Pending       0          0s    <none>       <none>         <none>           <none>
user-service-64fff7786d-fxnj5   0/1     Pending       0          0s    <none>       minikube       <none>           <none>
user-service-64fff7786d-k9hwj   0/1     Pending       0          0s    <none>       <none>         <none>           <none>
user-service-64fff7786d-k9hwj   0/1     Pending       0          0s    <none>       minikube       <none>           <none>
user-service-64fff7786d-fxnj5   0/1     ContainerCreating   0          0s    <none>       minikube       <none>           <none>
user-service-64fff7786d-k9hwj   0/1     ContainerCreating   0          0s    <none>       minikube       <none>           <none>
user-service-64fff7786d-fxnj5   1/1     Running             0          2s    10.244.0.6   minikube       <none>           <none>
user-service-64fff7786d-k9hwj   1/1     Running             0          2s    10.244.0.5   minikube       <none>           <none>

the control loop works conceptually like this:
----------------------------------------------
Controller Manager
       │
       ▼
Observe cluster
       │
       ▼
Node minikube-m02 is unhealthy
       │
       ▼
Pods on that Node are unavailable
       │
       ▼
Desired = 4
Available = 2
       │
       ▼
Controllers take corrective action
       │
       ▼
Replacement Pods are created
       │
       ▼
Scheduler sees:
"These Pods have no Node"
       │
       ▼
Scheduler selects minikube
       │
       ▼
Kubelet on minikube
       │
       ▼
Container Runtime
       │
       ▼
New Pods start

So:
-----
* Controller Manager
Responsible for the reconciliation / desired-state control loop.

* Scheduler
Responsible for assigning unscheduled Pods to Nodes.

* Kubelet
Responsible for making sure the Pods assigned to its Node actually run.

* Container Runtime
Responsible for actually running the containers.

###### The complete architecture you should remember:
                       Kubernetes Control Plane
                                │
               ┌────────────────┼────────────────┐
               │                │                │
               ▼                ▼                ▼
          API Server      Controller Manager   Scheduler
               │                │                │
               │                │                │
               │                │          Assigns Pods
               │                │          to Nodes
               │                │                │
               │         Reconciles             │
               │         Desired vs             │
               │         Actual                 │
               │                │                │
               └────────────────┼────────────────┘
                                │
                                ▼
                         Worker Nodes
                       ┌───────────────┐
                       │               │
                       ▼               ▼
                    Node 1          Node 2
                       │               │
                    Kubelet         Kubelet
                       │               │
                Container Runtime Container Runtime
                       │               │
                     Pods            Pods

* In the Pod failure experiment:
--------------------------------
Pod deleted
    ↓
Controller notices
    ↓
Desired = 4
Actual = 3
    ↓
Creates replacement Pod
    ↓
Scheduler assigns Node

* In the Node failure experiment:
--------------------------------
Node fails
    ↓
Node becomes NotReady
    ↓
Pods on Node become unavailable
    ↓
Controller reconciliation detects missing capacity
    ↓
Replacement Pods are created
    ↓
Scheduler chooses healthy Node
    ↓
Kubelet starts Pods


###### Add NodeSelector → prove controlled scheduling:
etes-multinode-poc % docker start minikube-m02
minikube-m02
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl get nodes -w
NAME           STATUS     ROLES           AGE    VERSION
minikube       Ready      control-plane   106m   v1.35.1
minikube-m02   NotReady   <none>          106m   v1.35.1
minikube       Ready      control-plane   107m   v1.35.1
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl describe node minikube-m02
Name:               minikube-m02
Roles:              <none>
Labels:             beta.kubernetes.io/arch=arm64
                    beta.kubernetes.io/os=linux
                    kubernetes.io/arch=arm64
                    kubernetes.io/hostname=minikube-m02
                    kubernetes.io/os=linux
                    minikube.k8s.io/commit=c93a4cb9311efc66b90d33ea03f75f2c4120e9b0
                    minikube.k8s.io/name=minikube
                    minikube.k8s.io/primary=false
                    minikube.k8s.io/updated_at=2026_08_03T10_38_11_0700
                    minikube.k8s.io/version=v1.38.1
Annotations:        node.alpha.kubernetes.io/ttl: 0
                    volumes.kubernetes.io/controller-managed-attach-detach: true
CreationTimestamp:  Mon, 03 Aug 2026 10:38:11 +0530
Taints:             node.kubernetes.io/unreachable:NoExecute
                    node.kubernetes.io/unreachable:NoSchedule
Unschedulable:      false
Lease:
  HolderIdentity:  minikube-m02
  AcquireTime:     <unset>
  RenewTime:       Mon, 03 Aug 2026 11:35:39 +0530
Conditions:
  Type             Status    LastHeartbeatTime                 LastTransitionTime                Reason              Message
  ----             ------    -----------------                 ------------------                ------              -------
  MemoryPressure   Unknown   Mon, 03 Aug 2026 11:34:59 +0530   Mon, 03 Aug 2026 11:36:30 +0530   NodeStatusUnknown   Kubelet stopped posting node status.
  DiskPressure     Unknown   Mon, 03 Aug 2026 11:34:59 +0530   Mon, 03 Aug 2026 11:36:30 +0530   NodeStatusUnknown   Kubelet stopped posting node status.
  PIDPressure      Unknown   Mon, 03 Aug 2026 11:34:59 +0530   Mon, 03 Aug 2026 11:36:30 +0530   NodeStatusUnknown   Kubelet stopped posting node status.
  Ready            Unknown   Mon, 03 Aug 2026 11:34:59 +0530   Mon, 03 Aug 2026 11:36:30 +0530   NodeStatusUnknown   Kubelet stopped posting node status.
Addresses:
  InternalIP:  192.168.49.3
  Hostname:    minikube-m02
Capacity:
  cpu:                10
  ephemeral-storage:  474095688Ki
  hugepages-1Gi:      0
  hugepages-2Mi:      0
  hugepages-32Mi:     0
  hugepages-64Ki:     0
  memory:             8025424Ki
  pods:               110
Allocatable:
  cpu:                10
  ephemeral-storage:  474095688Ki
  hugepages-1Gi:      0
  hugepages-2Mi:      0
  hugepages-32Mi:     0
  hugepages-64Ki:     0
  memory:             8025424Ki
  pods:               110
System Info:
  Machine ID:                 e366bd4b77b9d6be2d67552f69964f40
  System UUID:                e366bd4b77b9d6be2d67552f69964f40
  Boot ID:                    4ad47294-a78e-407b-ba50-d14cdff4e9a3
  Kernel Version:             6.10.14-linuxkit
  OS Image:                   Debian GNU/Linux 12 (bookworm)
  Operating System:           linux
  Architecture:               arm64
  Container Runtime Version:  docker://29.2.1
  Kubelet Version:            v1.35.1
  Kube-Proxy Version:         
PodCIDR:                      10.244.1.0/24
PodCIDRs:                     10.244.1.0/24
Non-terminated Pods:          (4 in total)
  Namespace                   Name                             CPU Requests  CPU Limits  Memory Requests  Memory Limits  Age
  ---------                   ----                             ------------  ----------  ---------------  -------------  ---
  default                     user-service-64fff7786d-gm86v    0 (0%)        0 (0%)      0 (0%)           0 (0%)         79m
  default                     user-service-64fff7786d-p7xbg    0 (0%)        0 (0%)      0 (0%)           0 (0%)         65m
  kube-system                 kindnet-7n5ml                    100m (1%)     100m (1%)   50Mi (0%)        50Mi (0%)      109m
  kube-system                 kube-proxy-92f8s                 0 (0%)        0 (0%)      0 (0%)           0 (0%)         109m
Allocated resources:
  (Total limits may be over 100 percent, i.e., overcommitted.)
  Resource           Requests   Limits
  --------           --------   ------
  cpu                100m (1%)  100m (1%)
  memory             50Mi (0%)  50Mi (0%)
  ephemeral-storage  0 (0%)     0 (0%)
  hugepages-1Gi      0 (0%)     0 (0%)
  hugepages-2Mi      0 (0%)     0 (0%)
  hugepages-32Mi     0 (0%)     0 (0%)
  hugepages-64Ki     0 (0%)     0 (0%)
Events:
  Type    Reason        Age   From             Message
  ----    ------        ----  ----             -------
  Normal  NodeNotReady  50m   node-controller  Node minikube-m02 status is now: NodeNotReady
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % 


* if the second node is not restart:
If the restart does not fix it, send me the output of these three commands:

sudo systemctl status kubelet
sudo journalctl -u kubelet --no-pager -n 100
curl -k https://192.168.49.2:8443/healthz

recommended exact sequence:
--------------------------
Don't randomly run many commands. Do this:

minikube node stop minikube-m02
minikube node start minikube-m02

Then:
kubectl get nodes -w

keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl get nodes -w
NAME           STATUS     ROLES           AGE    VERSION
minikube       Ready      control-plane   155m   v1.35.1
minikube-m02   NotReady   <none>          155m   v1.35.1
minikube       Ready      control-plane   3h25m   v1.35.1
minikube       Ready      control-plane   3h30m   v1.35.1
minikube-m02   Ready      <none>          3h30m   v1.35.1
minikube-m02   Ready      <none>          3h30m   v1.35.1
minikube-m02   Ready      <none>          3h30m   v1.35.1

keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl get nodes --show-labels
NAME           STATUS   ROLES           AGE     VERSION   LABELS
minikube       *Ready*    control-plane   3h39m   v1.35.1   beta.kubernetes.io/arch=arm64,beta.kubernetes.io/os=linux,kubernetes.io/arch=arm64,kubernetes.io/hostname=minikube,kubernetes.io/os=linux,minikube.k8s.io/commit=c93a4cb9311efc66b90d33ea03f75f2c4120e9b0,minikube.k8s.io/name=minikube,minikube.k8s.io/primary=true,minikube.k8s.io/updated_at=2026_08_03T10_37_53_0700,minikube.k8s.io/version=v1.38.1,node-role.kubernetes.io/control-plane=,node.kubernetes.io/exclude-from-external-load-balancers=
minikube-m02   *Ready*    <none>          3h38m   v1.35.1   beta.kubernetes.io/arch=arm64,beta.kubernetes.io/os=linux,kubernetes.io/arch=arm64,kubernetes.io/hostname=minikube-m02,kubernetes.io/os=linux,minikube.k8s.io/commit=c93a4cb9311efc66b90d33ea03f75f2c4120e9b0,minikube.k8s.io/name=minikube,minikube.k8s.io/primary=false,minikube.k8s.io/updated_at=2026_08_03T10_38_11_0700,minikube.k8s.io/version=v1.38.1
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % 

######
* Its kubelet had stopped reporting node status, so Kubernetes marked it NotReady.
* After restarting the worker node, the kubelet recovered.
######

###### Now Node selector step:

* After created yaml file for node-selector-pod.yaml file.

keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl label node minikube-m02 workload=worker
node/minikube-m02 labeled
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl get nodes --show-labels
NAME           STATUS   ROLES           AGE     VERSION   LABELS
minikube       Ready    control-plane   3h44m   v1.35.1   beta.kubernetes.io/arch=arm64,beta.kubernetes.io/os=linux,kubernetes.io/arch=arm64,kubernetes.io/hostname=minikube,kubernetes.io/os=linux,minikube.k8s.io/commit=c93a4cb9311efc66b90d33ea03f75f2c4120e9b0,minikube.k8s.io/name=minikube,minikube.k8s.io/primary=true,minikube.k8s.io/updated_at=2026_08_03T10_37_53_0700,minikube.k8s.io/version=v1.38.1,node-role.kubernetes.io/control-plane=,node.kubernetes.io/exclude-from-external-load-balancers=
minikube-m02   Ready    <none>          3h43m   v1.35.1   beta.kubernetes.io/arch=arm64,beta.kubernetes.io/os=linux,kubernetes.io/arch=arm64,kubernetes.io/hostname=minikube-m02,kubernetes.io/os=linux,minikube.k8s.io/commit=c93a4cb9311efc66b90d33ea03f75f2c4120e9b0,minikube.k8s.io/name=minikube,minikube.k8s.io/primary=false,minikube.k8s.io/updated_at=2026_08_03T10_38_11_0700,minikube.k8s.io/version=v1.38.1,workload=worker
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % 
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl apply -f node-selector-pod.yaml
pod/node-selector-pod created
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl get pod node-selector-pod -o wide
NAME                READY   STATUS              RESTARTS   AGE   IP       NODE           NOMINATED NODE   READINESS GATES
node-selector-pod   0/1     ContainerCreating   0          6s    <none>   minikube-m02   <none>           <none>
node-selector-pod   1/1     Running   0          100s   10.244.1.4   minikube-m02   <none>           <none>


This proves:
------------
Pod
 │
 │ nodeSelector:
 │   workload=worker
 ↓
Scheduler checks nodes
 │
 ├── minikube
 │     ❌ workload=worker label missing
 │
 └── minikube-m02
       ✅ workload=worker
             ↓
          Pod scheduled


* Prove the restriction:-
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl label node minikube-m02 workload-
node/minikube-m02 unlabeled
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl delete pod node-selector-pod
pod "node-selector-pod" deleted
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl apply -f node-selector-pod.yaml 
pod/node-selector-pod created
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl get pod node-selector-pod -o wide
NAME                READY   STATUS    RESTARTS   AGE   IP       NODE     NOMINATED NODE  READINESS GATES
node-selector-pod   0/1     Pending   0          10s   <none>   <none>   <none>  <none>
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl describe pod node-selector-pod
Name:             node-selector-pod
Namespace:        default
Priority:         0
Service Account:  default
Node:             <none>
Labels:           <none>
Annotations:      <none>
Status:           Pending
IP:               
IPs:              <none>
Containers:
  nginx:
    Image:        nginx:latest
    Port:         <none>
    Host Port:    <none>
    Environment:  <none>
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from kube-api-access-8bgsc (ro)
Conditions:
  Type           Status
  PodScheduled   False 
Volumes:
  kube-api-access-8bgsc:
    Type:                    Projected (a volume that contains injected data from multiple sources)
    TokenExpirationSeconds:  3607
    ConfigMapName:           kube-root-ca.crt
    ConfigMapOptional:       <nil>
    DownwardAPI:             true
QoS Class:                   BestEffort
Node-Selectors:              workload=worker
Tolerations:                 node.kubernetes.io/not-ready:NoExecute op=Exists for 300s
                             node.kubernetes.io/unreachable:NoExecute op=Exists for 300s
Events:
  Type     Reason            Age   From               Message
  ----     ------            ----  ----               -------
  Warning  FailedScheduling  17s   default-scheduler  0/2 nodes are available: 2 node(s) didn't match Pod's node affinity/selector. no new claims to deallocate, preemption: 0/2 nodes are available: 2 Preemption is not helpful for scheduling.
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % 


* Restore the label:-
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl label node minikube-m02 workload=worker
node/minikube-m02 labeled
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % 
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % 
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl get pod node-selector-pod -o wide -w
NAME                READY   STATUS    RESTARTS   AGE    IP           NODE           NOMINATED NODE   READINESS GATES
node-selector-pod   1/1     Running   0          100s   10.244.1.4   minikube-m02   <none>           <none>


What you have proved
--------------------
* nodeSelector is a *hard scheduling constraint*.

nodeSelector
     ↓
Scheduler filters nodes
     ↓
Only matching node is eligible
     ↓
Pod is scheduled there


The easiest way to remember
----------------------------
Think of nodeSelector as a rule on the Pod:

🏷️ "Only let me run on a node with this label."

For example:
-------------
nodeSelector:
  environment: production

Means:
------
Pod
 │
 ├── minikube
 │     environment=development ❌
 │
 └── minikube-m02
       environment=production ✅
                ↓
             Run Pod

- That's all nodeSelector does.

The key point is:
--------------------
nodeSelector does not tell the Pod where to go directly. It gives the Scheduler a requirement. The Scheduler finds a node matching that requirement and places the Pod there.


###### Add ConfigMap → Prove Configuration Injection:

* The goal is to understand this simple flow:
---------------------------------------------
ConfigMap
   ↓
Stores configuration
   ↓
Pod receives configuration
   ↓
Container can use the configuration

* After created yaml file for congif:

keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl apply -f configmap.yaml
configmap/app-config created
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl get configmap
NAME               DATA   AGE
app-config         2      6s
kube-root-ca.crt   1      4h19m
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % 

keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl describe configmap app-config
Name:         app-config
Namespace:    default
Labels:       <none>
Annotations:  <none>

Data
====
APP_ENV:
----
development

APP_MESSAGE:
----
Hello from Kubernetes ConfigMap


BinaryData
====

Events:  <none>
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % 

* Afte create yaml file for configmap-pod.ymal:
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl apply -f configmap-pod.yaml
pod/configmap-pod created
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl get pod configmap-pod
NAME            READY   STATUS    RESTARTS   AGE
configmap-pod   1/1     Running   0          4s
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % 

* Prove the configuration was injected:
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl exec configmap-pod -- printenv APP_ENV
development
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % 

keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl exec configmap-pod -- printenv APP_MESSAGE
Hello from Kubernetes ConfigMap
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % 

- This is the proof.

The values were stored in the ConfigMap:
-----------------------------------------
ConfigMap
    │
    ├── APP_ENV = development
    └── APP_MESSAGE = Hello from Kubernetes ConfigMap
             │
             │
             ↓
          Pod
             │
             ↓
       Environment Variables
             │
             ├── APP_ENV
             └── APP_MESSAGE

Remember:
--------
ConfigMap = non-sensitive configuration

Examples:
---------
APP_ENV=production
APP_PORT=3000
LOG_LEVEL=info
API_URL=http://user-service

For sensitive values such as:
----------------------------
DATABASE_PASSWORD
JWT_SECRET
API_KEY
- you should use a Kubernetes Secret, not a ConfigMap.

Steps:
------
kubectl get configmap
kubectl describe configmap app-config
kubectl get pod configmap-pod
kubectl exec configmap-pod -- printenv APP_ENV

The flow is:
------------
ConfigMap
    │
    │ APP_ENV=development
    ↓
API Server
    │
    ↓
Pod specification
    │
    │ "I need APP_ENV from app-config"
    ↓
Scheduler
    │
    ↓
Node selected
    │
    ↓
Kubelet
    │
    ↓
Reads ConfigMap
    │
    ↓
Container starts
    │
    ↓
APP_ENV=development


# Internal Kubernetes Flow:

* You create a Pod:

You run:
--------
kubectl apply -f pod.yaml

Your flow is:
-------------
Your Terminal
     │
     │ kubectl apply
     ↓
API Server
     │
     ↓
etcd
     │
     ↓
Scheduler
     │
     ↓
Selects a Node
     │
     ↓
Kubelet on that Node
     │
     ↓
Container Runtime
     │
     ↓
Container starts

Simple explanation:-
------------------
kubectl does not directly create the container.

It tells the API Server:
------------------------
"I want this Pod."

- The API Server stores the desired state.

The Scheduler decides:
----------------------
"This Pod should run on minikube-m02."

- The kubelet on minikube-m02 then makes it happen.


# Node Failure:

- This is the most important one for your multi-node POC.

You run:
---------
minikube node stop minikube-m02

Now:
-----
minikube-m02
      ↓
Kubelet stops responding
      ↓
API Server stops receiving heartbeats
      ↓
Node becomes NotReady

Then:
-----
Controller Manager
      ↓
Detects node failure
      ↓
Pod becomes unavailable
      ↓
Deployment notices desired replicas are missing
      ↓
Scheduler finds another available node
      ↓
New Pod starts

- The important thing is that the Scheduler does not detect the failure itself.

Different components have different jobs:
----------------------------------------
Kubelet
   │
   └── Reports node health

Controller Manager
   │
   └── Detects node state changes
       and manages desired state

Scheduler
   │
   └── Chooses a node for unscheduled Pods

Kubelet
   │
   └── Actually runs the Pod


# Complete Practical Flow:

                 kubectl
                    │
                    ↓
              API Server
                    │
                    ↓
                  etcd
                    │
                    ↓
              Scheduler
                    │
          ┌─────────┴─────────┐
          │                   │
    nodeSelector          No selector
          │                   │
          ↓                   ↓
   Select matching       Select suitable
       node                  node
          │                   │
          └─────────┬─────────┘
                    ↓
              Worker Node
                    │
                 Kubelet
                    │
             Container Runtime
                    │
                    ↓
                  Pod


# Should remember:

1. API Server
   → Receives Kubernetes requests

2. etcd
   → Stores Kubernetes cluster state

3. Scheduler
   → Decides which node runs a Pod

4. Controller Manager
   → Ensures the desired state is maintained

5. Kubelet
   → Makes sure the Pod actually runs on the node

------------------------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------------------------

# The difference between:
-------------------------
Pod failure → Kubernetes recreates the Pod.
Node failure → Kubernetes detects the node is unavailable and reschedules the workload to another healthy node.

* Pod Failure vs Node Failure:
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl get nodes
NAME           STATUS   ROLES           AGE     VERSION
minikube       Ready    control-plane   5h18m   v1.35.1
minikube-m02   Ready    <none>          5h17m   v1.35.1
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl get pods -o wide
NAME                            READY   STATUS             RESTARTS   AGE     IP           NODE           NOMINATED NODE   READINESS GATES
configmap-pod                   1/1     Running            0          55m     10.244.1.5   minikube-m02   <none>           <none>
node-selector-pod               1/1     Running            0          91m     10.244.1.4   minikube-m02   <none>           <none>
user-service-64fff7786d-fxnj5   1/1     Running            0          4h14m   10.244.0.6   minikube       <none>           <none>
user-service-64fff7786d-k9hwj   1/1     Running            0          4h14m   10.244.0.5   minikube       <none>           <none>
user-service-77cff9598c-gkfb5   0/1     ImagePullBackOff   0          95m     10.244.1.2   minikube-m02   <none>           <none>
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % 

* Pod failure:
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl delete pod 
user-service-64fff7786d-fxnj5
pod "user-service-64fff7786d-fxnj5" deleted
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl get pods -o wide -w
NAME                            READY   STATUS             RESTARTS   AGE     IP           NODE           NOMINATED NODE   READINESS GATES
configmap-pod                   1/1     Running            0          61m     10.244.1.5   minikube-m02   <none>           <none>
node-selector-pod               1/1     Running            0          97m     10.244.1.4   minikube-m02   <none>           <none>
user-service-64fff7786d-fxnj5   1/1     Running            0          4h20m   10.244.0.6   minikube       <none>           <none>
user-service-64fff7786d-k9hwj   1/1     Running            0          4h20m   10.244.0.5   minikube       <none>           <none>
user-service-77cff9598c-gkfb5   0/1     ImagePullBackOff   0          101m    10.244.1.2   minikube-m02   <none>           <none>
user-service-64fff7786d-fxnj5   1/1     Terminating        0          4h20m   10.244.0.6   minikube       <none>           <none>
user-service-64fff7786d-fxnj5   1/1     Terminating        0          4h20m   10.244.0.6   minikube       <none>           <none>
user-service-64fff7786d-chrrq   0/1     Pending            0          0s      <none>       <none>         <none>           <none>
user-service-64fff7786d-chrrq   0/1     Pending            0          0s      <none>       minikube-m02   <none>           <none>
user-service-64fff7786d-chrrq   0/1     ContainerCreating   0          0s      <none>       minikube-m02   <none>           <none>
user-service-64fff7786d-chrrq   1/1     Running             0          1s      10.244.1.6   minikube-m02   <none>           <none>
user-service-64fff7786d-fxnj5   0/1     Error               0          4h21m   10.244.0.6   minikube       <none>           <none>
user-service-64fff7786d-fxnj5   0/1     Error               0          4h21m   10.244.0.6   minikube       <none>           <none>
user-service-64fff7786d-fxnj5   0/1     Error               0          4h21m   10.244.0.6   minikube       <none>           <none>
user-service-77cff9598c-gkfb5   0/1     ErrImagePull        0          105m    10.244.1.2   minikube-m02   <none>           <none>
user-service-77cff9598c-gkfb5   0/1     ImagePullBackOff    0          106m    10.244.1.2   minikube-m02   <none>           <none>

* You will see:
---------------
Old Pod
   ↓
Deleted
   ↓
Deployment notices desired replicas are missing
   ↓
ReplicaSet creates a new Pod
   ↓
Scheduler chooses a Ready node
   ↓
New Pod starts

* What you prove: 

- Pod failure does NOT mean the application goes down permanently.

The Deployment/ReplicaSet maintains the desired number of Pods.


* Node Failure:
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl get pods -o wide
NAME                            READY   STATUS             RESTARTS   AGE     IP           NODE           NOMINATED NODE   READINESS GATES
configmap-pod                   1/1     Running            0          73m     10.244.1.5   minikube-m02   <none>           <none>
node-selector-pod               1/1     Running            0          109m    10.244.1.4   minikube-m02   <none>           <none>
user-service-64fff7786d-chrrq   1/1     Running            0          11m     10.244.1.6   minikube-m02   <none>           <none>
user-service-64fff7786d-k9hwj   1/1     Running            0          4h32m   10.244.0.5   minikube       <none>           <none>
user-service-77cff9598c-gkfb5   0/1     ImagePullBackOff   0          113m    10.244.1.2   minikube-m02   <none>           <none>
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % minikube node stop minikube-m02
✋  Stopping node "minikube-m02"  ...
🛑  Powering off "minikube-m02" via SSH ...
🛑  Successfully stopped node minikube-m02
multinode-poc % kubectl get nodes -w
NAME           STATUS   ROLES           AGE     VERSION
minikube       Ready    control-plane   5h36m   v1.35.1
minikube-m02   Ready    <none>          5h36m   v1.35.1
minikube-m02   NotReady   <none>          5h37m   v1.35.1
minikube-m02   NotReady   <none>          5h37m   v1.35.1
minikube-m02   NotReady   <none>          5h37m   v1.35.1

keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl get pods -o wide
NAME                            READY   STATUS             RESTARTS   AGE     IP           NODE           NOMINATED NODE   READINESS GATES
configmap-pod                   1/1     Running            0          76m     10.244.1.5   minikube-m02   <none>           <none>
node-selector-pod               1/1     Running            0          112m    10.244.1.4   minikube-m02   <none>           <none>
user-service-64fff7786d-chrrq   1/1     Running            0          15m     10.244.1.6   minikube-m02   <none>           <none>
user-service-64fff7786d-k9hwj   1/1     Running            0          4h35m   10.244.0.5   minikube       <none>           <none>
user-service-77cff9598c-gkfb5   0/1     ImagePullBackOff   0          117m    10.244.1.2   minikube-m02   <none>           <none>
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl get pods -o wide
NAME                            READY   STATUS        RESTARTS   AGE     IP           NODE           NOMINATED NODE   READINESS GATES
configmap-pod                   1/1     Terminating   0          81m     10.244.1.5   minikube-m02   <none>           <none>
node-selector-pod               1/1     Terminating   0          117m    10.244.1.4   minikube-m02   <none>           <none>
user-service-64fff7786d-2k6zd   1/1     Running       0          2m13s   10.244.0.7   minikube       <none>           <none>
user-service-64fff7786d-chrrq   1/1     Terminating   0          20m     10.244.1.6   minikube-m02   <none>           <none>
user-service-64fff7786d-k9hwj   1/1     Running       0          4h41m   10.244.0.5   minikube       <none>           <none>
user-service-77cff9598c-cjwz2   0/1     Pending       0          2m13s   <none>       <none>         <none>           <none>
user-service-77cff9598c-gkfb5   0/1     Terminating   0          122m    10.244.1.2   minikube-m02   <none>           <none>
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % 

* Standalone Pod

Your:
-----
configmap-pod
node-selector-pod

These are probably created directly with:
-----------------------------------------
kind: Pod

If the node dies:
------------------
Node failure
    ↓
Standalone Pod disappears                                                                                            -->*important point*
    ↓
Kubernetes does NOT create a replacement

- Because there is no Deployment/ReplicaSet controlling them.


Therefore:
------------
Pod failure
    ↓
ReplicaSet notices replica count is below desired
    ↓
Creates replacement Pod

And:
-----
Node failure
    ↓
Node becomes NotReady
    ↓
Pod on that node becomes unavailable
    ↓
Replacement Pod is created
    ↓
Scheduler selects healthy node


keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl get deployment
NAME           READY   UP-TO-DATE   AVAILABLE   AGE
user-service   2/2     1            2           5h26m
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl get rs
NAME                      DESIRED   CURRENT   READY   AGE
user-service-64fff7786d   2         2         2       5h26m
user-service-77cff9598c   1         1         0       133m

* Here after node 2 is stopped that pod is terminated and created new in another node 1:                                  -->*important notes*
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % kubectl get pods -o wide
NAME                            READY   STATUS        RESTARTS   AGE     IP       NODE           NOMINATED NODE   READINESS GATES
configmap-pod                   1/1     Terminating   0          96m     10.244.1.5   minikube-m02   <none>           <none>
node-selector-pod               1/1     Terminating   0          132m    10.244.1.4   minikube-m02   <none>           <none>
user-service-64fff7786d-2k6zd   1/1     *Running*       0          16m     10.244.0.7   minikube       <none>           <none>
user-service-64fff7786d-chrrq   1/1     Terminating   0          35m     10.244.1.6   minikube-m02   <none>           <none>
user-service-64fff7786d-k9hwj   1/1     *Running*       0          4h55m   10.244.0.5   minikube       <none>           <none>
user-service-77cff9598c-cjwz2   0/1     Pending       0          16m     <none>       <none>         <none>           <none>
user-service-77cff9598c-gkfb5   0/1     Terminating   0          137m    10.244.1.2   minikube-m02   <none>           <none>
keerthana@Keerthanas-MacBook-Air kubernetes-multinode-poc % 



