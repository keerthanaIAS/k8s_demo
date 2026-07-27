# Terminal Logs:
minikube start --> first command
if any error you can't start follow this then do your steps:
keerthana@Mac-293 node-k8s-lens-poc % minikube delete
🔥  Deleting "minikube" in docker ...
🔥  Deleting container "minikube" ...
🔥  Removing /Users/keerthana/.minikube/machines/minikube ...
💀  Removed all traces of the "minikube" cluster.
keerthana@Mac-293 node-k8s-lens-poc % minikube start --driver=docker
😄  minikube v1.38.1 on Darwin 26.4.1 (arm64)
✨  Using the docker driver based on user configuration
❗  Starting v1.39.0, minikube will default to "containerd" container runtime. See #21973 for more info.
📌  Using Docker Desktop driver with root privileges
👍  Starting "minikube" primary control-plane node in "minikube" cluster
🚜  Pulling base image v0.0.50 ...
🔥  Creating docker container (CPUs=2, Memory=4000MB) ...
🐳  Preparing Kubernetes v1.35.1 on Docker 29.2.1 ...
🔗  Configuring bridge CNI (Container Networking Interface) ...
🔎  Verifying Kubernetes components...
    ▪ Using image gcr.io/k8s-minikube/storage-provisioner:v5
🌟  Enabled addons: storage-provisioner, default-storageclass

❗  /usr/local/bin/kubectl is version 1.32.2, which may haveincompatibilities with Kubernetes 1.35.1.
    ▪ Want kubectl v1.35.1? Try 'minikube kubectl -- get pods -A'
🏄  Done! kubectl is now configured to use "minikube" cluster and "default" namespace by default
keerthana@Mac-293 node-k8s-lens-poc % minikube status
minikube
type: Control Plane
host: Running
kubelet: Running
apiserver: Running
kubeconfig: Configured

keerthana@Mac-293 node-k8s-lens-poc % 
keerthana@Mac-287 node-k8s-lens-poc % eval $(minikube docker-env)
keerthana@Mac-287 node-k8s-lens-poc % docker build -t user-service:1.0 .
[+] Building 13.3s (11/11) FINISHED                                                                              docker:default
 => [internal] load build definition from Dockerfile                                                                       0.0s
 => => transferring dockerfile: 155B                                                                                       0.0s
 => [internal] load metadata for docker.io/library/node:22-alpine                                                          3.7s
 => [auth] library/node:pull token for registry-1.docker.io                                                                0.0s
 => [internal] load .dockerignore                                                                                          0.0s
 => => transferring context: 2B                                                                                            0.0s
 => [1/5] FROM docker.io/library/node:22-alpine@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2    6.2s
 => => resolve docker.io/library/node:22-alpine@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2    0.0s
 => => sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2 6.41kB / 6.41kB                             0.0s
 => => sha256:d51cff3fa44ab8a368ae8708ae974480165be1b699b19527b7c0d2523433b271 1.72kB / 1.72kB                             0.0s
 => => sha256:262aa4f3ae295c90861c34b4319f74feda309a2342e0439d4017be78427b97c0 6.54kB / 6.54kB                             0.0s
 => => sha256:5de55e5ef9c033997441461efe7ba23a986db059c0bb78b38f84ee0d72b99167 4.18MB / 4.18MB                             1.0s
 => => sha256:3a9ba6859cb186d0e1706735d48c991b4572642d864d4e9081f29c4e302ab94f 52.67MB / 52.67MB                           4.8s
 => => sha256:1dd18119844762295970237ddd5b32ac891f32e68514233ae290e22faf25922b 1.26MB / 1.26MB                             1.1s
 => => extracting sha256:5de55e5ef9c033997441461efe7ba23a986db059c0bb78b38f84ee0d72b99167                                  0.1s
 => => sha256:4749b9b026c919018d0c11fe592b757dd1a928af6da1bfbbb19a02f445787456 443B / 443B                                 1.3s
 => => extracting sha256:3a9ba6859cb186d0e1706735d48c991b4572642d864d4e9081f29c4e302ab94f                                  1.3s
 => => extracting sha256:1dd18119844762295970237ddd5b32ac891f32e68514233ae290e22faf25922b                                  0.0s
 => => extracting sha256:4749b9b026c919018d0c11fe592b757dd1a928af6da1bfbbb19a02f445787456                                  0.0s
 => [internal] load build context                                                                                          0.0s
 => => transferring context: 1.40kB                                                                                        0.0s
 => [2/5] WORKDIR /app                                                                                                     0.1s
 => [3/5] COPY package*.json ./                                                                                            0.0s
 => [4/5] RUN npm install                                                                                                  2.9s
 => [5/5] COPY . .                                                                                                         0.0s
 => exporting to image                                                                                                     0.2s
 => => exporting layers                                                                                                    0.1s
 => => writing image sha256:0a5ecee5f037f5191cd763634b1432cb65948a8f9c5c72c851d1c5c757d90b90                               0.0s
 => => naming to docker.io/library/user-service:1.0                                                                        0.0s

