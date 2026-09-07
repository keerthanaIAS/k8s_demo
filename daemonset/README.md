---
Deployment = desired number of Pods
DaemonSet = desired Pod on every node
---

|                | Deployment         | DaemonSet                     |
| -------------- | ------------------ | ----------------------------- |
| Main idea      | **How many Pods?** | **One Pod per node**          |
| `replicas`     | ✅ Yes              | ❌ No                         |
| New node added | Nothing special    | ✅ Pod automatically created   |
| Typical use    | Application        | Logging/monitoring/node agent |


Practical example with **your current Minikube cluster** for *third point*:
--------------------------------------------------------------------------
Right now you have:

```text
minikube
   └── node-agent Pod

minikube-m02
   └── node-agent Pod
```

Now you add a third node:

```bash
minikube node add
```

Kubernetes sees:

```text
minikube        → node-agent Pod
minikube-m02    → node-agent Pod
minikube-m03    → ??? 
```

You **do NOT run `kubectl apply` again**.

DaemonSet automatically notices the new node and creates:

```text
minikube-m03
   └── node-agent Pod  ← automatically created
```

Check it:

```bash
kubectl get pods -l app=node-agent -o wide
```

You should see **3 Pods**, one on each node.

### Compare with Deployment

If you have:

```yaml
replicas: 2
```

and add a new node:

```text
Node 1 → Pod
Node 2 → Pod
Node 3 → No Pod
```

Deployment says: **"I need 2 Pods."**

DaemonSet says: **"I need 1 Pod on every node."**

That's the practical difference.



Easy way to remember:
--------------------
|                | Deployment         | DaemonSet                     |
| -------------- | ------------------ | ----------------------------- |
| Main idea      | **How many Pods?** | **One Pod per node**          |
| `replicas`     | ✅ Yes              | ❌ No                          |
| New node added | Nothing special    | ✅ Pod automatically created   |
| Typical use    | Application        | Logging/monitoring/node agent |


# Delete a DaemonSet Pod:

keerthana@Keerthanas-MacBook-Air daemonset % kubectl get pods -l app=node-agent
NAME               READY   STATUS    RESTARTS      AGE
node-agent-7vqxh   1/1     Running   3 (95s ago)   4h26m
node-agent-f9dml   1/1     Running   2 (69m ago)   4h8m
node-agent-sfvml   1/1     Running   3 (94s ago)   4h26m
keerthana@Keerthanas-MacBook-Air daemonset % kubectl delete pod node-agent-sfvml
pod "node-agent-sfvml" deleted
keerthana@Keerthanas-MacBook-Air daemonset % 

keerthana@Keerthanas-MacBook-Air daemonset % kubectl get pods -l app=node-agent -o wide
NAME               READY   STATUS        RESTARTS       AGE     IP           NODE           NOMINATED NODE   READINESS GATES
node-agent-7vqxh   1/1     Running       3 (117s ago)   4h27m   10.244.0.3   minikube       <none>           <none>
node-agent-f9dml   1/1     Running       2 (69m ago)    4h9m    10.244.2.2   minikube-m03   <none>           <none>
node-agent-sfvml   1/1     Terminating   3 (116s ago)   4h27m   10.244.1.2   minikube-m02   <none>           <none>
keerthana@Keerthanas-MacBook-Air daemonset % kubectl get pods -l app=node-agent -o wide
NAME               READY   STATUS        RESTARTS       AGE     IP           NODE           NOMINATED NODE   READINESS GATES
node-agent-7vqxh   1/1     Running       3 (2m5s ago)   4h27m   10.244.0.3   minikube       <none>           <none>
node-agent-f9dml   1/1     Running       2 (69m ago)    4h9m    10.244.2.2   minikube-m03   <none>           <none>
node-agent-sfvml   1/1     Terminating   3 (2m4s ago)   4h27m   10.244.1.2   minikube-m02   <none>           <none>
keerthana@Keerthanas-MacBook-Air daemonset % kubectl get pods -l app=node-agent -o wide -w
NAME               READY   STATUS        RESTARTS        AGE     IP           NODE           NOMINATED NODE   READINESS GATES
node-agent-7vqxh   1/1     Running       3 (2m11s ago)   4h27m   10.244.0.3   minikube       <none>           <none>
node-agent-f9dml   1/1     Running       2 (69m ago)     4h9m    10.244.2.2   minikube-m03   <none>           <none>
node-agent-sfvml   1/1     Terminating   3 (2m10s ago)   4h27m   10.244.1.2   minikube-m02   <none>           <none>
node-agent-sfvml   0/1     Error         3 (2m18s ago)   4h27m   10.244.1.2   minikube-m02   <none>           <none>
node-agent-hbnzr   0/1     Pending       0               0s      <none>       <none>         <none>           <none>
node-agent-hbnzr   0/1     Pending       0               0s      <none>       minikube-m02   <none>           <none>
node-agent-hbnzr   0/1     ContainerCreating   0               0s      <none>       minikube-m02   <none>           <none>
node-agent-sfvml   0/1     Error               3 (2m18s ago)   4h27m   10.244.1.2   minikube-m02   <none>           <none>
node-agent-sfvml   0/1     Error               3 (2m18s ago)   4h27m   10.244.1.2   minikube-m02   <none>           <none>
node-agent-hbnzr   1/1     Running             0               1s      10.244.1.3   minikube-m02   <none>           <none>

