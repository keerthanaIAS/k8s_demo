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
