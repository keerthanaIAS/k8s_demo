# TAINTS AND TOLERATIONS:

* Check existing taints:

keerthana@Mac-169 k8s_demo % kubectl describe node minikube | grep -i taint
Taints:             <none>

- This for - We need to know whether Minikube already has a taint on the control-plane node.
- So right now, a normal Pod is allowed to schedule onto minikube.

* Add a NoSchedule taint:

- We'll tell the node:
"Do not schedule Pods here unless they tolerate this taint."

keerthana@Mac-169 k8s_demo % kubectl taint nodes minikube dedicated=testing:NoSchedule
node/minikube tainted

* Verify:

keerthana@Mac-169 k8s_demo % kubectl describe node minikube | grep -i taint
Taints:             dedicated=testing:NoSchedule
keerthana@Mac-169 k8s_demo % 

- the taint is actually on the node.

minikube
└── Taint: dedicated=testing:NoSchedule

Interpret it literally:
------------------------
dedicated=testing → the taint key/value
NoSchedule → Kubernetes will not schedule a new Pod onto this node unless the Pod has a matching toleration.

* Prove it:

Now create a completely normal Pod without any toleration:

keerthana@Mac-169 k8s_demo % kubectl run normal-pod --image=nginx
pod/normal-pod created
keerthana@Mac-169 k8s_demo % 

* Then check:

keerthana@Mac-169 k8s_demo % kubectl get pod normal-pod
NAME         READY   STATUS    RESTARTS   AGE
normal-pod   0/1     Pending   0          19s
keerthana@Mac-169 k8s_demo % 

- because your only node has the taint and the Pod doesn't tolerate it.

* Then run:

keerthana@Mac-169 k8s_demo % kubectl describe pod normal-pod
Name:             normal-pod
Namespace:        default
Priority:         0
Service Account:  default
Node:             <none>
Labels:           run=normal-pod
Annotations:      <none>
Status:           Pending
IP:               
IPs:              <none>
Containers:
  normal-pod:
    Image:        nginx
    Port:         <none>
    Host Port:    <none>
    Environment:  <none>
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from kube-api-access-mr744 (ro)
Conditions:
  Type           Status
  PodScheduled   False 
Volumes:
  kube-api-access-mr744:
    Type:                    Projected (a volume that contains injected data from multiple sources)
    TokenExpirationSeconds:  3607
    ConfigMapName:           kube-root-ca.crt
    ConfigMapOptional:       <nil>
    DownwardAPI:             true
QoS Class:                   BestEffort
Node-Selectors:              <none>
Tolerations:                 node.kubernetes.io/not-ready:NoExecute op=Exists for 300s
                             node.kubernetes.io/unreachable:NoExecute op=Exists for 300s
Events:
  Type     Reason            Age   From               Message
  ----     ------            ----  ----               -------
  Warning  FailedScheduling  72s   default-scheduler  0/1 nodes are available: 1 node(s) had untolerated taint(s). no new claims to deallocate, preemption: 0/1 nodes are available: 1 Preemption is not helpful for scheduling.
keerthana@Mac-169 k8s_demo % 

* Your Pod is:

normal-pod   Pending

And the key line is:
---------------------
0/1 nodes are available: 1 node(s) had untolerated taint(s)

What happened?
--------------
You have:

Node: minikube
Taint: dedicated=testing:NoSchedule

Then you created:
-----------------
Pod: normal-pod
Toleration: ❌ dedicated=testing

So the scheduler evaluated:
---------------------------
                Scheduler
                    │
                    ▼
        Can normal-pod run on minikube?
                    │
              Node has taint
                    │
        Pod doesn't tolerate it
                    │
                    ▼
                  ❌ NO
                    │
                    ▼
              Pod = Pending

Notice this important detail from your output:
---------------------------------------------
Node: <none>
PodScheduled: False

The Pod has not been assigned to the node at all. It isn't running and then being rejected. The scheduler prevents the placement.

Also, Kubernetes automatically gave the Pod these tolerations:
--------------------------------------------------------------
     node.kubernetes.io/not-ready:NoExecute
     node.kubernetes.io/unreachable:NoExecute

Those are unrelated to your dedicated=testing:NoSchedule taint. That's why your Pod still cannot schedule.\

* Give the Pod permission:

keerthana@Mac-169 k8s % kubectl apply -f toleration-pod.yaml
pod/toleration-pod created
keerthana@Mac-169 k8s % kubectl get pod toleration-pod -o wide
NAME             READY   STATUS    RESTARTS   AGE   IP            NODE       NOMINATED NODE   READINESS GATES
toleration-pod   1/1     Running   0          26s   10.244.0.20   minikube   <none>           <none>
keerthana@Mac-169 k8s % 

