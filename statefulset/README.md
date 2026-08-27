# StatefulSet in one sentence

A Deployment manages interchangeable Pods.

A StatefulSet manages Pods that need stable identity and/or persistent storage.

Deployment
----------
Deployment
   │
   ├── pod-abc123
   ├── pod-def456
   └── pod-ghi789

Pods are replaceable. If pod-abc123 dies, Kubernetes can create another Pod with a different name.

StatefulSet
-----------
StatefulSet
   │
   ├── db-0
   ├── db-1
   └── db-2

The identities are stable.

If db-1 dies:
-------------
db-1 ❌
   ↓
db-1 ✅

- It comes back as db-1, not some random name.                                                                                  -->*important note*


## Terminal Logs:

keerthana@Mac-367 statefulset % kubectl apply -f statefulset.yaml
statefulset.apps/demo-statefulset created
keerthana@Mac-367 statefulset % kubectl get statefulset
NAME               READY   AGE
demo-statefulset   0/3     17s
keerthana@Mac-367 statefulset % kubectl get pods
NAME                 READY   STATUS    RESTARTS   AGE
demo-statefulset-0   0/1     Pending   0          22s
keerthana@Mac-367 statefulset % kubectl get pods
NAME                 READY   STATUS    RESTARTS   AGE
demo-statefulset-0   0/1     Pending   0          29s
keerthana@Mac-367 statefulset % kubectl get pods
NAME                 READY   STATUS    RESTARTS   AGE
demo-statefulset-0   0/1     Pending   0          54s
keerthana@Mac-367 statefulset % kubectl get pods
NAME                 READY   STATUS    RESTARTS   AGE
demo-statefulset-0   0/1     Pending   0          85s
keerthana@Mac-367 statefulset % kubectl describe pod demo-statefulset-0
Name:             demo-statefulset-0
Namespace:        default
Priority:         0
Service Account:  default
Node:             <none>
Labels:           app=demo
                  apps.kubernetes.io/pod-index=0
                  controller-revision-hash=demo-statefulset-78c49f8b
                  statefulset.kubernetes.io/pod-name=demo-statefulset-0
Annotations:      <none>
Status:           Pending
IP:               
IPs:              <none>
Controlled By:    StatefulSet/demo-statefulset
Containers:
  demo-container:
    Image:        nginx:latest
    Port:         80/TCP
    Host Port:    0/TCP
    Environment:  <none>
    Mounts:
      /data from demo-storage (rw)
      /var/run/secrets/kubernetes.io/serviceaccount from kube-api-access-kpswq (ro)
Conditions:
  Type           Status
  PodScheduled   False 
Volumes:
  demo-storage:
    Type:       PersistentVolumeClaim (a reference to a PersistentVolumeClaim in the same namespace)
    ClaimName:  demo-storage-demo-statefulset-0
    ReadOnly:   false
  kube-api-access-kpswq:
    Type:                    Projected (a volume that contains injected data from multiple sources)
    TokenExpirationSeconds:  3607
    ConfigMapName:           kube-root-ca.crt
    ConfigMapOptional:       <nil>
    DownwardAPI:             true
QoS Class:                   BestEffort
Node-Selectors:              <none>
Tolerations:                 node.kubernetes.io/not-ready:NoExecute op=Exists for 300s
                             node.kubernetes.io/unreachable:NoExecute op=Exists for 300s
Events:
  Type     Reason            Age                From               Message
  ----     ------            ----               ----               -------
  Warning  FailedScheduling  99s (x2 over 99s)  default-scheduler  0/1 nodes are available: pod has unbound immediate PersistentVolumeClaims. not found
keerthana@Mac-367 statefulset % kubectl get pvc
NAME                              STATUS    VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
demo-storage-demo-statefulset-0   Pending                                      standard       <unset>                 2m16s
keerthana@Mac-367 statefulset % kubectl get pv
NAME      CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS     CLAIM              STORAGECLASS   VOLUMEATTRIBUTESCLASS   REASON   AGE
demo-pv   1Gi        RWO            Retain           Released   default/demo-pvc                  <unset>                          151m
keerthana@Mac-367 statefulset % kubectl get storageclass
NAME                 PROVISIONER                RECLAIMPOLICY   VOLUMEBINDINGMODE   ALLOWVOLUMEEXPANSION   AGE
standard (default)   k8s.io/minikube-hostpath   Delete          Immediate           false                  16d
keerthana@Mac-367 statefulset % kubectl describe pvc demo-storage-demo-statefulset-0
Name:          demo-storage-demo-statefulset-0
Namespace:     default
StorageClass:  standard
Status:        Pending
Volume:        
Labels:        app=demo
Annotations:   volume.beta.kubernetes.io/storage-provisioner: k8s.io/minikube-hostpath
               volume.kubernetes.io/storage-provisioner: k8s.io/minikube-hostpath
