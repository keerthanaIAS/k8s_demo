# Part 1 — Kubernetes API Server:

* First understand one thing:
        Kubernetes API Server is the main entry point for communicating with Kubernetes.

* When you run:
        kubectl get pods

* it is basically:
        kubectl
           ↓
        Kubernetes API Server
           ↓
        "Give me the Pods"
           ↓
        Kubernetes responds
        
        Your application can do the same thing without kubectl.

keerthana@Keerthanas-MacBook-Air real-application % kubectl get pods
NAME                        READY   STATUS    RESTARTS       AGE
node-agent-588x7            1/1     Running   2 (2m2s ago)   47h
vpa-demo-5554dcb5c7-g2wbj   1/1     Running   1 (2m2s ago)   24h
vpa-demo-5554dcb5c7-pxxm5   1/1     Running   2 (2m2s ago)   43h
keerthana@Keerthanas-MacBook-Air real-application % kubectl cluster-info
Kubernetes control plane is running at https://127.0.0.1:49975
CoreDNS is running at https://127.0.0.1:49975/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy

To further debug and diagnose cluster problems, use 'kubectl cluster-info dump'.
keerthana@Keerthanas-MacBook-Air real-application % kubectl get --raw=/version
{
  "major": "1",
  "minor": "35",
  "emulationMajor": "1",
  "emulationMinor": "35",
  "minCompatibilityMajor": "1",
  "minCompatibilityMinor": "34",
  "gitVersion": "v1.35.1",
  "gitCommit": "8fea90b45245ef5c8ba54e7ae044d3e777c22500",
  "gitTreeState": "clean",
  "buildDate": "2026-02-10T12:53:14Z",
  "goVersion": "go1.25.6",
  "compiler": "gc",
  "platform": "linux/arm64"
}%     

* So kubectl successfully contacted the Kubernetes API Server and asked:
        "What Kubernetes version are you running?"

*Almost everything you ask Kubernetes goes through the API Server.*

# Part 2: Authentication — how Kubernetes knows WHO is making the request: (Part 2 — Authentication: "Who are you?")

* Now we answer the next question:
        When a request reaches the API Server, how does Kubernetes know who is making the request?

* There are two identities we've already worked with:

- Your terminal:
        When you run:

        ```bash
        kubectl get pods
        ```
        your `kubectl` uses your Kubernetes **kubeconfig** to authenticate.

- A Pod:
        When our `rbac-test-pod` made the API request:

        ```text
        Pod
         ↓
        ServiceAccount
         ↓
        Token
         ↓
        API Server
        ```

- Kubernetes identified it as:
        ```text
        system:serviceaccount:rbac-poc:developer
        ```
        Then **RBAC authorization** decided what that identity could do.

- So the overall flow is:
        ```text
        Request
           ↓
        API Server
           ↓
        Authentication
        "WHO are you?"
           ↓
        Authorization / RBAC
        "WHAT are you allowed to do?"
           ↓
        Allow / Deny
        ```

* The first command answers **WHO**:
        keerthana@Keerthanas-MacBook-Air real-application % kubectl auth whoami
        ATTRIBUTE                                           VALUE
        Username                                            minikube-user
        Groups                                              [system:masters system:authenticated]
        Extra: authentication.kubernetes.io/credential-id   [X509SHA256=3326967455db13c162351f093d4cbd0bdd054b5c48391c0221b9d20c6f83e9b0]


* The second answers **WHAT you are allowed to do**:
        keerthana@Keerthanas-MacBook-Air real-application % kubectl auth can-i get pods
        yes

* So the next part of the flow is:
        kubectl
           ↓
        API Server
           ↓
        Authentication → "Who are you?" → minikube-user
           ↓
        Authorization → "Are you allowed?" → YES
           ↓
        get pods

**Now let's prove Authorization separately**:
        keerthana@Keerthanas-MacBook-Air real-application % kubectl auth can-i delete pods
        yes
        keerthana@Keerthanas-MacBook-Air real-application % kubectl auth can-i create deployments
        yes
        keerthana@Keerthanas-MacBook-Air real-application % kubectl auth can-i get secrets
        yes

*Flow is now*:                                                                                                         -->*upto now completed*
==============
        kubectl
           ↓
        API Server
           ↓
        Authentication
        "Who are you?"
        → minikube-user
           ↓
        Authorization / RBAC
        "What can you do?"
        → system:masters
        → YES: get pods
        → YES: delete pods
        → YES: create deployments
        → YES: get secrets

**Next: Admission**:

* After authorization, Kubernetes can do one more check:
        Request
           ↓
        Authentication → WHO?
           ↓
        Authorization → ALLOWED?
           ↓
        Admission → "Should I accept/modify this request?"
           ↓
        Create/Update resource

* Simple example:
------------------
You are authenticated and authorized to create a Pod, but an Admission Controller can still reject it because of a cluster policy.

*So remember*:                                                                                                          -->*important point*
==============
Authentication = Who are you?
Authorization = What can you do?
Admission = Should Kubernetes accept this request?

# Part 3 — Admission Controller:

- we'll use a built-in admission behavior: ResourceQuota.

It lets the cluster say:
------------------------
        "Even if you are allowed to create Pods, you cannot create more than the namespace quota."

* Remember the flow:
        kubectl
           ↓
        API Server
           ↓
        1. Authentication → WHO are you?
           ↓
        2. Authorization → ARE you allowed?
           ↓
        3. Admission → SHOULD this request be accepted?
           ↓
        Resource created

* Step 1 — Create a test namespace:
keerthana@Keerthanas-MacBook-Air real-application % kubectl create namespace admission-poc
namespace/admission-poc created

* Step 2 — Add a quota:
keerthana@Keerthanas-MacBook-Air real-application % kubectl create quota pod-quota \
  --hard=pods=2 \
  -n admission-poc                                                                            -->*This namespace can have maximum 2 Pods.*
resourcequota/pod-quota created
keerthana@Keerthanas-MacBook-Air real-application % kubectl get resourcequota -n admission-poc
NAME        REQUEST     LIMIT   AGE
pod-quota   pods: 0/2           11s

* Step 3 — Create 2 Pods:
keerthana@Keerthanas-MacBook-Air real-application % kubectl run pod1 --image=nginx -n admission-poc
kubectl run pod2 --image=nginx -n admission-poc
pod/pod1 created
pod/pod2 created
                                                                                         -->    *→ Pod 1 created ✅*
                                                                                                *→ Pod 2 created ✅*
                                                                                                *→ Now 2/2 Pods are being used.*
keerthana@Keerthanas-MacBook-Air real-application % kubectl get pods -n admission-poc
NAME   READY   STATUS              RESTARTS   AGE
pod1   0/1     ContainerCreating   0          4s
pod2   0/1     ContainerCreating   0          4s

* Step 4 — Try a 3rd Pod:
keerthana@Keerthanas-MacBook-Air real-application % kubectl run pod3 --image=nginx -n admission-poc
Error from server (Forbidden): pods "pod3" is forbidden: exceeded quota: pod-quota, requested: pods=1, used: pods=2, limited: pods=2
keerthana@Keerthanas-MacBook-Air real-application %
*This should be rejected because our namespace allows only 2 Pods.*                 -->        *→ Kubernetes checks the quota.*
                                                                                               *→ Already 2/2 are used.*
                                                                                               *→ A 3rd Pod would exceed the limit.*
                                                                                               *→ Admission rejects it ❌*

* That's the important point:
        You are authorized to create Pod
                      ↓
              Admission checks quota
                      ↓
                quota exceeded
                      ↓
                  REJECT ❌

* What happened?

1. You were already authenticated:
        minikube-user

2. And authorized:
        Can create pods? → YES

3. But then Admission rejected the request because the namespace quota was already full.
        kubectl run pod3
               ↓
           API Server
               ↓
        Authentication
           minikube-user ✅
               ↓
        Authorization
           create pods? YES ✅
               ↓
        Admission
           quota = 2
           already using = 2
               ↓
             REJECT ❌

**The key difference**:
| Stage          | Question                          | Your result         |
| -------------- | --------------------------------- | ------------------- |
| Authentication | **Who are you?**                  | `minikube-user`     |
| Authorization  | **Can you create Pods?**          | YES                 |
| Admission      | **Can this request be accepted?** | NO — quota exceeded |

* So simply:
============
Quota = maximum 2 Pods. We created 2. When we tried to create the 3rd, Admission rejected it because the limit was already reached.

# Part: ServiceAccount → Token → API:

* Step 1 — See the ServiceAccount:
keerthana@Keerthanas-MacBook-Air real-application % kubectl get serviceaccount -n rbac-poc
NAME          AGE
admin         24h
backend-app   20h
default       24h
developer     24h
test-user     24h
viewer        24h
keerthana@Keerthanas-MacBook-Air real-application % kubectl get serviceaccount developer -n rbac-poc -o yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  creationTimestamp: "2026-09-08T05:41:54Z"
  name: developer
  namespace: rbac-poc
  resourceVersion: "35226"
  uid: e763a238-eb47-4c78-9525-6c5bbaa9d67d

* Step 2 — Find the Pod using developer:
keerthana@Keerthanas-MacBook-Air real-application % kubectl get pods -n rbac-poc -o wide
NAME            READY   STATUS    RESTARTS      AGE   IP           NODE       NOMINATED NODE   READINESS GATES
nginx           1/1     Running   1 (37m ago)   24h   10.244.0.6   minikube   <none>           <none>
rbac-test-pod   1/1     Running   1 (37m ago)   20h   10.244.0.9   minikube   <none>           <none>
keerthana@Keerthanas-MacBook-Air real-application % kubectl get pod rbac-test-pod -n rbac-poc -o jsonpath='{.spec.serviceAccountName}'
developer%                                                                                                                              
keerthana@Keerthanas-MacBook-Air real-application % kubectl exec -n rbac-poc rbac-test-pod -- ls /var/run/secrets/kubernetes.io/serviceaccount/
ca.crt
namespace
token
keerthana@Keerthanas-MacBook-Air real-application % 

* So Kubernetes has provided the Pod with:
------------------------------------------
        token → proves the Pod's identity
        ca.crt → helps verify the Kubernetes API Server
        namespace → tells the Pod its namespace

**The flow is**:
----------------
        Pod
         ↓
        uses ServiceAccount: developer
         ↓
        Kubernetes provides token
         ↓
        Pod uses token
         ↓
        Kubernetes API Server
         ↓
        Authentication: "developer"
         ↓
        RBAC: what can developer do?