View build details: docker-desktop://dashboard/build/default/default/xyajuyiol2pr2wxl6s790xk3x
keerthana@Mac-287 node-k8s-lens-poc % docker images
REPOSITORY                                TAG       IMAGE ID       CREATED         SIZE
user-service                              1.0       0a5ecee5f037   8 seconds ago   170MB
registry.k8s.io/kube-apiserver            v1.35.1   7459ea001763   5 months ago    83.9MB
registry.k8s.io/kube-controller-manager   v1.35.1   464c974e702e   5 months ago    71.1MB
registry.k8s.io/kube-scheduler            v1.35.1   4cad4f996631   5 months ago    48.7MB
registry.k8s.io/kube-proxy                v1.35.1   2d611d040292   5 months ago    72.5MB
registry.k8s.io/etcd                      3.6.6-0   271e49a0ebc5   8 months ago    59.8MB
registry.k8s.io/coredns/coredns           v1.13.1   e08f4d9d2e6e   9 months ago    73.4MB
registry.k8s.io/pause                     3.10.1    d7b100cd9a77   13 months ago   514kB
gcr.io/k8s-minikube/storage-provisioner   v5        ba04bb24b957   5 years ago     29MB
                                                                                                                                
keerthana@Mac-287 node-k8s-lens-poc % 
keerthana@Mac-287 node-k8s-lens-poc % kubectl apply -f k8s/deployment.yaml
deployment.apps/user-service created
keerthana@Mac-287 node-k8s-lens-poc % kubectl apply -f k8s/service.yaml
service/user-service created
keerthana@Mac-287 node-k8s-lens-poc % kubectl get pods
NAME                            READY   STATUS    RESTARTS   AGE
user-service-5c9c895554-gl4lr   1/1     Running   0          9s
user-service-5c9c895554-rjwdc   1/1     Running   0          9s
keerthana@Mac-287 node-k8s-lens-poc % kubectl get deployment
NAME           READY   UP-TO-DATE   AVAILABLE   AGE
user-service   2/2     2            2           15s
keerthana@Mac-287 node-k8s-lens-poc % kubectl get service
NAME           TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
kubernetes     ClusterIP   10.96.0.1       <none>        443/TCP          94s
user-service   NodePort    10.96.140.249   <none>        3000:30080/TCP   15s
keerthana@Mac-287 node-k8s-lens-poc % minikube service user-service
┌───────────┬──────────────┬─────────────┬───────────────────────────┐
│ NAMESPACE │     NAME     │ TARGET PORT │            URL            │
├───────────┼──────────────┼─────────────┼───────────────────────────┤
│ default   │ user-service │ 3000        │ http://192.168.49.2:30080 │
└───────────┴──────────────┴─────────────┴───────────────────────────┘
🔗  Starting tunnel for service user-service.
┌───────────┬──────────────┬─────────────┬────────────────────────┐
│ NAMESPACE │     NAME     │ TARGET PORT │          URL           │
├───────────┼──────────────┼─────────────┼────────────────────────┤
│ default   │ user-service │             │ http://127.0.0.1:51097 │
└───────────┴──────────────┴─────────────┴────────────────────────┘
🎉  Opening service default/user-service in default browser...
❗  Because you are using a Docker driver on darwin, the terminal needs to be open to run it.


