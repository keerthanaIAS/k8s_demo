# 1: NODESELECTOR:

* Add a label to the node:

- NodeSelector works using labels.

keerthana@Mac-169 k8s % kubectl label node minikube environment=testing
node/minikube labeled
keerthana@Mac-169 k8s % kubectl get nodes --show-labels
NAME       STATUS   ROLES           AGE   VERSION   LABELS
minikube   Ready    control-plane   25h   v1.35.1   beta.kubernetes.io/arch=arm64,beta.kubernetes.io/os=linux,environment=testing,kubernetes.io/arch=arm64,kubernetes.io/hostname=minikube,kubernetes.io/os=linux,minikube.k8s.io/commit=c93a4cb9311efc66b90d33ea03f75f2c4120e9b0,minikube.k8s.io/name=minikube,minikube.k8s.io/primary=true,minikube.k8s.io/updated_at=2026_08_10T10_06_18_0700,minikube.k8s.io/version=v1.38.1,node-role.kubernetes.io/control-plane=,node.kubernetes.io/exclude-from-external-load-balancers=
keerthana@Mac-169 k8s % 

Why are we doing this?
----------------------
Because later the Pod will say:

nodeSelector:
  environment: testing

Kubernetes will interpret that as:

"Only schedule me onto a node that has environment=testing."


- we'll create a Pod with NodeSelector.

* Create node-selector-pod.yaml:

keerthana@Mac-169 k8s % kubectl apply -f node-selector-pod.yaml
pod/node-selector-pod created
keerthana@Mac-169 k8s % kubectl get pod node-selector-pod -o wide
NAME                READY   STATUS    RESTARTS   AGE   IP            NODE       NOMINATED NODE   READINESS GATES
node-selector-pod   1/1     Running   0          8s    10.244.0.22   minikube   <none>           <none>
keerthana@Mac-169 k8s % 

- The key thing to notice is:

nodeSelector:
  environment: testing

This tells the scheduler:
--------------------------
"Only consider nodes having the label environment=testing."

* But we haven't actually proved the restriction yet:

Change:

nodeSelector:
  environment: testing

to:

nodeSelector:
  environment: production

keerthana@Mac-169 k8s % kubectl delete pod node-selector-pod
pod "node-selector-pod" deleted
keerthana@Mac-169 k8s % kubectl apply -f node-selector-pod.yaml
pod/node-selector-pod created
keerthana@Mac-169 k8s % kubectl get pod node-selector-pod -o wide
NAME                READY   STATUS    RESTARTS   AGE   IP       NODE     NOMINATED NODE   READINESS GATES
node-selector-pod   0/1     Pending   0          5s    <none>   <none>   <none>           <none>
keerthana@Mac-169 k8s % 

Why?

Node:
environment=testing

Pod:
environment=production

testing ≠ production
        ↓
No matching node
        ↓
Pod Pending

This is the actual proof that NodeSelector is selecting based on the node label.

After change the label -> production to testing:
-------------------------------------------------
keerthana@Mac-169 k8s % kubectl delete pod node-selector-pod          
pod "node-selector-pod" deleted
keerthana@Mac-169 k8s % kubectl apply -f node-selector-pod.yaml  
pod/node-selector-pod created
keerthana@Mac-169 k8s % kubectl get pod node-selector-pod -o wide
NAME                READY   STATUS              RESTARTS   AGE   IP       NODE       NOMINATED NODE   READINESS GATES
node-selector-pod   0/1     ContainerCreating   0          3s    <none>   minikube   <none>           <none>
keerthana@Mac-169 k8s % kubectl get pod node-selector-pod -o wide
NAME                READY   STATUS    RESTARTS   AGE   IP            NODE       NOMINATED NODE   READINESS GATES
node-selector-pod   1/1     Running   0          8s    10.244.0.23   minikube   <none>           <none>
keerthana@Mac-169 k8s % 

* This is the key difference from Taints
----------------------------------------
With the taint experiment:

Node: 🚫 Don't come here
Pod:  ✅ I tolerate your restriction

With NodeSelector:

Pod: 🎯 I need a node with this label
Node: ❌ My label doesn't match

So:

Taint controls who is allowed onto the node.
NodeSelector controls which labeled nodes the Pod can choose.

# 2: NODE AFFINITY:

What we're proving
------------------
NodeSelector says:

"The node must have this label."

Node Affinity can express more powerful rules, such as:

"The node must have one of these labels."

or later:

"Prefer this type of node, but don't require it."

* Create the Affinity Pod:
-------------------------

- After created the node-affinity-pod.yaml file:

keerthana@Mac-169 k8s % kubectl apply -f node-affinity-pod.yaml
pod/node-affinity-pod created
keerthana@Mac-169 k8s % kubectl get pod node-affinity-pod -o wide
NAME                READY   STATUS    RESTARTS   AGE   IP            NODE       NOMINATED NODE   READINESS GATES
node-affinity-pod   1/1   

* For now, understand only this:

key: environment
operator: In
values:
  - testing

means:
------
"I require a node whose environment label is testing."


