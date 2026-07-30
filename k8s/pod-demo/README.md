The first thing to understand is this:

> **Normally, we don't create Pods directly in production.**
> we create a **Deployment**, and the Deployment creates and manages Pods.

But for learning Kubernetes, we create a Pod directly once.

---

# 1. Create your first Pod

Create a file:

```bash
mkdir -p k8s/pod-demo
cd k8s/pod-demo
```

Create:

```bash
nano pod.yaml
```

Put this:

```yaml
apiVersion: v1
kind: Pod

metadata:
  name: nginx-pod

spec:
  containers:
    - name: nginx
      image: nginx:latest
      ports:
        - containerPort: 80
```

Save it.

Now create the Pod:

```bash
kubectl apply -f pod.yaml
```

You should get:

```text
pod/nginx-pod created
```

---

# 2. Check the Pod

```bash
kubectl get pods
```

Expected:

```text
NAME         READY   STATUS    RESTARTS   AGE
nginx-pod    1/1     Running   0          10s
```

This is your first Pod.

The flow is:

```text
pod.yaml
   │
   │ kubectl apply
   ▼
API Server
   │
   ▼
etcd
   │
   ▼
Scheduler
   │
   ▼
Node
   │
   ▼
kubelet
   │
   ▼
Container Runtime
   │
   ▼
nginx container
   │
   ▼
nginx-pod Running
```

This is the basic Kubernetes flow you have been learning.

---

# 3. Get more information about the Pod

```bash
kubectl get pod nginx-pod -o wide
```

You will see:

```text
NAME         READY   STATUS    IP            NODE
nginx-pod    1/1     Running   10.244.x.x    minikube
```

This tells you:

* Pod IP
* Node where the Pod is running
* Pod status

---

# 4. Describe the Pod

This is one of the **most important commands for troubleshooting**:

```bash
kubectl describe pod nginx-pod
```

Look at:

```text
Events:
```

This tells you what Kubernetes did.

For example:

```text
Scheduled
Pulled
Created
Started
```

The typical lifecycle is:

```text
Pod created
    ↓
Scheduler selects node
    ↓
Pod scheduled
    ↓
kubelet sees Pod
    ↓
Image pulled
    ↓
Container created
    ↓
Container started
    ↓
Pod Running
```

When a Pod fails, `describe` is one of the first commands you should use.

---

# 5. See Pod logs

```bash
kubectl logs nginx-pod
```

For a real application:

```bash
kubectl logs user-service-xxxxx -n microservices-poc
```

If the Pod has multiple containers:

```bash
kubectl logs nginx-pod -c nginx
```

To follow logs live:

```bash
kubectl logs -f nginx-pod
```

---

# 6. Enter inside a Pod

This is extremely important for debugging.

```bash
kubectl exec -it nginx-pod -- /bin/bash
```

If Bash doesn't exist:

```bash
kubectl exec -it nginx-pod -- /bin/sh
```

Now you're inside the container.

Try:

```bash
hostname
```

```bash
cat /etc/os-release
```

```bash
ls
```

Exit:

```bash
exit
```

---

# 7. Delete the Pod

```bash
kubectl delete pod nginx-pod
```

Check:

```bash
kubectl get pods
```

You will see:

```text
No resources found in default namespace.
```

Why?

Because you created the Pod **directly**.

There is no Deployment managing it.

This is a very important concept.

---

# 8. Create a Pod using `kubectl run`

You don't always need a YAML file.

You can do:

```bash
kubectl run nginx-pod \
  --image=nginx:latest
```

Check:

```bash
kubectl get pods
```

Describe:

```bash
kubectl describe pod nginx-pod
```

Delete:

```bash
kubectl delete pod nginx-pod
```

This is useful for quick testing.

---

# 9. Create a Pod in your namespace

Your application uses:

```text
microservices-poc
```

So you can create:

```bash
kubectl run test-pod \
  --image=nginx:latest \
  -n microservices-poc
```

Check:

```bash
kubectl get pods -n microservices-poc
```

Delete:

```bash
kubectl delete pod test-pod -n microservices-poc
```

---

# 10. The most important `kubectl` commands

You should memorize these first.

### Cluster

```bash
kubectl cluster-info
```

```bash
kubectl get nodes
```

```bash
kubectl get nodes -o wide
```