## Explaination:
*eval $(minikube docker-env) if i use this i dont have to run the docker?*

**you don't need to manually start a separate Docker container for your Node.js app**, but there is an important distinction.

* What this command does
-----------------------------
```bash
eval $(minikube docker-env)
```

It tells your **terminal**:

> "When I run `docker build` or `docker images`, use the Docker environment inside Minikube."

Then you build your image:
-----------------------------
```bash
docker build -t user-service:1.0 .
```

The image is built **inside Minikube's Docker environment**.

Then Kubernetes can directly use it:

```yaml
image: user-service:1.0
imagePullPolicy: Never
```

* Your flow becomes
-----------------------------
```text
You
 │
 │ docker build
 ▼
Minikube's Docker Environment
 │
 │ creates
 ▼
user-service:1.0
 │
 │ Kubernetes Deployment
 ▼
Pod
 │
 └── Node.js Container
```

* Important: Docker Desktop                                                                                    -->*important notes*
-----------------------------
If you are using **Minikube with the Docker driver**, Docker Desktop still needs to be **running**, because Minikube itself uses Docker as its container runtime.

So:

```text
Docker Desktop
     │
     └── Minikube
           │
           └── Kubernetes
                 │
                 └── Node.js Pod
```

You **don't need to separately run**:
--------------------------------------------------
```bash
docker run user-service:1.0
```

Kubernetes will create and run the container for you when you deploy:
-----------------------------------------------------------------------------
```bash
kubectl apply -f k8s/deployment.yaml
```

So the short answer is:
----------------------------------------------------------
> **`eval $(minikube docker-env)` means you don't need to push the image to Docker Hub. But Docker Desktop still needs to be running if your Minikube is using the Docker driver.**


### yes minikube is ready i can see now how its working i dont get it Node.js + Kubernetes + Minikube + Lens.

Let's make it **very simple**. Right now, you have **Minikube running** and **Lens connected to it**. But you have **not deployed your Node.js application yet**.

* Think of each tool as having one job:
----------------------------------------------------
```text
1. Node.js
   → Your application code

2. Docker
   → Packages your Node.js application into a container image

3. Minikube
   → Runs a local Kubernetes cluster on your Mac

4. Kubernetes
   → Manages your application inside that cluster

5. Lens
   → GUI to see and manage your Kubernetes cluster
```

* Your complete flow
-----------------------------
```text
             YOU WRITE
                 │
                 ▼
       Node.js Microservice
          app.js
             │
             │ docker build
             ▼
        Docker Image
       user-service:1.0
             │
             │ deploy
             ▼
        Kubernetes
             │
             │ running inside
             ▼
          Minikube
             │
             ├── Node
             │    │
             │    └── Pod
             │         │
             │         └── Node.js Container
             │
             ▼
           Lens
      (You can see everything)
```

* What completed NOW
-----------------------------
```text
Mac
 │
 ├── Minikube ✅
 │      │
 │      └── Kubernetes Cluster ✅
 │
 └── Lens ✅
        │
        └── Connected to Minikube ✅
```

If you open **Lens**, you can currently see the **Minikube Kubernetes cluster**.

But there is **no Node.js application inside Kubernetes yet**.

* What we will do NEXT:-
-----------------------------
We will create a very simple Node.js microservice:

```text
Node.js
   │
   ▼
app.js
   │
   ▼
Docker Image
   │
   ▼
Deploy to Kubernetes
   │
   ▼
Minikube
   │
   ├── Pod 1 → Node.js app
   └── Pod 2 → Node.js app
             │
             ▼
           Service
             │
             ▼
           Browser
```