* What your Affinity rule says:

You configured:

```yaml
requiredDuringSchedulingIgnoredDuringExecution:
  nodeSelectorTerms:
    - matchExpressions:
        - key: environment
          operator: In
          values:
            - testing
```

Meaning:

> **The Pod requires a node whose `environment` label is `testing`.**

* Now let's see why Affinity is more powerful

NodeSelector can basically do:

```yaml
nodeSelector:
  environment: testing
```

Affinity can do things like:
----------------------------
* Option 1 — OR condition

> Run on a node where environment is **testing OR staging**.

```yaml
matchExpressions:
  - key: environment
    operator: In
    values:
      - testing
      - staging
```

So:

```text
testing  → ✅
staging  → ✅
production → ❌
```

* Option 2 — NOT condition

> Don't run on production nodes.

```yaml
matchExpressions:
  - key: environment
    operator: NotIn
    values:
      - production
```

* Option 3 — Prefer rather than require

This is the big one.

You can tell Kubernetes:

> **"Prefer this type of node, but if it isn't available, you can use another node."**

That's called:

```text
preferredDuringSchedulingIgnoredDuringExecution
```

So the hierarchy is:

```text
NodeSelector
    ↓
Simple exact matching

Node Affinity
    ↓
More expressive matching
    ↓
In / NotIn / Exists / DoesNotExist
    ↓
Required OR preferred rules
```

* Three POCs now:

| POC                    | What you proved                                       |
| ---------------------- | ----------------------------------------------------- |
| **Taint + Toleration** | Node can repel Pods; Pod can tolerate the restriction |
| **NodeSelector**       | Pod selects nodes using labels                        |
| **Node Affinity**      | Pod can select nodes using more flexible rules        |

* Then we'll add a second Minikube worker and test:
------------------------------------------------
Node 1 → environment=testing
Node 2 → environment=production

Pod → preferred: environment=testing

---

* Why two nodes matter for `preferred`

Suppose we have:

```text
Node A
environment=testing

Node B
environment=production
```

And the Pod says:

```yaml
preferredDuringSchedulingIgnoredDuringExecution:
  ...
  environment=testing
```

Now Kubernetes has a **choice**:

```text
             Pod
              │
       "I prefer testing"
              │
        ┌─────┴─────┐
        ▼           ▼
     Node A       Node B
     testing      production
       ⭐            ○
     preferred
```

keerthana@Mac-169 k8s % minikube node add
😄  Adding node m02 to cluster minikube as [worker]
❗  Cluster was created without any CNI, adding a node to it might cause broken networking.
👍  Starting "minikube-m02" worker node in "minikube" cluster
🚜  Pulling base image v0.0.50 ...
🔥  Creating docker container (CPUs=2, Memory=2200MB) ...
🐳  Preparing Kubernetes v1.35.1 on Docker 29.2.1 ...
🔎  Verifying Kubernetes components...
🏄  Successfully added m02 to minikube!
keerthana@Mac-169 k8s %


keerthana@Mac-169 k8s % kubectl get nodes -o wide
NAME           STATUS     ROLES           AGE     VERSION   INTERNAL-IP    EXTERNAL-IP   OS-IMAGE                         KERNEL-VERSION     CONTAINER-RUNTIME
minikube       Ready      control-plane   26h     v1.35.1   192.168.49.2   <none>        Debian GNU/Linux 12 (bookworm)   6.10.14-linuxkit   docker://29.2.1
minikube-m02   NotReady   <none>          3m15s   v1.35.1   192.168.49.3   <none>        Debian GNU/Linux 12 (bookworm)   6.10.14-linuxkit   docker://29.2.1
keerthana@Mac-169 k8s % kubectl get pods -A -o wide
NAMESPACE     NAME                               READY   STATUS    RESTARTS       AGE     IP             NODE           NOMINATED NODE   READINESS GATES
default       node-affinity-pod                  1/1     Running   0              45m     10.244.0.24    minikube       <none>           <none>
default       node-selector-pod                  1/1     Running   0              51m     10.244.0.23    minikube       <none>           <none>
default       normal-pod                         1/1     Running   0              120m    10.244.0.21    minikube       <none>           <none>
default       toleration-pod                     1/1     Running   0              112m    10.244.0.20    minikube       <none>           <none>
health-poc    health-app-5ff4b446cb-bqxr8        1/1     Running   2 (145m ago)   21h     10.244.0.19    minikube       <none>           <none>
health-poc    health-app-5ff4b446cb-vhl7w        1/1     Running   1 (145m ago)   21h     10.244.0.17    minikube       <none>           <none>
kube-system   coredns-7d764666f9-crpnt           1/1     Running   1 (145m ago)   26h     10.244.0.18    minikube       <none>           <none>
kube-system   etcd-minikube                      1/1     Running   1 (145m ago)   26h     192.168.49.2   minikube       <none>           <none>
kube-system   kube-apiserver-minikube            1/1     Running   1 (145m ago)   26h     192.168.49.2   minikube       <none>           <none>
kube-system   kube-controller-manager-minikube   1/1     Running   1 (145m ago)   26h     192.168.49.2   minikube       <none>           <none>
kube-system   kube-proxy-552wp                   1/1     Running   0              3m21s   192.168.49.3   minikube-m02   <none>           <none>
kube-system   kube-proxy-jdjrt                   1/1     Running   1 (145m ago)   26h     192.168.49.2   minikube       <none>           <none>
kube-system   kube-scheduler-minikube            1/1     Running   1 (145m ago)   26h     192.168.49.2   minikube       <none>           <none>
kube-system   metrics-server-9d74bb658-l54jc     1/1     Running   2 (145m ago)   22h     10.244.0.16    minikube       <none>           <none>
kube-system   storage-provisioner                1/1     Running   2 (145m ago)   26h     192.168.49.2   minikube       <none>           <none>
keerthana@Mac-169 k8s % kubectl describe node minikube-m02
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
                    minikube.k8s.io/updated_at=2026_08_11T12_21_42_0700
                    minikube.k8s.io/version=v1.38.1