# Delete a Node:

keerthana@Keerthanas-MacBook-Air daemonset % minikube node delete minikube-m03
🔥  Deleting node minikube-m03 from cluster minikube
✋  Stopping node "minikube-m03"  ...
🛑  Powering off "minikube-m03" via SSH ...
🔥  Deleting "minikube-m03" in docker ...
💀  Node minikube-m03 was successfully deleted.
keerthana@Keerthanas-MacBook-Air daemonset % kubectl get nodes
NAME           STATUS   ROLES           AGE     VERSION
minikube       Ready    control-plane   4h30m   v1.35.1
minikube-m02   Ready    <none>          4h30m   v1.35.1

keerthana@Keerthanas-MacBook-Air daemonset % kubectl get pods -l app=node-agent -o wide -w
NAME               READY   STATUS    RESTARTS        AGE     IP           NODE           NOMINATED NODE   READINESS GATES
node-agent-7vqxh   1/1     Running   3 (3m48s ago)   4h28m   10.244.0.3   minikube       <none>           <none>
node-agent-f9dml   1/1     Running   2 (71m ago)     4h11m   10.244.2.2   minikube-m03   <none>           <none>
node-agent-hbnzr   1/1     Running   0               89s     10.244.1.3   minikube-m02   <none>           <none>
node-agent-f9dml   1/1     Failed    2 (72m ago)     4h12m   10.244.2.2   minikube-m03   <none>           <none>
node-agent-f9dml   1/1     Failed    2 (72m ago)     4h12m   10.244.2.2   minikube-m03   <none>           <none>
node-agent-f9dml   1/1     Failed    2 (72m ago)     4h12m   10.244.2.2

# Node-level workload:

keerthana@Keerthanas-MacBook-Air daemonset % kubectl get daemonset node-agent
NAME         DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE
node-agent   2         2         2       2            2           <none>          4h44m
keerthana@Keerthanas-MacBook-Air daemonset % kubectl get nodes
NAME           STATUS   ROLES           AGE     VERSION
minikube       Ready    control-plane   4h46m   v1.35.1
minikube-m02   Ready    <none>          4h45m   v1.35.1
keerthana@Keerthanas-MacBook-Air daemonset % kubectl get pods -l app=node-agent -o wide
NAME               READY   STATUS    RESTARTS   AGE   IP           NODE           NOMINATED NODE   READINESS GATES
node-agent-dlhtl   1/1     Running   0          12m   10.244.0.4   minikube       <none>           <none>
node-agent-vntcl   1/1     Running   0          13m   10.244.1.4   minikube-m02   <none>           <none>
keerthana@Keerthanas-MacBook-Air daemonset % 

