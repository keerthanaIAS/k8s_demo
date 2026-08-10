# READINESS

* we have two replicas, the Service currently has two healthy endpoints.

* First understand what we're testing:
-------------------------------------
Normal state

Pod
 |
 | /health/ready → HTTP 200
 ↓
READY = True
 |
 ↓
Service sends traffic

* When readiness fails:
----------------------
Pod
 |
 | /health/ready → HTTP 500
 ↓
READY = False
 |
 ↓
Service stops sending traffic
 |
 X
NO container restart

* keerthana@Mac-160 k8s-health-resource-scheduling-poc % kubectl get pods -n health-poc -w
NAME                         READY   STATUS    RESTARTS   AGE
health-app-ff9fc55f8-dqsp5   1/1     Running   0          28m
health-app-ff9fc55f8-k8cpr   1/1     Running   0          28m
health-app-ff9fc55f8-dqsp5   0/1     Running   0          28m
**doubt if call the endpoint not-ready how its effecting in deployment or yaml files how the api is linking ther?**

* What happened when you called /make-not-ready

Suppose Kubernetes chose:
-------------------------
health-app-ff9fc55f8-dqsp5
Pod IP = 10.244.0.3

You called:
-----------
curl http://localhost:8080/make-not-ready

The request went:
-----------------
curl
 ↓
kubectl port-forward
 ↓
Service
 ↓
one of the Pods
 ↓
Node.js /make-not-ready

Node.js executed:
---------------
ready = false;

So inside that Node.js process, the value changed:
-------------------------------------------------

BEFORE
  |
  ↓
ready = true


AFTER /make-not-ready
  |
  ↓
ready = false

- Nothing happened to your YAML file.
- Nothing happened to the Deployment object itself.

* Then Kubernetes comes into the picture:

Your YAML says:
---------------
readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000

So kubelet periodically asks the Pod:
------------------------------------
GET http://10.244.0.3:3000/health/ready

Node.js receives it.

Because you changed:
-------------------
ready = false;

the endpoint now returns:
------------------------
HTTP 500

instead of:
----------
HTTP 200

Therefore:
----------
Kubelet
   |
   | GET /health/ready
   ↓
Node.js
   |
   | ready === false
   ↓
HTTP 500
   |
   ↓
Readiness FAILED

After the configured failures, Kubernetes changes the Pod's condition:
---------------------------------------------------------------------
Ready: True
       ↓
Ready: False

That's why you got:
------------------
health-app-ff9fc55f8-dqsp5   0/1   Running   0

* This is the exact relationship:
 - "How is the API linking to the YAML?"
 - The YAML tells Kubernetes: "Call this HTTP endpoint to determine readiness."
 - Your application provides that endpoint.

                     Deployment YAML
                       |
                       |
                       ↓
              readinessProbe says:
              "/health/ready"
                       |
                       ↓
                 Kubernetes
                    Kubelet
                       |
                       | HTTP GET
                       ↓
              Pod IP : 3000
                       |
                       ↓
                 Node.js app
                       |
                       ↓
              /health/ready
                       |
              ┌────────┴────────┐
              ↓                 ↓
        ready = true       ready = false
              ↓                 ↓
           HTTP 200          HTTP 500
              ↓                 ↓
           Ready ✓           NotReady ✗

* For example, suppose your application depends on MongoDB:

Node.js
   |
   ↓
MongoDB
   X
Connection unavailable
   |
   ↓
/health/ready returns HTTP 500
   |
   ↓
Kubernetes marks Pod NotReady
   |
   ↓
Service stops sending traffic

- That is the real-world use case.

And notice something else from your output:
------------------------------------------
0/1 Running 0

This single line proves the distinction:
----------------------------------------
Running → container/process is still alive.
0/1 → readiness check failed.
0 restarts → liveness hasn't restarted anything.

# LIVENESS

The goal is to prove this:
---------------------------
Readiness failure
→ Pod stays Running
→ Pod becomes NotReady
→ No restart

Liveness failure
→ Container is considered unhealthy
→ kubelet restarts the container
→ RESTARTS increases

**Command Doubt: after i given liveness the pod name is changed its not restart changed the full pod? or it will just restart**:
cheduling-poc % kubectl get pods -n health-poc
NAME                         READY   STATUS    RESTARTS   AGE
health-app-ff9fc55f8-dqsp5   0/1     Running   0          30m
health-app-ff9fc55f8-k8cpr   1/1     Running   0          30m
keerthana@Mac-160 k8s-health-resource-scheduling-poc % kubectl apply -f k8s/deployment.yaml
cheduling-poc % kubectl get pods -n health-poc      
NAME                          READY   STATUS    RESTARTS   AGE
health-app-798db7fc99-c7pcf   1/1     Running   0          49s
health-app-798db7fc99-tgcrt   1/1     Running   0          56s

- Yes — in your case the full Pod was replaced, but that is not what a liveness probe normally does.

You are seeing two different Kubernetes mechanisms, and this distinction matters.

What happened in your output
----------------------------
* Before you added liveness:

health-app-ff9fc55f8-dqsp5
health-app-ff9fc55f8-k8cpr

* After you changed deployment.yaml and applied it:

kubectl apply -f k8s/deployment.yaml

you got:
--------
health-app-798db7fc99-c7pcf
health-app-798db7fc99-tgcrt

The hash changed:
----------------
ff9fc55f8
      ↓
798db7fc99

That means Deployment created a new ReplicaSet and replaced the old Pods.