Then you open **Lens**, and you will visually see:
----------------------------------------------------
```text
Workloads
   │
   ├── Deployment
   │      └── user-service
   │
   ├── ReplicaSet
   │      └── user-service-xxxxx
   │
   └── Pods
          ├── user-service-xxxxx
          └── user-service-yyyyy
```

So, **Lens doesn't run your Node.js application**.

**Minikube runs the Kubernetes cluster. Kubernetes manages your Node.js application. Lens lets you see what Kubernetes is doing.**                                                                                                                      -->*important notes*

The next step is: **create the Node.js microservice → create Docker image → deploy it to your Minikube → watch it appear in Lens.**

#### ✅ In 3 Bullet Points:                                                                                             -->*important notes*

1. **Ingress** = A configuration file that says **"this domain goes to this service"**
2. **NGINX Ingress Controller** = The actual program that **reads that config and handles traffic**
3. **You need BOTH**: Without NGINX, your Ingress rules are just useless text files. Without Ingress, NGINX doesn't know where to send traffic.

* Simple words:
- Ingress will say where the req have to go.
- Nginx will actually move the req to that service.

User types: user-service.local
              │
              ▼
    ┌─────────────────────┐
    │   NGINX (Doer)      │  ← "I got a request!"
    │                     │
    │  Checks the rules:  │
    │  ┌────────────────┐ │
    │  │ INGRESS (Rule) │ │  ← "user-service.local goes to user-service"
    │  └────────────────┘ │
    │                     │
    │  "Okay, moving it!" │  ← Actually forwards the request
    └─────────────────────┘
              │
              ▼
       user-service
       (Your app)

* Why do we need both?
       Because they have different responsibilities.
Imagine you have a receptionist in an office.
- Ingress
= Written instructions
"If customer asks for User Service,
send them to User Service."
- NGINX
= Receptionist
Actually receives the customer
and sends them to the right department.

* In Kubernetes:
Browser
   │
   │ HTTP request
   ▼
NGINX Ingress Controller
   │
   │ Reads Ingress rules
   ▼
Ingress Rule
   │
   │ user-service.local
   ▼
user-service Service
   │
   ├── Pod 1
   └── Pod 2

* Step 1 — Enable NGINX Ingress in Minikube:
-------------------------------------------
minikube addons enable ingress

* Then we check:
-----------------
kubectl get pods -n ingress-nginx

* Step 3 — Apply the Ingress
-------------------------------
kubectl apply -f k8s/ingress.yaml

Then:
kubectl get ingress

Lens will show the Ingress under in lens dashboard:
Network
   ↓
Ingresses

##### Terminal Logs:
keerthana@Mac-287 node-k8s-lens-poc % minikube addons enable ingress
💡  ingress is an addon maintained by Kubernetes. For any concerns contact minikube on GitHub.
You can view the list of minikube maintainers at: https://github.com/kubernetes/minikube/blob/master/OWNERS
💡  After the addon is enabled, please run "minikube tunnel" and your ingress resources would be available at "127.0.0.1"
    ▪ Using image registry.k8s.io/ingress-nginx/kube-webhook-certgen:v1.6.7
    ▪ Using image registry.k8s.io/ingress-nginx/controller:v1.14.3
    ▪ Using image registry.k8s.io/ingress-nginx/kube-webhook-certgen:v1.6.7
