# Understand the concept first

A normal Service usually has a virtual IP:
-----------------------------------------
Client
  ↓
Service IP
  ↓
Pod

A Headless Service has:
----------------------
clusterIP: None

So Kubernetes doesn't give the Service a single virtual IP. Instead, DNS can return the individual Pod IPs.

With a StatefulSet:
-------------------
Headless Service
       │
       ├── demo-statefulset-0
       ├── demo-statefulset-1
       └── demo-statefulset-2

Each pod gets a predictable DNS name.

For example, if your Service is called demo-service:
-----------------------------------------------------
demo-statefulset-0.demo-service.default.svc.cluster.local
demo-statefulset-1.demo-service.default.svc.cluster.local
demo-statefulset-2.demo-service.default.svc.cluster.local

The important part:
------------------
Pod IP can change, but the StatefulSet pod's DNS identity remains predictable.

## Terminal:

keerthana@Mac-367 statefulset % kubectl get statefulset demo-statefulset -o yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"apps/v1","kind":"StatefulSet","metadata":{"annotations":{},"name":"demo-statefulset","namespace":"default"},"spec":{"replicas":3,"selector":{"matchLabels":{"app":"demo"}},"serviceName":"demo-service","template":{"metadata":{"labels":{"app":"demo"}},"spec":{"containers":[{"image":"nginx:latest","name":"demo-container","ports":[{"containerPort":80}],"volumeMounts":[{"mountPath":"/data","name":"demo-storage"}]}]}},"volumeClaimTemplates":[{"metadata":{"name":"demo-storage"},"spec":{"accessModes":["ReadWriteOnce"],"resources":{"requests":{"storage":"1Gi"}}}}]}}
  creationTimestamp: "2026-08-27T08:43:40Z"
  generation: 6
  name: demo-statefulset
  namespace: default
  resourceVersion: "17201"
  uid: 9748d439-0731-4968-bced-a094e9073760
spec:
  persistentVolumeClaimRetentionPolicy:
    whenDeleted: Retain
    whenScaled: Retain
  podManagementPolicy: OrderedReady
  replicas: 5
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      app: demo
  serviceName: demo-service
  template:
    metadata:
      labels:
        app: demo
    spec:
      containers:
      - image: nginx:latest
        imagePullPolicy: Always
        name: demo-container
        ports:
        - containerPort: 80
          protocol: TCP
        resources: {}
        terminationMessagePath: /dev/termination-log
        terminationMessagePolicy: File
        volumeMounts:
        - mountPath: /data
          name: demo-storage
      dnsPolicy: ClusterFirst
      restartPolicy: Always
      schedulerName: default-scheduler
      securityContext: {}
      terminationGracePeriodSeconds: 30
  updateStrategy:
    rollingUpdate:
      maxUnavailable: 1
      partition: 0
    type: RollingUpdate
  volumeClaimTemplates:
  - apiVersion: v1
    kind: PersistentVolumeClaim
    metadata:
      name: demo-storage
    spec:
      accessModes:
      - ReadWriteOnce
      resources:
        requests:
          storage: 1Gi
      volumeMode: Filesystem
    status:
      phase: Pending
status:
  availableReplicas: 5
  collisionCount: 0
  currentReplicas: 5
  currentRevision: demo-statefulset-78c49f8b
  observedGeneration: 6
  readyReplicas: 5
  replicas: 5
  updateRevision: demo-statefulset-78c49f8b
  updatedReplicas: 5
keerthana@Mac-367 statefulset % kubectl apply -f service.yaml
service/demo-service created
keerthana@Mac-367 statefulset % kubectl get svc
NAME           TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
demo-service   ClusterIP   None         <none>        80/TCP    5s
kubernetes     ClusterIP   10.96.0.1    <none>        443/TCP   16d
keerthana@Mac-367 statefulset % kubectl get endpoints demo-service
Warning: v1 Endpoints is deprecated in v1.33+; use discovery.k8s.io/v1 EndpointSlice
NAME           ENDPOINTS   AGE
demo-service   <none>      15s
keerthana@Mac-367 statefulset % kubectl get endpoints demo-service
Warning: v1 Endpoints is deprecated in v1.33+; use discovery.k8s.io/v1 EndpointSlice
NAME           ENDPOINTS   AGE
demo-service   <none>      21s
keerthana@Mac-367 statefulset % kubectl get svc demo-service -o yaml
apiVersion: v1
kind: Service
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"v1","kind":"Service","metadata":{"annotations":{},"name":"demo-service","namespace":"default"},"spec":{"clusterIP":"None","ports":[{"port":80,"targetPort":80}],"selector":{"app":"demo-statefulset"}}}
  creationTimestamp: "2026-08-27T09:49:58Z"
  name: demo-service
  namespace: default
  resourceVersion: "18372"
  uid: a035a27b-42dd-4d0f-9888-28c7a90a8536
