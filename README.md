# Kubernetes Architecture

```text
                         YOU
                          │
                          │ kubectl apply
                          ▼
                 ┌───────────────────┐
                 │   CONTROL PLANE   │
                 │                   │
                 │  API Server       │
                 │  Scheduler        │
                 │  Controller Mgr   │
                 │  etcd             │
                 └─────────┬─────────┘
                           │
                           │ manages
                           ▼
                 ┌───────────────────┐
                 │   WORKER NODE     │
                 │    DATA PLANE     │
                 │                   │
                 │  kubelet          │
                 │  kube-proxy       │
                 │  Container Runtime│
                 │                   │
                 │  Pod              │
                 │  Pod              │
                 │  Pod              │
                 └───────────────────┘
```

Think of it as:

> **Control Plane = Brain**
> **Worker Node/Data Plane = Where the application actually runs**

---

# 1. API Server — The Entry Door

You run:

```bash
kubectl apply -f deployment.yaml
```

The request goes to:

```text
kubectl
   │
   ▼
API Server
```

The API Server is the **main communication point** of Kubernetes.

Practically:

```text
You
 │
 │ kubectl get pods
 ▼
API Server
 │
 │ asks Kubernetes state
 ▼
Response
 │
 ▼
You see Pods
```

*Almost all Kubernetes operations go through the API Server*.                                                         -->*important note*

You can think:

> **API Server = Front door of Kubernetes**

---

# 2. etcd — The Kubernetes Database

Suppose you create:

```yaml
replicas: 3
```

Kubernetes needs to remember:

> "The user wants 3 replicas."

That information is stored in:

```text
API Server
    │
    ▼
etcd
```

etcd stores the **cluster's desired and current state information**.                                                    -->*important note*

For example:

```text
Deployment:
nginx-deployment

Desired replicas:
3

Pods:
Pod 1
Pod 2
Pod 3
```

Think:

> **etcd = Kubernetes' source of truth**

Important: Your application data like:

```text
Users
Orders
Payments
```

is **not normally stored in etcd**.

That's your application database:

```text
MongoDB
PostgreSQL
MySQL
```

---

# 3. Scheduler — Decides WHERE the Pod Runs

Suppose you create:

```yaml
replicas: 3
```

The Deployment/ReplicaSet wants:

```text
3 Pods
```

But Kubernetes needs to decide:

> "Which Worker Node should run each Pod?"

That's the Scheduler's job.

Imagine:

```text
Worker Node 1
CPU: Available

Worker Node 2
CPU: Available

Worker Node 3
CPU: Busy
```

Scheduler might decide:

```text
Pod 1 → Worker Node 1
Pod 2 → Worker Node 2
Pod 3 → Worker Node 1
```

So:

> **Scheduler = Decides which node should run a new Pod**                                                                 -->*important note*

It does **not actually create the container**.

It makes the placement decision.                                                                                          -->*important note*

---

# 4. Controller Manager — Watches and Fixes

This is where your previous Deployment question connects.

Suppose you say:

```yaml
replicas: 3
```

Controller Manager contains controllers that continuously compare:

```text
Desired State
      vs
Actual State
```

You want:

```text
3 Pods
```

But one crashes:

```text
Desired: 3
Actual: 2
```

The controller notices:

```text
3 desired
2 actual
   ↓
Create 1 more Pod
```

Then:

```text
3 desired
3 actual
   ↓
Everything okay
```

Think:

> **Controller Manager = Continuously watches and tries to make actual state match desired state**                          -->*important note*

This is the foundation of Kubernetes' **self-healing behavior**.                                                            -->*important note*

---

# 5. Worker Node / Data Plane

Now the Scheduler decides:

```text
Pod 1 → Worker Node 1
```

The Pod actually runs on the **Worker Node**.

A Worker Node contains:

```text
Worker Node
│
├── kubelet
├── Container Runtime
├── kube-proxy
│
├── Pod 1
├── Pod 2
└── Pod 3
```

This is the **Data Plane**.

The Control Plane decides and manages.

The Data Plane actually **runs the workload**.

---

# 6. kubelet — Worker Node Manager

Suppose Scheduler says:

```text
Pod 1
↓
Worker Node 1
```

