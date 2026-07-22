# Understand the flow
Your app
   ↓
Dockerfile
   ↓
docker build
   ↓
Docker Image
   ↓
docker run
   ↓
Docker Container
   ↓
Node.js app running on port 3000

## The key concept
You now have:

Docker Image
     │
     ▼
Kubernetes Deployment
     │
     ▼
ReplicaSet
     │
     ├── Pod 1 → Node.js Container
     │
     └── Pod 2 → Node.js Container

### Terminal Logs:-
keerthana@Mac-585 node-k8s-poc % docker rm -f node-k8s-container
node-k8s-container
keerthana@Mac-585 node-k8s-poc % sudo lsof -i :3000
keerthana@Mac-585 node-k8s-poc % docker run -d --name node-k8s-container -p 3000:3000 node-k8s-poc:1.0
ae3d281c0166e3a51b23e2ead714e6cb169d2ca4b568d8b0a2286adb68a028d6
keerthana@Mac-585 node-k8s-poc % kubectl version --client
Client Version: v1.32.2
Kustomize Version: v5.5.0
keerthana@Mac-585 node-k8s-poc % kubectl get nodes
NAME             STATUS   ROLES           AGE     VERSION
docker-desktop   Ready    control-plane   5d18h   v1.32.2
keerthana@Mac-585 node-k8s-poc % mkdir k8s
keerthana@Mac-585 node-k8s-poc % touch k8s/deployment.yaml
keerthana@Mac-585 node-k8s-poc % kubectl apply -f k8s/deployment.yaml
deployment.apps/node-k8s-deployment created
keerthana@Mac-585 node-k8s-poc % kubectl get deployments
NAME                  READY   UP-TO-DATE   AVAILABLE   AGE
node-k8s-deployment   2/2     2            2           9s
keerthana@Mac-585 node-k8s-poc % kubectl get pods
NAME                                   READY   STATUS    RESTARTS   AGE
node-k8s-deployment-86d568bc6d-d97fw   1/1     Running   0          15s
node-k8s-deployment-86d568bc6d-tnwn9   1/1     Running   0          15s
keerthana@Mac-585 node-k8s-poc % kubectl get all
NAME                                       READY   STATUS    RESTARTS   AGE
pod/node-k8s-deployment-86d568bc6d-d97fw   1/1     Running   0          23s
pod/node-k8s-deployment-86d568bc6d-tnwn9   1/1     Running   0          23s

NAME                 TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
service/kubernetes   ClusterIP   10.96.0.1    <none>        443/TCP   5d18h

NAME                                  READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/node-k8s-deployment   2/2     2            2           23s

NAME                                             DESIRED   CURRENT   READY   AGE
replicaset.apps/node-k8s-deployment-86d568bc6d   2         2         2       23s
keerthana@Mac-585 node-k8s-poc % kubectl get pods
NAME                                   READY   STATUS    RESTARTS   AGE
node-k8s-deployment-86d568bc6d-d97fw   1/1     Running   0          100s
node-k8s-deployment-86d568bc6d-tnwn9   1/1     Running   0          100s
keerthana@Mac-585 node-k8s-poc % kubectl port-forward deployment/node-k8s-deployment 3000:3000
Forwarding from 127.0.0.1:3000 -> 3000
Forwarding from [::1]:3000 -> 3000
Handling connection for 3000
Handling connection for 3000

# After check the kubernet container running in local:-
You have now successfully done:

Docker Image
    ↓
Kubernetes Deployment
    ↓
ReplicaSet
    ↓
2 Pods
    ↓
Node.js Containers
    ↓
port-forward
    ↓
localhost:3000

One thing: *your docker run container is still running separately*. Kubernetes is *not using that container*. Kubernetes created *its own containers from the same image*. 

You can remove the standalone Docker container now:
docker rm -f node-k8s-container

## Terminal Log:-
keerthana@Mac-585 node-k8s-poc % docker rm -f node-k8s-container
node-k8s-container

*Note*: the local 3000 now also will run using kubernetes container

## Create a Kubernetes Service:
Right now, you have 2 Pods:

Pod 1 → Node.js
Pod 2 → Node.js

But users don't directly access Pods.

We create a Service:
                 Kubernetes Service
                  node-k8s-service
                         │
                ┌────────┴────────┐
                ↓                 ↓
              Pod 1             Pod 2
                │                 │
                └──── Node.js ────┘