spec:
  clusterIP: None
  clusterIPs:
  - None
  internalTrafficPolicy: Cluster
  ipFamilies:
  - IPv4
  ipFamilyPolicy: SingleStack
  ports:
  - port: 80
    protocol: TCP
    targetPort: 80
  selector:
    app: demo-statefulset
  sessionAffinity: None
  type: ClusterIP
status:
  loadBalancer: {}
keerthana@Mac-367 statefulset % kubectl get pods --show-labels
NAME                 READY   STATUS    RESTARTS   AGE   LABELS
demo-statefulset-0   1/1     Running   0          67m   app=demo,apps.kubernetes.io/pod-index=0,controller-revision-hash=demo-statefulset-78c49f8b,statefulset.kubernetes.io/pod-name=demo-statefulset-0
demo-statefulset-1   1/1     Running   0          52m   app=demo,apps.kubernetes.io/pod-index=1,controller-revision-hash=demo-statefulset-78c49f8b,statefulset.kubernetes.io/pod-name=demo-statefulset-1
demo-statefulset-2   1/1     Running   0          26m   app=demo,apps.kubernetes.io/pod-index=2,controller-revision-hash=demo-statefulset-78c49f8b,statefulset.kubernetes.io/pod-name=demo-statefulset-2
demo-statefulset-3   1/1     Running   0          25m   app=demo,apps.kubernetes.io/pod-index=3,controller-revision-hash=demo-statefulset-78c49f8b,statefulset.kubernetes.io/pod-name=demo-statefulset-3
demo-statefulset-4   1/1     Running   0          25m   app=demo,apps.kubernetes.io/pod-index=4,controller-revision-hash=demo-statefulset-78c49f8b,statefulset.kubernetes.io/pod-name=demo-statefulset-4
keerthana@Mac-367 statefulset % kubectl get svc demo-service -o yaml
apiVersion: v1
kind: Service
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"v1","kind":"Service","metadata":{"annotations":{},"name":"demo-service","namespace":"default"},"spec":{"clusterIP":"None","ports":[{"port":80,"targetPort":80}],"selector":{"app":"demo-statefulset"}}}
  creationTimestamp: "2026-08-27T09:49:58Z"
  name: demo-service
  namespace: default
  resourceVersion: "18372"
  uid: a035a27b-42dd-4d0f-9888-28c7a90a8536
spec:
  clusterIP: None
  clusterIPs:
  - None
  internalTrafficPolicy: Cluster
  ipFamilies:
  - IPv4
  ipFamilyPolicy: SingleStack
  ports:
  - port: 80
    protocol: TCP
    targetPort: 80
  selector:
    app: demo-statefulset
  sessionAffinity: None
  type: ClusterIP
status:
  loadBalancer: {}