The kubelet on Worker Node 1 is *responsible for making sure that Pod actually runs*.                                       -->*important note*

Think:

```text
Control Plane
      │
      │ "Run this Pod"
      ▼
Worker Node
      │
      ▼
kubelet
      │
      ▼
Container Runtime
      │
      ▼
Container
```

The kubelet continuously checks:

```text
Pod should be Running
        vs
Pod is actually Running?
```

If something goes wrong, kubelet works with the container runtime to maintain the Pod according to its specification.

Think:

> **kubelet = Agent on every Worker Node that manages Pods**

---

# 7. Container Runtime — Actually Runs Containers

The kubelet says:

> "I need an Nginx container running."

The Container Runtime actually runs it.

Examples:

```text
containerd
CRI-O
```

Flow:

```text
kubelet
   │
   │ Run container
   ▼
Container Runtime
   │
   ▼
Nginx Container
```

Think:

> **Container Runtime = Actually runs the containers**                                                                  -->*important note*

---

# 8. kube-proxy — Helps Service Networking

Now suppose you have:

```text
Service
   │
   ├── Pod 1
   ├── Pod 2
   └── Pod 3
```

A request comes to the Service:

```text
User
  │
  ▼
Service
```

Kubernetes needs networking rules to direct that traffic toward the correct Pods.

`kube-proxy` helps implement the networking behavior behind 
 Services, 
 *typically by programming network rules on the node*.                                                                  -->*important note*

Think:

> **kube-proxy = Helps implement Service networking**

Don't think of it as a traditional proxy that personally handles every request. Modern Kubernetes networking often relies on kernel-level rules or other implementations.

`kube-proxy` can use different **proxy modes** to implement Kubernetes Service networking. The two important ones you asked about are:

### 1. `iptables` mode

```text
Client
   │
   ▼
Service IP
   │
   ▼
iptables rules
   │
   ├──► Pod 1
   ├──► Pod 2
   └──► Pod 3
```

`kube-proxy` watches Services and Endpoints and programs **iptables rules** on the node.

When traffic comes to the Service IP, the Linux kernel's netfilter/iptables rules select a backend Pod.

Think:

> **iptables mode = Service traffic handled through iptables rules.**

---

### 2. `IPVS` mode

```text
Client
   │
   ▼
Service IP
   │
   ▼
IPVS
   │
   ├──► Pod 1
   ├──► Pod 2
   └──► Pod 3
```

`IPVS` (IP Virtual Server) is a Linux kernel-based Layer 4 load-balancing mechanism.

It is designed for efficient handling of large numbers of Services and backend endpoints.

Think:

> **IPVS mode = Service traffic handled by the Linux IPVS load-balancing mechanism.**

| kube-proxy mode | How backend selection works                                                  |
| --------------- | ---------------------------------------------------------------------------- |
| **iptables**    | Probabilistic/randomized selection through iptables rules                    |
| **IPVS**        | Supports load-balancing algorithms such as Round Robin and Least Connections |

---
### But one important correction to your earlier understanding                                                       -->*important notes*

Don't think:

> "Kubernetes checks which Pod is free and sends traffic there."

That's **not generally how it works**.

Kubernetes first makes sure the Pod is an eligible **Ready endpoint**. Then the networking implementation selects among those endpoints according to its rules/algorithm.

```text
Pod 1 → Ready ✅
Pod 2 → NotReady ❌
Pod 3 → Ready ✅
             ↓

Service / kube-proxy
             ↓

Select between:
Pod 1
Pod 3
```

So **"Ready" determines eligibility**, while **the networking implementation determines how traffic is distributed among eligible endpoints**.

---

# 9. Now Put Everything Together

Let's say you execute:

```bash
kubectl apply -f deployment.yaml
```

Your Deployment says:

```yaml
replicas: 3
```

Here's what happens:

```text
                 YOU
                  │
                  │ kubectl apply
                  ▼
            API SERVER
                  │
                  ▼
                etcd
                  │
          Stores desired state
          "I want 3 Pods"
                  │
                  ▼
        Controller Manager
          "Only 0 Pods now"
                  │
                  │
          ReplicaSet creates
          requirement for Pods
                  │
                  ▼
              Scheduler
          "Where should they run?"
             │           │
             ▼           ▼
         Worker 1     Worker 2
             │           │
           kubelet     kubelet
             │           │
             ▼           ▼
      Container Runtime
             │
             ▼
          Containers
             │
             ▼
           Pods
```