Annotations:        node.alpha.kubernetes.io/ttl: 0
                    volumes.kubernetes.io/controller-managed-attach-detach: true
CreationTimestamp:  Tue, 11 Aug 2026 12:21:42 +0530
Taints:             node.kubernetes.io/not-ready:NoExecute
                    node.kubernetes.io/not-ready:NoSchedule
Unschedulable:      false
Lease:
  HolderIdentity:  minikube-m02
  AcquireTime:     <unset>
  RenewTime:       Tue, 11 Aug 2026 12:25:25 +0530
Conditions:
  Type             Status  LastHeartbeatTime                 LastTransitionTime                Reason                       Message
  ----             ------  -----------------                 ------------------                ------                       -------
  MemoryPressure   False   Tue, 11 Aug 2026 12:21:52 +0530   Tue, 11 Aug 2026 12:21:42 +0530   KubeletHasSufficientMemory   kubelet has sufficient memory available
  DiskPressure     False   Tue, 11 Aug 2026 12:21:52 +0530   Tue, 11 Aug 2026 12:21:42 +0530   KubeletHasNoDiskPressure     kubelet has no disk pressure
  PIDPressure      False   Tue, 11 Aug 2026 12:21:52 +0530   Tue, 11 Aug 2026 12:21:42 +0530   KubeletHasSufficientPID      kubelet has sufficient PID available
  Ready            False   Tue, 11 Aug 2026 12:21:52 +0530   Tue, 11 Aug 2026 12:21:42 +0530   KubeletNotReady              container runtime network not ready: NetworkReady=false reason:NetworkPluginNotReady message:docker: network plugin is not ready: cni config uninitialized
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
  Boot ID:                    17c425b7-c9b6-428b-94ec-0f4af7afcb59
  Kernel Version:             6.10.14-linuxkit
  OS Image:                   Debian GNU/Linux 12 (bookworm)
  Operating System:           linux
  Architecture:               arm64
  Container Runtime Version:  docker://29.2.1
  Kubelet Version:            v1.35.1
  Kube-Proxy Version:         
PodCIDR:                      10.244.1.0/24
PodCIDRs:                     10.244.1.0/24
Non-terminated Pods:          (1 in total)
  Namespace                   Name                CPU Requests  CPU Limits  Memory Requests  Memory Limits  Age
  ---------                   ----                ------------  ----------  ---------------  -------------  ---
  kube-system                 kube-proxy-552wp    0 (0%)        0 (0%)      0 (0%)           0 (0%)         3m49s
Allocated resources:
  (Total limits may be over 100 percent, i.e., overcommitted.)
  Resource           Requests  Limits
  --------           --------  ------
  cpu                0 (0%)    0 (0%)
  memory             0 (0%)    0 (0%)
  ephemeral-storage  0 (0%)    0 (0%)
  hugepages-1Gi      0 (0%)    0 (0%)
  hugepages-2Mi      0 (0%)    0 (0%)
  hugepages-32Mi     0 (0%)    0 (0%)
  hugepages-64Ki     0 (0%)    0 (0%)
Events:
  Type    Reason          Age    From             Message
  ----    ------          ----   ----             -------
  Normal  RegisteredNode  3m45s  node-controller  Node minikube-m02 event: Registered Node minikube-m02 in Controller
keerthana@Mac-169 k8s % kubectl get pods -n kube-system -o wide
NAME                               READY   STATUS    RESTARTS       AGE     IP             NODE           NOMINATED NODE   READINESS GATES
coredns-7d764666f9-crpnt           1/1     Running   1 (146m ago)   26h     10.244.0.18    minikube       <none>           <none>
etcd-minikube                      1/1     Running   1 (146m ago)   26h     192.168.49.2   minikube       <none>           <none>
kube-apiserver-minikube            1/1     Running   1 (146m ago)   26h     192.168.49.2   minikube       <none>           <none>
kube-controller-manager-minikube   1/1     Running   1 (146m ago)   26h     192.168.49.2   minikube       <none>           <none>
kube-proxy-552wp                   1/1     Running   0              3m57s   192.168.49.3   minikube-m02   <none>           <none>
kube-proxy-jdjrt                   1/1     Running   1 (146m ago)   26h     192.168.49.2   minikube       <none>           <none>
kube-scheduler-minikube            1/1     Running   1 (146m ago)   26h     192.168.49.2   minikube       <none>           <none>
metrics-server-9d74bb658-l54jc     1/1     Running   2 (146m ago)   22h     10.244.0.16    minikube       <none>           <none>
storage-provisioner                1/1     Running   2 (146m ago)   26h     192.168.49.2   minikube       <none>           <none>
keerthana@Mac-169 k8s % 