Finalizers:    [kubernetes.io/pvc-protection]
Capacity:      
Access Modes:  
VolumeMode:    Filesystem
Used By:       demo-statefulset-0
Events:
  Type    Reason                Age                   From                         Message
  ----    ------                ----                  ----                         -------
  Normal  ExternalProvisioning  94s (x26 over 7m46s)  persistentvolume-controller  Waiting for a volume to be created either by the external provisioner 'k8s.io/minikube-hostpath' or manually by the system administrator. If volume creation is delayed, please verify that the provisioner is running and correctly registered.
keerthana@Mac-367 statefulset % kubectl get pods -n kube-system
NAME                                       READY   STATUS    RESTARTS      AGE
calico-kube-controllers-565c89d6df-mfhjs   1/1     Running   1 (15d ago)   15d
calico-node-5c5z8                          1/1     Running   2 (15d ago)   16d
coredns-7d764666f9-h899n                   1/1     Running   1 (15d ago)   15d
etcd-minikube                              1/1     Running   2 (15d ago)   16d
kube-apiserver-minikube                    1/1     Running   2 (15d ago)   16d
kube-controller-manager-minikube           1/1     Running   2 (15d ago)   16d
kube-proxy-8x7gx                           1/1     Running   2 (15d ago)   16d
kube-scheduler-minikube                    1/1     Running   2 (15d ago)   16d
keerthana@Mac-367 statefulset % kubectl get pods -n kube-system | grep -i provision
keerthana@Mac-367 statefulset % kubectl get deployment -n kube-system
NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
calico-kube-controllers   1/1     1            1           16d
coredns                   1/1     1            1           16d
keerthana@Mac-367 statefulset % minikube addons list
┌─────────────────────────────┬──────────┬──────────┬────────────────────────────────────────┐
│         ADDON NAME          │ PROFILE  │  STATUS  │               MAINTAINER               │
├─────────────────────────────┼──────────┼──────────┼────────────────────────────────────────┤
│ ambassador                  │ minikube │ disabled │ 3rd party (Ambassador)                 │
│ amd-gpu-device-plugin       │ minikube │ disabled │ 3rd party (AMD)                        │
│ auto-pause                  │ minikube │ disabled │ minikube                               │
│ cloud-spanner               │ minikube │ disabled │ Google                                 │
│ csi-hostpath-driver         │ minikube │ disabled │ Kubernetes                             │
│ dashboard                   │ minikube │ disabled │ Kubernetes                             │
│ default-storageclass        │ minikube │ disabled │ Kubernetes                             │
│ efk                         │ minikube │ disabled │ 3rd party (Elastic)                    │
│ freshpod                    │ minikube │ disabled │ Google                                 │
│ gcp-auth                    │ minikube │ disabled │ Google                                 │
│ gvisor                      │ minikube │ disabled │ minikube                               │
│ headlamp                    │ minikube │ disabled │ 3rd party (kinvolk.io)                 │
│ inaccel                     │ minikube │ disabled │ 3rd party (InAccel [info@inaccel.com]) │
│ ingress                     │ minikube │ disabled │ Kubernetes                             │
│ ingress-dns                 │ minikube │ disabled │ minikube                               │
│ inspektor-gadget            │ minikube │ disabled │ 3rd party (inspektor-gadget.io)        │
│ istio                       │ minikube │ disabled │ 3rd party (Istio)                      │
│ istio-provisioner           │ minikube │ disabled │ 3rd party (Istio)                      │
│ kong                        │ minikube │ disabled │ 3rd party (Kong HQ)                    │
│ kubeflow                    │ minikube │ disabled │ 3rd party                              │
│ kubetail                    │ minikube │ disabled │ 3rd party (kubetail.com)               │
│ kubevirt                    │ minikube │ disabled │ 3rd party (KubeVirt)                   │
│ logviewer                   │ minikube │ disabled │ 3rd party (unknown)                    │
│ metallb                     │ minikube │ disabled │ 3rd party (MetalLB)                    │
│ metrics-server              │ minikube │ disabled │ Kubernetes                             │
│ nvidia-device-plugin        │ minikube │ disabled │ 3rd party (NVIDIA)                     │
│ nvidia-driver-installer     │ minikube │ disabled │ 3rd party (NVIDIA)                     │
│ nvidia-gpu-device-plugin    │ minikube │ disabled │ 3rd party (NVIDIA)                     │
│ olm                         │ minikube │ disabled │ 3rd party (Operator Framework)         │
│ pod-security-policy         │ minikube │ disabled │ 3rd party (unknown)                    │
│ portainer                   │ minikube │ disabled │ 3rd party (Portainer.io)               │
│ registry                    │ minikube │ disabled │ minikube                               │
│ registry-aliases            │ minikube │ disabled │ 3rd party (unknown)                    │
│ registry-creds              │ minikube │ disabled │ 3rd party (UPMC Enterprises)           │
│ storage-provisioner         │ minikube │ disabled │ minikube                               │
│ storage-provisioner-rancher │ minikube │ disabled │ 3rd party (Rancher)                    │
│ volcano                     │ minikube │ disabled │ third-party (volcano)                  │
│ volumesnapshots             │ minikube │ disabled │ Kubernetes                             │
│ yakd                        │ minikube │ disabled │ 3rd party (marcnuri.com)               │
└─────────────────────────────┴──────────┴──────────┴────────────────────────────────────────┘
keerthana@Mac-367 statefulset % minikube addons enable storage-provisioner
💡  storage-provisioner is an addon maintained by minikube. For any concerns contact minikube on GitHub.
You can view the list of minikube maintainers at: https://github.com/kubernetes/minikube/blob/master/OWNERS
    ▪ Using image gcr.io/k8s-minikube/storage-provisioner:v5