keerthana@Mac-367 statefulset % kubectl get endpointslice -l kubernetes.io/service-name=demo-service -o wide
NAME                 ADDRESSTYPE   PORTS     ENDPOINTS   AGE
demo-service-bf2cl   IPv4          <unset>   <unset>     2m48s
keerthana@Mac-367 statefulset % kubectl get endpoints demo-service
Warning: v1 Endpoints is deprecated in v1.33+; use discovery.k8s.io/v1 EndpointSlice
NAME           ENDPOINTS   AGE
demo-service   <none>      2m57s
keerthana@Mac-367 statefulset % kubectl apply -f service.yaml
service/demo-service configured
keerthana@Mac-367 statefulset % kubectl get endpointslice -l kubernetes.io/service-name=demo-service -o wide
NAME                 ADDRESSTYPE   PORTS   ENDPOINTS                                               AGE
demo-service-bf2cl   IPv4          80      10.244.120.76,10.244.120.85,10.244.120.79 + 2 more...   4m22s
keerthana@Mac-367 statefulset % kubectl get endpoints demo-service
Warning: v1 Endpoints is deprecated in v1.33+; use discovery.k8s.io/v1 EndpointSlice
NAME           ENDPOINTS                                                        AGE
demo-service   10.244.120.76:80,10.244.120.79:80,10.244.120.85:80 + 2 more...   4m29s
keerthana@Mac-367 statefulset % kubectl get endpoints demo-service                                          
Warning: v1 Endpoints is deprecated in v1.33+; use discovery.k8s.io/v1 EndpointSlice
NAME           ENDPOINTS                                                        AGE
demo-service   10.244.120.76:80,10.244.120.79:80,10.244.120.85:80 + 2 more...   5m4s
keerthana@Mac-367 statefulset % kubectl exec -it demo-statefulset-0 -- sh
# nslookup demo-service
sh: 1: nslookup: not found
# nslookup demo-statefulset-0.demo-service
sh: 2: nslookup: not found
# nslookup demo                   
sh: 3: nslookup: not found
# exit
command terminated with exit code 127
keerthana@Mac-367 statefulset % kubectl exec -it demo-0 -- sh            
Error from server (NotFound): pods "demo-0" not found
keerthana@Mac-367 statefulset % kubectl exec -it demo-statefulset-0 -- sh
# nslookup demo-statefulset-2.demo-service
sh: 1: nslookup: not found
# exit
command terminated with exit code 127
keerthana@Mac-367 statefulset % kubectl get pods -o wide
NAME                 READY   STATUS    RESTARTS   AGE   IP              NODE       NOMINATED NODE   READINESS GATES
demo-statefulset-0   1/1     Running   0          74m   10.244.120.76   minikube   <none>           <none>
demo-statefulset-1   1/1     Running   0          58m   10.244.120.79   minikube   <none>           <none>
demo-statefulset-2   1/1     Running   0          33m   10.244.120.85   minikube   <none>           <none>
demo-statefulset-3   1/1     Running   0          32m   10.244.120.86   minikube   <none>           <none>
demo-statefulset-4   1/1     Running   0          32m   10.244.120.87   minikube   <none>           <none>
keerthana@Mac-367 statefulset % kubectl delete pod demo-statefulset-1
pod "demo-statefulset-1" deleted
keerthana@Mac-367 statefulset % kubectl get pods -w
NAME                 READY   STATUS    RESTARTS   AGE
demo-statefulset-0   1/1     Running   0          74m
demo-statefulset-1   1/1     Running   0          5s
demo-statefulset-2   1/1     Running   0          33m
demo-statefulset-3   1/1     Running   0          32m
demo-statefulset-4   1/1     Running   0          32m
^C%                                                                                                                                     
keerthana@Mac-367 statefulset % kubectl get pods -o wide             
NAME                 READY   STATUS    RESTARTS   AGE   IP              NODE       NOMINATED NODE   READINESS GATES
demo-statefulset-0   1/1     Running   0          75m   10.244.120.76   minikube   <none>           <none>
demo-statefulset-1   1/1     Running   0          69s   10.244.120.88   minikube   <none>           <none>
demo-statefulset-2   1/1     Running   0          34m   10.244.120.85   minikube   <none>           <none>
demo-statefulset-3   1/1     Running   0          33m   10.244.120.86   minikube   <none>           <none>
demo-statefulset-4   1/1     Running   0          33m   10.244.120.87   minikube   <none>           <none>

## Your nslookup problem

Your container image simply doesn't have nslookup installed:
------------------------------------------------------------
sh: 1: nslookup: not found

- Don't change your StatefulSet just for that.

Use a temporary DNS-debug pod instead:
--------------------------------------
kubectl run dns-test \
  --image=busybox:1.36 \
  --restart=Never \
  -it --rm \
  -- sh\

keerthana@Mac-367 statefulset % kubectl run dns-test \
  --image=busybox:1.36 \
  --restart=Never \
  -it --rm \
  -- sh