The important differece:
--------------------------
Node:
dedicated=testing:NoSchedule

Pod:
dedicated=testing:NoSchedule
        ↑
    tolerates it


The critical concept
--------------------
Don't think:

Toleration = Pod must run on that node

That's wrong.

Think:
------
Toleration = Pod is allowed to run on a node with that taint.

- The taint repels Pods.
- The toleration removes that restriction.

It does not force the Pod onto the node.

For example, if you had 3 nodes:
--------------------------------
Node A → tainted
Node B → normal
Node C → normal

A Pod with the toleration could potentially run on A, B, or C. The toleration only says "A is allowed."

**i dont understand what is taint beacuse toleration is giving permission the pod to create in node and avoid restriction then what is taint? i dont understand the steps why we need to create the yaml file is just pod creation means we can create deployment.yaml then why we need this?**

* 1. What is the taint?

A **taint belongs to the Node**, not the Pod.

It is basically a **rule on the Node saying:**

> **"Don't put Pods on me unless they are allowed."**

We did this:

```bash
kubectl taint nodes minikube dedicated=testing:NoSchedule
```

So now:

```text
MINIKUBE NODE
┌──────────────────────────┐
│ Taint:                   │
│ dedicated=testing        │
│ effect=NoSchedule        │
│                          │
│ 🚫 Normal Pods           │
└──────────────────────────┘
```

The taint is the **restriction**.

---

* 2. What is the toleration?

The Pod can say:

> **"I can tolerate that restriction."**

That's what this YAML contains:

```yaml
tolerations:
  - key: dedicated
    operator: Equal
    value: testing
    effect: NoSchedule
```

So:

```text
Node                          Pod
────                          ───
🚫 Don't schedule me     ←→   ✅ I tolerate this
   dedicated=testing          dedicated=testing
```

Therefore the scheduler allows the Pod onto the node.

---

* 3. Why did we create the YAML?

This is where your question is valid.

**We did NOT create the YAML because Kubernetes requires YAML to create a Pod.**

You already created a Pod without YAML:

```bash
kubectl run normal-pod --image=nginx
```

The reason we used YAML for `toleration-pod` is because we needed to specify the **toleration configuration**.

`kubectl run` can create simple Pods, but YAML makes the Pod configuration explicit:

```yaml
spec:
  tolerations:
    - key: dedicated
      operator: Equal
      value: testing
      effect: NoSchedule
```

And yes — **you absolutely can use a Deployment YAML instead.**

For a real application, a Deployment is usually more appropriate because it manages replicas and recreates failed Pods.

For example:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      tolerations:
        - key: dedicated
          operator: Equal
          value: testing
          effect: NoSchedule
      containers:
        - name: nginx
          image: nginx
```

Notice **where the toleration goes**:

```text
Deployment
    │
    └── Pod template
          │
          ├── containers
          │
          └── tolerations  ← here
```

---

*The whole concept in one picture*:-

Imagine your node is a **VIP room**.

* Taint

The Node puts a sign on the door:

```text
┌─────────────────────────────┐
│          NODE               │
│                             │
│   🚫 "NO NORMAL PODS"       │
│                             │
│   Taint: dedicated=testing  │
└─────────────────────────────┘
```

* Normal Pod

```text
Pod
"I want to enter."

Node:
"No. You don't have permission."

        ❌
```

Result:

```text
Pod → Pending
```

* Pod with toleration

```text
Pod:
"I tolerate dedicated=testing."

Node:
"Okay, you're allowed."

        ✅