-----------------------------------------------------------------------------------------------------------------------------------------
* Now let's actually use the token:
-----------------------------------------------------------------------------------------------------------------------------------------
(*You're saying: "Kubernetes API Server, I am the ServiceAccount represented by this token. Give me the Pods in rbac-poc."*)
keerthana@Keerthanas-MacBook-Air real-application % kubectl exec -it -n rbac-poc rbac-test-pod -- sh
# TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
# curl -k \
  -H "Authorization: Bearer $TOKEN" \
  https://kubernetes.default.svc/api/v1/namespaces/rbac-poc/pods/> > 
{
  "kind": "PodList",
  "apiVersion": "v1",
  "metadata": {
    "resourceVersion": "56168"
  },
  "items": [
    {
      "metadata": {
        "name": "nginx",
        "namespace": "rbac-poc",
        "uid": "1940087e-6dbc-444c-a3fe-42c943e27447",
        "resourceVersion": "53697",
        "generation": 1,
        "creationTimestamp": "2026-09-08T04:59:05Z",
        "labels": {
          "run": "nginx"
        },
        "managedFields": [
          {
            "manager": "kubectl-run",
            "operation": "Update",
            "apiVersion": "v1",
            "time": "2026-09-08T04:59:05Z",
            "fieldsType": "FieldsV1",
            "fieldsV1": {
              "f:metadata": {
                "f:labels": {
                  ".": {},
                  "f:run": {}
                }
              },
              "f:spec": {
                "f:containers": {
                  "k:{\"name\":\"nginx\"}": {
                    ".": {},
                    "f:image": {},
                    "f:imagePullPolicy": {},
                    "f:name": {},
                    "f:resources": {},
                    "f:terminationMessagePath": {},
                    "f:terminationMessagePolicy": {}
                  }
                },
                "f:dnsPolicy": {},
                "f:enableServiceLinks": {},
                "f:restartPolicy": {},
                "f:schedulerName": {},
                "f:securityContext": {},
                "f:terminationGracePeriodSeconds": {}
              }
            }
          },
          {
            "manager": "kubelet",
            "operation": "Update",
            "apiVersion": "v1",
            "time": "2026-09-09T05:12:32Z",
            "fieldsType": "FieldsV1",
            "fieldsV1": {
              "f:status": {
                "f:conditions": {
                  "k:{\"type\":\"ContainersReady\"}": {
                    ".": {},
                    "f:lastProbeTime": {},
                    "f:lastTransitionTime": {},
                    "f:observedGeneration": {},
                    "f:status": {},
                    "f:type": {}
                  },
                  "k:{\"type\":\"Initialized\"}": {
                    ".": {},
                    "f:lastProbeTime": {},
                    "f:lastTransitionTime": {},
                    "f:observedGeneration": {},
                    "f:status": {},
                    "f:type": {}
                  },
                  "k:{\"type\":\"PodReadyToStartContainers\"}": {
                    ".": {},
                    "f:lastProbeTime": {},
                    "f:lastTransitionTime": {},
                    "f:observedGeneration": {},
                    "f:status": {},
                    "f:type": {}
                  },
                  "k:{\"type\":\"PodScheduled\"}": {
                    "f:observedGeneration": {}
                  },
                  "k:{\"type\":\"Ready\"}": {
                    ".": {},
                    "f:lastProbeTime": {},
                    "f:lastTransitionTime": {},
                    "f:observedGeneration": {},
                    "f:status": {},
                    "f:type": {}
                  }
                },
                "f:containerStatuses": {},
                "f:hostIP": {},
                "f:hostIPs": {},
                "f:observedGeneration": {},
                "f:phase": {},
                "f:podIP": {},
                "f:podIPs": {
                  ".": {},
                  "k:{\"ip\":\"10.244.0.6\"}": {
                    ".": {},
                    "f:ip": {}
                  }
                },
                "f:startTime": {}
              }
            },
            "subresource": "status"
          }
        ]
      },
      "spec": {
        "volumes": [
          {
            "name": "kube-api-access-nd2vw",
            "projected": {
              "sources": [
                {
                  "serviceAccountToken": {
                    "expirationSeconds": 3607,
                    "path": "token"
                  }
                },
                {
                  "configMap": {
                    "name": "kube-root-ca.crt",
                    "items": [
                      {
                        "key": "ca.crt",
                        "path": "ca.crt"
                      }
                    ]
                  }
                },
                {
                  "downwardAPI": {
                    "items": [
                      {
                        "path": "namespace",
                        "fieldRef": {
                          "apiVersion": "v1",
                          "fieldPath": "metadata.namespace"
                        }
                      }
                    ]
                  }
                }
              ],
              "defaultMode": 420
            }
          }
        ],
        "containers": [
          {
            "name": "nginx",
            "image": "nginx",
            "resources": {},
            "volumeMounts": [
              {
                "name": "kube-api-access-nd2vw",
                "readOnly": true,
                "mountPath": "/var/run/secrets/kubernetes.io/serviceaccount"
              }
            ],
            "terminationMessagePath": "/dev/termination-log",
            "terminationMessagePolicy": "File",
            "imagePullPolicy": "Always"
          }
        ],
        "restartPolicy": "Always",
        "terminationGracePeriodSeconds": 30,
        "dnsPolicy": "ClusterFirst",
        "serviceAccountName": "default",
        "serviceAccount": "default",
        "nodeName": "minikube",
        "securityContext": {},
        "schedulerName": "default-scheduler",
        "tolerations": [
          {
            "key": "node.kubernetes.io/not-ready",
            "operator": "Exists",
            "effect": "NoExecute",
            "tolerationSeconds": 300
          },
          {
            "key": "node.kubernetes.io/unreachable",
            "operator": "Exists",
            "effect": "NoExecute",
            "tolerationSeconds": 300
          }
        ],
        "priority": 0,
        "enableServiceLinks": true,
        "preemptionPolicy": "PreemptLowerPriority"
      },
      "status": {
        "observedGeneration": 1,
        "phase": "Running",
        "conditions": [
          {
            "type": "PodReadyToStartContainers",
            "observedGeneration": 1,
            "status": "True",
            "lastProbeTime": null,
            "lastTransitionTime": "2026-09-09T05:12:32Z"
          },
          {
            "type": "Initialized",
            "observedGeneration": 1,
            "status": "True",
            "lastProbeTime": null,
            "lastTransitionTime": "2026-09-08T04:59:05Z"
          },
          {
            "type": "Ready",
            "observedGeneration": 1,
            "status": "True",
            "lastProbeTime": null,
            "lastTransitionTime": "2026-09-09T05:12:32Z"
          },
          {
            "type": "ContainersReady",
            "observedGeneration": 1,
            "status": "True",
            "lastProbeTime": null,
            "lastTransitionTime": "2026-09-09T05:12:32Z"
          },
          {
            "type": "PodScheduled",
            "observedGeneration": 1,
            "status": "True",
            "lastProbeTime": null,
            "lastTransitionTime": "2026-09-08T04:59:05Z"
          }
        ],
        "hostIP": "192.168.49.2",
        "hostIPs": [
          {
            "ip": "192.168.49.2"
          }
        ],
        "podIP": "10.244.0.6",
        "podIPs": [
          {
            "ip": "10.244.0.6"
          }
        ],
        "startTime": "2026-09-08T04:59:05Z",
        "containerStatuses": [
          {
            "name": "nginx",
            "state": {
              "running": {
                "startedAt": "2026-09-09T05:12:31Z"
              }
            },
            "lastState": {
              "terminated": {
                "exitCode": 255,
                "reason": "Error",
                "startedAt": "2026-09-08T04:59:15Z",
                "finishedAt": "2026-09-09T05:12:13Z",
                "containerID": "docker://300843acf468c61690c7195f8f4797aaa9ed91fc71d4201fbbd8eb9e3298d683"
              }
            },
            "ready": true,
            "restartCount": 1,
            "image": "nginx:latest",
            "imageID": "docker-pullable://nginx@sha256:05b8cb60c354a44ab824ea6e7dc69b46d50762cdbe728a347a5b656e6fb3d7c4",
            "containerID": "docker://804066d6b0e256db11d5d76d7d4b7ab8d02c614572c25533e13ae243543bc53b",
            "started": true,
            "resources": {},
            "volumeMounts": [
              {
                "name": "kube-api-access-nd2vw",
                "mountPath": "/var/run/secrets/kubernetes.io/serviceaccount",
                "readOnly": true,
                "recursiveReadOnly": "Disabled"
              }
            ]
          }
        ],
        "qosClass": "BestEffort"
      }
    },
    {
      "metadata": {
        "name": "rbac-test-pod",
        "namespace": "rbac-poc",
        "uid": "f24f0a92-0fe5-45dd-8cbe-d9e37ff9ee9a",
        "resourceVersion": "53707",
        "generation": 1,
        "creationTimestamp": "2026-09-08T09:02:44Z",
        "annotations": {
          "kubectl.kubernetes.io/last-applied-configuration": "{\"apiVersion\":\"v1\",\"kind\":\"Pod\",\"metadata\":{\"annotations\":{},\"name\":\"rbac-test-pod\",\"namespace\":\"rbac-poc\"},\"spec\":{\"containers\":[{\"image\":\"nginx\",\"name\":\"test\"}],\"serviceAccountName\":\"developer\"}}\n"
        },
        "managedFields": [
          {
            "manager": "kubectl-client-side-apply",
            "operation": "Update",
            "apiVersion": "v1",
            "time": "2026-09-08T09:02:44Z",
            "fieldsType": "FieldsV1",
            "fieldsV1": {
              "f:metadata": {
                "f:annotations": {
                  ".": {},
                  "f:kubectl.kubernetes.io/last-applied-configuration": {}
                }
              },
              "f:spec": {
                "f:containers": {
                  "k:{\"name\":\"test\"}": {
                    ".": {},
                    "f:image": {},
                    "f:imagePullPolicy": {},
                    "f:name": {},
                    "f:resources": {},
                    "f:terminationMessagePath": {},
                    "f:terminationMessagePolicy": {}
                  }
                },
                "f:dnsPolicy": {},
                "f:enableServiceLinks": {},
                "f:restartPolicy": {},
                "f:schedulerName": {},
                "f:securityContext": {},
                "f:serviceAccount": {},
                "f:serviceAccountName": {},
                "f:terminationGracePeriodSeconds": {}
              }
            }
          },
          {
            "manager": "kubelet",
            "operation": "Update",
            "apiVersion": "v1",
            "time": "2026-09-09T05:12:34Z",
            "fieldsType": "FieldsV1",
            "fieldsV1": {
              "f:status": {
                "f:conditions": {
                  "k:{\"type\":\"ContainersReady\"}": {
                    ".": {},
                    "f:lastProbeTime": {},
                    "f:lastTransitionTime": {},
                    "f:observedGeneration": {},
                    "f:status": {},
                    "f:type": {}
                  },
                  "k:{\"type\":\"Initialized\"}": {
                    ".": {},
                    "f:lastProbeTime": {},
                    "f:lastTransitionTime": {},
                    "f:observedGeneration": {},
                    "f:status": {},
                    "f:type": {}
                  },
                  "k:{\"type\":\"PodReadyToStartContainers\"}": {
                    ".": {},
                    "f:lastProbeTime": {},
                    "f:lastTransitionTime": {},
                    "f:observedGeneration": {},
                    "f:status": {},
                    "f:type": {}
                  },
                  "k:{\"type\":\"PodScheduled\"}": {
                    "f:observedGeneration": {}
                  },
                  "k:{\"type\":\"Ready\"}": {
                    ".": {},
                    "f:lastProbeTime": {},
                    "f:lastTransitionTime": {},
                    "f:observedGeneration": {},
                    "f:status": {},
                    "f:type": {}
                  }
                },
                "f:containerStatuses": {},
                "f:hostIP": {},
                "f:hostIPs": {},
                "f:observedGeneration": {},
                "f:phase": {},
                "f:podIP": {},
                "f:podIPs": {
                  ".": {},
                  "k:{\"ip\":\"10.244.0.9\"}": {
                    ".": {},
                    "f:ip": {}
                  }
                },
                "f:startTime": {}
              }
            },
            "subresource": "status"
          }
        ]
      },
      "spec": {
        "volumes": [
          {
            "name": "kube-api-access-hhs42",
            "projected": {
              "sources": [
                {
                  "serviceAccountToken": {
                    "expirationSeconds": 3607,
                    "path": "token"
                  }
                },
                {
                  "configMap": {
                    "name": "kube-root-ca.crt",
                    "items": [
                      {
                        "key": "ca.crt",
                        "path": "ca.crt"
                      }
                    ]
                  }
                },
                {
                  "downwardAPI": {
                    "items": [
                      {
                        "path": "namespace",
                        "fieldRef": {
                          "apiVersion": "v1",
                          "fieldPath": "metadata.namespace"
                        }
                      }
                    ]
                  }
                }
              ],
              "defaultMode": 420
            }
          }
        ],
        "containers": [
          {
            "name": "test",
            "image": "nginx",
            "resources": {},
            "volumeMounts": [
              {
                "name": "kube-api-access-hhs42",
                "readOnly": true,
                "mountPath": "/var/run/secrets/kubernetes.io/serviceaccount"
              }
            ],
            "terminationMessagePath": "/dev/termination-log",
            "terminationMessagePolicy": "File",
            "imagePullPolicy": "Always"
          }
        ],
        "restartPolicy": "Always",
        "terminationGracePeriodSeconds": 30,
        "dnsPolicy": "ClusterFirst",
        "serviceAccountName": "developer",
        "serviceAccount": "developer",
        "nodeName": "minikube",
        "securityContext": {},
        "schedulerName": "default-scheduler",
        "tolerations": [
          {
            "key": "node.kubernetes.io/not-ready",
            "operator": "Exists",
            "effect": "NoExecute",
            "tolerationSeconds": 300
          },
          {
            "key": "node.kubernetes.io/unreachable",
            "operator": "Exists",
            "effect": "NoExecute",
            "tolerationSeconds": 300
          }
        ],
        "priority": 0,
        "enableServiceLinks": true,
        "preemptionPolicy": "PreemptLowerPriority"
      },
      "status": {
        "observedGeneration": 1,
        "phase": "Running",
        "conditions": [
          {
            "type": "PodReadyToStartContainers",
            "observedGeneration": 1,
            "status": "True",
            "lastProbeTime": null,
            "lastTransitionTime": "2026-09-09T05:12:34Z"
          },
          {
            "type": "Initialized",
            "observedGeneration": 1,
            "status": "True",
            "lastProbeTime": null,
            "lastTransitionTime": "2026-09-08T09:02:44Z"
          },
          {
            "type": "Ready",
            "observedGeneration": 1,
            "status": "True",
            "lastProbeTime": null,
            "lastTransitionTime": "2026-09-09T05:12:34Z"
          },
          {
            "type": "ContainersReady",
            "observedGeneration": 1,
            "status": "True",
            "lastProbeTime": null,
            "lastTransitionTime": "2026-09-09T05:12:34Z"
          },
          {
            "type": "PodScheduled",
            "observedGeneration": 1,
            "status": "True",
            "lastProbeTime": null,
            "lastTransitionTime": "2026-09-08T09:02:44Z"
          }
        ],
        "hostIP": "192.168.49.2",
        "hostIPs": [
          {
            "ip": "192.168.49.2"
          }
        ],
        "podIP": "10.244.0.9",
        "podIPs": [
          {
            "ip": "10.244.0.9"
          }
        ],
        "startTime": "2026-09-08T09:02:44Z",
        "containerStatuses": [
          {
            "name": "test",
            "state": {
              "running": {
                "startedAt": "2026-09-09T05:12:33Z"
              }
            },
            "lastState": {
              "terminated": {
                "exitCode": 255,
                "reason": "Error",
                "startedAt": "2026-09-08T09:02:47Z",
                "finishedAt": "2026-09-09T05:12:13Z",
                "containerID": "docker://20112ac4dcc482889f21c6d461a57272586ee4c05cf99de7053238432a85286b"
              }
            },
            "ready": true,
            "restartCount": 1,
            "image": "nginx:latest",
            "imageID": "docker-pullable://nginx@sha256:05b8cb60c354a44ab824ea6e7dc69b46d50762cdbe728a347a5b656e6fb3d7c4",
            "containerID": "docker://52763a2aceb8e85b14b5c30abb5f1452b14e1e055437d714637b8a2237e7e890",
            "started": true,
            "resources": {},
            "volumeMounts": [
              {
                "name": "kube-api-access-hhs42",
                "mountPath": "/var/run/secrets/kubernetes.io/serviceaccount",
                "readOnly": true,
                "recursiveReadOnly": "Disabled"
              }
            ]
          }
        ],
        "qosClass": "BestEffort"
      }
    }
  ]
}# 
-----------------------------------------------------------------------------------------------------------------------------------------

* The API Server will:
        Pod
         ↓
        ServiceAccount token
         ↓
        API Server
         ↓
        Authentication
        "Who are you?"
        → developer
         ↓
        RBAC Authorization
        "Can developer get Pods?"
        → YES
         ↓
        Return PodList

* nd the API request was:
        Pod
         ↓
        developer ServiceAccount
         ↓
        token
         ↓
        Kubernetes API Server
         ↓
        Authentication → identify developer
         ↓
        RBAC Authorization → developer can get/list Pods
         ↓
        PodList returned ✅

* So we have completed this part

- You now understand:
        Kubernetes API
               ↓
        API Server
               ↓
        Authentication
               ↓
        Authorization / RBAC
               ↓
        Admission
               ↓
        Resource

- And separately:
        Application Pod
               ↓
        ServiceAccount
               ↓
        Token
               ↓
        API Server
               ↓
        RBAC

# Part 5 — Sidecar Proxy:

- Our real application will eventually look like:

                Kubernetes
                     │
        ┌────────────┴────────────┐
        │                         │
   user-service              order-service
        │                         │
   [app container]           [app container]
   [sidecar proxy]           [sidecar proxy]
        │                         │
        └────── proxy ↔ proxy ────┘

* First, understand the idea **without Istio yet**.
- Suppose our application has:
        ```text
        user-service
             ↓
        order-service
        ```

- Normally:
        ```text
        user-service container
                ↓
           network call
                ↓
        order-service container
        ```

- With a **sidecar proxy**:
        ```text
        user-service Pod
        ┌─────────────────────────┐
        │ App container            │
        │ user-service             │
        │        ↓                 │
        │ Sidecar proxy            │
        └────────┬────────────────┘
                 │
                 │ network
                 ↓
        ┌─────────────────────────┐
        │ Sidecar proxy            │
        │        ↓                 │
        │ App container            │
        │ order-service            │
        └─────────────────────────┘
        ```

**Why do we need the sidecar**?

- Instead of putting networking logic inside every application:
        ```text
        user-service → retries
        order-service → retries
        payment-service → retries
        ...
        ```
     the proxy handles it.

- So your application can simply say:
        > "Call order-service."

- The proxy can handle:
        > "How should I send this request? Should I retry? Should I encrypt it? How long should I wait? How much traffic is going there?"

**Important**:                                                                                                      -->*important points*
--------------
**Sidecar proxy ≠ Service Mesh**
Sidecar proxy = **one proxy attached to a Pod**
Service Mesh = **system that manages communication between many of these proxies**

* For example:
--------------
        ```text
                     Istio
                       │
               ┌───────┴────────┐
               ↓                ↓
         user-service       order-service
         ┌──────────┐       ┌──────────┐
         │ App      │       │ App      │
         │ Proxy ←──┼───────┼→ Proxy   │
         └──────────┘       └──────────┘
        ```


* Let's see a sidecar practically:

We'll create a simple Pod with **two containers**:
        ```text
        Pod
        ├── app container
        └── sidecar container
        ```

* Create a file:
keerthana@Keerthanas-MacBook-Air real-application % kubectl apply -f sidecar-pod.yaml
Error from server (Forbidden): error when creating "sidecar-pod.yaml": pods "sidecar-demo" is forbidden: exceeded quota: pod-quota, requested: pods=1, used: pods=2, limited: pods=2
keerthana@Keerthanas-MacBook-Air real-application % kubectl delete pod pod1 pod2 -n admission-poc
pod "pod1" deleted
pod "pod2" deleted
keerthana@Keerthanas-MacBook-Air real-application % kubectl get pods -n admission-poc
No resources found in admission-poc namespace.
keerthana@Keerthanas-MacBook-Air real-application % kubectl apply -f sidecar-pod.yaml
pod/sidecar-demo created
keerthana@Keerthanas-MacBook-Air real-application % kubectl get pod sidecar-demo -n admission-poc
NAME           READY   STATUS              RESTARTS   AGE
sidecar-demo   0/2     ContainerCreating   0          4s
keerthana@Keerthanas-MacBook-Air real-application % kubectl get pod sidecar-demo -n admission-poc
NAME           READY   STATUS    RESTARTS   AGE
sidecar-demo   2/2     Running   0          11s
keerthana@Keerthanas-MacBook-Air real-application % 

* Your result:
        sidecar-demo   2/2   Running

* means:
        sidecar-demo Pod
        │
        ├── app container      → nginx
        │
        └── sidecar container  → busybox
- Both containers are running inside the same Pod.

* Why same Pod?
        Containers in the same Pod share the same network namespace.

So they can communicate with each other using:
        localhost
- That's one of the key reasons sidecars work well.

**Let's prove there are really 2 containers**:
keerthana@Keerthanas-MacBook-Air real-application % kubectl get pod sidecar-demo -n admission-poc \
  -o jsonpath='{.spec.containers[*].name}'
app sidecar%                                                                                                                            
keerthana@Keerthanas-MacBook-Air real-application % kubectl logs sidecar-demo -n admission-poc -c sidecar
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running
sidecar running

* So now your mental model is:                                                                                         -->*important point*
        Sidecar = an additional container running alongside the main application container in the same Pod.

# Part 6 — Service Mesh with Istio:

*Remember*:                                                                                                            -->*important points*
Sidecar = proxy container beside your app
Service Mesh = manages these proxies across services

* For example:
        user-service Pod
        ┌──────────────────┐
        │ App              │
        │ Istio Proxy      │
        └────────┬─────────┘
                 │
                 │ proxy ↔ proxy
                 ↓
        ┌──────────────────┐
        │ Istio Proxy      │
        │ App              │
        └──────────────────┘
        order-service Pod

* Istio can provide:
        Traffic management — routing, retries, timeouts
        Security — mTLS between services
        Observability — metrics, traces
        Policy — control service-to-service communication

* Installation of istio:
keerthana@Keerthanas-MacBook-Air real-application % istioctl version
zsh: command not found: istioctl
keerthana@Keerthanas-MacBook-Air real-application % curl -L https://istio.io/downloadIstio | sh -
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   102  100   102    0     0    255      0 --:--:-- --:--:-- --:--:--   255
100  5124  100  5124    0     0   2962      0  0:00:01  0:00:01 --:--:--     0

Downloading istio-1.31.0 from https://github.com/istio/istio/releases/download/1.31.0/istio-1.31.0-osx-arm64.tar.gz ...

Istio 1.31.0 download complete!

The Istio release archive has been downloaded to the istio-1.31.0 directory.

To configure the istioctl client tool for your workstation,
add the /Users/keerthana/Desktop/k8s_demo/rbac-poc/real-application/istio-1.31.0/bin directory to your environment path variable with:
         export PATH="$PATH:/Users/keerthana/Desktop/k8s_demo/rbac-poc/real-application/istio-1.31.0/bin"

Begin the Istio pre-installation check by running:
         istioctl x precheck 

Try Istio in ambient mode
        https://istio.io/latest/docs/ambient/getting-started/
Try Istio in sidecar mode
        https://istio.io/latest/docs/setup/getting-started/
Install guides for ambient mode
        https://istio.io/latest/docs/ambient/install/
Install guides for sidecar mode
        https://istio.io/latest/docs/setup/install/

Need more information? Visit https://istio.io/latest/docs/ 
keerthana@Keerthanas-MacBook-Air real-application % ls
README.md               istio-1.31.0            sidecar-pod.yaml
keerthana@Keerthanas-MacBook-Air real-application % cd istio-*/
keerthana@Keerthanas-MacBook-Air istio-1.31.0 % export PATH=$PWD/bin:$PATH
keerthana@Keerthanas-MacBook-Air istio-1.31.0 % istioctl version
Istio is not present in the cluster: no running Istio pods in namespace "istio-system"
client version: 1.31.0
keerthana@Keerthanas-MacBook-Air istio-1.31.0 % istioctl install --set profile=demo -y
        |\          
        | \         
        |  \        
        |   \       
      /||    \      
     / ||     \     
    /  ||      \    
   /   ||       \   
  /    ||        \  
 /     ||         \ 
/______||__________\
____________________
  \__       _____/  
     \_____/        

✔ Istio core installed ⛵️                                                                                                               
✔ Istiod installed 🧠                                                                                                                   
✔ Ingress gateways installed 🛬                                                                                                         
✔ Egress gateways installed 🛫                                                                                                          
✔ Installation complete                                                                                                                 
keerthana@Keerthanas-MacBook-Air istio-1.31.0 % kubectl get pods -n istio-system
NAME                                    READY   STATUS    RESTARTS   AGE
istio-egressgateway-7764fccd4d-jwhbz    1/1     Running   0          23s
istio-ingressgateway-689d459946-qvrwn   1/1     Running   0          23s
istiod-78c5d4cf-q9glq                   1/1     Running   0          37s
keerthana@Keerthanas-MacBook-Air istio-1.31.0 % 

*Now we'll do the important part: automatic sidecar injection*:

* Step 1 — Enable Istio injection for our namespace:
keerthana@Keerthanas-MacBook-Air istio-1.31.0 % kubectl label namespace admission-poc istio-injection=enabled
namespace/admission-poc labeled
keerthana@Keerthanas-MacBook-Air istio-1.31.0 % kubectl get namespace admission-poc --show-labels
NAME            STATUS   AGE   LABELS
admission-poc   Active   53m   istio-injection=enabled,kubernetes.io/metadata.name=admission-poc

* Step 2 — Restart our sidecar-demo Pod:
keerthana@Keerthanas-MacBook-Air istio-1.31.0 % kubectl delete pod sidecar-demo -n admission-poc
pod "sidecar-demo" deleted
keerthana@Keerthanas-MacBook-Air istio-1.31.0 % kubectl apply -f sidecar-pod.yaml
error: the path "sidecar-pod.yaml" does not exist
keerthana@Keerthanas-MacBook-Air istio-1.31.0 % kubectl get pod sidecar-demo -n admission-poc
Error from server (NotFound): pods "sidecar-demo" not found
keerthana@Keerthanas-MacBook-Air istio-1.31.0 % cd ..
keerthana@Keerthanas-MacBook-Air real-application % ls
README.md               istio-1.31.0            sidecar-pod.yaml
keerthana@Keerthanas-MacBook-Air real-application % kubectl apply -f sidecar-pod.yaml
pod/sidecar-demo created
keerthana@Keerthanas-MacBook-Air real-application % kubectl get pod sidecar-demo -n admission-poc
NAME           READY   STATUS            RESTARTS   AGE
sidecar-demo   1/3     PodInitializing   0          4s
keerthana@Keerthanas-MacBook-Air real-application % kubectl get pod sidecar-demo -n admission-poc
NAME           READY   STATUS            RESTARTS   AGE
sidecar-demo   1/3     PodInitializing   0          10s
keerthana@Keerthanas-MacBook-Air real-application % kubectl get pod sidecar-demo -n admission-poc -w
NAME           READY   STATUS    RESTARTS   AGE
sidecar-demo   3/3     Running   0          18s

--------
meaning  3/3 :
--------
app
sidecar
istio-proxy  ← automatically injected by Istio

* Your Pod is:
        sidecar-demo   3/3   Running

* Your YAML had:
        app → your application container
        sidecar → your manually added sidecar
        istio-proxy → Istio automatically injected proxy

* Logs:                                                                                                                           
keerthana@Keerthanas-MacBook-Air real-application % kubectl get pod sidecar-demo -n admission-poc \
  -o jsonpath='{.spec.containers[*].name}'
echo
app sidecar
keerthana@Keerthanas-MacBook-Air real-application % kubectl get pod sidecar-demo -n admission-poc \
  -o jsonpath='{.spec.initContainers[*].name}'
echo
istio-init istio-proxy
keerthana@Keerthanas-MacBook-Air real-application % kubectl describe pod sidecar-demo -n admission-poc | grep -i istio
Labels:           security.istio.io/tlsMode=istio
                  service.istio.io/canonical-name=sidecar-demo
                  service.istio.io/canonical-revision=latest
Annotations:      istio.io/rev: default
                  sidecar.istio.io/status:
                    {"initContainers":["istio-init","istio-proxy"],"containers":null,"volumes":["workload-socket","credential-socket","workload-certs","istio-...
  istio-init:
    Image:         docker.io/istio/proxyv2:1.31.0
    Image ID:      docker-pullable://istio/proxyv2@sha256:e3b973cce2442c2883188d8cf839dff8a21075fab0e00e5079df6ef28c9caf17
      istio-iptables
  istio-proxy:
    Image:         docker.io/istio/proxyv2:1.31.0
    Image ID:      docker-pullable://istio/proxyv2@sha256:e3b973cce2442c2883188d8cf839dff8a21075fab0e00e5079df6ef28c9caf17
      PILOT_CERT_PROVIDER:           istiod
      CA_ADDR:                       istiod.istio-system.svc:15012
      ISTIO_CPU_LIMIT:               2 (limits.cpu)
      ISTIO_META_POD_PORTS:          [
      ISTIO_META_APP_CONTAINERS:     app,sidecar
      ISTIO_META_CLUSTER_ID:         Kubernetes
      ISTIO_META_NODE_NAME:           (v1:spec.nodeName)
      ISTIO_META_INTERCEPTION_MODE:  REDIRECT
      ISTIO_META_WORKLOAD_NAME:      sidecar-demo
      ISTIO_META_OWNER:              kubernetes://apis/v1/namespaces/admission-poc/pods/sidecar-demo
      ISTIO_META_MESH_ID:            cluster.local
      /etc/istio/pod from istio-podinfo (rw)
      /etc/istio/proxy from istio-envoy (rw)
      /var/lib/istio/data from istio-data (rw)
      /var/run/secrets/istio from istiod-ca-cert (rw)
      /var/run/secrets/istio/crl from istio-ca-crl (rw)
      /var/run/secrets/tokens from istio-token (rw)
  istio-envoy:
  istio-data:
  istio-podinfo:
  istio-token:
  istiod-ca-cert:
    Name:      istio-ca-root-cert
  istio-ca-crl:
    Name:      istio-ca-crl
  Normal  Pulled     3m8s   kubelet            Container image "docker.io/istio/proxyv2:1.31.0" already present on machine and can be accessed by the pod
  Normal  Pulled     3m7s   kubelet            Container image "docker.io/istio/proxyv2:1.31.0" already present on machine and can be accessed by the pod
keerthana@Keerthanas-MacBook-Air real-application % 

* So the important distinction is:
        app → your application
        sidecar → your manually created sidecar
        istio-init → Istio setup/init container
        istio-proxy → Istio's Envoy proxy

* So our POC status
        Kubernetes Admission POC → DONE ✅
        Sidecar POC → DONE ✅
        Istio automatic sidecar injection → DONE ✅

# Part: real Service Mesh communication:

* Step 1 — Create user-service and order-service:
keerthana@Keerthanas-MacBook-Air real-application % 
keerthana@Keerthanas-MacBook-Air real-application % kubectl apply -f mesh-demo.yaml
deployment.apps/user-service created
service/user-service created
deployment.apps/order-service created
service/order-service created
keerthana@Keerthanas-MacBook-Air real-application % kubectl get pods -n admission-poc
NAME                            READY   STATUS            RESTARTS   AGE
sidecar-demo                    3/3     Running           0          12m
user-service-68b69db9bb-khgnr   1/2     PodInitializing   0          5s
keerthana@Keerthanas-MacBook-Air real-application % kubectl get pods -n admission-poc
NAME                            READY   STATUS    RESTARTS   AGE
sidecar-demo                    3/3     Running   0          12m
user-service-68b69db9bb-khgnr   2/2     Running   0     
keerthana@Keerthanas-MacBook-Air real-application % kubectl get deployment order-service -n admission-poc
NAME            READY   UP-TO-DATE   AVAILABLE   AGE
order-service   0/1     0            0           65s
keerthana@Keerthanas-MacBook-Air real-application % kubectl get rs -n admission-poc
NAME                       DESIRED   CURRENT   READY   AGE
order-service-7dd6b7964b   1         0         0       70s
user-service-68b69db9bb    1         1         1       70s
keerthana@Keerthanas-MacBook-Air real-application % kubectl create quota pod-quota-mesh --hard=pods=5 -n admission-poc
resourcequota/pod-quota-mesh created
keerthana@Keerthanas-MacBook-Air real-application % kubectl delete resourcequota pod-quota -n admission-poc
resourcequota "pod-quota" deleted
keerthana@Keerthanas-MacBook-Air real-application % kubectl create quota pod-quota --hard=pods=5 -n admission-poc
resourcequota/pod-quota created
keerthana@Keerthanas-MacBook-Air real-application % kubectl get pods -n admission-poc
NAME                            READY   STATUS    RESTARTS   AGE
sidecar-demo                    3/3     Running   0          14m
user-service-68b69db9bb-khgnr   2/2     Running   0          114s
keerthana@Keerthanas-MacBook-Air real-application % kubectl describe rs order-service-7dd6b7964b -n admission-poc
Name:           order-service-7dd6b7964b
Namespace:      admission-poc
Selector:       app=order-service,pod-template-hash=7dd6b7964b
Labels:         app=order-service
                pod-template-hash=7dd6b7964b
Annotations:    deployment.kubernetes.io/desired-replicas: 1
                deployment.kubernetes.io/max-replicas: 2
                deployment.kubernetes.io/revision: 1
Controlled By:  Deployment/order-service
Replicas:       0 current / 1 desired
Pods Status:    0 Running / 0 Waiting / 0 Succeeded / 0 Failed
Pod Template:
  Labels:  app=order-service
           pod-template-hash=7dd6b7964b
  Containers:
   order-service:
    Image:         nginx
    Port:          80/TCP
    Host Port:     0/TCP
    Environment:   <none>
    Mounts:        <none>
  Volumes:         <none>
  Node-Selectors:  <none>
  Tolerations:     <none>
Conditions:
  Type             Status  Reason
  ----             ------  ------
  ReplicaFailure   True    FailedCreate
Events:
  Type     Reason        Age                  From                   Message
  ----     ------        ----                 ----                   -------
  Warning  FailedCreate  2m17s                replicaset-controller  Error creating: pods "order-service-7dd6b7964b-pf4cg" is forbidden: exceeded quota: pod-quota, requested: pods=1, used: pods=2, limited: pods=2
  Warning  FailedCreate  2m17s                replicaset-controller  Error creating: pods "order-service-7dd6b7964b-tscw2" is forbidden: exceeded quota: pod-quota, requested: pods=1, used: pods=2, limited: pods=2
  Warning  FailedCreate  2m16s                replicaset-controller  Error creating: pods "order-service-7dd6b7964b-bfjbz" is forbidden: exceeded quota: pod-quota, requested: pods=1, used: pods=2, limited: pods=2
  Warning  FailedCreate  2m16s                replicaset-controller  Error creating: pods "order-service-7dd6b7964b-5zhd2" is forbidden: exceeded quota: pod-quota, requested: pods=1, used: pods=2, limited: pods=2
  Warning  FailedCreate  2m16s                replicaset-controller  Error creating: pods "order-service-7dd6b7964b-9rwg6" is forbidden: exceeded quota: pod-quota, requested: pods=1, used: pods=2, limited: pods=2
  Warning  FailedCreate  2m16s                replicaset-controller  Error creating: pods "order-service-7dd6b7964b-7t8lq" is forbidden: exceeded quota: pod-quota, requested: pods=1, used: pods=2, limited: pods=2
  Warning  FailedCreate  2m16s                replicaset-controller  Error creating: pods "order-service-7dd6b7964b-6fl2r" is forbidden: exceeded quota: pod-quota, requested: pods=1, used: pods=2, limited: pods=2
  Warning  FailedCreate  2m16s                replicaset-controller  Error creating: pods "order-service-7dd6b7964b-gvqmk" is forbidden: exceeded quota: pod-quota, requested: pods=1, used: pods=2, limited: pods=2
  Warning  FailedCreate  2m15s                replicaset-controller  Error creating: pods "order-service-7dd6b7964b-gtgms" is forbidden: exceeded quota: pod-quota, requested: pods=1, used: pods=2, limited: pods=2
  Warning  FailedCreate  54s (x6 over 2m14s)  replicaset-controller  (combined from similar events): Error creating: pods "order-service-7dd6b7964b-9cdbg" is forbidden: exceeded quota: pod-quota, requested: pods=1, used: pods=2, limited: pods=2
keerthana@Keerthanas-MacBook-Air real-application % kubectl get resourcequota -n admission-poc
NAME             REQUEST     LIMIT   AGE
pod-quota        pods: 2/5           37s
pod-quota-mesh   pods: 2/5           46s
keerthana@Keerthanas-MacBook-Air real-application % kubectl delete resourcequota pod-quota-mesh -n admission-poc
resourcequota "pod-quota-mesh" deleted
keerthana@Keerthanas-MacBook-Air real-application % kubectl get resourcequota -n admission-poc
NAME        REQUEST     LIMIT   AGE
pod-quota   pods: 3/5           67s
keerthana@Keerthanas-MacBook-Air real-application % kubectl scale deployment order-service --replicas=0 -n admission-poc
kubectl scale deployment order-service --replicas=1 -n admission-poc
deployment.apps/order-service scaled
deployment.apps/order-service scaled
keerthana@Keerthanas-MacBook-Air real-application % kubectl get pods -n admission-poc -w
NAME                             READY   STATUS    RESTARTS   AGE
order-service-7dd6b7964b-v6jwf   2/2     Running   0          7s
sidecar-demo                     3/3     Running   0          15m
user-service-68b69db9bb-khgnr    2/2     Running   0          3m15s

* Step 1 — Get inside user-service:
keerthana@Keerthanas-MacBook-Air real-application % kubectl exec -it -n admission-poc \
  deployment/user-service -- bash
E0909 12:14:41.970645   17774 websocket.go:296] Unknown stream id 1, discarding message
                                                                                       root@user-service-68b69db9bb-khgnr:/# curl http:/curl http://order-service
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
html { color-scheme: light dark; }
body { width: 35em; margin: 0 auto;
font-family: Tahoma, Verdana, Arial, sans-serif; }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, nginx is successfully installed and working.
Further configuration is required for the web server, reverse proxy, 
API gateway, load balancer, content cache, or other features.</p>

<p>For online documentation and support please refer to
<a href="https://nginx.org/">nginx.org</a>.<br/>
To engage with the community please visit
<a href="https://community.nginx.org/">community.nginx.org</a>.<br/>
For enterprise grade support, professional services, additional 
security features and capabilities please refer to
<a href="https://f5.com/nginx">f5.com/nginx</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>
root@user-service-68b69db9bb-khgnr:/# exit
exit

- The service-to-service communication works. ✅

* You got the nginx response from:
        curl http://order-service

* So:
        user-service
             ↓
        Kubernetes Service: order-service
             ↓
        order-service Pod
             ↓
        nginx response

* Upto now what we done:                                                                                                -->*important point*

***for one service and one application we can use sidecar proxy then if we have multiple service application we have to use service mesh and it will manage all proxies and it use istio for that?**

**Yes, you understood it correctly.** 👍 Just one small correction: a Service Mesh isn't *required* just because you have multiple services; it's useful when managing service-to-service communication becomes complex.

Think of it like this:
        ```text
        1 service
        ┌─────────────────┐
        │  application    │
        │  + sidecar      │
        └─────────────────┘
        ```
        - You can manually add a sidecar if you need one.

With many services:
        ```text
        user-service    + proxy
        order-service   + proxy
        payment-service + proxy
        notification    + proxy
                ↓
           Service Mesh
                ↓
        manages all proxies
        ```

**Istio** is one implementation of a Service Mesh that manages those proxies.

So your mental model should be:
        > **Sidecar proxy = the individual traffic helper.**
        > **Service Mesh = the system managing traffic across many services/proxies.**
        > **Istio = a Service Mesh platform that does that management.**

And importantly, **Istio itself isn't the proxy**. In our POC, **Envoy is the proxy**, while **Istio manages/configures Envoy proxies**.

keerthana@Keerthanas-MacBook-Air real-application % kubectl logs -n admission-poc \
  deployment/user-service -c istio-proxy --tail=20
2026-09-09T06:40:37.931462Z     info    ads     ADS: new connection for node:1
2026-09-09T06:40:37.931537Z     info    cache   returned workload trust anchor from cache       ttl=23h59m59.068463415s
2026-09-09T06:40:37.931471Z     info    ads     ADS: new connection for node:2
2026-09-09T06:40:37.931653Z     info    cache   returned workload certificate from cache        ttl=23h59m59.068347706s
2026-09-09T06:40:39.248823Z     info    Readiness succeeded in 1.642303918s
2026-09-09T06:40:39.249433Z     info    *Envoy proxy is ready*
[2026-09-09T06:44:57.570Z] "GET / HTTP/1.1" 200 - via_upstream - "-" 0 896 11 5 "-" "curl/8.14.1" "1e471995-0d33-9c87-aaa8-0fff722626cc" "order-service" "10.244.0.21:80" outbound|80||order-service.admission-poc.svc.cluster.local 10.244.0.19:51886 10.109.253.54:80 10.244.0.19:60948 - default

### 1. First: what is a sidecar?

Imagine your application:

```text
┌──────────────────────┐
│       Pod            │
│                      │
│  user-service        │
│                      │
│  sidecar proxy       │
└──────────────────────┘
```

The **sidecar proxy is another container beside your application**.

Its job is to handle network traffic for your application.

Your application doesn't need to know about it.

---

### 2. Why do we need the proxy?

Suppose:

```text
user-service → order-service
```

Normally:

```text
user-service ──────────────→ order-service
```

With a proxy:

```text
user-service → proxy → network → proxy → order-service
```

The proxies can handle things like:

* security/encryption
* traffic monitoring
* retries
* routing
* timeouts
* metrics

So your application code can stay simple.

---

### 3. Then what is Service Mesh?

Having **one proxy** is just a sidecar.

But imagine you have 50 services:

```text
user-service    + proxy
order-service   + proxy
payment-service + proxy
notification    + proxy
...
```

Managing all those proxies together is a **Service Mesh**.

```text
              Istio Service Mesh
                     │
       ┌─────────────┼─────────────┐
       ↓             ↓             ↓
 user-service   order-service   payment-service
    + proxy         + proxy         + proxy
```

**Istio = the system that manages these proxies.**

---

* What we're trying to achieve:
- Currently:
        user-service
             ↓
        order-service

- Istio is already putting Envoy proxies in between:
        user-service
            ↓
        Envoy proxy
            ↓
        Envoy proxy
            ↓
        order-service

- Now we want Istio to make that communication encrypted and authenticated automatically.                                  -->*important point*
- That's called mTLS (mutual TLS).

1. Create mTLS policy:
keerthana@Keerthanas-MacBook-Air real-application % kubectl apply -f mtls.yaml
peerauthentication.security.istio.io/default created
keerthana@Keerthanas-MacBook-Air real-application % kubectl get peerauthentication -n admission-poc
NAME      MODE     AGE
default   STRICT   5s                                                --> *Any service-to-service communication in this namespace must use mutual TLS.*

* What STRICT means:
- Before:
        user-service → order-service
   could communicate without requiring mTLS.

- After:
        user-service
             ↓
        Envoy 🔐
             ↓
        Envoy 🔐
             ↓
        order-service
   Istio requires the workloads to communicate using mutual TLS.

- mTLS = both sides prove their identity + traffic is encrypted.

2. Test our existing communication:
keerthana@Keerthanas-MacBook-Air real-application % kubectl exec -it -n admission-poc \
  deployment/user-service -- \
  curl http://order-service
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
html { color-scheme: light dark; }
body { width: 35em; margin: 0 auto;
font-family: Tahoma, Verdana, Arial, sans-serif; }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, nginx is successfully installed and working.
Further configuration is required for the web server, reverse proxy, 
API gateway, load balancer, content cache, or other features.</p>

<p>For online documentation and support please refer to
<a href="https://nginx.org/">nginx.org</a>.<br/>
To engage with the community please visit
<a href="https://community.nginx.org/">community.nginx.org</a>.<br/>
For enterprise grade support, professional services, additional 
security features and capabilities please refer to
<a href="https://f5.com/nginx">f5.com/nginx</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>
keerthana@Keerthanas-MacBook-Air real-application % 

* Why does normal http:// still work?
        Because your application talks HTTP to the local proxy, and Istio handles the mTLS between the proxies.

* Conceptually:
        user-service
            │
            │ HTTP
            ▼
        user Envoy
            │
            │ 🔐 mTLS
            ▼
        order Envoy
            │
            │ HTTP
            ▼
        order-service

* This is the key benefit:
        Your application doesn't need to implement certificates, encryption, or mTLS itself. Istio/Envoy handles it.

# Part: CSI:

* The key difference you need to understand is:
        PV/PVC = Kubernetes way of requesting/using storage.
        CSI = the plugin interface that lets Kubernetes communicate with different storage systems.                     -->*important point*

1. Check what CSI/storage drivers your Minikube already has:
keerthana@Keerthanas-MacBook-Air real-application % kubectl get csidrivers
No resources found
keerthana@Keerthanas-MacBook-Air real-application % kubectl get storageclass
NAME                 PROVISIONER                RECLAIMPOLICY   VOLUMEBINDINGMODE   ALLOWVOLUMEEXPANSION   AGE
standard (default)   k8s.io/minikube-hostpath   Delete          Immediate           false                  5d2h

Why:
We first check what CSI driver is already available instead of installing something unnecessarily.

2. Install the CSI Hostpath driver:
keerthana@Keerthanas-MacBook-Air real-application % kubectl apply -f https://raw.githubusercontent.com/kubernetes-csi/csi-driver-host-path/master/deploy/kubernetes-1.27/deploy-hostpath.yaml
error: unable to read URL "https://raw.githubusercontent.com/kubernetes-csi/csi-driver-host-path/master/deploy/kubernetes-1.27/deploy-hostpath.yaml", server reported 404 Not Found, status code=404
keerthana@Keerthanas-MacBook-Air real-application % kubectl get csidrivers
No resources found
keerthana@Keerthanas-MacBook-Air real-application % minikube addons list | grep -i csi
│ csi-hostpath-driver         │ minikube │ disabled │ Kubernetes                             │
keerthana@Keerthanas-MacBook-Air real-application % minikube addons enable csi-hostpath-driver
💡  csi-hostpath-driver is an addon maintained by Kubernetes. For any concerns contact minikube on GitHub.
You can view the list of minikube maintainers at: https://github.com/kubernetes/minikube/blob/master/OWNERS
❗  [WARNING] For full functionality, the 'csi-hostpath-driver' addon requires the 'volumesnapshots' addon to be enabled.

You can enable 'volumesnapshots' addon by running: 'minikube addons enable volumesnapshots'

    ▪ Using image registry.k8s.io/sig-storage/csi-attacher:v4.0.0
    ▪ Using image registry.k8s.io/sig-storage/csi-external-health-monitor-controller:v0.7.0
    ▪ Using image registry.k8s.io/sig-storage/csi-node-driver-registrar:v2.6.0
    ▪ Using image registry.k8s.io/sig-storage/hostpathplugin:v1.9.0
    ▪ Using image registry.k8s.io/sig-storage/livenessprobe:v2.8.0
    ▪ Using image registry.k8s.io/sig-storage/csi-resizer:v1.6.0
    ▪ Using image registry.k8s.io/sig-storage/csi-snapshotter:v6.1.0
    ▪ Using image registry.k8s.io/sig-storage/csi-provisioner:v3.3.0
🔎  Verifying csi-hostpath-driver addon...
🌟  The 'csi-hostpath-driver' addon is enabled
keerthana@Keerthanas-MacBook-Air real-application % kubectl get csidrivers
NAME                  ATTACHREQUIRED   PODINFOONMOUNT   STORAGECAPACITY   TOKENREQUESTS   REQUIRESREPUBLISH   MODES                  AGE
hostpath.csi.k8s.io   false            true             true              <unset>         false               Persistent,Ephemeral   109s
keerthana@Keerthanas-MacBook-Air real-application % 

* The flow we want to prove is:
        Pod
         ↓
        PVC
         ↓
        StorageClass
         ↓
        CSI Driver
         ↓
        Storage

3. See the CSI driver's StorageClass:
keerthana@Keerthanas-MacBook-Air real-application % kubectl get storageclass
NAME                 PROVISIONER                RECLAIMPOLICY   VOLUMEBINDINGMODE   ALLOWVOLUMEEXPANSION   AGE
csi-hostpath-sc      hostpath.csi.k8s.io        Delete          Immediate           false                  2m17s
standard (default)   k8s.io/minikube-hostpath   Delete          Immediate           false                  5d2h

4. Create a PVC using CSI:
keerthana@Keerthanas-MacBook-Air real-application % nano csi-pvc.yaml
keerthana@Keerthanas-MacBook-Air real-application % kubectl apply -f csi-pvc.yaml
persistentvolumeclaim/csi-demo-pvc created
keerthana@Keerthanas-MacBook-Air real-application % kubectl get pvc csi-demo-pvc -n admission-poc
NAME           STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS      VOLUMEATTRIBUTESCLASS   AGE
csi-demo-pvc   Bound    pvc-73ac7ed1-6fb1-43c0-9ece-c3f51c6d5a6c   1Gi        RWO            csi-hostpath-sc   <unset>                 12s
keerthana@Keerthanas-MacBook-Air real-application % 

* Your result proves:
        PVC
         ↓
        csi-hostpath-sc
         ↓
        hostpath.csi.k8s.io
         ↓
        PV automatically created
         ↓
        PVC = Bound
- You didn't create that PV manually. The CSI driver handled the provisioning.


5. Prove the CSI volume is actually usable:
keerthana@Keerthanas-MacBook-Air real-application % kubectl apply -f csi-pod.yaml
pod/csi-demo-pod created
keerthana@Keerthanas-MacBook-Air real-application % kubectl get pod csi-demo-pod -n admission-poc
NAME           READY   STATUS            RESTARTS   AGE
csi-demo-pod   0/2     PodInitializing   0          2s
keerthana@Keerthanas-MacBook-Air real-application % kubectl get pod csi-demo-pod -n admission-poc -w
NAME           READY   STATUS    RESTARTS   AGE
csi-demo-pod   2/2     Running   0          7s

keerthana@Keerthanas-MacBook-Air real-application % kubectl exec -n admission-poc csi-demo-pod -c app -- sh -c 'echo "CSI works" > /data/test.txt'
keerthana@Keerthanas-MacBook-Air real-application % kubectl exec -n admission-poc csi-demo-pod -c app -- cat /data/test.txt
CSI works
- proves the application Pod can actually use the CSI-provisioned storage.
- all the important parts:
        PVC
         ↓
        CSI StorageClass
         ↓
        CSI Driver
         ↓
        PV automatically created
         ↓
        Pod mounted the volume
         ↓
        Pod wrote/reads data

# Part: KubeFed:

1. Understand the goal:
* Right now you have:
        Cluster A
          └── user-service

* With KubeFed, the idea is:
                KubeFed
               /       \
        Cluster A     Cluster B
           ↓             ↓
        user-service  user-service
- One Federation control plane can manage workloads across multiple Kubernetes clusters.

2. First check your current clusters:
keerthana@Keerthanas-MacBook-Air real-application % kubectl config get-contexts
CURRENT   NAME                               CLUSTER           AUTHINFO           NAMESPACE
          docker-desktop                     docker-desktop    docker-desktop     
          kubernetes-admin@capi-management   capi-management   kubernetes-admin   
*         minikube                           minikube          minikube           default
keerthana@Keerthanas-MacBook-Air real-application % 

3. Create two small kind clusters:
keerthana@Keerthanas-MacBook-Air real-application % kind create cluster --name fed-cluster1
Creating cluster "fed-cluster1" ...
 ✓ Ensuring node image (kindest/node:v1.36.1) 🖼
 ✓ Preparing nodes 📦  
 ✓ Writing configuration 📜 
 ✓ Starting control-plane 🕹️ 
 ✓ Installing CNI 🔌 
 ✓ Installing StorageClass 💾 
Set kubectl context to "kind-fed-cluster1"
You can now use your cluster with:

kubectl cluster-info --context kind-fed-cluster1

Not sure what to do next? 😅  Check out https://kind.sigs.k8s.io/docs/user/quick-start/
keerthana@Keerthanas-MacBook-Air real-application % kind create cluster --name fed-cluster2
Creating cluster "fed-cluster2" ...
 ✓ Ensuring node image (kindest/node:v1.36.1) 🖼
 ✓ Preparing nodes 📦  
 ✓ Writing configuration 📜 
 ✓ Starting control-plane 🕹️ 
 ✓ Installing CNI 🔌 
 ✓ Installing StorageClass 💾 
Set kubectl context to "kind-fed-cluster2"
You can now use your cluster with:

kubectl cluster-info --context kind-fed-cluster2

Not sure what to do next? 😅  Check out https://kind.sigs.k8s.io/docs/user/quick-start/
keerthana@Keerthanas-MacBook-Air real-application % kubectl config get-contexts
CURRENT   NAME                               CLUSTER             AUTHINFO            NAMESPACE
          docker-desktop                     docker-desktop      docker-desktop      
          kind-fed-cluster1                  kind-fed-cluster1   kind-fed-cluster1   
*         kind-fed-cluster2                  kind-fed-cluster2   kind-fed-cluster2   
          kubernetes-admin@capi-management   capi-management     kubernetes-admin    
          minikube                           minikube            minikube            default
keerthana@Keerthanas-MacBook-Air real-application % 

keerthana@Keerthanas-MacBook-Air real-application % kubectl get nodes --context kind-fed-cluster1
NAME                         STATUS   ROLES           AGE    VERSION
fed-cluster1-control-plane   Ready    control-plane   105s   v1.36.1
keerthana@Keerthanas-MacBook-Air real-application % kubectl get nodes --context kind-fed-cluster2
NAME                         STATUS   ROLES           AGE   VERSION
fed-cluster2-control-plane   Ready    control-plane   92s   v1.36.1
keerthana@Keerthanas-MacBook-Air real-application % 

- Both clusters are Ready. ✅

4. Let's do the multi-cluster concept practically:
* First create a namespace in both:
keerthana@Keerthanas-MacBook-Air real-application % kubectl create namespace multi-cluster --context kind-fed-cluster1
namespace/multi-cluster created
keerthana@Keerthanas-MacBook-Air real-application % kubectl create namespace multi-cluster --context kind-fed-cluster2
namespace/multi-cluster created
keerthana@Keerthanas-MacBook-Air real-application % 

5. Deploy the same app to both clusters:
keerthana@Keerthanas-MacBook-Air real-application % kubectl apply -f multi-cluster-app.yaml --context kind-fed-cluster1
deployment.apps/user-service created
keerthana@Keerthanas-MacBook-Air real-application % kubectl apply -f multi-cluster-app.yaml --context kind-fed-cluster2
deployment.apps/user-service created
keerthana@Keerthanas-MacBook-Air real-application % kubectl get pods -n multi-cluster --context kind-fed-cluster1
NAME                            READY   STATUS    RESTARTS   AGE
user-service-6b8454fb47-mm5rd   1/1     Running   0          20s
keerthana@Keerthanas-MacBook-Air real-application % kubectl get pods -n multi-cluster --context kind-fed-cluster2
NAME                            READY   STATUS    RESTARTS   AGE
user-service-6b8454fb47-rbglz   1/1     Running   0          19s
keerthana@Keerthanas-MacBook-Air real-application % 

- Multi-cluster deployment is working. ✅

* You now have:
        fed-cluster1
        └── user-service → Running

        fed-cluster2
        └── user-service → Running