The Service gives you a stable *network endpoint and distributes* traffic between Pods.

# ou should see:

Service
    ↓
Deployment
    ↓
ReplicaSet
    ↓
2 Pods

## Terminal Log:-
keerthana@Mac-585 node-k8s-poc % touch k8s/service.yaml
keerthana@Mac-585 node-k8s-poc % kubectl apply -f k8s/service.yaml
service/node-k8s-service created
keerthana@Mac-585 node-k8s-poc % kubectl get services
NAME               TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)   AGE
kubernetes         ClusterIP   10.96.0.1        <none>        443/TCP   5d19h
node-k8s-service   ClusterIP   10.109.118.109   <none>        80/TCP    5s
keerthana@Mac-585 node-k8s-poc % kubectl get all
NAME                                       READY   STATUS    RESTARTS   AGE
pod/node-k8s-deployment-86d568bc6d-d97fw   1/1     Running   0          9m25s
pod/node-k8s-deployment-86d568bc6d-tnwn9   1/1     Running   0          9m25s

NAME                       TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)   AGE
service/kubernetes         ClusterIP   10.96.0.1        <none>        443/TCP   5d19h
service/node-k8s-service   ClusterIP   10.109.118.109   <none>        80/TCP    11s

NAME                                  READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/node-k8s-deployment   2/2     2            2           9m25s

NAME                                             DESIRED   CURRENT   READY   AGE
replicaset.apps/node-k8s-deployment-86d568bc6d   2         2         2       9m25s

# Get the enpoint:-
keerthana@Mac-585 node-k8s-poc % kubectl get endpoints node-k8s-service
NAME               ENDPOINTS                       AGE
node-k8s-service   10.1.0.54:3000,10.1.0.55:3000   89s
keerthana@Mac-585 node-k8s-poc % 

* Conceptually:

node-k8s-service
       │
       ├── 10.x.x.x:3000 → Pod 1
       │
       └── 10.x.x.x:3000 → Pod 2

This proves your Service discovered your Pods.

# The complete architecture is now:
                    Kubernetes
                       │
              Deployment (2 replicas)
                       │
              ┌────────┴────────┐
              │                 │
            Pod 1             Pod 2
          :3000               :3000
              │                 │
              └────────┬────────┘
                       │
                Service :3000
                       │
               port-forward
                       │
                localhost:3000

## You have now practically learned:
- Pod → Runs your container
- Deployment → Manages desired number of Pods
- ReplicaSet → Maintains the number of Pods
- Service → Provides stable networking to Pods
- Labels & Selectors → Connect Services to the correct Pods

### Terminal log for service yaml run steps:
keerthana@Mac-585 node-k8s-poc % touch k8s/service.yaml
keerthana@Mac-585 node-k8s-poc % kubectl apply -f k8s/service.yaml
service/node-k8s-service created
keerthana@Mac-585 node-k8s-poc % kubectl get services
NAME               TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)   AGE
kubernetes         ClusterIP   10.96.0.1        <none>        443/TCP   5d19h
node-k8s-service   ClusterIP   10.109.118.109   <none>        80/TCP    5s
keerthana@Mac-585 node-k8s-poc % kubectl get all
NAME                                       READY   STATUS    RESTARTS   AGE
pod/node-k8s-deployment-86d568bc6d-d97fw   1/1     Running   0          9m25s
pod/node-k8s-deployment-86d568bc6d-tnwn9   1/1     Running   0          9m25s

NAME                       TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)   AGE
service/kubernetes         ClusterIP   10.96.0.1        <none>        443/TCP   5d19h
service/node-k8s-service   ClusterIP   10.109.118.109   <none>        80/TCP    11s

NAME                                  READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/node-k8s-deployment   2/2     2            2           9m25s

