## First understand the problem we created

Initially we had:

```text
Workload Kubernetes Cluster

Control Plane
     |
Worker Node 1
     |
     ├── scale-test pods
     └── autoscale-trigger pod
```

Worker Node 1 had limited available CPU/memory.

Then we intentionally created **2 `autoscale-trigger` pods**, each asking for:

```text
CPU:    6
Memory: 4Gi
```

But we had only **one worker**.

So:

```text
Worker 1
Capacity
   ↓
Enough for Pod 1
   ↓
NOT enough for Pod 2
   ↓
Pod 2 = Pending
```

**This Pending pod is what starts the autoscaling process.**

---

# 1. Where did we "increase capacity"?

We did **not directly increase CPU/RAM of the existing node**.

Instead, Cluster Autoscaler increases capacity by asking CAPI to create **another worker node**.

Initially:

```text
MachineDeployment

replicas: 1
```

Meaning:

> "I want 1 worker."

After Cluster Autoscaler detected the Pending pod:

```text
MachineDeployment

1 → 2
```

Meaning:

> "I now need 2 workers."

This is the actual **capacity increase**.

---

# 2. Who detected that capacity was insufficient?

This is the important part.

Cluster Autoscaler continuously watches the workload cluster.

It saw:

```text
autoscale-trigger-pod-1
        Running

autoscale-trigger-pod-2
        Pending
```

Why is it Pending?

Because Kubernetes scheduler tried to find a node with enough resources and couldn't.

So Cluster Autoscaler effectively says:

> "There is an unschedulable pod. If I add another worker, this pod can probably run."

That's why our CA log showed:

```text
1 unschedulable
```

and then:

```text
Final scale-up plan:
MachineDeployment ... 1->2
```

---

# 3. Where is the new node actually created?

This is where **CAPI + CAPD** comes in.

Cluster Autoscaler does **NOT create the Docker container/node itself**.

The chain is:

```text
Cluster Autoscaler
       |
       | scale MachineDeployment 1 → 2
       ↓
CAPI MachineDeployment
       |
       ↓
CAPI Machine
       |
       ↓
CAPD / DevMachine
       |
       ↓
Docker container
       |
       ↓
Kubernetes worker node
```

In our actual POC, the new Machine was:

```text
node-spinup-md-0-29lx6-tb2tl-5cmv7
```

And it became:

```text
Ready
Running
172.18.0.6
```

So **this Docker container became our second Kubernetes worker.**

---

# 4. How did the new pod get assigned to the new node?

This part is done by **Kubernetes Scheduler**, not Cluster Autoscaler.

After the new node joined:

```text
Worker 1
Worker 2
```

the scheduler looked again at the Pending pod.

Now there was enough capacity:

```text
Worker 1
   |
   └── autoscale-trigger pod 1


Worker 2
   |
   └── autoscale-trigger pod 2
```

And that's exactly what your final output showed:

```text
autoscale-trigger-...-bjztc
        ↓
node-spinup-md-0-29lx6-tb2tl-5cmv7
```

and:

```text
autoscale-trigger-...-drfb5
        ↓
node-spinup-md-0-29lx6-tb2tl-5799c
```

Both became:

```text
1/1 Running
```

---

# So there are actually 3 different "brains"

This is the part I want you to remember.

### ① Kubernetes Scheduler

Its job:

> **"Where can this pod run?"**

It sees:

```text
Pod Pending
```

because existing nodes don't have enough resources.

---

### ② Cluster Autoscaler

Its job:

> **"There isn't enough capacity. Should I add another node?"**

It sees:

```text
Pending pod
      ↓
Need more capacity
      ↓
MachineDeployment 1 → 2
```

---

### ③ CAPI + CAPD

Their job:

> **"Okay, you asked for one more worker. I'll create it."**

```text
MachineDeployment = 2
          ↓
CAPI Machine
          ↓
CAPD DevMachine
          ↓
Docker worker
          ↓
Kubernetes Node Ready
```

---

# Our entire POC in one picture

```text
                 YOU
                  |
                  | Create 2 pods
                  ↓
        autoscale-trigger
        CPU=6, Memory=4Gi
                  |
                  ↓
       ┌──────────────────┐
       │ Kubernetes       │
       │ Scheduler        │
       └────────┬─────────┘
                |
                | Pod cannot fit
                ↓
             PENDING
                |
                ↓
       ┌──────────────────┐
       │ Cluster          │
       │ Autoscaler       │
       └────────┬─────────┘
                |
                | Need more capacity
                ↓
        MachineDeployment
             1 → 2
                |
                ↓
       ┌──────────────────┐
       │ Cluster API      │
       │ CAPI             │
       └────────┬─────────┘
                |
                ↓
             Machine
                |
                ↓
       ┌──────────────────┐
       │ CAPD             │
       │ Docker provider  │
       └────────┬─────────┘
                |
                ↓
          New Docker
          Worker Node
                |
                ↓
             Ready
                |
                ↓
       Kubernetes Scheduler
                |
                ↓
       Pending Pod → Worker 2
                |
                ↓
             Running
```

## And where each thing happened in our commands

| What we did                    | Our POC                             |
| ------------------------------ | ----------------------------------- |
| Created initial capacity       | `worker-machine-count=1`            |
| Set autoscaling limits         | `min=1`, `max=3`                    |
| Created pressure               | `autoscale-trigger` with 2 replicas |
| Created resource demand        | `CPU=6`, `Memory=4Gi`               |
| Detected insufficient capacity | Pod became `Pending`                |
| Decided to add capacity        | Cluster Autoscaler                  |
| Increased capacity             | MachineDeployment `1 → 2`           |
| Created new machine            | CAPI                                |
| Created Docker worker          | CAPD                                |
| Joined Kubernetes              | New worker became `Ready`           |
| Assigned Pending pod           | Kubernetes Scheduler                |
| Final result                   | Both pods `Running`                 |

### The most important thing to remember

**We did not create a new pod when autoscaling happened.**

We created **2 pods at the beginning**.

One pod ran immediately, while the **second pod stayed Pending**.

Then:

**Pending pod → CA creates/increases node capacity → new node joins → scheduler assigns the already-existing Pending pod to the new node.**

That is the exact behavior your POC demonstrated.