Eventually:
-----------
```text
Worker Node 1
│
├── kubelet
├── kube-proxy
├── Container Runtime
│
├── Pod 1
└── Pod 2


Worker Node 2
│
├── kubelet
├── kube-proxy
├── Container Runtime
│
└── Pod 3
```

---

# Now a Pod Crashes

Suppose:

```text
Worker Node 1

Pod 1 ❌ Crashed
Pod 2 ✅
```

The flow is roughly:
-------------------
```text
Pod 1 crashes
     │
     ▼
kubelet detects problem
     │
     ▼
Pod is no longer healthy
     │
     ▼
Controller observes desired
state is not satisfied
     │
     ▼
Replacement Pod is created
     │
     ▼
Scheduler decides where
replacement Pod should run
     │
     ▼
kubelet on selected node
     │
     ▼
Container Runtime
     │
     ▼
New Pod starts
```

If the Pod is behind a Service:

```text
                 Service
                    │
              ┌─────┴─────┐
              ▼           ▼
           Pod 2        Pod 3
           Ready        Ready

           Pod 1 ❌
           Removed from available endpoints
```

The Service avoids sending **new traffic to the unhealthy endpoint**.

Then the replacement Pod becomes Ready:

```text
                 Service
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
        Pod 2      Pod 3     Pod 4
        Ready      Ready     Ready
```

Now Pod 4 can receive traffic.

---

# The Full Architecture You Should Remember

```text
                        CONTROL PLANE
┌──────────────────────────────────────────────────────┐
│                                                      │
│  kubectl                                             │
│     │                                                │
│     ▼                                                │
│  API Server ◄──────────────► etcd                    │
│     │                                                │
│     ├────────► Scheduler                             │
│     │              │                                 │
│     │              │ chooses node                    │
│     │              ▼                                 │
│     └──────► Controller Manager                      │
│                                                      │
└──────────────────────┬───────────────────────────────┘
                       │
                       │ manages
                       ▼
                    DATA PLANE
┌──────────────────────────────────────────────────────┐
│                                                      │
│  Worker Node 1             Worker Node 2             │
│  ┌─────────────────┐       ┌─────────────────┐       │
│  │ kubelet         │       │ kubelet         │       │
│  │ kube-proxy      │       │ kube-proxy      │       │
│  │ Runtime         │       │ Runtime         │       │
│  │                 │       │                 │       │
│  │ Pod 1           │       │ Pod 3           │       │
│  │ Pod 2           │       │                 │       │
│  └─────────────────┘       └─────────────────┘       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## The most important mental model

| Component              | Think of it as           | Main job                               |
| ---------------------- | ------------------------ | -------------------------------------- |
| **API Server**         | Front door               | Receives Kubernetes requests           |
| **etcd**               | Cluster database         | Stores cluster state                   |
| **Scheduler**          | Placement decision-maker | Decides which node gets a Pod          |
| **Controller Manager** | Watcher + fixer          | Makes actual state match desired state |
| **Worker Node**        | Application machine      | Runs workloads                         |
| **kubelet**            | Node agent               | Manages Pods on its node               |
| **Container Runtime**  | Engine                   | Runs containers                        |
| **kube-proxy**         | Networking rules         | Helps implement Service networking     |
| **Pod**                | Application unit         | Runs your application                  |

### One sentence to memorize:

> **Control Plane decides and manages; Worker Nodes run the applications; Deployment/ReplicaSet maintain Pods; Service routes traffic to Pods; Ingress routes external HTTP traffic to Services.**

That is the architecture you should use when explaining Kubernetes in a meeting.


# say one line deployment and service deployment don't know the ready state only recreate pod if fail here service handle that traffic that dont send the traffic to that pod its not ready so what is ready send there?
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Exactly. In one line:                                                                                                   -->*important note*
---------------------
**Deployment/ReplicaSet:** maintains the required Pods and recreates a Pod if it fails; **Service:** sends traffic only to **Ready** Pods and avoids Pods that are **NotReady**.


# stateful i created fixed ip for mongodb and kafka but i don't crealy get it but i know it have same indetity and storage here we use which docker hub or atlas or how we connect in yaml file i dont know?
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
# StatefulSet confusion:

You said:

> "I created fixed IP for MongoDB and Kafka."

Most likely, what you actually created was a **stable DNS identity**, not a fixed Pod IP.

For example:

```text
mongodb-0.mongodb-service
```

If MongoDB Pod crashes:

```text
Old Pod:
mongodb-0
IP: 10.244.1.5 ❌
```

Kubernetes recreates:

```text
New Pod:
mongodb-0
IP: 10.244.2.8 ✅
```

The **IP changed**.                                                                                                       -->*important notes*

But the identity remains:

mongodb-0                                                                                                                 -->*important notes*

So your application can still connect using the stable DNS name.

That's the point of StatefulSet.

---

# Where does the MongoDB image come from?

When you write:

```yaml
containers:
  - name: mongodb
    image: mongo:8.0