🌟  The 'storage-provisioner' addon is enabled
keerthana@Mac-367 statefulset % minikube addons enable default-storageclass
💡  default-storageclass is an addon maintained by Kubernetes. For any concerns contact minikube on GitHub.
You can view the list of minikube maintainers at: https://github.com/kubernetes/minikube/blob/master/OWNERS
🌟  The 'default-storageclass' addon is enabled
keerthana@Mac-367 statefulset % kubectl get pods -n kube-system
NAME                                       READY   STATUS    RESTARTS      AGE
calico-kube-controllers-565c89d6df-mfhjs   1/1     Running   1 (15d ago)   15d
calico-node-5c5z8                          1/1     Running   2 (15d ago)   16d
coredns-7d764666f9-h899n                   1/1     Running   1 (15d ago)   15d
etcd-minikube                              1/1     Running   2 (15d ago)   16d
kube-apiserver-minikube                    1/1     Running   2 (15d ago)   16d
kube-controller-manager-minikube           1/1     Running   2 (15d ago)   16d
kube-proxy-8x7gx                           1/1     Running   2 (15d ago)   16d
kube-scheduler-minikube                    1/1     Running   2 (15d ago)   16d
storage-provisioner                        1/1     Running   0             11s
keerthana@Mac-367 statefulset % kubectl get pvc -w
NAME                              STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
demo-storage-demo-statefulset-0   Bound    pvc-649dc2f5-cf20-4d35-a2be-920a5bb21d45   1Gi        RWO            standard       <unset>                 12m
demo-storage-demo-statefulset-1   Pending                                                                        standard       <unset>                 0s
demo-storage-demo-statefulset-1   Pending                                                                        standard       <unset>                 0s
demo-storage-demo-statefulset-1   Pending   pvc-f70ae000-6523-4eae-b650-c9f482f7cd6a   0                         standard       <unset>                 0s
demo-storage-demo-statefulset-1   Bound     pvc-f70ae000-6523-4eae-b650-c9f482f7cd6a   1Gi        RWO            standard       <unset>                 0s
demo-storage-demo-statefulset-2   Pending                                                                        standard       <unset>                 0s
demo-storage-demo-statefulset-2   Pending                                                                        standard       <unset>                 0s
demo-storage-demo-statefulset-2   Pending   pvc-9a05f3ea-34b3-457f-a90a-5c991ab419d6   0                         standard       <unset>                 0s
demo-storage-demo-statefulset-2   Bound     pvc-9a05f3ea-34b3-457f-a90a-5c991ab419d6   1Gi        RWO            standard       <unset>                 0s
^C%                                                                                                                                     
keerthana@Mac-367 statefulset % kubectl get pods
NAME                 READY   STATUS    RESTARTS   AGE
demo-statefulset-0   1/1     Running   0          13m
demo-statefulset-1   1/1     Running   0          90s
demo-statefulset-2   1/1     Running   0          87s
keerthana@Mac-367 statefulset % kubectl exec -it demo-statefulset-0 -- sh
# echo "I am Pod 0" > /data/test.txt
cat /data/test.txt
exit# I am Pod 0
# 
keerthana@Mac-367 statefulset % kubectl exec -it demo-statefulset-1 -- sh
# echo "I am Pod 1" > /data/test.txt
cat /data/test.txt
exit# I am Pod 1
# 
keerthana@Mac-367 statefulset % kubectl exec -it demo-statefulset-2 -- sh
# echo "I am Pod 2" > /data/test.txt
cat /data/test.txt
exit# I am Pod 2
# 
keerthana@Mac-367 statefulset % kubectl delete pod demo-statefulset-1
pod "demo-statefulset-1" deleted
keerthana@Mac-367 statefulset % kubectl get pods
NAME                 READY   STATUS    RESTARTS   AGE
demo-statefulset-0   1/1     Running   0          15m
demo-statefulset-1   1/1     Running   0          5s
demo-statefulset-2   1/1     Running   0          3m15s
keerthana@Mac-367 statefulset % kubectl exec -it demo-statefulset-1 -- cat /data/test.txt
I am Pod 1
keerthana@Mac-367 statefulset % 