NAME                                             DESIRED   CURRENT   READY   AGE
replicaset.apps/node-k8s-deployment-86d568bc6d   2         2         2       9m25s
keerthana@Mac-585 node-k8s-poc % kubectl get endpoints node-k8s-service
NAME               ENDPOINTS                       AGE
node-k8s-service   10.1.0.54:3000,10.1.0.55:3000   89s
keerthana@Mac-585 node-k8s-poc % kubectl port-forward service/node-k8s-service 3000:80
Unable to listen on port 3000: Listeners failed to create with the following errors: [unable to create listener: Error listen tcp4 127.0.0.1:3000: bind: address already in use unable to create listener: Error listen tcp6 [::1]:3000: bind: address already in use]
error: unable to listen on any of the requested ports: [{3000 3000}]
keerthana@Mac-585 node-k8s-poc % lsof -i :3000
COMMAND    PID      USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
Google     636 keerthana   44u  IPv6 0x923bbc21d96eed86      0t0  TCP localhost:54417->localhost:hbci (CLOSED)
Google     636 keerthana   52u  IPv6 0xb168cf7412abf35c      0t0  TCP localhost:54418->localhost:hbci (CLOSE_WAIT)
kubectl   8374 keerthana    8u  IPv4 0x734069be3aeb84ce      0t0  TCP localhost:hbci (LISTEN)
kubectl   8374 keerthana    9u  IPv6 0x779fc3267c7bde4c      0t0  TCP localhost:hbci (LISTEN)
keerthana@Mac-585 node-k8s-poc % kubectl apply -f k8s/service.yaml
service/node-k8s-service configured
keerthana@Mac-585 node-k8s-poc % kubectl get service node-k8s-service
NAME               TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)    AGE
node-k8s-service   ClusterIP   10.109.118.109   <none>        3000/TCP   69m
keerthana@Mac-585 node-k8s-poc % kill 8374
keerthana@Mac-585 node-k8s-poc % lsof -i :3000
keerthana@Mac-585 node-k8s-poc % kubectl port-forward service/node-k8s-service 3000:3000
Forwarding from 127.0.0.1:3000 -> 3000
Forwarding from [::1]:3000 -> 3000
Handling connection for 3000
Handling connection for 3000

# Do we need both Deployment and Service?
Usually, yes.

They solve different problems:
* Deployment = manages Pods
Deployment
    │
    ├── Pod 1
    ├── Pod 2
    └── Pod 3

Deployment's job is:
- Keep the desired number of Pods running.
- Recreate a Pod if it crashes.
- Scale Pods up/down.
- Roll out a new application version.
- Roll back a bad deployment.

Example:
replicas: 3

Means:
Kubernetes, keep 3 healthy Pods running.

* Service = provides stable networking

Pods are temporary.

Today:
Pod 1 → 10.1.0.54
Pod 2 → 10.1.0.55

Tomorrow, Pod 1 might die and be replaced:
Pod 1 → 10.1.0.60
Pod 2 → 10.1.0.55

The Pod IP changed.
You don't want your application or users to track changing Pod IPs.

So:
Client
   ↓
Service
   ↓
Pod 1
Pod 2
Pod 3

The Service gives you a stable endpoint and sends traffic to available Pods.

# "Service just changing and giving the network IP?"

Almost.

More accurately:
----------------
Deployment
    │
    │ Manages Pod lifecycle
    │
    ├── Create Pods
    ├── Maintain replicas
    ├── Replace failed Pods
    └── Rolling updates
          │
          ▼
        Pods
          │
          │ Labels
          ▼
      Kubernetes Service
          │
          │ Stable network identity
          │ Traffic routing
          │
          ▼
    Available / Ready Pods

So:
----
Deployment:-
"How many application instances should exist, and are they running?"

Service:-
"How can other applications/users reliably reach the currently available instances?"

>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

# Yes. **Exactly.** Your understanding should be:

> **We build a Docker image first. Then Kubernetes uses that Docker image to create containers inside Pods.**

Let's trace **your exact project** from beginning to end.
---------------------------------------------------------

# 1. You wrote the Node.js application

You have:

```text
app.js
```

```javascript
const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.json({
    message: "Hello from Node.js Kubernetes POC",
    version: "1.0.0",
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

This is your actual application.

---

# 2. You created a Dockerfile

```dockerfile
FROM node:22

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

This tells Docker:

> Take Node.js, copy my application, install dependencies, and prepare it to run.

---

# 3. You built a Docker image

You ran:

```bash
docker build -t node-k8s-poc:1.0 .
```

Now you have:

```text
Docker Image
node-k8s-poc:1.0
```

Think of the image as a **packaged application**.

It contains roughly:

```text
node-k8s-poc:1.0
│
├── Node.js
├── npm
├── Express
├── node_modules
├── app.js
└── package.json
```

The image itself is **not running**.

It is a package/template that can be used to create containers.

---

# 4. Normally Docker can use the image

You already did this:

```bash
docker run node-k8s-poc:1.0
```

