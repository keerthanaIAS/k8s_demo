# Keep the main difference in your mind:

HPA → increases/decreases number of Pods
VPA → increases/decreases CPU & memory for a Pod
Node Autoscaler → increases/decreases number of Nodes

# understand the architecture:

VPA
├── Recommender  → watches Pod CPU/memory usage
├── Updater       → decides when a Pod needs new resources
└── Admission Controller → gives the Pod the new CPU/memory settings

# VPA (Vertical Pod Autoscaler) POC — Working Flow

## 1. Objective

The purpose of this POC is to demonstrate how **VPA automatically adjusts CPU and memory resources of Pods based on their actual usage**.

```text
HPA
→ changes number of Pods

VPA
→ changes CPU/Memory resources of Pods

Cluster Autoscaler
→ changes number of Nodes
```

---

# 2. Prerequisites

We used:

```text
Minikube
kubectl
Docker
Git
OpenSSL
```

Check:

```bash
minikube status
kubectl get nodes
kubectl version --client
git --version
openssl version
```

Expected Minikube nodes:

```text
minikube        Ready
minikube-m02    Ready
```

---

# 3. Get VPA Source Code

Go to the Kubernetes POC directory:

```bash
cd ~/Desktop/k8s_demo
```

Clone the Kubernetes autoscaler repository:

```bash
git clone https://github.com/kubernetes/autoscaler.git
```

Go into VPA:

```bash
cd autoscaler/vertical-pod-autoscaler
```

The repository is used because VPA components need to be installed in the cluster.

---

# 4. Install VPA

Run:

```bash
./hack/vpa-up.sh
```

This installs the VPA components and CRDs.

Verify:

```bash
kubectl get pods -n kube-system | grep vpa
```

Expected:

```text
vpa-admission-controller-xxxxx   1/1   Running
vpa-recommender-xxxxx           1/1   Running
vpa-updater-xxxxx               1/1   Running
```

### VPA components

```text
Recommender
    ↓
observes Pod resource usage
    ↓
calculates CPU/Memory recommendation

Updater
    ↓
decides which Pods need resource updates
    ↓
evicts Pods when required

Admission Controller
    ↓
intercepts newly created Pods
    ↓
applies VPA recommended CPU/Memory
```

---

# 5. Create Application Deployment

Create `vpa-demo.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vpa-demo
spec:
  replicas: 2
  selector:
    matchLabels:
      app: vpa-demo
  template:
    metadata:
      labels:
        app: vpa-demo
    spec:
      containers:
        - name: app
          image: busybox:1.36
          command:
            - /bin/sh
            - -c
            - |
              while true; do
                echo "Generating workload..."
                for i in $(seq 1 1000); do echo $i > /dev/null; done
                sleep 1
              done
          resources:
            requests:
              cpu: "100m"
              memory: "32Mi"
            limits:
              cpu: "500m"
              memory: "128Mi"
```

Apply:

```bash
kubectl apply -f vpa-demo.yaml
```

Check:

```bash
kubectl get pods -l app=vpa-demo -o wide
```

---

# 6. Create VPA Configuration

Create `vpa.yaml`:

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: vpa-demo
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: vpa-demo

  updatePolicy:
    updateMode: "Recreate"
```

Apply:

```bash
kubectl apply -f vpa.yaml
```

---

# 7. Understand `Recreate`

We use:

```yaml
updateMode: "Recreate"
```

Flow:

```text
VPA finds better resources
        ↓
Updater decides Pod needs update
        ↓
Old Pod is evicted
        ↓
Deployment creates new Pod
        ↓
Admission Controller applies VPA recommendation
        ↓
New Pod starts with new CPU/Memory
```

This is important because VPA needs to recreate the Pod to apply changed resource requests in this POC.

---

# 8. Check VPA Recommendation

Run:

```bash
kubectl describe vpa vpa-demo
```

Look under:

```text
Recommendation:
```

Our successful recommendation was:

```text
Container Name: app