🔎  Verifying ingress addon...
🌟  The 'ingress' addon is enabled
keerthana@Mac-287 node-k8s-lens-poc % 
keerthana@Mac-287 node-k8s-lens-poc % kubectl get pods -n ingress-nginx
NAME                                        READY   STATUS              RESTARTS   AGE
ingress-nginx-admission-create-npthd        0/1     Completed           0          85s
ingress-nginx-admission-patch-vrfpk         0/1     Completed           1          85s
ingress-nginx-controller-596f8778bc-2vqvc   0/1     ContainerCreating   0          85s
keerthana@Mac-287 node-k8s-lens-poc % kubectl get pods -n ingress-nginx
NAME                                        READY   STATUS      RESTARTS   AGE
ingress-nginx-admission-create-npthd        0/1     Completed   0          118s
ingress-nginx-admission-patch-vrfpk         0/1     Completed   1          118s
ingress-nginx-controller-596f8778bc-2vqvc   1/1     Running     0          118s
keerthana@Mac-287 node-k8s-lens-poc % kubectl apply -f k8s/ingress.yaml
ingress.networking.k8s.io/user-service-ingress created
keerthana@Mac-287 node-k8s-lens-poc % kubectl get ingress
NAME                   CLASS   HOSTS                ADDRESS   PORTS   AGE
user-service-ingress   nginx   user-service.local             80      6s
keerthana@Mac-287 node-k8s-lens-poc % minikube ip
192.168.49.2
keerthana@Mac-287 node-k8s-lens-poc % sudo nano /etc/hosts
Password:
keerthana@Mac-287 node-k8s-lens-poc % 

*** sudo nano /etc/hosts ***
steps:
------
Add this line
At the bottom, add:
192.168.49.2 user-service.local

Save the file:-
Inside nano:
Ctrl + O
Press Enter.
Then:
Ctrl + X

keerthana@Mac-287 node-k8s-lens-poc % grep user-service.local /etc/hosts
192.168.49.2 user-service.local
keerthana@Mac-287 node-k8s-lens-poc % ping -c 1 user-service.local
PING user-service.local (192.168.49.2): 56 data bytes

--- user-service.local ping statistics ---
1 packets transmitted, 0 packets received, 100.0% packet loss
keerthana@Mac-287 node-k8s-lens-poc % 

*after i change this 127.0.0.1 user-service.local its working why ? without running minikube tunnel or anything*?
keerthana@Mac-293 node-k8s-lens-poc % sudo nano /etc/hosts
Password:

Change:
192.168.49.2 user-service.local
to:
127.0.0.1 user-service.local
Save:
Ctrl + O
Enter
Ctrl + X

* Your flow is:
```text
Browser
   │
   │ http://user-service.local
   ▼
/etc/hosts
   │
   │ 127.0.0.1 user-service.local
   ▼
Your Mac (localhost)
   │
   ▼
Minikube's Ingress exposure
   │
   ▼
NGINX Ingress Controller
   │
   ▼
Ingress Rule
   │
   │ user-service.local → user-service
   ▼
Service
   │
   ├── Pod 1
   └── Pod 2
```

* Why did `192.168.49.2` fail?
You had:
-----------------------
```text
192.168.49.2 user-service.local
```
That IP is the **Minikube internal Docker network IP**.

Your Mac tried:
-----------------------
```text
Mac
  │
  │ HTTP request
  ▼
192.168.49.2:80
  │
  X
  │
  ❌ Mac couldn't reach that Docker network IP
```
That's why you got:
-----------------------
```text
Operation timed out
```
* Why does `127.0.0.1` work?
Now you have:
-----------------------
```text
127.0.0.1 user-service.local
```
`127.0.0.1` means:
-----------------------
> "This computer itself."

So your browser sends the request to your Mac's localhost, where your Minikube/NGINX setup is exposed.

The important thing is:
-----------------------
> **`/etc/hosts` only translates the domain name. It does not route traffic by itself.**

It changes:
----------------
```text
user-service.local
        ↓
127.0.0.1
```
Then something on your machine/Minikube environment is handling the request on localhost.

* Your final working setup
------------------------------
```text
user-service.local
        │
        │ /etc/hosts
        ▼
127.0.0.1
        │
        ▼
NGINX Ingress Controller
        │
        ▼
Ingress
        │
        ▼
user-service Service
        │
        ├── user-service Pod 1
        │
        └── user-service Pod 2
```
You now have the full flow working with **Node.js + Docker + Kubernetes + Minikube + NGINX Ingress + Lens**.