* That proves:
----------------
Pod deleted
    ↓
Pod recreated with same identity
    ↓
Same PVC
    ↓
Same persistent data

Remember this table:
--------------------
|                     | Deployment            | StatefulSet              |
| ------------------- | --------------------- | ------------------------ |
| Pod identity        | Random                | Stable                   |
| Pod names           | Random suffix         | `name-0`, `name-1`, etc. |
| Persistent identity | Not guaranteed        | Yes                      |
| Per-Pod PVC         | No automatic template | `volumeClaimTemplates`   |
| Typical use         | Stateless APIs        | Databases, Kafka, etc.   |
| Scaling             | Interchangeable Pods  | Ordered/stable Pods      |

*It's for workloads where stable identity, stable network identity, ordered deployment/scaling, and/or persistent storage matter.*


## the real difference between StatefulSet and Deployment:

keerthana@Mac-367 statefulset % kubectl scale statefulset demo-statefulset --replicas=5
statefulset.apps/demo-statefulset scaled
keerthana@Mac-367 statefulset % kubectl get pods
kubectl get pvc
NAME                 READY   STATUS              RESTARTS   AGE
demo-statefulset-0   1/1     Running             0          27m
demo-statefulset-1   1/1     Running             0          12m
demo-statefulset-2   1/1     Running             0          15m
demo-statefulset-3   1/1     Running             0          5s
demo-statefulset-4   0/1     ContainerCreating   0          1s
NAME                              STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
demo-storage-demo-statefulset-0   Bound    pvc-649dc2f5-cf20-4d35-a2be-920a5bb21d45   1Gi        RWO            standard       <unset>                 27m
demo-storage-demo-statefulset-1   Bound    pvc-f70ae000-6523-4eae-b650-c9f482f7cd6a   1Gi        RWO            standard       <unset>                 15m
demo-storage-demo-statefulset-2   Bound    pvc-9a05f3ea-34b3-457f-a90a-5c991ab419d6   1Gi        RWO            standard       <unset>                 15m
demo-storage-demo-statefulset-3   Bound    pvc-a60f1c0d-d54f-40ab-b511-f3433a103132   1Gi        RWO            standard       <unset>                 5s
demo-storage-demo-statefulset-4   Bound    pvc-29d806d3-9477-4fe5-9c8c-3ad34b1a9d4a   1Gi        RWO            standard       <unset>                 1s
keerthana@Mac-367 statefulset % kubectl get pods
kubectl get pvc
NAME                 READY   STATUS    RESTARTS   AGE
demo-statefulset-0   1/1     Running   0          27m
demo-statefulset-1   1/1     Running   0          12m
demo-statefulset-2   1/1     Running   0          15m
demo-statefulset-3   1/1     Running   0          12s
demo-statefulset-4   1/1     Running   0          8s
NAME                              STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
demo-storage-demo-statefulset-0   Bound    pvc-649dc2f5-cf20-4d35-a2be-920a5bb21d45   1Gi        RWO            standard       <unset>                 27m
demo-storage-demo-statefulset-1   Bound    pvc-f70ae000-6523-4eae-b650-c9f482f7cd6a   1Gi        RWO            standard       <unset>                 15m
demo-storage-demo-statefulset-2   Bound    pvc-9a05f3ea-34b3-457f-a90a-5c991ab419d6   1Gi        RWO            standard       <unset>                 15m
demo-storage-demo-statefulset-3   Bound    pvc-a60f1c0d-d54f-40ab-b511-f3433a103132   1Gi        RWO            standard       <unset>                 12s
demo-storage-demo-statefulset-4   Bound    pvc-29d806d3-9477-4fe5-9c8c-3ad34b1a9d4a   1Gi        RWO            standard       <unset>                 8s
keerthana@Mac-367 statefulset % kubectl scale statefulset demo-statefulset --replicas=2
statefulset.apps/demo-statefulset scaled
keerthana@Mac-367 statefulset % kubectl get pvc
NAME                              STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
demo-storage-demo-statefulset-0   Bound    pvc-649dc2f5-cf20-4d35-a2be-920a5bb21d45   1Gi        RWO            standard       <unset>                 27m
demo-storage-demo-statefulset-1   Bound    pvc-f70ae000-6523-4eae-b650-c9f482f7cd6a   1Gi        RWO            standard       <unset>                 15m
demo-storage-demo-statefulset-2   Bound    pvc-9a05f3ea-34b3-457f-a90a-5c991ab419d6   1Gi        RWO            standard       <unset>                 15m
demo-storage-demo-statefulset-3   Bound    pvc-a60f1c0d-d54f-40ab-b511-f3433a103132   1Gi        RWO            standard       <unset>                 23s
demo-storage-demo-statefulset-4   Bound    pvc-29d806d3-9477-4fe5-9c8c-3ad34b1a9d4a   1Gi        RWO            standard       <unset>                 19s
keerthana@Mac-367 statefulset % kubectl get pvc
NAME                              STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
demo-storage-demo-statefulset-0   Bound    pvc-649dc2f5-cf20-4d35-a2be-920a5bb21d45   1Gi        RWO            standard       <unset>                 28m
demo-storage-demo-statefulset-1   Bound    pvc-f70ae000-6523-4eae-b650-c9f482f7cd6a   1Gi        RWO            standard       <unset>                 16m
demo-storage-demo-statefulset-2   Bound    pvc-9a05f3ea-34b3-457f-a90a-5c991ab419d6   1Gi        RWO            standard       <unset>                 15m
demo-storage-demo-statefulset-3   Bound    pvc-a60f1c0d-d54f-40ab-b511-f3433a103132   1Gi        RWO            standard       <unset>                 38s
demo-storage-demo-statefulset-4   Bound    pvc-29d806d3-9477-4fe5-9c8c-3ad34b1a9d4a   1Gi        RWO            standard       <unset>                 34s