Lower Bound:
  CPU:    25m
  Memory: 250Mi

Target:
  CPU:    25m
  Memory: 250Mi

Upper Bound:
  CPU:    25m
  Memory: 250Mi
```

This means VPA observed the workload and calculated:

```text
CPU    → 25m
Memory → 250Mi
```

---

# 9. VPA Admission Controller Applies Recommendation

When a new Pod is created, the Admission Controller receives the Pod creation request.

It applies patches such as:

```text
CPU request:
100m → 25m

Memory request:
32Mi → 250Mi

CPU limit:
500m → 125m

Memory limit:
128Mi → 1000Mi
```

The important log was:

```text
Admitting pod
Updating requirements for pod
Sending patches
```

With:

```text
cpu request = 25m
memory request = 250Mi
```

---

# 10. Verify the New Pod

Run:

```bash
kubectl get pods -l app=vpa-demo \
  -o custom-columns='POD:.metadata.name,CPU_REQUEST:.spec.containers[0].resources.requests.cpu,MEM_REQUEST:.spec.containers[0].resources.requests.memory'
```

Successful result:

```text
POD                         CPU_REQUEST   MEM_REQUEST
vpa-demo-xxxxx              25m           250Mi
```

This proves that VPA actually changed the Pod resources.

---

# 11. Complete Working Flow

The entire POC can be understood like this:

```text
                    VPA
                     │
                     ▼
              Recommender
                     │
              observes usage
                     │
                     ▼
          CPU = 25m, Memory = 250Mi
                     │
                     ▼
                Updater
                     │
              Pod needs update
                     │
                     ▼
             Old Pod evicted
                     │
                     ▼
            Deployment creates
               new Pod
                     │
                     ▼
          Admission Controller
                     │
             applies recommendation
                     │
                     ▼
              New Pod
          CPU = 25m
          Memory = 250Mi
```

---

# 12. What We Successfully Demonstrated

| Step                                    | Result |
| --------------------------------------- | ------ |
| Install VPA                             | ✅      |
| Recommender running                     | ✅      |
| Updater running                         | ✅      |
| Admission Controller running            | ✅      |
| VPA observes workload                   | ✅      |
| VPA generates recommendation            | ✅      |
| Updater evicts Pod                      | ✅      |
| New Pod created                         | ✅      |
| Admission Controller modifies resources | ✅      |
| CPU request changed                     | ✅      |
| Memory request changed                  | ✅      |
| Complete VPA flow                       | ✅      |

---

# 13. Important Things to Remember

### VPA does NOT increase Pod count

For example:

```text
Before:
2 Pods

After VPA:
2 Pods
```

VPA changes:

```text
CPU
Memory
```

not:

```text
number of Pods
```

### HPA vs VPA

```text
HPA:
CPU high
   ↓
more Pods

VPA:
CPU/Memory requirement changes
   ↓
more CPU/Memory per Pod

Cluster Autoscaler:
Pods cannot fit
   ↓
more Nodes
```

### VPA flow in one line

> **VPA observes resource usage → recommends CPU/Memory → updater recreates the Pod → admission controller applies the recommended resources.**

---

# 14. Cleanup

When the POC is finished:

```bash
kubectl delete -f vpa.yaml
kubectl delete -f vpa-demo.yaml
```

Remove VPA components:

```bash
./hack/vpa-down.sh
```

Verify:

```bash
kubectl get pods -n kube-system | grep vpa
```

---

## Final POC Result

**VPA POC completed successfully.** ✅

We demonstrated the actual end-to-end behavior:

```text
Workload
   ↓
VPA observes
   ↓
Recommendation generated
   ↓
Pod updated/recreated
   ↓
New CPU/Memory resources applied
   ↓