```bash
kubectl describe node minikube
```

---

### Pods

```bash
kubectl get pods
```

```bash
kubectl get pods -o wide
```

```bash
kubectl get pods -A
```

```bash
kubectl get pods -n microservices-poc
```

```bash
kubectl get pods -n microservices-poc -o wide
```

```bash
kubectl describe pod POD_NAME -n microservices-poc
```

```bash
kubectl logs POD_NAME -n microservices-poc
```

```bash
kubectl logs -f POD_NAME -n microservices-poc
```

```bash
kubectl exec -it POD_NAME -n microservices-poc -- /bin/sh
```

```bash
kubectl delete pod POD_NAME -n microservices-poc
```

---

### Deployments

```bash
kubectl get deployments -n microservices-poc
```

```bash
kubectl describe deployment user-service -n microservices-poc
```

```bash
kubectl scale deployment user-service \
  --replicas=5 \
  -n microservices-poc
```

```bash
kubectl rollout status deployment/user-service \
  -n microservices-poc
```

```bash
kubectl rollout history deployment/user-service \
  -n microservices-poc
```

```bash
kubectl rollout undo deployment/user-service \
  -n microservices-poc
```

---

### Services

```bash
kubectl get services -n microservices-poc
```

or:

```bash
kubectl get svc -n microservices-poc
```

```bash
kubectl describe svc user-service \
  -n microservices-poc
```

```bash
kubectl get endpoints -n microservices-poc
```

Modern Kubernetes:

```bash
kubectl get endpointslices \
  -n microservices-poc
```

---

### Apply and delete YAML

```bash
kubectl apply -f file.yaml
```

```bash
kubectl apply -f directory/
```

```bash
kubectl delete -f file.yaml
```

```bash
kubectl delete -f directory/
```

---

### Namespace

```bash
kubectl get namespaces
```

```bash
kubectl get pods -A
```

```bash
kubectl get pods -n microservices-poc
```

---

# 11. Very important: Pod vs Deployment

You should now understand this difference.

### Direct Pod

```text
You
 │
 │ kubectl apply pod.yaml
 ▼
Pod
 │
 ▼
Container
```

If the Pod dies:

```text
Pod dies
   ↓
Nobody recreates it
```

---

### Deployment

```text
You
 │
 │ kubectl apply deployment.yaml
 ▼
Deployment
 │
 ▼
ReplicaSet
 │
 ▼
Pods
 │
 ▼
Containers
```

If one Pod dies:

```text
Pod 1 💥
   ↓
ReplicaSet detects
   ↓
Creates replacement Pod
   ↓
New Pod Running
```

If you have:

```yaml
replicas: 3
```

Kubernetes maintains:

```text
Pod 1  ✅
Pod 2  ✅
Pod 3  ✅
```

If Pod 2 crashes:

```text
Pod 1  ✅
Pod 2  💥
Pod 3  ✅
          ↓
ReplicaSet
          ↓
New Pod 4  ✅
```

That's why your actual applications use **Deployment**, not standalone Pods.

---

# 12. Your practical exercise

I recommend you do this exact exercise now.

### Part A — Direct Pod

```bash
kubectl run test-pod --image=nginx:latest
```

Then:

```bash
kubectl get pods
```

Then:

```bash
kubectl get pods -o wide
```

Then:

```bash
kubectl describe pod test-pod
```

Then:

```bash
kubectl logs test-pod
```

Then:

```bash
kubectl exec -it test-pod -- /bin/sh
```

Inside:

```bash
hostname
```

Then:

```bash
exit
```

Finally:

```bash
kubectl delete pod test-pod
```

---

### Part B — See what happens with Deployment

After that, we should create:

```text
Deployment
    │
    ├── Pod 1
    ├── Pod 2
    └── Pod 3
```

Then manually delete one Pod:

```bash
kubectl delete pod <pod-name>
```

And watch Kubernetes automatically create a replacement:

```text
Pod 1 ✅
Pod 2 💥
Pod 3 ✅
       ↓
ReplicaSet
       ↓
Pod 4 created
       ↓
Pod 4 ✅
```

**That practical exercise is the correct next step for you.** Once you understand this, we can move in order to **Deployment → ReplicaSet → Service → HPA → multi-node scheduling → node failure → Pod rescheduling → StatefulSet → MongoDB/Kafka failover**.
