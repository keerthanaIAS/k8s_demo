# Redis StatefulSet
Architecture
-------------
                    Redis Headless Service
                           │
             ┌─────────────┼─────────────┐
             ↓             ↓             ↓
          redis-0       redis-1       redis-2
             │             │             │
            PVC           PVC           PVC
             │             │             │
          storage       storage       storage

Each Redis Pod gets its own PVC.

So:
---
redis-0 → redis-data-redis-0
redis-1 → redis-data-redis-1
redis-2 → redis-data-redis-2

## Terminal logs:
keerthana@Keerthanas-MacBook-Air redis-statefulset % kubectl get pod
redis-0              0/1     ContainerCreating   0              7s
keerthana@Keerthanas-MacBook-Air redis-statefulset % kubectl get pod
NAME                 READY   STATUS    RESTARTS       AGE
redis-0              1/1     Running   0              20s
keerthana@Keerthanas-MacBook-Air redis-statefulset % kubectl get pvc
NAME                              STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
redis-data-redis-0                Bound    pvc-b08a48bc-22af-49c1-8665-8a92676f106d   1Gi        RWO            standard       <unset>   
keerthana@Keerthanas-MacBook-Air redis-statefulset % kubectl get svc
NAME           TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)    AGE
kubernetes     ClusterIP   10.96.0.1    <none>        443/TCP    16d
redis          ClusterIP   None         <none>        6379/TCP   60s

## Redis value set and get log:
keerthana@Keerthanas-MacBook-Air redis-statefulset % kubectl exec -it redis-0 -- redis-cli
127.0.0.1:6379> SET user:1 keerthana
OK
127.0.0.1:6379> GET user:1
"keerthana"
127.0.0.1:6379> 

keerthana@Keerthanas-MacBook-Air redis-statefulset % kubectl delete pod redis-0
pod "redis-0" deleted
keerthana@Keerthanas-MacBook-Air redis-statefulset % kubectl get pod -w
NAME                 READY   STATUS    RESTARTS       AGE
redis-0              1/1     Running   0              10s

- it's recreated.

keerthana@Keerthanas-MacBook-Air redis-statefulset % kubectl exec -it redis-0 -- redis-cli GET user:1
"keerthana"

### You have now demonstrated:

Redis Pod dies
     ↓
StatefulSet recreates redis-0
     ↓
same PVC remains
     ↓
Redis mounts same storage
     ↓
data comes back

# Log:

keerthana@Keerthanas-MacBook-Air redis-statefulset % kubectl get endpoints redis -o yaml    
Warning: v1 Endpoints is deprecated in v1.33+; use discovery.k8s.io/v1 EndpointSlice
apiVersion: v1
kind: Endpoints
metadata:
  annotations:
    endpoints.kubernetes.io/last-change-trigger-time: "2026-08-28T06:39:35Z"
  creationTimestamp: "2026-08-28T06:36:12Z"
  labels:
    endpoints.kubernetes.io/managed-by: endpoint-controller
    service.kubernetes.io/headless: ""
  name: redis
  namespace: default
  resourceVersion: "30841"
  uid: 4a010e01-fd70-4a46-8b28-752ea35c6fd7
subsets:
- addresses:
  - hostname: redis-0
    ip: 10.244.120.101
    nodeName: minikube
    targetRef:
      kind: Pod
      name: redis-0
      namespace: default
      uid: 5b314681-097c-4f92-8110-92b3a174747a
  ports:
  - port: 6379
    protocol: TCP
keerthana@Keerthanas-MacBook-Air redis-statefulset % kubectl get endpointslices -l kubernetes.io/service-name=redis -o yaml    
apiVersion: v1
items:
- addressType: IPv4
  apiVersion: discovery.k8s.io/v1
  endpoints:
  - addresses:
    - 10.244.120.101
    conditions:
      ready: true
      serving: true
      terminating: false
    hostname: redis-0
    nodeName: minikube
    targetRef:
      kind: Pod
      name: redis-0
      namespace: default
      uid: 5b314681-097c-4f92-8110-92b3a174747a
  kind: EndpointSlice
  metadata:
    annotations:
      endpoints.kubernetes.io/last-change-trigger-time: "2026-08-28T06:39:35Z"
    creationTimestamp: "2026-08-28T06:36:12Z"
    generateName: redis-
    generation: 5
    labels:
      endpointslice.kubernetes.io/managed-by: endpointslice-controller.k8s.io
      kubernetes.io/service-name: redis
      service.kubernetes.io/headless: ""
    name: redis-g5gdr
    namespace: default
    ownerReferences:
    - apiVersion: v1
      blockOwnerDeletion: true
      controller: true
      kind: Service
      name: redis
      uid: b69fef2b-3a91-40c2-b9c8-90b583d2fab2
    resourceVersion: "30840"
    uid: 254e1be5-201b-4498-b413-d17ae855bffe
  ports:
  - name: ""
    port: 6379
    protocol: TCP
kind: List
metadata:
  resourceVersion: ""
keerthana@Keerthanas-MacBook-Air redis-statefulset % kubectl run redis-client \
  --image=redis:7 \
  --restart=Never \
  -it --rm \
  -- bash
If you don't see a command prompt, try pressing enter.
root@redis-client:/data# redis-cli -h redis-0.redis
redis-0.redis:6379> PING
PONG
redis-0.redis:6379> exit
root@redis-client:/data# exit
exit
pod "redis-client" deleted
keerthana@Keerthanas-MacBook-Air redis-statefulset % kubectl scale statefulset redis --replicas=3
statefulset.apps/redis scaled
keerthana@Keerthanas-MacBook-Air redis-statefulset % kubectl get pods
NAME                 READY   STATUS    RESTARTS        AGE
redis-0              1/1     Running   0               178m
redis-1              1/1     Running   0               5s
redis-2              1/1     Running   0               4s
keerthana@Keerthanas-MacBook-Air redis-statefulset % kubectl get pvc
NAME                              STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
redis-data-redis-0                Bound    pvc-b08a48bc-22af-49c1-8665-8a92676f106d   1Gi        RWO            standard       <unset>                 3h1m
redis-data-redis-1                Bound    pvc-aee48d7e-497e-48d6-9228-7112dc8ceb67   1Gi        RWO            standard       <unset>                 10s
redis-data-redis-2                Bound    pvc-9b27819f-0bbf-4e3a-8aa8-f327607adb94   1Gi        RWO            standard       <unset>                 9s
keerthana@Keerthanas-MacBook-Air redis-statefulset % 