Verified on running Pod
```

This is the clean version you can keep as your **VPA POC README / future reference notes**.


**certificate setup/check as a required part of the working POC**:

### Certificate setup — required for Admission Controller

After installing VPA:

1. **Check whether the VPA TLS secret exists**

```bash
kubectl get secret vpa-tls-certs -n kube-system
```

2. **Check the CA certificate**

```bash
kubectl get secret vpa-tls-certs -n kube-system \
  -o jsonpath='{.data.caCert\.pem}' | base64 -d > /tmp/vpa-ca.pem

openssl x509 -in /tmp/vpa-ca.pem -noout -text | \
  grep -A3 "Basic Constraints"
```

The CA must contain:

```text
Basic Constraints: critical
    CA:TRUE
```

3. **If the certificate is missing or the CA is invalid, generate a proper CA + server certificate.**

The important certificate requirements are:

```text
CA certificate:
  CA:TRUE

Server certificate:
  CA:FALSE
  SAN: vpa-webhook.kube-system.svc
```

4. **Put the certificates into the VPA secret**

```bash
kubectl create secret generic vpa-tls-certs \
  -n kube-system \
  --from-file=caKey.pem=/tmp/vpa-fixed-certs/caKey.pem \
  --from-file=caCert.pem=/tmp/vpa-fixed-certs/caCert.pem \
  --from-file=serverKey.pem=/tmp/vpa-fixed-certs/serverKey.pem \
  --from-file=serverCert.pem=/tmp/vpa-fixed-certs/serverCert.pem \
  --dry-run=client -o yaml | kubectl apply -f -
```

5. **Update the webhook CA bundle**

```bash
CA_BUNDLE=$(base64 < /tmp/vpa-fixed-certs/caCert.pem | tr -d '\n')

kubectl patch mutatingwebhookconfiguration vpa-webhook-config \
  --type='json' \
  -p="[{\"op\":\"replace\",\"path\":\"/webhooks/0/clientConfig/caBundle\",\"value\":\"${CA_BUNDLE}\"}]"
```

6. **Restart Admission Controller**

```bash
kubectl rollout restart deployment vpa-admission-controller -n kube-system

kubectl rollout status deployment vpa-admission-controller -n kube-system
```

7. **Test the webhook**

```text
Client
  ↓ HTTPS
vpa-webhook service
  ↓