```

Result:

```text
Pod → Running
```

* But here's the important correction:

**Toleration does NOT mean "send me to this node."**

It only means:

> **"If you consider this node for scheduling, its taint doesn't block me."**

If you want to say:

> **"I specifically want this Pod on this node."**

That's a different Kubernetes concept: **nodeSelector / nodeAffinity**.

---

So remember these three separately:

| Concept                   | Belongs to | Meaning                                       |
| ------------------------- | ---------- | --------------------------------------------- |
| **Taint**                 | Node       | 🚫 "Keep Pods away"                           |
| **Toleration**            | Pod        | ✅ "I'm allowed despite the taint"            |
| **NodeSelector/Affinity** | Pod        | 🎯 "I want to run on this type/specific node" |

**Taint + Toleration = restriction + permission.**

The YAML was simply the easiest way to put the toleration into the Pod specification. And yes, for the next practical, **we should use a Deployment YAML**, because that's closer to how you'd actually configure an application.

* Remove the taint:

keerthana@Mac-169 k8s % kubectl taint nodes minikube dedicated=testing:NoSchedule-
node/minikube untainted

* Verify:

keerthana@Mac-169 k8s % kubectl describe node minikube | grep -i taint
Taints:             <none>
keerthana@Mac-169 k8s %  


* `NoSchedule`, `PreferNoSchedule`, and `NoExecute` are **taint effects**. They belong to the **Taints & Tolerations** mechanism.

Think of it like this:

```text
TAINTS & TOLERATIONS
        │
        └── Taint has an EFFECT
              │
              ├── NoSchedule
              ├── PreferNoSchedule
              └── NoExecute
```

* 1. `NoSchedule`

Node says:

> **"Don't put new Pods here unless they tolerate my taint."**

```text
New Pod without toleration
        ↓
       ❌
```

Your first POC already demonstrated this.

---

* 2. `PreferNoSchedule`

Node says:

> **"Try not to put new Pods here."**

It's a **soft restriction**.

```text
New Pod
   ↓
Scheduler tries other nodes first
   ↓
If necessary, it MAY use this node
```

So:

```text
NoSchedule          = ❌ don't schedule
PreferNoSchedule    = ⚠️ preferably don't schedule
```

---

* 3. `NoExecute`

Node says:

> **"Pods without the appropriate toleration should not run here."**

This affects **existing Pods too**.

```text
Existing Pod
     ↓
Node gets NoExecute taint
     ↓
Pod has no toleration
     ↓
❌ Pod gets evicted
```

- This is the big difference:-

```text
NoSchedule
→ affects NEW Pods

PreferNoSchedule
→ tries to avoid NEW Pods

NoExecute
→ affects NEW Pods + existing Pods
```

* And toleration?

A **toleration belongs to the Pod**.

```text
Node
└── Taint
     └── effect: NoExecute

Pod
└── Toleration
     └── "I can tolerate this"
```

So the clean mental model is:

> **Taint = Node restriction**
> **Toleration = Pod permission**
> **Effect = tells Kubernetes how strongly that restriction applies.**

Now we should do **`PreferNoSchedule` practically**, then **`NoExecute`**, because those two will make the difference much clearer.


* Step 1 — Put a PreferNoSchedule taint on minikube:

keerthana@Mac-169 k8s % kubectl taint node minikube dedicated=testing:PreferNoSchedule
node/minikube tainted
keerthana@Mac-169 k8s % kubectl describe node minikube | grep -i taint
Taints:             dedicated=testing:PreferNoSchedule
keerthana@Mac-169 k8s % 

- What are we testing?

The node is saying:
--------------------
"Prefer not to schedule normal Pods on me."

But unlike NoSchedule, it is not an absolute block.

* Step 2 — Create a normal Pod:

No toleration. No affinity. Just a normal Pod:


keerthana@Mac-169 k8s % kubectl run prefer-test --image=nginx
pod/prefer-test created
keerthana@Mac-169 k8s % kubectl get pod prefer-test -o wide
NAME          READY   STATUS    RESTARTS   AGE   IP               NODE           NOMINATED NODE   READINESS GATES
prefer-test   1/1     Running   0          4s    10.244.205.194   minikube-m02   <none>           <none>
keerthana@Mac-169 k8s % 


- What are we expecting?

We have:
--------
minikube       → testing + PreferNoSchedule ⚠️
minikube-m02   → production

The scheduler will prefer avoiding minikube, so we expect the Pod to go to:
      minikube-m02

- But unlike NoSchedule, Kubernetes can still use minikube if necessary.

You had:

```text
minikube
  └── dedicated=testing:PreferNoSchedule ⚠️

minikube-m02
  └── no taint
```

You created a **normal Pod with no toleration**:

```text
prefer-test
```

Kubernetes chose:

```text
prefer-test
     ↓
minikube-m02 ✅
```

because `PreferNoSchedule` tells the scheduler:

> **"If possible, don't put this Pod on me."**

### But here's the important part

`PreferNoSchedule` is **not a hard wall**.

Compare:

```text
NoSchedule
     ↓
"Don't put it here."
     ↓
❌ Normal Pod blocked


PreferNoSchedule
     ↓
"Try somewhere else first."
     ↓