* Your current state is:

minikube       Ready
minikube-m02   NotReady

- We already know the worker's likely problem is CNI/networking, but don't assume. Your previous multi-node attempt had the same NetworkPluginNotReady/CNI issue, and we need to confirm what this cluster is reporting now.

* Confirmed. This is not an Affinity problem. Your worker has a CNI/networking problem.

The decisive line is:
----------------------
Ready False
Reason: KubeletNotReady
Message: container runtime network not ready:
NetworkReady=false
reason:NetworkPluginNotReady
message: docker: network plugin is not ready: cni config uninitialized

And your worker has:
---------------------
PodCIDR: 10.244.1.0/24

- but no CNI configuration has been initialized on minikube-m02.

* Why this happened:

When you created the original Minikube cluster, it was created without CNI. Minikube explicitly warned you:

Cluster was created without any CNI, adding a node to it might cause broken networking.

So adding the worker exposed that configuration problem.

Also notice:
-------------
minikube-m02
└── kube-proxy ✅

but there is no CNI networking component running on the worker.


* Capture what you currently have:

keerthana@Mac-169 k8s % kubectl get all -A
NAMESPACE     NAME                                   READY   STATUS    RESTARTS       AGE
default       pod/node-affinity-pod                  1/1     Running   0              56m
default       pod/node-selector-pod                  1/1     Running   0              62m
default       pod/normal-pod                         1/1     Running   0              131m
default       pod/toleration-pod                     1/1     Running   0              123m
health-poc    pod/health-app-5ff4b446cb-bqxr8        1/1     Running   2 (156m ago)   22h
health-poc    pod/health-app-5ff4b446cb-vhl7w        1/1     Running   1 (156m ago)   22h
kube-system   pod/coredns-7d764666f9-crpnt           1/1     Running   1 (156m ago)   26h
kube-system   pod/etcd-minikube                      1/1     Running   1 (156m ago)   26h
kube-system   pod/kube-apiserver-minikube            1/1     Running   1 (156m ago)   26h
kube-system   pod/kube-controller-manager-minikube   1/1     Running   1 (156m ago)   26h
kube-system   pod/kube-proxy-552wp                   1/1     Running   0              14m
kube-system   pod/kube-proxy-jdjrt                   1/1     Running   1 (156m ago)   26h
kube-system   pod/kube-scheduler-minikube            1/1     Running   1 (156m ago)   26h
kube-system   pod/metrics-server-9d74bb658-l54jc     1/1     Running   2 (156m ago)   22h
kube-system   pod/storage-provisioner                1/1     Running   2 (156m ago)   26h

NAMESPACE     NAME                         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)                  AGE
default       service/kubernetes           ClusterIP   10.96.0.1       <none>        443/TCP                  26h
health-poc    service/health-app-service   ClusterIP   10.97.162.126   <none>        80/TCP                   26h
kube-system   service/kube-dns             ClusterIP   10.96.0.10      <none>        53/UDP,53/TCP,9153/TCP   26h
kube-system   service/metrics-server       ClusterIP   10.104.155.70   <none>        443/TCP                  22h

NAMESPACE     NAME                        DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR            AGE
kube-system   daemonset.apps/kube-proxy   2         2         2       2            2           kubernetes.io/os=linux   26h

NAMESPACE     NAME                             READY   UP-TO-DATE   AVAILABLE   AGE
health-poc    deployment.apps/health-app       2/2     2            2           26h
kube-system   deployment.apps/coredns          1/1     1            1           26h
kube-system   deployment.apps/metrics-server   1/1     1            1           22h