Admission Controller
```

Only after this certificate/webhook check should we test whether VPA changes Pod resources.

> **Certificate setup is not the VPA scaling logic itself; it is required infrastructure for the Admission Controller webhook to work.**


# Q&A:
-----
--------------------------------------------------------------------------------------------------------------------------------------------

**if pod is not creating, only memory and cpu resouce increasing means why i can see here new pod oh it will recreate the pod based on the memory need** ?

LOG:
====

keerthana@Mac-551 vertical-pod-autoscaler % >....                
    "volumes": [{
      "name": "ca",
      "configMap": {
        "name": "vpa-ca-test"
      }
    }]
  }
}'


echo "=== 2. Check admission controller logs ==="

kubectl logs -n kube-system \
  deployment/vpa-admission-controller \
  --tail=50


echo "=== 3. Check VPA recommendation ==="

kubectl describe vpa vpa-demo | sed -n '/Recommendation:/,/Events:/p'


echo "=== 4. Check current Pods/resources ==="

kubectl get pods -l app=vpa-demo -o wide

kubectl get pods -l app=vpa-demo \
  -o custom-columns='POD:.metadata.name,CPU_REQUEST:.spec.containers[0].resources.requests.cpu,MEM_REQUEST:.spec.containers[0].resources.requests.memory'
=== 1. Test webhook TLS with new CA ===
configmap/vpa-ca-test configured
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0* Host vpa-webhook.kube-system.svc:443 was resolved.
* IPv6: (none)
* IPv4: 10.98.213.57
*   Trying 10.98.213.57:443...
* ALPN: curl offers h2,http/1.1
} [5 bytes data]
* TLSv1.3 (OUT), TLS handshake, Client hello (1):
} [512 bytes data]
*  CAfile: /tmp/ca.pem
*  CApath: /etc/ssl/certs
{ [5 bytes data]
* TLSv1.3 (IN), TLS handshake, Server hello (2):
{ [122 bytes data]
* TLSv1.3 (IN), TLS handshake, Encrypted Extensions (8):
{ [19 bytes data]
* TLSv1.3 (IN), TLS handshake, Certificate (11):
{ [818 bytes data]
* TLSv1.3 (IN), TLS handshake, CERT verify (15):
{ [264 bytes data]
* TLSv1.3 (IN), TLS handshake, Finished (20):
{ [36 bytes data]
* TLSv1.3 (OUT), TLS change cipher, Change cipher spec (1):
} [1 bytes data]
* TLSv1.3 (OUT), TLS handshake, Finished (20):
} [36 bytes data]
* SSL connection using TLSv1.3 / TLS_AES_128_GCM_SHA256 / x25519 / RSASSA-PSS
* ALPN: server accepted h2
* Server certificate:
*  subject: CN=vpa-webhook.kube-system.svc
*  start date: Sep  7 09:31:47 2026 GMT
*  expire date: Jun 23 09:31:47 2300 GMT
*  subjectAltName: host "vpa-webhook.kube-system.svc" matched cert's "vpa-webhook.kube-system.svc"
*  issuer: CN=vpa_webhook_ca
*  SSL certificate verify ok.
*   Certificate level 0: Public key type RSA (2048/112 Bits/secBits), signed using sha256WithRSAEncryption
*   Certificate level 1: Public key type RSA (2048/112 Bits/secBits), signed using sha256WithRSAEncryption
{ [5 bytes data]
* TLSv1.3 (IN), TLS handshake, Newsession Ticket (4):
{ [122 bytes data]
* Connected to vpa-webhook.kube-system.svc (10.98.213.57) port 443
* using HTTP/2
* [HTTP/2] [1] OPENED stream for https://vpa-webhook.kube-system.svc:443/healthz
* [HTTP/2] [1] [:method: GET]
* [HTTP/2] [1] [:scheme: https]
* [HTTP/2] [1] [:authority: vpa-webhook.kube-system.svc]
* [HTTP/2] [1] [:path: /healthz]
* [HTTP/2] [1] [user-agent: curl/8.10.1]
* [HTTP/2] [1] [accept: */*]
} [5 bytes data]
> GET /healthz HTTP/2
> Host: vpa-webhook.kube-system.svc
> User-Agent: curl/8.10.1
> Accept: */*
> 
{ [5 bytes data]
* Request completely sent off
{ [5 bytes data]
< HTTP/2 200 
< content-length: 0
< date: Mon, 07 Sep 2026 09:33:05 GMT
< 
{ [0 bytes data]
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0
* Connection #0 to host vpa-webhook.kube-system.svc left intact
pod "tls-test" deleted
=== 2. Check admission controller logs ===
I0907 09:31:54.795142       1 envvar.go:195] "Feature gate default state" feature="AtomicFIFO" enabled=true
I0907 09:31:54.795145       1 envvar.go:195] "Feature gate default state" feature="ClientsAllowTLSCacheGC" enabled=true
I0907 09:31:54.795147       1 envvar.go:195] "Feature gate default state" feature="ClientsPreferCBOR" enabled=false
I0907 09:31:54.795150       1 envvar.go:195] "Feature gate default state" feature="ClientsAllowCARotation" enabled=true
I0907 09:31:54.795152       1 envvar.go:195] "Feature gate default state" feature="InOrderInformers" enabled=true
I0907 09:31:54.795315       1 reflector.go:425] "Starting reflector" type="*v1.VerticalPodAutoscaler" resyncPeriod="1h0m0s" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343"
I0907 09:31:54.795328       1 reflector.go:472] "Listing and watching" type="*v1.VerticalPodAutoscaler" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343"
I0907 09:31:54.813685       1 reflector.go:1080] "Exiting watch because received the bookmark that marks the end of initial events stream" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343" totalItems=2 duration="18.324541ms"
I0907 09:31:54.813709       1 reflector.go:507] "Caches populated" type="*v1.VerticalPodAutoscaler" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343"
I0907 09:31:54.895337       1 api.go:108] "Initial VPA synced successfully"
I0907 09:31:54.895687       1 reflector.go:425] "Starting reflector" type="*v1.Deployment" resyncPeriod="10m0s" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343"
I0907 09:31:54.895702       1 reflector.go:472] "Listing and watching" type="*v1.Deployment" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343"
I0907 09:31:54.895846       1 reflector.go:425] "Starting reflector" type="*v1.ReplicaSet" resyncPeriod="10m0s" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343"
I0907 09:31:54.895859       1 reflector.go:472] "Listing and watching" type="*v1.ReplicaSet" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343"
I0907 09:31:54.895952       1 reflector.go:425] "Starting reflector" type="*v1.StatefulSet" resyncPeriod="10m0s" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343"
I0907 09:31:54.895962       1 reflector.go:472] "Listing and watching" type="*v1.StatefulSet" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343"
I0907 09:31:54.896020       1 reflector.go:425] "Starting reflector" type="*v1.ReplicationController" resyncPeriod="10m0s" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343"
I0907 09:31:54.896031       1 reflector.go:472] "Listing and watching" type="*v1.ReplicationController" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343"
I0907 09:31:54.896132       1 reflector.go:425] "Starting reflector" type="*v1.CronJob" resyncPeriod="10m0s" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343"
I0907 09:31:54.896150       1 reflector.go:472] "Listing and watching" type="*v1.CronJob" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343"
I0907 09:31:54.896182       1 reflector.go:425] "Starting reflector" type="*v1.Job" resyncPeriod="10m0s" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343"
I0907 09:31:54.896206       1 reflector.go:472] "Listing and watching" type="*v1.Job" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343"
I0907 09:31:54.896251       1 reflector.go:425] "Starting reflector" type="*v1.LimitRange" resyncPeriod="10m0s" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343"
I0907 09:31:54.896269       1 reflector.go:472] "Listing and watching" type="*v1.LimitRange" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343"
I0907 09:31:54.896359       1 reflector.go:425] "Starting reflector" type="*v1.DaemonSet" resyncPeriod="10m0s" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343"
I0907 09:31:54.896374       1 reflector.go:472] "Listing and watching" type="*v1.DaemonSet" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343"
I0907 09:31:54.898025       1 reflector.go:1080] "Exiting watch because received the bookmark that marks the end of initial events stream" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343" totalItems=1 duration="2.031208ms"
I0907 09:31:54.898058       1 reflector.go:507] "Caches populated" type="*v1.StatefulSet" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343"
I0907 09:31:54.898304       1 reflector.go:1080] "Exiting watch because received the bookmark that marks the end of initial events stream" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343" totalItems=1 duration="1.983916ms"
I0907 09:31:54.898329       1 reflector.go:507] "Caches populated" type="*v1.LimitRange" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343"
I0907 09:31:54.898451       1 reflector.go:1080] "Exiting watch because received the bookmark that marks the end of initial events stream" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343" totalItems=1 duration="2.400334ms"
I0907 09:31:54.898465       1 reflector.go:507] "Caches populated" type="*v1.ReplicationController" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343"
I0907 09:31:54.898490       1 reflector.go:1080] "Exiting watch because received the bookmark that marks the end of initial events stream" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343" totalItems=6 duration="2.76625ms"
I0907 09:31:54.898504       1 reflector.go:507] "Caches populated" type="*v1.Deployment" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343"
I0907 09:31:54.898562       1 reflector.go:1080] "Exiting watch because received the bookmark that marks the end of initial events stream" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343" totalItems=1 duration="2.385958ms"
I0907 09:31:54.898576       1 reflector.go:507] "Caches populated" type="*v1.CronJob" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343"
I0907 09:31:54.898639       1 reflector.go:1080] "Exiting watch because received the bookmark that marks the end of initial events stream" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343" totalItems=4 duration="2.246084ms"
I0907 09:31:54.898652       1 reflector.go:507] "Caches populated" type="*v1.DaemonSet" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343"
I0907 09:31:54.898672       1 reflector.go:1080] "Exiting watch because received the bookmark that marks the end of initial events stream" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343" totalItems=1 duration="2.443875ms"
I0907 09:31:54.898711       1 reflector.go:507] "Caches populated" type="*v1.Job" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343"
I0907 09:31:54.898798       1 reflector.go:1080] "Exiting watch because received the bookmark that marks the end of initial events stream" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343" totalItems=7 duration="2.923375ms"
I0907 09:31:54.898817       1 reflector.go:507] "Caches populated" type="*v1.ReplicaSet" reflector="pkg/mod/k8s.io/client-go@v0.36.3/tools/cache/reflector.go:343"
I0907 09:31:54.899340       1 certs.go:41] "Successfully read bytes from file" bytes=1135 file="/etc/tls-certs/caCert.pem"
I0907 09:32:04.913817       1 config.go:192] Self registration as MutatingWebhook succeeded.
I0907 09:32:40.504676       1 handler.go:81] "Admitting pod" pod="default/vpa-demo-5554dcb5c7-%"
I0907 09:32:40.504869       1 recommendation_provider.go:121] "Updating requirements for pod" pod="default/vpa-demo-5554dcb5c7-%"
I0907 09:32:40.505018       1 server.go:166] "Sending patches" patches=[{"op":"add","path":"/metadata/annotations","value":{}},{"op":"add","path":"/spec/containers/0/resources/requests/cpu","value":"25m"},{"op":"add","path":"/spec/containers/0/resources/requests/memory","value":"250Mi"},{"op":"add","path":"/spec/containers/0/resources/limits/cpu","value":"125m"},{"op":"add","path":"/spec/containers/0/resources/limits/memory","value":"1000Mi"},{"op":"add","path":"/metadata/annotations/vpaUpdates","value":"Pod resources updated by vpa-demo: container 0: cpu request, memory request, cpu limit, memory limit"},{"op":"add","path":"/metadata/annotations/vpaObservedContainers","value":"app"}]
I0907 09:33:05.077700       1 handler.go:81] "Admitting pod" pod="default/tls-test"
I0907 09:33:05.077733       1 handler.go:84] "No matching VPA found for pod" pod="default/tls-test"
E0907 09:33:05.586917       1 server.go:202] contentType=, expect application/json
=== 3. Check VPA recommendation ===
  Recommendation:
    Container Recommendations:
      Container Name:  app
      Lower Bound:
        Cpu:     25m
        Memory:  250Mi
      Target:
        Cpu:     25m
        Memory:  250Mi
      Uncapped Target:
        Cpu:     25m
        Memory:  250Mi
      Upper Bound:
        Cpu:     25m
        Memory:  250Mi
Events:
=== 4. Check current Pods/resources ===
NAME                        READY   STATUS        RESTARTS   AGE     IP            NODE           NOMINATED NODE   READINESS GATES
vpa-demo-5554dcb5c7-jzdqz   1/1     Running       0          2m27s   10.244.1.21   minikube-m02   <none>           <none>
vpa-demo-5554dcb5c7-pxxm5   1/1     Running       0          27s     10.244.0.16   minikube       <none>           <none>
vpa-demo-5554dcb5c7-vm46l   1/1     Terminating   0          87s     10.244.0.14   minikube       <none>           <none>
POD                         CPU_REQUEST   MEM_REQUEST
vpa-demo-5554dcb5c7-jzdqz   100m          32Mi
vpa-demo-5554dcb5c7-pxxm5   25m           250Mi
vpa-demo-5554dcb5c7-vm46l   100m          32Mi
keerthana@Mac-551 vertical-pod-autoscaler % 


above .. Command given Terminal log:
====================================

echo "=== 1. Test webhook TLS with new CA ==="

kubectl create configmap vpa-ca-test \
  -n default \
  --from-file=ca.pem=/tmp/vpa-fixed-certs/caCert.pem \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl run tls-test \
  --rm -i --restart=Never \
  --image=curlimages/curl:8.10.1 \
  --overrides='
{
  "spec": {
    "containers": [{
      "name": "tls-test",
      "image": "curlimages/curl:8.10.1",
      "command": [
        "curl",
        "-v",
        "--cacert",
        "/tmp/ca.pem",
        "https://vpa-webhook.kube-system.svc:443/healthz"
      ],
      "volumeMounts": [{
        "name": "ca",
        "mountPath": "/tmp"
      }]
    }],
    "volumes": [{
      "name": "ca",
      "configMap": {
        "name": "vpa-ca-test"
      }
    }]
  }
}'


echo "=== 2. Check admission controller logs ==="

kubectl logs -n kube-system \
  deployment/vpa-admission-controller \
  --tail=50


echo "=== 3. Check VPA recommendation ==="

kubectl describe vpa vpa-demo | sed -n '/Recommendation:/,/Events:/p'


echo "=== 4. Check current Pods/resources ==="

kubectl get pods -l app=vpa-demo -o wide

kubectl get pods -l app=vpa-demo \
  -o custom-columns='POD:.metadata.name,CPU_REQUEST:.spec.containers[0].resources.requests.cpu,MEM_REQUEST:.spec.containers[0].resources.requests.memory'


output command:
==============

Yes — **the VPA webhook is now working correctly.** ✅

Your output proves the full flow:

* ✅ TLS certificate verified successfully
* ✅ Webhook returned `HTTP 200`
* ✅ Admission controller received the Pod
* ✅ VPA recommendation = **25m CPU + 250Mi memory**
* ✅ Admission controller generated patches
* ✅ One new Pod already has:

  * CPU request: **25m**
  * Memory request: **250Mi**

The important proof is:

```text
Sending patches
cpu request = 25m
memory request = 250Mi
cpu limit = 125m
memory limit = 1000Mi
```

And:

```text
vpa-demo-...-pxxm5   25m   250Mi
```

So **our VPA POC is successful now.** 🎉

### What actually happened

```text
Pod created
   ↓