⚠️ Normal Pod may still be placed here
```

So our next test should prove that difference.


* Step 3 — Remove the worker from consideration:

keerthana@Mac-169 k8s % kubectl cordon minikube-m02
node/minikube-m02 cordoned
keerthana@Mac-169 k8s % kubectl delete pod prefer-test
pod "prefer-test" deleted
keerthana@Mac-169 k8s % kubectl run prefer-test --image=nginx
pod/prefer-test created
keerthana@Mac-169 k8s % kubectl get pod prefer-test -o wide
NAME          READY   STATUS    RESTARTS   AGE   IP              NODE       NOMINATED NODE   READINESS GATES
prefer-test   1/1     Running   0          5s    10.244.120.68   minikube   <none>           <none>
keerthana@Mac-169 k8s % 

- Expected: it should be scheduled onto minikube despite its PreferNoSchedule taint, because there is no other schedulable node.

That will give you the complete proof:
--------------------------------------
PreferNoSchedule = preference, NOT prohibition.

Run those commands one at a time and send me the result.

*PreferNoSchedule does not strictly block a Pod. It tells the scheduler to avoid that node if another suitable node is available.*


* Now let's do NoExecute:

- First, clean up the cordon so both nodes can schedule again:

keerthana@Mac-169 k8s % kubectl uncordon minikube-m02
node/minikube-m02 uncordoned

keerthana@Mac-169 k8s % kubectl taint node minikube dedicated=testing:PreferNoSchedule-
node/minikube untainted
keerthana@Mac-169 k8s % kubectl describe node minikube | grep -i taint
Taints:             <none>
keerthana@Mac-169 k8s % 

* After created noexecute-pod.yaml file:

keerthana@Mac-169 k8s % kubectl apply -f noexecute-pod.yaml
pod/noexecute-pod created
keerthana@Mac-169 k8s % kubectl get pod noexecute-pod -o wide
NAME            READY   STATUS              RESTARTS   AGE   IP       NODE       NOMINATED NODE   READINESS GATES
noexecute-pod   0/1     ContainerCreating   0          4s    <none>   minikube   <none>           <none>
keerthana@Mac-169 k8s % kubectl get pod noexecute-pod -o wide
NAME            READY   STATUS    RESTARTS   AGE   IP              NODE       NOMINATED NODE   READINESS GATES
noexecute-pod   1/1     Running   0          8s    10.244.120.69   minikube   <none>           <none>
keerthana@Mac-169 k8s % 

- Second — Add NoExecute taint:

keerthana@Mac-169 k8s % kubectl taint node minikube dedicated=testing:NoExecute
node/minikube tainted
keerthana@Mac-169 k8s % kubectl get pods -o wide
NAME                     READY   STATUS    RESTARTS   AGE    IP               NODE           NOMINATED NODE   READINESS GATES
preferred-affinity-pod   1/1     Running   0          114m   10.244.205.193   minikube-m02   <none>           <none>
keerthana@Mac-169 k8s % 

| Effect               | What you observed                                                   |
| -------------------- | ------------------------------------------------------------------- |
| **NoSchedule**       | Normal Pod stayed `Pending`                                         |
| **PreferNoSchedule** | Pod preferred another node, but could use tainted node if necessary |
| **NoExecute**        | Already-running Pod was removed                                     |

The simplest memory:

NoSchedule
→ ❌ Don't let NEW Pods in

PreferNoSchedule
→ ⚠️ Try not to let NEW Pods in

NoExecute
→ 🚪 Get non-tolerating Pods OUT

- Third, One cleanup is important before we move on:

keerthana@Mac-169 k8s % kubectl taint node minikube dedicated=testing:NoExecute-
node/minikube untainted
keerthana@Mac-169 k8s % kubectl describe node minikube | grep -i taint
Taints:             <none>
keerthana@Mac-169 k8s % 

NoExecute     ----->         *Anyone staying on this floor who isn't authorized must leave.*

* Put them side by side:

┌────────────────────┬──────────────────────────────┐
│ PreferNoSchedule   │ NoExecute                    │
├────────────────────┼──────────────────────────────┤
│ Soft restriction   │ Strong restriction            │
│                    │                              │
│ New Pods           │ New Pods                     │
│ preferably avoid   │ cannot enter                  │
│                    │                              │
│ Existing Pods      │ Existing Pods                │
│ stay                │ can be evicted               │
└────────────────────┴──────────────────────────────┘

* And this is the one sentence I want you to remember:

PreferNoSchedule = "Don't put new Pods here if possible."
NoExecute = "Pods that don't tolerate this taint cannot stay here."