NAMESPACE     NAME                                       DESIRED   CURRENT   READY   AGE
health-poc    replicaset.apps/health-app-5dc7bb648       0         0         0       22h
health-poc    replicaset.apps/health-app-5ff4b446cb      2         2         2       22h
health-poc    replicaset.apps/health-app-6ddfcdb79c      0         0         0       25h
health-poc    replicaset.apps/health-app-798db7fc99      0         0         0       25h
health-poc    replicaset.apps/health-app-f7d8cd445       0         0         0       22h
health-poc    replicaset.apps/health-app-ff9fc55f8       0         0         0       26h
kube-system   replicaset.apps/coredns-7d764666f9         1         1         1       26h
kube-system   replicaset.apps/metrics-server-9d74bb658   1         1         1       22h
keerthana@Mac-169 k8s % kubectl get nodes --show-labels
NAME           STATUS     ROLES           AGE   VERSION   LABELS
minikube       Ready      control-plane   26h   v1.35.1   beta.kubernetes.io/arch=arm64,beta.kubernetes.io/os=linux,environment=testing,kubernetes.io/arch=arm64,kubernetes.io/hostname=minikube,kubernetes.io/os=linux,minikube.k8s.io/commit=c93a4cb9311efc66b90d33ea03f75f2c4120e9b0,minikube.k8s.io/name=minikube,minikube.k8s.io/primary=true,minikube.k8s.io/updated_at=2026_08_10T10_06_18_0700,minikube.k8s.io/version=v1.38.1,node-role.kubernetes.io/control-plane=,node.kubernetes.io/exclude-from-external-load-balancers=
minikube-m02   NotReady   <none>          14m   v1.35.1   beta.kubernetes.io/arch=arm64,beta.kubernetes.io/os=linux,kubernetes.io/arch=arm64,kubernetes.io/hostname=minikube-m02,kubernetes.io/os=linux,minikube.k8s.io/commit=c93a4cb9311efc66b90d33ea03f75f2c4120e9b0,minikube.k8s.io/name=minikube,minikube.k8s.io/primary=false,minikube.k8s.io/updated_at=2026_08_11T12_21_42_0700,minikube.k8s.io/version=v1.38.1
keerthana@Mac-169 k8s % 


* Delete the broken cluster:

❌ Old approach
Create cluster without CNI
        ↓
Add worker
        ↓
worker = NotReady

✅ New approach
Create cluster WITH CNI
        ↓
Verify control plane
        ↓
Add worker
        ↓
Verify both nodes = Ready

keerthana@Mac-169 k8s % minikube delete
🔥  Deleting "minikube" in docker ...
🔥  Deleting container "minikube" ...
🔥  Deleting container "minikube-m02" ...
🔥  Removing /Users/keerthana/.minikube/machines/minikube ...
🔥  Removing /Users/keerthana/.minikube/machines/minikube-m02 ...
💀  Removed all traces of the "minikube" cluster.
keerthana@Mac-169 k8s % 

* Create Minikube with CNI:

 - We're explicitly choosing Calico as the CNI so the worker gets proper Pod networking when we add it.

keerthana@Mac-169 k8s % minikube start --driver=docker --cni=calico
😄  minikube v1.38.1 on Darwin 26.4.1 (arm64)
✨  Using the docker driver based on user configuration
❗  Starting v1.39.0, minikube will default to "containerd" container runtime. See #21973 for more info.
📌  Using Docker Desktop driver with root privileges
👍  Starting "minikube" primary control-plane node in "minikube" cluster
🚜  Pulling base image v0.0.50 ...
🔥  Creating docker container (CPUs=2, Memory=4000MB) ...
🐳  Preparing Kubernetes v1.35.1 on Docker 29.2.1 ...
🔗  Configuring Calico (Container Networking Interface) ...
🔎  Verifying Kubernetes components...
    ▪ Using image gcr.io/k8s-minikube/storage-provisioner:v5
🌟  Enabled addons: storage-provisioner, default-storageclass

❗  /usr/local/bin/kubectl is version 1.32.2, which may have incompatibilities with Kubernetes 1.35.1.
    ▪ Want kubectl v1.35.1? Try 'minikube kubectl -- get pods -A'
🏄  Done! kubectl is now configured to use "minikube" cluster and "default" namespace by default
keerthana@Mac-169 k8s % 


keerthana@Mac-169 k8s % kubectl get pods -n kube-system
NAME                                       READY   STATUS              RESTARTS   AGE
calico-kube-controllers-565c89d6df-94wz6   0/1     ContainerCreating   0          42s
calico-node-5c5z8                          0/1     Init:2/3            0          42s
coredns-7d764666f9-wsj88                   0/1     ContainerCreating   0          42s
etcd-minikube                              1/1     Running             0          48s
kube-apiserver-minikube                    1/1     Running             0          48s
kube-controller-manager-minikube           1/1     Running             0          48s
kube-proxy-8x7gx                           1/1     Running             0          42s
kube-scheduler-minikube                    1/1     Running             0          48s
storage-provisioner                        1/1     Running             0          46s
keerthana@Mac-169 k8s % kubectl get pods -A -o wide | grep -i calico
kube-system   calico-kube-controllers-565c89d6df-94wz6   0/1     ContainerCreating   0          54s   <none>         minikube   <none>      <none>
kube-system   calico-node-5c5z8                          0/1     Init:2/3            0          54s   192.168.49.2   minikube   <none>      <none>
keerthana@Mac-169 k8s % 

- If Calico is healthy, then we'll add m02. Don't add it yet.

* You ran:

kubectl get nodes

and got:

NAME       STATUS   ROLES
minikube   Ready    control-plane

That means:

minikube
   │
   ├── Role: control-plane
   │
   ├── API Server
   ├── Scheduler
   ├── Controller Manager
   └── etcd

So right now you have only one node, and that node is the control plane.                                                            -->*important note*

* When we add the second node:

We'll run:

minikube node add