Why?
----
Because you changed the Pod template by adding:                                                                            -->*important notes*

livenessProbe:
-------------
A Deployment detects that the Pod template changed and performs a rolling update.

* So this:

Deployment
    |
    | Pod template changed
    ↓
New ReplicaSet
    |
    ├── New Pod
    └── New Pod

- The old Pods were eventually removed.

That's why this command failed:
--------------------------------
kubectl describe pod health-app-ff9fc55f8-dqsp5 -n health-poc

keerthana@Mac-160 k8s-health-resource-scheduling-poc % kubectl describe pod health-app-ff9fc55f8-dqsp5 -n health-poc
Error from server (NotFound): pods "health-app-ff9fc55f8-dqsp5" not found

- because that Pod no longer exists.


* Watch Kubernetes restart it:
------------------------------
keerthana@Mac-160 k8s-health-resource-scheduling-poc % curl http://localhost:8080/make-unhealthy
{"message":"Application is now UNHEALTHY"}%                                   
keerthana@Mac-160 k8s-health-resource-scheduling-poc % 

keerthana@Mac-160 k8s-health-resource-scheduling-poc % kubectl get pods -n health-poc -w
NAME                          READY   STATUS    RESTARTS     AGE
health-app-798db7fc99-c7pcf   1/1     Running   0            9m26s
health-app-798db7fc99-tgcrt   1/1     Running   1 (7s ago)   9m33s

The important part:
------------------
RESTARTS
0
 ↓
1

- Unlike readiness, Kubernetes restarted the container.

keerthana@Mac-160 k8s-health-resource-scheduling-poc % kubectl describe pod health-app-798db7fc99-tgcrt -n health-poc

Name:             health-app-798db7fc99-tgcrt
Namespace:        health-poc
Priority:         0
Service Account:  default
Node:             minikube/192.168.49.2
Start Time:       Mon, 10 Aug 2026 11:16:38 +0530
Labels:           app=health-app
                  pod-template-hash=798db7fc99
Annotations:      <none>
Status:           Running
IP:               10.244.0.5
IPs:
  IP:           10.244.0.5
Controlled By:  ReplicaSet/health-app-798db7fc99
Containers:
  health-app:
    Container ID:   docker://0b13b68253b0fd477255064a99674dab13350f743d94da21295636c944ec01c4
    Image:          health-resource-poc:1.0
    Image ID:       docker://sha256:5fd4e47c95b470a8932ee7b49e9a3451238247ce200b305b94c16327f424893a
    Port:           3000/TCP
    Host Port:      0/TCP
    State:          Running
      Started:      Mon, 10 Aug 2026 11:26:04 +0530
    Last State:     Terminated
      Reason:       Error
      Exit Code:    1
      Started:      Mon, 10 Aug 2026 11:16:39 +0530
      Finished:     Mon, 10 Aug 2026 11:26:04 +0530
    Ready:          True
    Restart Count:  1                                                                                                      -->*important notes*
    Liveness:       http-get http://:3000/health/live delay=10s timeout=1s period=5s #success=1 #failure=3
    Readiness:      http-get http://:3000/health/ready delay=5s timeout=1s period=5s #success=1 #failure=3
    Environment:    <none>
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from kube-api-access-pc8kn (ro)
Conditions:
  Type                        Status
  PodReadyToStartContainers   True 
  Initialized                 True 
  Ready                       True 
  ContainersReady             True 
  PodScheduled                True 
Volumes:
  kube-api-access-pc8kn:
    Type:                    Projected(a volume that contains injected data from multiple sources)
    TokenExpirationSeconds:  3607
    ConfigMapName:           kube-root-ca.crt
    ConfigMapOptional:       <nil>
    DownwardAPI:             true
QoS Class:                   BestEffort
Node-Selectors:              <none>
Tolerations:                 node.kubernetes.io/not-ready:NoExecute op=Existsfor 300s
                             node.kubernetes.io/unreachable:NoExecute op=Exists for 300s
Events:
  Type     Reason     Age     From               Message
  ----     ------     ----     ----               -------
  Normal   Scheduled  11m     default-scheduler  Successfully assigned health-poc/health-app-798db7fc99-tgcrt to minikube
  Warning  Unhealthy  2m7s (x3 over 2m17s)  kubelet            Liveness probefailed: HTTP probe failed with statuscode: 500
  Normal   Killing    2m7s     kubelet            Container health-app failed liveness probe, will be restarted
  Normal   Pulled     2m6s (x2 over 11m)    kubelet            Container image "health-resource-poc:1.0" already present on machine and can be accessed by the pod
  Normal   Created    2m6s (x2 over 11m)    kubelet            Container created
  Normal   Started    2m6s (x2 over 11m)    kubelet            Container started
keerthana@Mac-160 k8s-health-resource-scheduling-poc % 

* The difference you should now be able to explain:
---------------------------------------------------
Readiness
----------
/health/ready → 500
       ↓
Pod = NotReady
       ↓
Service removes Pod from endpoints
       ↓
Container keeps running
       ↓
RESTARTS = 0

Liveness
---------
/health/live → 500
       ↓
Pod/container considered unhealthy
       ↓
kubelet restarts container
       ↓
Application starts again
       ↓
RESTARTS = 1

*the Deployment itself does not restart your container. The kubelet on the Node executes the liveness probe and restarts the failed container. The Deployment/ReplicaSet is responsible for maintaining the desired number of Pods, which is a different responsibility.*

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