* What happened:
-----------------
You scaled:

kubectl scale statefulset demo-statefulset --replicas=5

Kubernetes created:

demo-statefulset-0
demo-statefulset-1
demo-statefulset-2
demo-statefulset-3
demo-statefulset-4

And because your StatefulSet uses volumeClaimTemplates, it automatically created one PVC per pod:

Pod                     PVC
------------------------------------------------
demo-statefulset-0  →   demo-storage-demo-statefulset-0
demo-statefulset-1  →   demo-storage-demo-statefulset-1
demo-statefulset-2  →   demo-storage-demo-statefulset-2
demo-statefulset-3  →   demo-storage-demo-statefulset-3
demo-statefulset-4  →   demo-storage-demo-statefulset-4

- So you now have 5 independent persistent storages.

## Kubernetes does not automatically delete the PVCs when StatefulSet replicas are scaled down.

keerthana@Mac-367 statefulset % kubectl get pods
NAME                 READY   STATUS    RESTARTS   AGE
demo-statefulset-0   1/1     Running   0          29m
demo-statefulset-1   1/1     Running   0          13m
keerthana@Mac-367 statefulset % 

The important part of your experiment
------------------------------------
Then you did:

kubectl scale statefulset demo-statefulset --replicas=2

The pods 3 and 4 should disappear.