Then you'll have:

minikube        → control-plane
minikube-m02    → <none>

Why <none>?

Because the second node is a worker node. It doesn't run the control-plane components.                                                 -->*important note*

So:

                 Kubernetes Cluster
                        │
             ┌──────────┴──────────┐
             │                     │
             ▼                     ▼
       minikube               minikube-m02
       control-plane              <none>
             │                     │
       API Server              Your Pods
       Scheduler
       Controller
       etcd

ROLES being <none> doesn't mean the node is broken.

It simply means Kubernetes hasn't assigned a special role label such as:

        control-plane

to that worker.

* What you're seeing right now with Calico:

This:

calico-node    0/1   Init:2/3

and:

calico-kube-controllers   0/1   ContainerCreating

is normal during startup if the cluster has only been running for ~1 minute.

keerthana@Mac-169 k8s % kubectl get pods -n kube-system
NAME                                       READY   STATUS    RESTARTS   AGE
calico-kube-controllers-565c89d6df-94wz6   1/1     Running   0          18m
calico-node-5c5z8                          1/1     Running   0          18m
coredns-7d764666f9-wsj88                   1/1     Running   0          18m
etcd-minikube                              1/1     Running   0          18m
kube-apiserver-minikube                    1/1     Running   0          18m
kube-controller-manager-minikube           1/1     Running   0          18m
kube-proxy-8x7gx                           1/1     Running   0          18m
kube-scheduler-minikube                    1/1     Running   0          18m
storage-provisioner                        1/1     Running   0          18m
keerthana@Mac-169 k8s % 

- And your mental model should be:

Control plane is also a node.
Worker is also a node.
The difference is what Kubernetes components/roles run on them.

keerthana@Mac-169 k8s % kubectl get nodes -o wide
NAME       STATUS   ROLES           AGE   VERSION   INTERNAL-IP    EXTERNAL-IP   OS-IMAGE                         KERNEL-VERSION     CONTAINER-RUNTIME
minikube   Ready    control-plane   23m   v1.35.1   192.168.49.2   <none>        Debian GNU/Linux 12 (bookworm)   6.10.14-linuxkit   docker://29.2.1
keerthana@Mac-169 k8s % minikube node add
😄  Adding node m02 to cluster minikube as [worker]
❗  Cluster was created without any CNI, adding a node to it might cause broken networking.
👍  Starting "minikube-m02" worker node in "minikube" cluster
🚜  Pulling base image v0.0.50 ...
🔥  Creating docker container (CPUs=2, Memory=2200MB) ...
🐳  Preparing Kubernetes v1.35.1 on Docker 29.2.1 ...
🔎  Verifying Kubernetes components...
🏄  Successfully added m02 to minikube!
keerthana@Mac-169 k8s % kubectl get nodes -o wide
NAME           STATUS     ROLES           AGE   VERSION   INTERNAL-IP    EXTERNAL-IP   OS-IMAGE                         KERNEL-VERSION     CONTAINER-RUNTIME
minikube       Ready      control-plane   24m   v1.35.1   192.168.49.2   <none>        Debian GNU/Linux 12 (bookworm)   6.10.14-linuxkit   docker://29.2.1
minikube-m02   NotReady   <none>          5s    v1.35.1   192.168.49.3   <none>        Debian GNU/Linux 12 (bookworm)   6.10.14-linuxkit   docker://29.2.1
keerthana@Mac-169 k8s % kubectl get nodes -o wide
NAME           STATUS   ROLES           AGE   VERSION   INTERNAL-IP    EXTERNAL-IP   OS-IMAGE                         KERNEL-VERSION     CONTAINER-RUNTIME
minikube       Ready    control-plane   91m   v1.35.1   192.168.49.2   <none>        Debian GNU/Linux 12 (bookworm)   6.10.14-linuxkit   docker://29.2.1
minikube-m02   Ready    <none>          66m   v1.35.1   192.168.49.3   <none>        Debian GNU/Linux 12 (bookworm)   6.10.14-linuxkit   docker://29.2.1
keerthana@Mac-169 k8s % 

* Give each node a different label:

keerthana@Mac-169 k8s % kubectl label node minikube-m02 environment=production
node/minikube-m02 labeled
keerthana@Mac-169 k8s % kubectl get nodes --show-labels
NAME           STATUS   ROLES           AGE   VERSION   LABELS
minikube       Ready    control-plane   99m   v1.35.1   beta.kubernetes.io/arch=arm64,beta.kubernetes.io/os=linux,kubernetes.io/arch=arm64,kubernetes.io/hostname=minikube,kubernetes.io/os=linux,minikube.k8s.io/commit=c93a4cb9311efc66b90d33ea03f75f2c4120e9b0,minikube.k8s.io/name=minikube,minikube.k8s.io/primary=true,minikube.k8s.io/updated_at=2026_08_11T12_38_18_0700,minikube.k8s.io/version=v1.38.1,node-role.kubernetes.io/control-plane=,node.kubernetes.io/exclude-from-external-load-balancers=
minikube-m02   Ready    <none>          75m   v1.35.1   beta.kubernetes.io/arch=arm64,beta.kubernetes.io/os=linux,environment=production,kubernetes.io/arch=arm64,kubernetes.io/hostname=minikube-m02,kubernetes.io/os=linux,minikube.k8s.io/commit=c93a4cb9311efc66b90d33ea03f75f2c4120e9b0,minikube.k8s.io/name=minikube,minikube.k8s.io/primary=false,minikube.k8s.io/updated_at=2026_08_11T13_02_21_0700,minikube.k8s.io/version=v1.38.1
keerthana@Mac-169 k8s % 