If you don't see a command prompt, try pressing enter.
/ # 
/ # 
/ # 
/ # nslookup demo-service
Server:         10.96.0.10
Address:        10.96.0.10:53


Name:   demo-service.default.svc.cluster.local
Address: 10.244.120.88
Name:   demo-service.default.svc.cluster.local
Address: 10.244.120.87
Name:   demo-service.default.svc.cluster.local
Address: 10.244.120.86
Name:   demo-service.default.svc.cluster.local
Address: 10.244.120.85
Name:   demo-service.default.svc.cluster.local
Address: 10.244.120.76

** server can't find demo-service.cluster.local: NXDOMAIN

** server can't find demo-service.svc.cluster.local: NXDOMAIN

** server can't find demo-service.svc.cluster.local: NXDOMAIN

** server can't find demo-service.cluster.local: NXDOMAIN

/ # nslookup demo-statefulset-0.demo-service
Server:         10.96.0.10
Address:        10.96.0.10:53

Non-authoritative answer:

** server can't find demo-statefulset-0.demo-service: NXDOMAIN

/ # nslookup demo-statefulset-1.demo-service
Server:         10.96.0.10
Address:        10.96.0.10:53

Non-authoritative answer:

** server can't find demo-statefulset-1.demo-service: NXDOMAIN

/ # nslookup demo-statefulset-0.demo-service.default.svc.cluster.local
Server:         10.96.0.10
Address:        10.96.0.10:53

Name:   demo-statefulset-0.demo-service.default.svc.cluster.local
Address: 10.244.120.76


/ # nslookup demo-statefulset-1.demo-service.default.svc.cluster.local
Server:         10.96.0.10
Address:        10.96.0.10:53


Name:   demo-statefulset-1.demo-service.default.svc.cluster.local
Address: 10.244.120.88

/ # exit
pod "dns-test" deleted
keerthana@Mac-367 statefulset % kubectl get pods -o wide
NAME                 READY   STATUS    RESTARTS   AGE     IP              NODE       NOMINATED NODE   READINESS GATES
demo-statefulset-0   1/1     Running   0          79m     10.244.120.76   minikube   <none>           <none>
demo-statefulset-1   1/1     Running   0          4m36s   10.244.120.88   minikube   <none>           <none>
demo-statefulset-2   1/1     Running   0          38m     10.244.120.85   minikube   <none>           <none>
demo-statefulset-3   1/1     Running   0          37m     10.244.120.86   minikube   <none>           <none>
demo-statefulset-4   1/1     Running   0          37m     10.244.120.87   minikube   <none>           <none>
keerthana@Mac-367 statefulset % kubectl run dns-test \
  --image=busybox:1.36 \
  --restart=Never \
  -it --rm \
  -- sh
If you don't see a command prompt, try pressing enter.
/ # 
/ # 
/ # nslookup demo-statefulset-1.demo-service.default.svc.cluster.local
Server:         10.96.0.10
Address:        10.96.0.10:53

Name:   demo-statefulset-1.demo-service.default.svc.cluster.local
Address: 10.244.120.88


/ # exit
pod "dns-test" deleted
keerthana@Mac-367 statefulset % kubectl delete pod demo-statefulset-1
pod "demo-statefulset-1" deleted
keerthana@Mac-367 statefulset % kubectl get pods -w
NAME                 READY   STATUS    RESTARTS   AGE
demo-statefulset-0   1/1     Running   0          79m
demo-statefulset-1   1/1     Running   0          7s
demo-statefulset-2   1/1     Running   0          38m
demo-statefulset-3   1/1     Running   0          37m
demo-statefulset-4   1/1     Running   0          37m
^C%                                                                                                                                     
keerthana@Mac-367 statefulset % kubectl run dns-test \
  --image=busybox:1.36 \
  --restart=Never \
  -it --rm \
  -- sh
If you don't see a command prompt, try pressing enter.
/ # 
/ # 
/ # nslookup demo-statefulset-1.demo-service.default.svc.cluster.local
Server:         10.96.0.10
Address:        10.96.0.10:53


Name:   demo-statefulset-1.demo-service.default.svc.cluster.local
Address: 10.244.120.91

/ # exit
pod "dns-test" deleted
keerthana@Mac-367 statefulset % 

## Remember earlier:

demo-statefulset-1
old IP → 10.244.120.79
new IP → 10.244.120.88

The Pod IP changed, but the DNS name stayed:

demo-statefulset-1.demo-service.default.svc.cluster.local

That's the core value of StatefulSet identity.

Your Headless Service has:
---------------------------
clusterIP: None

- So Kubernetes DNS exposes the individual Pod addresses.

### Think of it like this
                    DELETE POD
                        ↓
demo-statefulset-1 ───────────────→ recreated
      │                                  │
      │                                  │
      ↓                                  ↓
10.244.120.79                       10.244.120.88
      ❌                                  ✅
   old IP                            new IP


BUT:

demo-statefulset-1
        ↓
demo-statefulset-1.demo-service.default.svc.cluster.local
        ↑
        SAME

*One important correction: StatefulSet doesn't magically make the IP permanent. It makes the identity stable; DNS follows that identity to whatever IP the current Pod has.*

* That's the lesson:
---------------------
StatefulSet gives the Pod a stable identity; Kubernetes DNS maps that stable identity to its current IP.

* The canonical structure is:
------------------------------
<pod-name>.<headless-service>.<namespace>.svc.cluster.local

For you:
--------
demo-statefulset-0.demo-service.default.svc.cluster.local
        │                  │        │
        │                  │        └── namespace
        │                  └────────── Service
        └───────────────────────────── StatefulSet Pod

## *DNS = converts a name into an IP address.*

What is DNS?
------------
DNS stands for Domain Name System.

Computers communicate using IP addresses:
-----------------------------------------
10.244.120.88

But humans and applications prefer names:
-----------------------------------------
demo-statefulset-1.demo-service.default.svc.cluster.local

## *nslookup = a command you use to ask DNS, "What IP does this name point to?"*

What is nslookup?
-----------------
nslookup means Name Server Lookup.

It is a command-line tool for checking DNS.

When you run:
----------------
nslookup demo-service.default.svc.cluster.local

you're basically asking:
------------------------
"DNS server, what IP address belongs to this name?"

# 3. What is CoreDNS?

CoreDNS is the DNS server Kubernetes normally uses inside the cluster.

Its job includes answering questions like:

What IP is kubernetes.default.svc.cluster.local?

or:

What IP is demo-service.default.svc.cluster.local?

Your Pod doesn't know the IP itself.

It asks the DNS server.

# 4. Now the interesting part: how does CoreDNS know?

CoreDNS has a Kubernetes plugin that watches Kubernetes resources.

Conceptually:

Kubernetes API
       ↑
       |
    CoreDNS
       |
       ↓
DNS records

CoreDNS learns about:

Services
Pods
EndpointSlices

The most important one for your Headless Service is EndpointSlice.

You already ran:

kubectl get endpointslice \
  -l kubernetes.io/service-name=demo-service \
  -o wide

and got:

ENDPOINTS

10.244.120.76
10.244.120.85
10.244.120.79
...

After Pod 1 was recreated, it became:

10.244.120.88

Kubernetes updates the EndpointSlice.

So conceptually:

StatefulSet
    ↓
Pods
    ↓
Pod IPs
    ↓
EndpointSlice
    ↓
CoreDNS
    ↓
DNS response

### if we create service endpoint will auto create? in kubernets?
  Yes. **Normally, when you create a Service, Kubernetes automatically creates/updates EndpointSlices based on the Service's selector matching Pods.**

Service created
     ↓
Service selector: app=kafka
     ↓
Kubernetes finds Pods with app=kafka
     ↓
EndpointSlice Controller
     ↓
EndpointSlice created/updated
     ↓
Contains Pod IPs + ports

For your Kafka example:
----------------------
Service: kafka
selector:
  app: kafka

Pods:
-----
kafka-0 → 10.244.120.105
kafka-1 → 10.244.120.106
kafka-2 → 10.244.120.107

Kubernetes automatically creates an EndpointSlice roughly containing:
--------------------------------------------------------------------
kafka
 └── EndpointSlice
      ├── 10.244.120.105:9092
      ├── 10.244.120.106:9092
      └── 10.244.120.107:9092


*Service + matching Pods → EndpointSlice; StatefulSet + Headless Service adds stable per-Pod DNS identities on top of that.*