But look at your PVCs:
---------------------
demo-storage-demo-statefulset-0
demo-storage-demo-statefulset-1
demo-storage-demo-statefulset-2
demo-storage-demo-statefulset-3
demo-storage-demo-statefulset-4

All 5 PVCs are still there.

That's intentional StatefulSet behavior.

Think of it like:
----------------
Scale UP
2 pods
 ↓
5 pods
 ↓
5 PVCs

Scale DOWN
5 pods
 ↓
2 pods
 ↓
5 PVCs   ← storage remains

Kubernetes does not automatically delete the PVCs when StatefulSet replicas are scaled down.                                        -->*important note*

- This protects your data.

### Sample:

keerthana@Mac-367 statefulset % kubectl exec -it demo-statefulset-3 -- sh
# echo "I am Pod 3 and my data survives" > /data/test.txt
cat /data/test.txt
exit# I am Pod 3 and my data survives
# 
keerthana@Mac-367 statefulset % kubectl exec -it demo-statefulset-3 -- cat /data/test.txt
I am Pod 3 and my data survives
keerthana@Mac-367 statefulset % kubectl scale statefulset demo-statefulset --replicas=2
statefulset.apps/demo-statefulset scaled
keerthana@Mac-367 statefulset % kubectl scale statefulset demo-statefulset --replicas=5
statefulset.apps/demo-statefulset scaled
keerthana@Mac-367 statefulset % kubectl exec -it demo-statefulset-3 -- cat /data/test.txt
Error from server (NotFound): pods "demo-statefulset-3" not found
keerthana@Mac-367 statefulset % kubectl exec -it demo-statefulset-3 -- cat /data/test.txt
Error from server (NotFound): pods "demo-statefulset-3" not found
keerthana@Mac-367 statefulset % kubectl exec -it demo-statefulset-3 -- cat /data/test.txt
Error from server (NotFound): pods "demo-statefulset-3" not found
keerthana@Mac-367 statefulset % kubectl exec -it demo-statefulset-3 -- cat /data/test.txt
Error from server (NotFound): pods "demo-statefulset-3" not found
keerthana@Mac-367 statefulset % kubectl exec -it demo-statefulset-3 -- cat /data/test.txt
Error from server (NotFound): pods "demo-statefulset-3" not found
keerthana@Mac-367 statefulset % kubectl exec -it demo-statefulset-3 -- cat /data/test.txt
Error from server (NotFound): pods "demo-statefulset-3" not found
keerthana@Mac-367 statefulset % kubectl get pods -w
NAME                 READY   STATUS              RESTARTS   AGE
demo-statefulset-0   1/1     Running             0          41m
demo-statefulset-1   1/1     Running             0          26m
demo-statefulset-2   1/1     Running             0          57s
demo-statefulset-3   0/1     ContainerCreating   0          0s
demo-statefulset-3   0/1     ContainerCreating   0          0s
demo-statefulset-3   1/1     Running             0          3s
demo-statefulset-4   0/1     Pending             0          0s
demo-statefulset-4   0/1     Pending             0          0s
demo-statefulset-4   0/1     ContainerCreating   0          0s
demo-statefulset-4   0/1     ContainerCreating   0          0s
demo-statefulset-4   1/1     Running             0          3s
^C%                                                                                                                                     
keerthana@Mac-367 statefulset % kubectl exec -it demo-statefulset-3 -- cat /data/test.txt
I am Pod 3 and my data survives
keerthana@Mac-367 statefulset % 

* That's the real StatefulSet lesson
--------------------------------------
- A Pod is disposable.
- A StatefulSet gives the Pod a stable identity.

And with volumeClaimTemplates:
------------------------------
Pod identity + dedicated PVC = persistent identity + persistent storage.