```

Kubernetes does approximately:
Kubernetes
    │
    ▼
Worker Node
    │
    ▼
Container Runtime
    │
    │ Pull image
    ▼
Docker Hub                                                                                                              -->*important notes*
    │
    ▼
mongo:8.0
    │
    ▼
Container
    │
    ▼
MongoDB Pod

So:

```yaml
image: mongo:8.0
```

means:
--------
> "Use the `mongo:8.0` container image from the configured container registry."

By default, `mongo:8.0` is pulled from Docker Hub.

You can also use another registry:
----------------------------------
```yaml
image: quay.io/...
```

or:

```yaml
image: ghcr.io/...
```

or your own private registry:
-----------------------------
```yaml
image: myregistry.com/myteam/mongo:8.0
```

For your Node.js application, you used:

```yaml
image: keerthanalp/user-service:latest
```

Kubernetes pulls that image from Docker Hub because you didn't specify another registry.

---

# Where does storage come from?
--------------------------------
This is a separate concept.

Your MongoDB container has:

```text
MongoDB
    │
    ▼
Data
    │
    ▼
Persistent Volume
    │
    ▼
Actual storage
```

Without persistent storage:

```text
MongoDB Pod
    │
    ▼
Container filesystem
    │
    ▼
Pod deleted
    │
    ▼
Data can be lost
```

With persistent storage:

```text
MongoDB Pod
    │
    ▼
PVC
    │
    ▼
PV
    │
    ▼
Persistent Storage
```

If the Pod moves or is recreated, the storage can be reattached depending on the storage system.

---

----------------------------------------------------------------------------------------------------------------------------
here i got doubt ingress what doing if service handle the network traffic?
----------------------------------------------------------------------------------------------------------------------------

The confusion is because **both Ingress and Service deal with networking, but at different levels**.

### Simple difference:

**Service = routes traffic inside the Kubernetes cluster to Pods.**

**Ingress = routes external HTTP/HTTPS traffic into the cluster to the correct Service.**

Think of your application:

```text
User Browser
     │
     │ http://nginx.local
     ▼
  INGRESS
  "Which Service?"
     │
     ▼
  SERVICE
  "Which Ready Pod?"
     │
     ├──────► Pod 1
     ├──────► Pod 2
     └──────► Pod 3
```

### Example

You have two applications:

```text
nginx-service
    ├── nginx-pod-1
    └── nginx-pod-2

user-service
    ├── user-pod-1
    └── user-pod-2
```

Ingress can route based on the domain:

```text
nginx.local
     ↓
Ingress
     ↓
nginx-service
     ↓
nginx Pods
```

and:

```text
user.local
     ↓
Ingress
     ↓
user-service
     ↓
user Pods
```

So:

> **Ingress decides WHICH Service should receive external HTTP/HTTPS traffic.**

> **Service decides WHICH Ready Pod should receive traffic from that Service.**

### Remember this:

```text
Internet
   ↓
Ingress        → "Which application?"
   ↓
Service        → "Which Pod?"
   ↓