Docker takes:

```text
Docker Image
     │
     ▼
Container
     │
     ▼
npm start
     │
     ▼
Node.js application
```

So:

```text
Image = Package/template
Container = Running instance of that image
```

---

# 5. Now Kubernetes uses the same image

This is the part you're asking about.

Your `deployment.yaml` says:

```yaml
containers:
  - name: node-k8s-container
    image: node-k8s-poc:1.0
```

This line:

```yaml
image: node-k8s-poc:1.0
```

means:

> Kubernetes, run a container using the `node-k8s-poc:1.0` Docker image.

So the flow is:

```text
                 Docker
                   │
                   │ docker build
                   ▼
          node-k8s-poc:1.0
             Docker Image
                   │
                   │ Kubernetes uses image
                   ▼
                 Pod
                   │
                   ▼
              Container
                   │
                   ▼
            npm start
                   │
                   ▼
          Node.js Application
```

So **YES**, you're using the Docker image you built in Kubernetes.

---

# 6. Why do we need a Pod?

Kubernetes doesn't directly manage a Docker image.

It creates a **Pod**.

The Pod contains your container.

```text
Pod
└── Container
      └── node-k8s-poc:1.0
            └── Node.js application
```

In your case:

```text
Deployment
    │
    ├── Pod 1
    │     └── Container
    │           └── node-k8s-poc:1.0
    │                 └── Node.js
    │
    └── Pod 2
          └── Container
                └── node-k8s-poc:1.0
                      └── Node.js
```

Because you said:

```yaml
replicas: 2
```

Kubernetes creates **2 Pods**, and each Pod runs a container from the same image.

So you have:

```text
Same Image
    │
    ├───────────────┐
    ▼               ▼
Container 1     Container 2
    │               │
    ▼               ▼
Node.js App      Node.js App
```

---

# 7. Where does Deployment come in?

You tell Kubernetes:

```yaml
replicas: 2
```

Deployment says:

> I want 2 running instances of this application.

So:

```text
Deployment
     │
     │ "I want 2"
     ▼
Pod 1 ─── Container ─── Node.js
Pod 2 ─── Container ─── Node.js
```

If Pod 1 crashes:

```text
Pod 1 ❌
Pod 2 ✅
```

Deployment notices:

> I wanted 2 Pods, but I only have 1.

So Kubernetes creates a replacement:

```text
Pod 1 ❌
Pod 2 ✅
Pod 3 🆕
```

Pod 3 also uses:

```text
node-k8s-poc:1.0
```

So Deployment manages the **number and lifecycle of running Pods**.

---

# 8. Where does Service come in?

Now you have:

```text
Pod 1 → Node.js
Pod 2 → Node.js
```

But Pods have temporary IP addresses.

So you create:

```text
Service
```

The Service provides a stable way to reach your Pods.

```text
Client
   │
   ▼
Service
   │
   ├── Pod 1
   │     └── Node.js
   │
   └── Pod 2
         └── Node.js
```

The Service doesn't run your application.

It doesn't create Pods.

It doesn't contain your Docker image.

It simply provides **networking and traffic routing** to the Pods.

---

# The whole picture

This is the most important diagram for your current learning:

```text
                 YOUR CODE
                    │
                    ▼
                 app.js
                    │
                    ▼
               Dockerfile
                    │
                    │ docker build
                    ▼
          ┌────────────────────┐
          │ Docker Image       │
          │ node-k8s-poc:1.0   │
          └────────────────────┘
                    │
                    │ Kubernetes uses this image
                    ▼
              Deployment
              replicas: 2
                    │
             ┌──────┴──────┐
             ▼             ▼
           Pod 1         Pod 2
             │             │
             ▼             ▼
        Container      Container
             │             │
             ▼             ▼
        Node.js App    Node.js App
             │             │
             └──────┬──────┘
                    │
                    ▼
                 Service
                    │
                    ▼
              HTTP Requests
```

The simplest way to remember it:

> **Docker Image = packaged application.**

> **Container = running application created from the image.**

> **Pod = Kubernetes wrapper around the container.**

> **Deployment = makes sure the required Pods are running.**

> **Service = gives network access to those Pods and routes requests to available Pods.**

### Your exact project:

```text
docker build
      ↓
node-k8s-poc:1.0
      ↓
Kubernetes Deployment
      ↓
2 Pods
      ↓
2 Containers
      ↓
2 Node.js applications
      ↓
Kubernetes Service
      ↓
HTTP API requests
```

