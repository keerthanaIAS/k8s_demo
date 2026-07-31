# Enable Ingress in Minikube
If you are using Minikube:
-------------------------
minikube addons enable ingress

Check:
--------
kubectl get pods -n ingress-nginx

You should see the NGINX Ingress Controller running.

## Terminal Log:
keerthana@Mac-375 k8s-rollout-ingress-poc % minikube addons enable ingress
💡  ingress is an addon maintained by Kubernetes. For any concerns contact minikube on GitHub.
You can view the list of minikube maintainers at: https://github.com/kubernetes/minikube/blob/master/OWNERS
💡  After the addon is enabled, please run "minikube tunnel" and your ingress resources would be available at "127.0.0.1"
    ▪ Using image registry.k8s.io/ingress-nginx/controller:v1.14.3
    ▪ Using image registry.k8s.io/ingress-nginx/kube-webhook-certgen:v1.6.7
    ▪ Using image registry.k8s.io/ingress-nginx/kube-webhook-certgen:v1.6.7
🔎  Verifying ingress addon...
🌟  The 'ingress' addon is enabled
keerthana@Mac-375 k8s-rollout-ingress-poc % 
keerthana@Mac-375 k8s-rollout-ingress-poc % kubectl apply -f ingress.yaml
ingress.networking.k8s.io/nginx-ingress created
keerthana@Mac-375 k8s-rollout-ingress-poc % kubectl get ingress
NAME            CLASS   HOSTS         ADDRESS   PORTS   AGE
nginx-ingress   nginx   nginx.local             80      5s
keerthana@Mac-375 k8s-rollout-ingress-poc % kubectl get pods -n ingress-nginx
NAME                                        READY   STATUS      RESTARTS      AGE
ingress-nginx-admission-create-jdmx7        0/1     Completed   0             7m40s
ingress-nginx-admission-patch-995ng         0/1     Completed   1             7m40s
ingress-nginx-controller-596f8778bc-526nj   1/1     Running     1 (94s ago)   7m40s
keerthana@Mac-375 k8s-rollout-ingress-poc % kubectl get svc -n ingress-nginx
NAME                                 TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)                      AGE
ingress-nginx-controller             NodePort    10.107.72.159   <none>        80:31533/TCP,443:30772/TCP   7m46s
ingress-nginx-controller-admission   ClusterIP   10.101.61.181   <none>        443/TCP                      7m46s
keerthana@Mac-375 k8s-rollout-ingress-poc % minikube ip
192.168.49.2

#### The issue is specifically this:
*Minikube with the Docker driver on macOS does not expose the Minikube VM/container IP (192.168.49.2) directly to your Mac host in the same way it would on Linux*.

That's why you previously had a working 127.0.0.1 setup.

Your current output proves it:
------------------------------
Ingress ADDRESS: 192.168.49.2
Minikube IP:     192.168.49.2

But your Mac browser cannot necessarily route to that internal Minikube network. 

**Let's make your nginx.local work through 127.0.0.1**

step 1: keerthana@Mac-375 k8s-rollout-ingress-poc % minikube tunnel
✅  Tunnel successfully started

📌  NOTE: Please do not close this terminal as this process must stay alive for the tunnel to be accessible ...

❗  The service/ingress nginx-ingress requires privileged ports to be exposed: [80 443]
🔑  sudo permission will be asked for it.
🔗  Starting tunnel for service nginx-ingress.
Password:

step 2: keerthana@Mac-375 k8s-rollout-ingress-poc % sudo nano /etc/hosts
Password:

##### Tunnel importance:
-------------------------
**`minikube tunnel` creates a network path from your Mac to services inside Minikube**.

Think of it simply:

```text
Your Mac
   │
   │ Browser: http://nginx.local
   ▼
127.0.0.1
   │
   │  ← minikube tunnel creates this connection
   ▼
Minikube
   │
   ▼
Ingress Controller
   │
   ▼
Service
   │
   ▼
Pod
```

### Why must it keep running?
-----------------------------
`minikube tunnel` is **not a one-time configuration command**. It starts a process that continuously forwards traffic.

When you run:

```bash
minikube tunnel
```

you are starting a **running tunnel process**.

If you close that terminal or press:
-----------------------------------
```text
Ctrl + C
```

the tunnel stops, so the path from your Mac to the Kubernetes service disappears.

That's why you see:
-------------------
```text
Please do not close this terminal as this process must stay alive
```

### Important for your specific case

You have:

```text
Minikube Docker driver
        ↓
Mac
```

The `192.168.49.2` address belongs to the Minikube networking environment. Your Mac cannot always access it directly.

`minikube tunnel` helps expose Kubernetes services through your Mac's networking.                                         -->*importnant notes*

### Simple analogy

Think of Minikube as a **building inside another building**:

```text
Mac
┌──────────────────────────┐
│                          │
│   Tunnel = Open Door     │
│          ↓               │
│   ┌──────────────────┐   │
│   │    Minikube      │   │
│   │                  │   │
│   │ Ingress → Service│   │
│   │        → Pod     │   │
│   └──────────────────┘   │
│                          │
└──────────────────────────┘
```

Without the tunnel:

```text
Mac ─────X─────> Minikube Service
```

With the tunnel:

```text
Mac ────────> Tunnel ────────> Minikube Service
```

**So the tunnel has to stay running because it is the actual process carrying the traffic.**

One more important point: **you don't always need `minikube tunnel` for every Minikube setup**. For your previous POC, you may have used `minikube service`, `port-forward`, or a NodePort-based route instead. The correct method depends on how you exposed the Ingress Controller.

#### More Simple analogy:
------------------------
`minikube tunnel` is needed because you are using **Minikube with the Docker driver on Mac**.

In simple terms:

```text
Your Mac
   ↓
127.0.0.1
   ↓
minikube tunnel
   ↓
Kubernetes Ingress
   ↓
Service
   ↓
Pod
```

The tunnel creates a **network path from your Mac to Kubernetes services/Ingress** that need to be exposed outside the Minikube cluster.

So:

* **Without tunnel** → Mac may not reach the Ingress.                                                               -->*important notes*
* **With tunnel** → Mac can access the Ingress through the exposed local address.
* It must **keep running** while you are testing because it maintains that network path.

That's why the command says:

> Please do not close this terminal.