keerthana@Mac-169 k8s % kubectl label node minikube environment=testing
node/minikube labeled
keerthana@Mac-169 k8s % kubectl get nodes -L environment
NAME           STATUS   ROLES           AGE    VERSION   ENVIRONMENT
minikube       Ready    control-plane   100m   v1.35.1   testing
minikube-m02   Ready    <none>          76m    v1.35.1   production
keerthana@Mac-169 k8s % 

* After create the file of preferred-affinity-pod.yaml file:

keerthana@Mac-169 k8s % kubectl apply -f preferred-affinity-pod.yaml
pod/preferred-affinity-pod created
keerthana@Mac-169 k8s % kubectl get pod preferred-affinity-pod -o wide
NAME                     READY   STATUS              RESTARTS   AGE   IP       NODE       NOMINATED NODE   READINESS GATES
preferred-affinity-pod   0/1     ContainerCreating   0          8s    <none>   minikube   <none>           <none>
keerthana@Mac-169 k8s % kubectl get pod preferred-affinity-pod -o wide
NAME                     READY   STATUS    RESTARTS   AGE   IP              NODE       NOMINATED NODE   READINESS GATES
preferred-affinity-pod   1/1     Running   0          14s   10.244.120.67   minikube   <none>           <none>
keerthana@Mac-169 k8s % 

The Pod says:

```text
"I PREFER environment=testing"
```

So the scheduler has:

```text
                 Pod
                  │
          Prefer testing
                  │
          ┌───────┴───────┐
          ▼               ▼
      minikube         minikube-m02
       testing          production
         ⭐                ○
```

We expect the Pod to land on:

```text
minikube
```

But here's the important difference:

**`preferred` is not a restriction.**

---

* the Pod said:

preferredDuringSchedulingIgnoredDuringExecution:
  ...
  environment:
    - testing
But now let's prove the difference

Right now we only proved:
------------------------
Preferred node is chosen when available.

We haven't proved that preferred is not mandatory.


* Cordon minikube:

keerthana@Mac-169 k8s % kubectl cordon minikube
node/minikube cordoned
keerthana@Mac-169 k8s % 

Cordon means:
  Don't schedule new Pods onto this node.

- It does not remove existing Pods.

keerthana@Mac-169 k8s % kubectl get nodes
NAME           STATUS                     ROLES           AGE    VERSION
minikube       Ready,SchedulingDisabled   control-plane   109m   v1.35.1
minikube-m02   Ready                      <none>          85m    v1.35.1
keerthana@Mac-169 k8s % 


* Recreate the Pod:

keerthana@Mac-169 k8s % kubectl delete pod preferred-affinity-pod
pod "preferred-affinity-pod" deleted
keerthana@Mac-169 k8s % kubectl apply -f preferred-affinity-pod.yaml
pod/preferred-affinity-pod created
keerthana@Mac-169 k8s % kubectl get pod preferred-affinity-pod -o wide
NAME                     READY   STATUS              RESTARTS   AGE   IP       NODE           NOMINATED NODE   READINESS GATES
preferred-affinity-pod   0/1     ContainerCreating   0          4s    <none>   minikube-m02   <none>           <none>
keerthana@Mac-169 k8s % kubectl get pod preferred-affinity-pod -o wide
NAME                     READY   STATUS    RESTARTS   AGE   IP               NODE           NOMINATED NODE   READINESS GATES
preferred-affinity-pod   1/1     Running   0          38s   10.244.205.193   minikube-m02   <none>           <none>
keerthana@Mac-169 k8s % 

* This is the proof:

Preferred: testing ⭐
        ↓
testing node unavailable
        ↓
production node is still acceptable
        ↓
Pod → minikube-m02 ✅

* Your Pod moved to:

preferred-affinity-pod → minikube-m02

even though it prefers:
---------------------
environment=testing

Why?
-----
minikube
environment=testing ⭐
SchedulingDisabled ❌

        ↓ preferred node unavailable

minikube-m02
environment=production
Scheduling allowed ✅

        ↓

Pod → minikube-m02

* What you just proved:

| Rule                           | Behavior                                                 |
| ------------------------------ | -------------------------------------------------------- |
| `requiredDuringScheduling...`  | **Must** find a matching node                            |
| `preferredDuringScheduling...` | **Prefer** matching node, but another node is acceptable |

* One cleanup step:

  We cordoned minikube only for the experiment. Uncordon it now, otherwise future Pods won't be scheduled there.