VPA Admission Controller
   ↓
VPA recommendation
   ↓
25m CPU + 250Mi Memory
   ↓
Pod resources mutated
   ↓
New Pod runs with recommended resources
```

The older Pods still showing `100m / 32Mi` are expected because **they were created before the successful webhook mutation**.

One small error:

```text
contentType=, expect application/json
```

came from our `curl /healthz` test because curl sent a normal HTTP request, not a Kubernetes AdmissionReview request. **It is not a VPA failure.**

### POC status

**VPA → Observe → Recommend → Evict/Recreate → Apply new resources: COMPLETE ✅**

-------------------------------------------------------------------------------------------------------------------------------------------------------

**where we applied load here? to check this?**

- the load is already inside your vpa-demo.yaml

- This part is the load generator:

command:
  - /bin/sh
  - -c
  - |
    while true; do
      echo "Generating workload..."
      for i in $(seq 1 1000); do echo $i > /dev/null; done
      sleep 1
    done

* What it does

The container continuously runs:

while true
   ↓
run loop 1 → 1000
   ↓
CPU work
   ↓
sleep 1 second
   ↓
repeat forever

So your Pod itself is generating continuous CPU workload.

- That workload is what the VPA Recommender observes.

Your flow was:
=============

vpa-demo Pod
   │
   │ CPU workload generated here
   ▼
VPA Recommender
   │
   │ observes usage
   ▼
Recommendation
CPU    = 25m
Memory = 250Mi
   │
   ▼
VPA Updater
   │
   ▼
Pod recreated
   │
   ▼
Admission Controller
   │
   ▼
New Pod
CPU request    = 25m
Memory request = 250Mi