Ready Pod
```

**Ingress is like the reception desk of a building.**
**Service is like the department's internal routing system.**

----------------------------------------------------------------------------------------------------------------------------
WHICH Service should receive external HTTP/HTTPS traffic. means is that microsercice ?
----------------------------------------------------------------------------------------------------------------------------
                    Browser
                       │
                       │ http://myapp.local/users
                       ▼
                   INGRESS
                       │
             ┌─────────┴─────────┐
             │                   │
      /users path          /orders path
             │                   │
             ▼                   ▼
      user-service        order-service
        (Service)            (Service)
             │                   │
        ┌────┴────┐         ┌────┴────┐
        ▼         ▼         ▼         ▼
     User Pod  User Pod  Order Pod  Order Pod

### What happens practically?

User requests:

```text
http://myapp.local/users
```

The flow is:

```text
1. Browser
      ↓
2. DNS / hosts file
      ↓
3. Ingress Controller
      ↓
4. Ingress rule checks "/users"
      ↓
5. Routes to "user-service"
      ↓
6. user-service selects Ready User Pods
      ↓
7. Request reaches User Pod
```

Another request:

```text
http://myapp.local/orders
```

goes:

```text
Ingress
   ↓
"/orders"
   ↓
order-service
   ↓
Ready Order Pod
```

### So what does "which Service" mean?

It means the **logical Kubernetes Service name**, such as:

```yaml
backend:
  service:
    name: user-service
```

Not:

```text
Pod IP: 10.244.1.5
```

The Service itself has a stable **ClusterIP**, for example:
-----------------------------------------------------------
```text
user-service   → 10.96.10.20
order-service  → 10.96.20.30
```

But your Ingress normally routes to the **Service by name**:
-----------------------------------------------------------
```text
Ingress
   │
   ├── /users  → user-service
   │
   └── /orders → order-service
```

Then the Service routes to the appropriate **Ready Pods**:
-----------------------------------------------------------
```text
user-service
   │
   ├── User Pod 1 ✅
   ├── User Pod 2 ✅
   └── User Pod 3 ❌ NotReady
```

So the complete mental model is:

> **Ingress chooses the microservice (Service) based on host/path. Service chooses the eligible Pod endpoints.**

For your upcoming microservices POC, you should build exactly this:

```text
                    nginx.local
                        │
                      Ingress
                   ┌────┴─────┐
                   │          │
                /users      /orders
                   │          │
                   ▼          ▼
             user-service  order-service
                   │          │
              ┌────┴───┐  ┌───┴────┐
              ▼        ▼  ▼        ▼
            User     User Order   Order
            Pod      Pod  Pod     Pod
```

That practical exercise will make the difference between **Ingress vs Service** completely clear.

-------------------------------------------------------------------------------------------------------------------------------------

# /etc/hosts means?
-------------------------------------------------------------------------------------------------------------------------------------

`/etc/hosts` is a **local file on your Mac that manually maps a domain name to an IP address**.

For your Minikube Ingress POC, you might add:

```text
192.168.49.2   nginx.local
```

This means:

```text
When my Mac sees:
nginx.local

Use this IP:
192.168.49.2
```

So when you open:

```text
http://nginx.local
```

your Mac does:

```text
Browser
   ↓
nginx.local
   ↓
/etc/hosts
   ↓
192.168.49.2
   ↓
Minikube
   ↓
Ingress
   ↓
nginx-service
   ↓
nginx-pod
```

### Why do we use it?

Normally, a real domain like:

```text
google.com
```

is resolved using **DNS**.

But `nginx.local` is your **fake/local domain**. It doesn't exist in public DNS, so you manually tell your Mac:

```text
nginx.local → 192.168.49.2
```

using `/etc/hosts`.

### Important distinction

```text
/etc/hosts
    ↓
Your Mac locally resolves the domain

DNS
    ↓
Usually resolves domains for networks/users globally

Ingress
    ↓
Receives the HTTP request and decides which Service gets it
```

So `/etc/hosts` **does not create the Ingress route**. It only helps your Mac find the IP address where the Ingress is reachable.

For your POC:
-------------
```text

/etc/hosts
nginx.local → Ingress IP

Ingress rule
nginx.local → nginx-service

Service
nginx-service → Ready nginx Pods

```

That's the complete chain.

-------------------------------------------------------------------------------------------------------------------------------------