keerthana@Mac-169 k8s % kubectl uncordon minikube
node/minikube uncordoned
keerthana@Mac-169 k8s % kubectl get nodes
NAME           STATUS   ROLES           AGE    VERSION
minikube       Ready    control-plane   116m   v1.35.1
minikube-m02   Ready    <none>          92m    v1.35.1
keerthana@Mac-169 k8s % 

* What is Node Affinity?

**Node Affinity = a Pod's rule for choosing nodes based on node labels.**

You had two nodes:

```text
Node 1: minikube
        label: environment=testing

Node 2: minikube-m02
        label: environment=production
```

Think of those labels as the nodes' **characteristics**.

---

* POC 1: Required Node Affinity

We created:

```yaml
affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
        - matchExpressions:
            - key: environment
              operator: In
              values:
                - testing
```

Don't worry about the long name yet.

Read only this part:

```yaml
environment: testing
```

The Pod is saying:

> **"I REQUIRE a node whose environment is testing."**

Our nodes:

```text
minikube
environment=testing
        ↑
        │
     MATCH ✅

minikube-m02
environment=production
        ↑
        │
     NO MATCH ❌
```

Therefore:

```text
Pod
 ↓
"I require testing"
 ↓
Scheduler
 ↓
minikube → testing ✅
 ↓
Pod runs on minikube
```

* That's Required Affinity.

**It MUST find a matching node.**

---

* POC 2: Preferred Node Affinity

Now we changed the rule.

Instead of:

> "I REQUIRE testing."

we said:

> **"I PREFER testing."**

Our YAML:

```yaml
affinity:
  nodeAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        preference:
          matchExpressions:
            - key: environment
              operator: In
              values:
                - testing
```

Again, ignore the complicated syntax.

The important part is:

```text
PREFER:
environment=testing
```

Our nodes:

```text
minikube
environment=testing
⭐ preferred

minikube-m02
environment=production
acceptable
```

So Kubernetes chose:

```text
Pod → minikube
```

because `minikube` matched the preference.

---

* Then we did the important test

**What does kubectl cordon mean?**

When you run:
      kubectl cordon minikube

you are telling Kubernetes: "Do not schedule any NEW Pods on minikube."

- It does not shut down the node. It does not delete Pods. It does not make the node NotReady. It simply makes the node unschedulable for new Pods.


* Why did we use cordon?

Because we needed to **prove that `preferred` is not `required`.**

Our Pod says:

> "I prefer `environment=testing`."

Normally:

```text
testing node available
        ↓
Pod → testing node ⭐
```

But how can we prove that production is an acceptable fallback?

We temporarily made the testing node unavailable for **new scheduling**:

```bash
kubectl cordon minikube
```

Now Kubernetes had this situation:

```text
Pod preference:
        testing ⭐

Available nodes:
        testing    ❌ cannot receive new Pods
        production ✅ available
```

Therefore:

```text
Pod → production
```

That proved:

> **Preferred = first choice, NOT a requirement.**

---

* Very important: Cordon ≠ NotReady

You saw this:

```text
minikube   Ready,SchedulingDisabled
```

That means:

```text
Node is healthy ✅
BUT
Scheduler should not place NEW Pods there 🚫
```

Compare that with:

```text
minikube   NotReady
```

That means the node itself has a problem and Kubernetes considers it unhealthy.

---

### One-line memory trick

> **`cordon` = "Keep this node running, but don't put new Pods here."**

We used it **only as a testing tool** to demonstrate the difference between:

```text
required = MUST
preferred = PREFER
```

After the experiment, we ran:

```bash
kubectl uncordon minikube
```

which means:

> **"Allow new Pods to be scheduled here again."**

* Your final mental model:

NODE LABEL
    ↓
environment=testing
    │
    │
    ├── NodeSelector
    │     "I REQUIRE this label"
    │
    └── Node Affinity
          ├── required  → MUST match
          └── preferred → PREFER match
                          but fallback allowed

                          
=================================================================

* NodeSelector

Very simple:

```yaml
nodeSelector:
  environment: testing
```

Meaning:

> **"Run me only on a node that has `environment=testing`."**

If no such node exists:

```text
Pod → Pending ❌
```

It's basically an exact label match.

---

* Node Affinity

Affinity gives you **more ways to express the selection rule**.

For example:

```yaml
requiredDuringSchedulingIgnoredDuringExecution:
```

means:

> **"I require a matching node."**

But you can make more complex rules:

```text
environment = testing OR staging
```

or:

```text
disk = ssd
AND
environment = production
```

And you also have:

```yaml
preferredDuringSchedulingIgnoredDuringExecution:
```

which means:

> **"I prefer this type of node, but another node is okay."**

---

### So remember this

```text
NodeSelector
    ↓
Simple node selection
"environment must be testing"

Node Affinity
    ↓
Flexible node selection
"must/prefer these node characteristics"
```

And don't confuse this with **Toleration**:

```text
NodeSelector / Affinity
→ "Which node do I WANT?"

Toleration
→ "Which tainted nodes am I ALLOWED to use?"
```

That's the clean distinction.

=================================================================