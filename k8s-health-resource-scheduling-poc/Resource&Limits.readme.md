# RESOURCE AND LIMITS:
keerthana@Mac-160 k8s-health-resource-scheduling-poc % kubectl apply -f k8s/deployment.yaml
deployment.apps/health-app configured
keerthana@Mac-160 k8s-health-resource-scheduling-poc % 

keerthana@Mac-160 k8s-health-resource-scheduling-poc % kubectl get pods -n health-poc
NAME                          READY   STATUS    RESTARTS   AGE
health-app-6ddfcdb79c-nhqtb   1/1     Running   0          53s
health-app-6ddfcdb79c-vvzcw   1/1     Running   0          47s
keerthana@Mac-160 k8s-health-resource-scheduling-poc % 

Important
----------
You will probably see your Pod names change again.

That's expected.

Why?
----
* You changed the Deployment's Pod template:

Old template
   ↓
No resources
   ↓
New template
   ↓
Requests + Limits
   ↓
New ReplicaSet
   ↓
New Pods

keerthana@Mac-160 k8s-health-resource-scheduling-poc % kubectl get pods -n health-poc
NAME                          READY   STATUS    RESTARTS   AGE
health-app-6ddfcdb79c-nhqtb   1/1     Running   0          93s
health-app-6ddfcdb79c-vvzcw   1/1     Running   0          87s
keerthana@Mac-160 k8s-health-resource-scheduling-poc % kubectl describe pod health-app-6ddfcdb79c-nhqtb -n health-poc

Name:             health-app-6ddfcdb79c-nhqtb
Namespace:        health-poc
Priority:         0
Service Account:  default
Node:             minikube/192.168.49.2
Start Time:       Mon, 10 Aug 2026 11:34:28 +0530
Labels:           app=health-app
                  pod-template-hash=6ddfcdb79c
Annotations:      <none>
Status:           Running
IP:               10.244.0.7
IPs:
  IP:           10.244.0.7
Controlled By:  ReplicaSet/health-app-6ddfcdb79c
Containers:
  health-app:
    Container ID:   docker://097498e2f937baaaa6082045569af10c8e630f828d244609d1f299d12ed7a01f
    Image:          health-resource-poc:1.0
    Image ID:       docker://sha256:5fd4e47c95b470a8932ee7b49e9a3451238247ce200b305b94c16327f424893a
    Port:           3000/TCP
    Host Port:      0/TCP
    State:          Running
      Started:      Mon, 10 Aug 2026 11:34:28 +0530
    Ready:          True
    Restart Count:  0
    Limits:                                                                                                              -->*important notes*
      cpu:     500m
      memory:  256Mi
    Requests:
      cpu:        100m
      memory:     128Mi
    Liveness:     http-get http://:3000/health/live delay=10s timeout=1s period=5s #success=1 #failure=3
    Readiness:    http-get http://:3000/health/ready delay=5s timeout=1s period=5s #success=1 #failure=3
    Environment:  <none>
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from kube-api-access-227sx (ro)
Conditions:
  Type                        Status
  PodReadyToStartContainers   True 
  Initialized                 True 
  Ready                       True 
  ContainersReady             True 
  PodScheduled                True 
Volumes:
  kube-api-access-227sx:
    Type:                    Projected(a volume that contains injected data from multiple sources)
    TokenExpirationSeconds:  3607
    ConfigMapName:           kube-root-ca.crt
    ConfigMapOptional:       <nil>
    DownwardAPI:             true
QoS Class:                   Burstable                                                                                      -->*important*
Node-Selectors:              <none>
Tolerations:                 node.kubernetes.io/not-ready:NoExecute op=Existsfor 300s
                             node.kubernetes.io/unreachable:NoExecute op=Exists for 300s
Events:
  Type    Reason     Age   From       Message
  ----    ------     ----  ----       -------
  Normal  Scheduled  113s  default-scheduler  Successfully assigned health-poc/health-app-6ddfcdb79c-nhqtb to minikube
  Normal  Pulled     113s  kubelet       Container image "health-resource-poc:1.0" already present on machine and can be accessed by the pod
  Normal  Created    113s  kubelet       Container created
  Normal  Started    113s  kubelet       Container started
keerthana@Mac-160 k8s-health-resource-scheduling-poc % 

* Previously you had:
---------------------
QoS Class: BestEffort

* Now it should become:
---------------------
QoS Class: Burstable

Why?
-----
Because you have defined resource requests and limits, but they are not equal for every resource:

CPU:
request = 100m
limit   = 500m

Memory:
request = 128Mi
limit   = 256Mi

Therefore Kubernetes classifies this Pod as Burstable.

* request: 100m

- It means Kubernetes *reserves/considers 100m as the Pod's scheduling requirement*.
- The container can use more CPU, up to the configured limit.