So yes, **you built the Docker image once, and Kubernetes is now using that image to run your application in Pods**.

The next important thing you should learn is **where that image comes from in a real production environment**. Right now, your local Docker Desktop Kubernetes can see your local image. In a real production cluster, the image usually comes from a **Docker Registry** such as Docker Hub or a private registry. That is the missing piece between **Docker and Kubernetes** that you'll need before learning Jenkins CI/CD.



# 2. Stop Kubernetes pods
kubectl delete pods --all 2>/dev/null


>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

# Here we are going to do extra jenkins and domain:

# View:
GitHub
   │
   │ push
   ▼
Jenkins
   │
   ├── Clone repository
   ├── Build Docker image
   └── Deploy to Kubernetes
            │
            ▼
      Kubernetes
            │
       Deployment
            │
       ┌────┴────┐
       ▼         ▼
     Pod 1     Pod 2
       │         │
       └────┬────┘
            ▼
         Service
            │
            ▼
         Ingress
            │
            ▼
     node-k8s.local

# Kubernetes learning journey so far:
After complete ingress:
Node.js Application
        ↓
Docker Image
        ↓
Docker Container
        ↓
Kubernetes
        ↓
Deployment
        ↓
Pods
        ↓
Pod Self-Healing ✅
        ↓
ClusterIP Service
        ↓
NodePort ✅
        ↓
LoadBalancer ✅
        ↓
NGINX Ingress
        ↓
Local Domain
        ↓
node-k8s.local

## Your final request flow is:

http://node-k8s.local
        ↓
Ingress
        ↓
Service
        ↓
Healthy Pod
        ↓
Node.js
        ↓
{"message":"Hello from Node.js Kubernetes POC","version":"1.0.0"}

# Important Notes:
------------------------------------------------------------------------------------------------------------------------------------------
## Think of them as different levels of access.

1. ClusterIP — internal access
Kubernetes Cluster
│
├── Service (ClusterIP)
│       │
│       ├── Pod 1
│       └── Pod 2

Only applications inside the Kubernetes cluster can normally access it.

Example:

Backend Service A
       ↓
Service B (ClusterIP)
       ↓
Pod B

*Use it when you don't want the service directly exposed outside the cluster*.

Default Service type.

2. NodePort — expose through a Kubernetes Node port
Your Computer
      │
      │ :30080
      ▼
Kubernetes Node
      │
      ▼
NodePort Service
      │
      ├── Pod 1
      └── Pod 2

You get a port such as:

30080

So you can access:

http://localhost:30080

In your POC, you tested this successfully.

*Use it mainly for simple external access/testing*.

3. LoadBalancer — external load balancer
External User
      │
      ▼
LoadBalancer
      │
      ▼
Service
      │
      ├── Pod 1
      └── Pod 2

In a cloud environment:

Internet
   ↓
AWS Load Balancer
   ↓
Kubernetes Service
   ↓
Pods

In your Docker Desktop:

localhost
   ↓
Docker Desktop LoadBalancer
   ↓
Kubernetes Service
   ↓
Pods

*So LoadBalancer is normally used when you want an externally accessible application, especially in cloud Kubernetes*.

### The key difference
| Type             | Who can access?               | Typical use                     |
| ---------------- | ----------------------------- | ------------------------------- |
| **ClusterIP**    | Inside cluster                | Internal microservices          |
| **NodePort**     | Outside via node port         | Simple testing / basic exposure |
| **LoadBalancer** | Outside via external LB       | Public/external application     |
| **Ingress**      | Outside via HTTP/HTTPS domain | Multiple apps, domains, routing |

#### final understanding should be:
ClusterIP = internal networking
NodePort = expose through a node port
LoadBalancer = expose through an external load balancer
Ingress = HTTP/HTTPS routing using domains and paths

##### The correct flow is:
1. Docker
   Build Docker image
        ↓
   Docker Image
        ↓
2. Kubernetes Deployment
   Uses that image
        ↓
   Creates and manages Pods
        ↓
3. Pods
   Run your Node.js application
        ↓
4. Service
   Provides stable networking
   and routes traffic to Pods
        ↓
5. Ingress
   Uses the Service to route
   external HTTP/HTTPS requests
   based on domain/path
        ↓
6. Browser
   http://node-k8s.local