# Part 1 — Basic RBAC ✅ DONE

Completed:

* Namespace
* ServiceAccount
* Role
* RoleBinding
* `kubectl auth can-i`
* Allowed vs denied operations
* Actual `Forbidden` test

You understand:

```text
Role = permissions
RoleBinding = gives permissions to someone
```

📝 YAML file Broken Down:
============================
1️⃣ Role (The Permission)
yaml
Role: pod-reader
├── WHAT can you do?
│   ├── get pods ✅
│   └── list pods ✅
└── WHERE?
    └── in namespace: rbac-poc
2️⃣ RoleBinding (The Assignment)
yaml
RoleBinding: pod-reader-binding
├── WHO gets it?
│   └── ServiceAccount: test-user (in rbac-poc namespace)
├── WHAT permission?
│   └── Role: pod-reader
└── WHERE?
    └── in namespace: rbac-poc


🔄 How They Work Together
========================
1. Create Role (Define permission)
   └── "Anyone with this role can list pods"
   
2. Create RoleBinding (Assign permission)  
   └── "test-user gets the pod-reader role"
   
3. Result
   └── test-user can now list pods ✅

---

# Terminal Logs:

keerthana@Keerthanas-MacBook-Air rbac-poc % minikube start
😄  minikube v1.38.1 on Darwin 26.4.1 (arm64)
✨  Using the docker driver based on existing profile
👍  Starting "minikube" primary control-plane node in "minikube" cluster
🚜  Pulling base image v0.0.50 ...
🔄  Restarting existing docker container for "minikube" ...
🐳  Preparing Kubernetes v1.35.1 on Docker 29.2.1 ...
🔎  Verifying Kubernetes components...
🌟  Enabled addons: 

👍  Starting "minikube-m02" worker node in "minikube" cluster
🚜  Pulling base image v0.0.50 ...
🤷  docker "minikube-m02" container is missing, will recreate.
🔥  Creating docker container (CPUs=2, Memory=3072MB) ...
🌐  Found network options:
    ▪ NO_PROXY=192.168.49.2
🐳  Preparing Kubernetes v1.35.1 on Docker 29.2.1 ...
    ▪ env NO_PROXY=192.168.49.2
🔎  Verifying Kubernetes components...

❗  /usr/local/bin/kubectl is version 1.32.2, which may have incompatibilities with Kubernetes 1.35.1.
    ▪ Want kubectl v1.35.1? Try 'minikube kubectl -- get pods -A'
🏄  Done! kubectl is now configured to use "minikube" cluster and "default" namespace by default
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl create namespace rbac-poc
namespace/rbac-poc created
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl get ns
NAME              STATUS   AGE
default           Active   3d21h
kube-node-lease   Active   3d21h
kube-public       Active   3d21h
kube-system       Active   3d21h
rbac-poc          Active   4s
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl create serviceaccount test-user -n rbac-poc
serviceaccount/test-user created
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl get serviceaccount -n rbac-poc
NAME        AGE
default     25s
test-user   5s
keerthana@Keerthanas-MacBook-Air rbac-poc % 



keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl apply -f role.yaml
role.rbac.authorization.k8s.io/pod-reader created
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl get role -n rbac-poc
NAME         CREATED AT
pod-reader   2026-09-08T04:52:09Z
keerthana@Keerthanas-MacBook-Air rbac-poc % 


* What this means

This Role says:
--------------
test-user can *get and list Pods*.

But cannot:
===========
create pods
delete pods
update pods

Important: Role only defines the permission. It doesn't give the permission to anyone yet.


keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl apply -f rolebinding.yaml
rolebinding.rbac.authorization.k8s.io/pod-reader-binding created
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl get rolebinding -n rbac-poc
NAME                 ROLE              AGE
pod-reader-binding   Role/pod-reader   8s
keerthana@Keerthanas-MacBook-Air rbac-poc % 


Now the flow is:
===============
test-user
    ↓
RoleBinding
    ↓
pod-reader Role
    ↓
get + list Pods

## Test the permission:

keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i get pods \
  --as=system:serviceaccount:rbac-poc:test-user \
  -n rbac-poc
yes
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i list pods \
  --as=system:serviceaccount:rbac-poc:test-user \
  -n rbac-poc
yes
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i delete pods \
  --as=system:serviceaccount:rbac-poc:test-user \
  -n rbac-poc
no
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i create pods \
  --as=system:serviceaccount:rbac-poc:test-user \
  -n rbac-poc
no
keerthana@Keerthanas-MacBook-Air rbac-poc % 

* RBAC result proves the setup:
====================================
test-user
   ↓
RoleBinding
   ↓
pod-reader
   ↓
┌──────────────┐
│ get pods  ✅ │
│ list pods ✅ │
│ create    ❌ │
│ delete    ❌ │
└──────────────┘

* The important thing you just demonstrated is:
        **RBAC does not give general access. It gives only the specific permissions defined in the Role.**

### Let's prove it with an actual Pod:

keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl run nginx --image=nginx -n rbac-poc
pod/nginx created
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl get pods -n rbac-poc
NAME    READY   STATUS              RESTARTS   AGE
nginx   0/1     ContainerCreating   0          5s
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl get pods -n rbac-poc
NAME    READY   STATUS              RESTARTS   AGE
nginx   0/1     ContainerCreating   0          9s
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl get pods -n rbac-poc -w
NAME    READY   STATUS    RESTARTS   AGE
nginx   1/1     Running   0          12s

* Test test-user can see the Pod:
=================================
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i get pods \
  --as=system:serviceaccount:rbac-poc:test-user \
  -n rbac-poc
yes
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl get pods -n rbac-poc \
  --as=system:serviceaccount:rbac-poc:test-user
NAME    READY   STATUS    RESTARTS   AGE
nginx   1/1     Running   0          64s
keerthana@Keerthanas-MacBook-Air rbac-poc %                                       

* Try deleting the Pod as test-user:
===================================
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl delete pod nginx \
  --as=system:serviceaccount:rbac-poc:test-user \
  -n rbac-poc
Error from server (Forbidden): pods "nginx" is forbidden: User "system:serviceaccount:rbac-poc:test-user" cannot delete resource "pods"in API group "" in the namespace "rbac-poc"
keerthana@Keerthanas-MacBook-Air rbac-poc % 

- Expected:
-----------
Error from server (Forbidden)

That's the real proof.

Why?

Our Role contains only:

verbs:
  - get
  - list

There is no:

- delete

So Kubernetes rejects the request.

**upto now proven**:
--------------------------
test-user
   ↓
RoleBinding
   ↓
pod-reader Role
   ↓
┌─────────────────────────┐
│ get pods       → yes ✅  │
│ list pods      → yes ✅  │
│ delete pods    → no  ❌  │
│ create pods    → no  ❌  │
└─────────────────────────┘

#### Final Part — Role vs ClusterRole:

* Role
=======
Your current Role:

```yaml
kind: Role
metadata:
  namespace: rbac-poc
```

means:

> Permissions are limited to **`rbac-poc` namespace**.

For example:

```text
test-user
   ↓
Role
   ↓
rbac-poc namespace
   ↓
Pods → get/list
```

It cannot automatically read Pods in another namespace.


* ClusterRole
================
A `ClusterRole` is used when permissions need to apply **cluster-wide** or to cluster-scoped resources.

Think:

```text
Role
 ↓
ONE namespace
```

versus:

```text
ClusterRole
 ↓
Cluster-wide permissions
```

And the binding changes too:

```text
Role + RoleBinding
       ↓
specific namespace
```

```text
ClusterRole + ClusterRoleBinding
       ↓
cluster-wide
```

* Your mental model
===================
Remember just this:

> **Role = what can be done in one namespace.**
> **RoleBinding = who gets that permission.**
> **ClusterRole = broader/cluster-level permission definition.**
> **ClusterRoleBinding = gives ClusterRole permissions cluster-wide.**

##### Cleanup

```bash
kubectl delete namespace rbac-poc
```

That removes the Pod, ServiceAccount, Role and RoleBinding together.

Then verify:

```bash
kubectl get ns
```

`rbac-poc` should be gone.


# Part 2 = three users with different permissions:

viewer     → read Pods only
developer  → read + create + update + delete Pods
admin      → everything in rbac-poc

keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl create serviceaccount viewer -n rbac-poc
kubectl create serviceaccount developer -n rbac-poc
kubectl create serviceaccount admin -n rbac-poc
serviceaccount/viewer created
serviceaccount/developer created
serviceaccount/admin created
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl get serviceaccount -n rbac-poc
NAME        AGE
admin       21s
default     51m
developer   21s
test-user   51m
viewer      21s
keerthana@Keerthanas-MacBook-Air rbac-poc % 


keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl apply -f viewer-role.yaml
role.rbac.authorization.k8s.io/viewer-role created
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl apply -f developer-role.yaml
role.rbac.authorization.k8s.io/developer-role created
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl apply -f admin-role.yaml
role.rbac.authorization.k8s.io/admin-role created
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl apply -f rbac-bindings.yaml
rolebinding.rbac.authorization.k8s.io/viewer-binding created
rolebinding.rbac.authorization.k8s.io/developer-binding created
rolebinding.rbac.authorization.k8s.io/admin-binding created
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl get roles,rolebindings -n rbac-poc
NAME                                            CREATED AT
role.rbac.authorization.k8s.io/admin-role       2026-09-08T05:43:14Z
role.rbac.authorization.k8s.io/developer-role   2026-09-08T05:42:57Z
role.rbac.authorization.k8s.io/pod-reader       2026-09-08T04:52:09Z
role.rbac.authorization.k8s.io/viewer-role      2026-09-08T05:42:40Z

NAME                                                       ROLE                  AGE
rolebinding.rbac.authorization.k8s.io/admin-binding        Role/admin-role       7s
rolebinding.rbac.authorization.k8s.io/developer-binding    Role/developer-role   7s
rolebinding.rbac.authorization.k8s.io/pod-reader-binding   Role/pod-reader       50m
rolebinding.rbac.authorization.k8s.io/viewer-binding       Role/viewer-role      7s
keerthana@Keerthanas-MacBook-Air rbac-poc % 


* Now test the 3 users:
=======================

- Viewer:

keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i get pods \
  --as=system:serviceaccount:rbac-poc:viewer \
  -n rbac-poc
yes
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i delete pods \
  --as=system:serviceaccount:rbac-poc:viewer \
  -n rbac-poc
no
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i create pods \
  --as=system:serviceaccount:rbac-poc:viewer \
  -n rbac-poc
no
keerthana@Keerthanas-MacBook-Air rbac-poc % 

- Developer:

keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i get pods \
  --as=system:serviceaccount:rbac-poc:developer \
  -n rbac-poc
yes
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i create pods \
  --as=system:serviceaccount:rbac-poc:developer \
  -n rbac-poc
yes
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i delete pods \
  --as=system:serviceaccount:rbac-poc:developer \
  -n rbac-poc
yes
keerthana@Keerthanas-MacBook-Air rbac-poc % 

- Admin:

keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i create pods \
  --as=system:serviceaccount:rbac-poc:admin \
  -n rbac-poc
yes
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i delete pods \
  --as=system:serviceaccount:rbac-poc:admin \
  -n rbac-poc
yes
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i create deployments \
  --as=system:serviceaccount:rbac-poc:admin \
  -n rbac-poc
yes
keerthana@Keerthanas-MacBook-Air rbac-poc % 

- The key lesson
----------------
VIEWER
  get/list/watch
       ↓
     Pods


DEVELOPER
  get/list/watch/create/update/delete
       ↓
     Pods


ADMIN
  everything
       ↓
  everything in rbac-poc


# Part 3 — RBAC for different resources:

* Step 1 — Create developer-resources-role.yaml:

keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl apply -f developer-resources-role.yaml
role.rbac.authorization.k8s.io/developer-resources-role created
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl get role -n rbac-poc
NAME                       CREATED AT
admin-role                 2026-09-08T05:43:14Z
developer-resources-role   2026-09-08T05:51:18Z
developer-role             2026-09-08T05:42:57Z
pod-reader                 2026-09-08T04:52:09Z
viewer-role                2026-09-08T05:42:40Z
keerthana@Keerthanas-MacBook-Air rbac-poc % 

* Step 2 — Bind this Role to developer:

keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl apply -f developer-resources-binding.yaml
rolebinding.rbac.authorization.k8s.io/developer-resources-binding created
keerthana@Keerthanas-MacBook-Air rbac-poc % 

* Step 3 — Test each resource:

keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i create pods \
  --as=system:serviceaccount:rbac-poc:developer \
  -n rbac-poc
yes
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i create deployments \
  --as=system:serviceaccount:rbac-poc:developer \
  -n rbac-poc
yes
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i get services \
  --as=system:serviceaccount:rbac-poc:developer \
  -n rbac-poc
yes
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i delete services \
  --as=system:serviceaccount:rbac-poc:developer \
  -n rbac-poc
no
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i create configmaps \
  --as=system:serviceaccount:rbac-poc:developer \
  -n rbac-poc
yes
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i delete configmaps \
  --as=system:serviceaccount:rbac-poc:developer \
  -n rbac-poc
yes
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i get secrets \
  --as=system:serviceaccount:rbac-poc:developer \
  -n rbac-poc
yes
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i delete secrets \
  --as=system:serviceaccount:rbac-poc:developer \
  -n rbac-poc
no
keerthana@Keerthanas-MacBook-Air rbac-poc % 

* Available Commands:
  can-i         Check whether an action is allowed
  reconcile     Reconciles rules for RBAC role, role binding, cluster role, and cluster role binding objects
  whoami        Experimental: Check self subject attributes

# Part 4 — Namespace Isolation:

1. Create a second namespace:
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl create namespace rbac-test
namespace/rbac-test created
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl get ns
NAME              STATUS   AGE
default           Active   3d23h
kube-node-lease   Active   3d23h
kube-public       Active   3d23h
kube-system       Active   3d23h
rbac-poc          Active   104m
rbac-test         Active   7s
keerthana@Keerthanas-MacBook-Air rbac-poc % 

2. Create a Pod in the second namespace:
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl run nginx-test --image=nginx -n rbac-test
pod/nginx-test created
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl get pods -n rbac-test -w
NAME         READY   STATUS    RESTARTS   AGE
nginx-test   1/1     Running   0          5s

3. Test developer in rbac-poc:
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i get deployments \ 
  --as=system:serviceaccount:rbac-poc:developer \
  -n rbac-poc
yes

4. Now the important test:
*Use the same developer, but ask for access to rbac-test*:
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i get deployments \
  --as=system:serviceaccount:rbac-poc:developer \
  -n rbac-test
no

- Why?
-------
Your Role was created here:

metadata:
  name: developer-resources-role
  namespace: rbac-poc

And the RoleBinding is also:

namespace: rbac-poc

So the permission applies only there.

developer
    ↓
RoleBinding
    ↓
Role
    ↓
rbac-poc

- It does not automatically cross into:
--------------------------------------
rbac-test

5. don't confuse namespace with ServiceAccount:
- Your ServiceAccount is:
------------------------
system:serviceaccount:rbac-poc:developer

That identity belongs to rbac-poc.

- But we're asking:
------------------
Can that identity access rbac-test?

Answer:

NO ❌

*That's namespace isolation*.

6. See the actual Kubernetes objects:
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl get role,rolebinding -n rbac-poc
NAME                                                      CREATED AT
role.rbac.authorization.k8s.io/admin-role                 2026-09-08T05:43:14Z
role.rbac.authorization.k8s.io/developer-resources-role   2026-09-08T05:51:18Z
role.rbac.authorization.k8s.io/developer-role             2026-09-08T05:42:57Z
role.rbac.authorization.k8s.io/pod-reader                 2026-09-08T04:52:09Z
role.rbac.authorization.k8s.io/viewer-role                2026-09-08T05:42:40Z

NAME                                                                ROLE                            AGE
rolebinding.rbac.authorization.k8s.io/admin-binding                 Role/admin-role                 60m
rolebinding.rbac.authorization.k8s.io/developer-binding             Role/developer-role             60m
rolebinding.rbac.authorization.k8s.io/developer-resources-binding   Role/developer-resources-role   49m
rolebinding.rbac.authorization.k8s.io/pod-reader-binding            Role/pod-reader                 111m
rolebinding.rbac.authorization.k8s.io/viewer-binding                Role/viewer-role                60m
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl get role,rolebinding -n rbac-test
No resources found in rbac-test namespace.                                                                 -->*That's exactly why access is denied*.
keerthana@Keerthanas-MacBook-Air rbac-poc % 

**The key lesson**:
-------------------
Role = permission within a namespace.                                                                       -->*important note*

- So:
----
Role
 ↓
rbac-poc
 ↓
developer can access resources here

- but:
-----
Role
 ↓
rbac-test
 ↓
developer has no permission

# Part 5 — ClusterRole:

* see the difference between Role and ClusterRole practically:

Currently:

developer
   ↓
Role
   ↓
rbac-poc only

- We'll create a ClusterRole that can read Pods.

1. Create pod-reader-clusterrole.yaml:
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl apply -f pod-reader-clusterrole.yaml
clusterrole.rbac.authorization.k8s.io/pod-reader-clusterrole created
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl get clusterrole pod-reader-clusterrole
NAME                     CREATED AT
pod-reader-clusterrole   2026-09-08T06:50:51Z
keerthana@Keerthanas-MacBook-Air rbac-poc % 

Notice *there is no namespace:*.

* That's the first big difference:                                                                                  -->*important note*

Role
→ has namespace

ClusterRole
→ no namespace

2. Create ClusterRoleBinding:
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl apply -f pod-reader-clusterbinding.yaml
clusterrolebinding.rbac.authorization.k8s.io/pod-reader-clusterbinding created
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl get clusterrolebinding pod-reader-clusterbinding
NAME                        ROLE                                 AGE
pod-reader-clusterbinding   ClusterRole/pod-reader-clusterrole   23s
keerthana@Keerthanas-MacBook-Air rbac-poc % 

3. Test in rbac-poc:
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i get pods \
  --as=system:serviceaccount:rbac-poc:developer \
  -n rbac-poc
yes

4. Test in rbac-test:
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i get pods \
  --as=system:serviceaccount:rbac-poc:developer \
  -n rbac-test
yes

**This is the difference you wanted to see**.

- Previously:
-------------
Role
 ↓
rbac-poc
 ↓
rbac-test → NO

- Now:
------
ClusterRole
      ↓
ClusterRoleBinding
      ↓
developer
      ↓
rbac-poc → YES
rbac-test → YES

5. Test another namespace:
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i get pods \
  --as=system:serviceaccount:rbac-poc:developer \
  -n kube-system
yes

- Don't actually access or modify anything in kube-system; we're only asking Kubernetes whether the permission exists.

6. But developer still cannot delete Pods:

- Our ClusterRole only has:
--------------------------
verbs:
  - get
  - list
  - watch

keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i delete pods \
  --as=system:serviceaccount:rbac-poc:developer \
  -n rbac-test
no
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i create pods \
  --as=system:serviceaccount:rbac-poc:developer \
  -n rbac-test
no

*So ClusterRole doesn't mean "admin."*                                                                              -->*important note*
It means:
---------
A reusable permission definition that can be granted cluster-wide, depending on how it is bound.

**MUST understand**:

- this incorrectly:
-----------------
❌ ClusterRole = always cluster-wide

- The more accurate model is:
----------------------------
ClusterRole
    │
    ├── ClusterRoleBinding
    │       ↓
    │   cluster-wide
    │
    └── RoleBinding
            ↓
        one namespace


# Part 6 — ClusterRole + RoleBinding:

* Now the RBAC picture should be clear
------------------------------------
You have now tested both ways:

1. ClusterRoleBinding
ClusterRole
     ↓
ClusterRoleBinding
     ↓
developer
     ↓
ALL namespaces

2. RoleBinding + ClusterRole
ClusterRole
     ↓
RoleBinding
     ↓
developer
     ↓
ONE namespace

3. Role + RoleBinding
Role
 ↓
RoleBinding
 ↓
developer
 ↓
ONE namespace

* The difference:

| Permission  | Binding            | Scope         |
| ----------- | ------------------ | ------------- |
| Role        | RoleBinding        | One namespace |
| ClusterRole | RoleBinding        | One namespace |
| ClusterRole | ClusterRoleBinding | Cluster-wide  |

* Terminal logs and explain:

keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl apply -f clusterrole-rolebinding.yaml
rolebinding.rbac.authorization.k8s.io/pod-reader-from-clusterrole created
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl get rolebinding -n rbac-test
NAME                          ROLE                                 AGE
pod-reader-from-clusterrole   ClusterRole/pod-reader-clusterrole   5s
keerthana@Keerthanas-MacBook-Air rbac-poc % 

- Test rbac-test:
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i get pods \
  --as=system:serviceaccount:rbac-poc:developer \
  -n rbac-test
yes

- Test another namespace:
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i get pods \
  --as=system:serviceaccount:rbac-poc:developer \
  -n default
yes                                                                             -->*It's because earlier we created: So the developer already has cluster-wide read access* 

- Test create:
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i create pods \
  --as=system:serviceaccount:rbac-poc:developer \
  -n rbac-test
no

keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i delete pods \
  --as=system:serviceaccount:rbac-poc:developer \
  -n rbac-test
no

* To prove Part 6 specifically:

We can temporarily remove the earlier ClusterRoleBinding:
=========================================================
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl delete clusterrolebinding pod-reader-clusterbinding
clusterrolebinding.rbac.authorization.k8s.io "pod-reader-clusterbinding" deleted
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i get pods \
  --as=system:serviceaccount:rbac-poc:developer \
  -n rbac-test
yes
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i get pods \
  --as=system:serviceaccount:rbac-poc:developer \
  -n default
no

* Your result:

rbac-test → yes
default   → no

means:
======
ClusterRole + RoleBinding = ClusterRole permissions are available only in the namespace where the RoleBinding exists.

So your RBAC understanding now is:
=================================
Role + RoleBinding
    → one namespace

ClusterRole + RoleBinding
    → one namespace

ClusterRole + ClusterRoleBinding
    → cluster-wide


# Part 7 — ServiceAccount inside a Pod:

So Part 7 proves the full real-world flow:
-------------------------------------------
**Application/Pod → ServiceAccount → Token → Kubernetes API → RBAC → Allow/Deny**

keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl apply -f rbac-pod.yaml
pod/rbac-test-pod created
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl get pod rbac-test-pod -n rbac-poc
NAME            READY   STATUS    RESTARTS   AGE
rbac-test-pod   1/1     Running   0          4s

**let's prove the Pod is actually using those RBAC permissions.**:

* Step 1 — Check the ServiceAccount:
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl get pod rbac-test-pod -n rbac-poc \
  -o jsonpath='{.spec.serviceAccountName}'
developer%                                                                                                                          

* Step 2 — Enter the Pod:

The main goal is to see:
========================
Pod
 ↓
developer ServiceAccount
 ↓
RBAC permissions
 ↓
Kubernetes API

keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl exec -it rbac-test-pod -n rbac-poc -- /bin/sh
# cat /var/run/secrets/kubernetes.io/serviceaccount/namespace
rbac-poc# ls /var/run/secrets/kubernetes.io/serviceaccount/
ca.crt  namespace  token
# TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
# curl -k \
  -H "Authorization: Bearer $TOKEN" \
  https://kubernetes.default.svc/api/v1/namespaces/rbac-poc/pods    
{
  "kind": "Status",
  "apiVersion": "v1",
  "metadata": {},
  "status": "Failure",
  "message": "namespaces \"rbac-poc\" is forbidden: User \"system:serviceaccount:rbac-poc:developer\" cannot get resource \"namespaces\" in API group \"\" in the namespace \"rbac-poc\"",
  "reason": "Forbidden",
  "details": {
    "name": "rbac-poc",
    "kind": "namespaces"
  },
  "code": 403
}# 
# curl -k \
  -H "Authorization: Bearer $TOKEN" \
  https://kubernetes.default.svc/api/v1/namespaces/rbac-poc/pods/> > 
{
  "kind": "PodList",
  "apiVersion": "v1",
  "metadata": {
    "resourceVersion": "42131"
  },
  "items": [
    {
      "metadata": {
        "name": "nginx",
        "namespace": "rbac-poc",
        "uid": "1940087e-6dbc-444c-a3fe-42c943e27447",
        "resourceVersion": "33421",
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
            "time": "2026-09-08T04:59:15Z",
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
            "lastTransitionTime": "2026-09-08T04:59:15Z"
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
            "lastTransitionTime": "2026-09-08T04:59:15Z"
          },
          {
            "type": "ContainersReady",
            "observedGeneration": 1,
            "status": "True",
            "lastProbeTime": null,
            "lastTransitionTime": "2026-09-08T04:59:15Z"
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
        "podIP": "10.244.0.9",
        "podIPs": [
          {
            "ip": "10.244.0.9"
          }
        ],
        "startTime": "2026-09-08T04:59:05Z",
        "containerStatuses": [
          {
            "name": "nginx",
            "state": {
              "running": {
                "startedAt": "2026-09-08T04:59:15Z"
              }
            },
            "lastState": {},
            "ready": true,
            "restartCount": 0,
            "image": "nginx:latest",
            "imageID": "docker-pullable://nginx@sha256:05b8cb60c354a44ab824ea6e7dc69b46d50762cdbe728a347a5b656e6fb3d7c4",
            "containerID": "docker://300843acf468c61690c7195f8f4797aaa9ed91fc71d4201fbbd8eb9e3298d683",
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
        "resourceVersion": "41774",
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
            "time": "2026-09-08T09:02:47Z",
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
                  "k:{\"ip\":\"10.244.0.11\"}": {
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
            "lastTransitionTime": "2026-09-08T09:02:47Z"
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
            "lastTransitionTime": "2026-09-08T09:02:47Z"
          },
          {
            "type": "ContainersReady",
            "observedGeneration": 1,
            "status": "True",
            "lastProbeTime": null,
            "lastTransitionTime": "2026-09-08T09:02:47Z"
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
        "podIP": "10.244.0.11",
        "podIPs": [
          {
            "ip": "10.244.0.11"
          }
        ],
        "startTime": "2026-09-08T09:02:44Z",
        "containerStatuses": [
          {
            "name": "test",
            "state": {
              "running": {
                "startedAt": "2026-09-08T09:02:47Z"
              }
            },
            "lastState": {},
            "ready": true,
            "restartCount": 0,
            "image": "nginx:latest",
            "imageID": "docker-pullable://nginx@sha256:05b8cb60c354a44ab824ea6e7dc69b46d50762cdbe728a347a5b656e6fb3d7c4",
            "containerID": "docker://20112ac4dcc482889f21c6d461a57272586ee4c05cf99de7053238432a85286b",
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

Your RBAC permission is:
=======================
developer
   ↓
ClusterRole pod-reader-clusterrole
   ↓
pods: get, list, watch
   ↓
RoleBinding in rbac-test

*So importantly, the developer ServiceAccount does NOT have the same permissions everywhere.*

That's the important flow:
=========================
Pod
 ↓
developer ServiceAccount
 ↓
ServiceAccount token
 ↓
Kubernetes API
 ↓
RBAC checks permissions
 ↓
pods → get/list → ALLOWED

Your API request returned:
=========================
"kind": "PodList"

So:
====
rbac-test-pod
      ↓
developer ServiceAccount
      ↓
ServiceAccount token
      ↓
Kubernetes API
      ↓
RBAC checks
      ↓
GET pods in rbac-poc → ALLOWED ✅

* Now prove DENIED
-------------------
Still inside the Pod, run:

keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl exec -it rbac-test-pod -n rbac-poc -- /bin/sh
# curl -k \
  -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  https://kubernetes.default.svc/api/v1/namespaces/rbac-poc/pods/nginx> > > 
{
  "kind": "Status",
  "apiVersion": "v1",
  "metadata": {},
  "status": "Failure",
  "message": "pods \"nginx\" is forbidden: User \"system:anonymous\" cannot delete resource \"pods\" in API group \"\" in the namespace \"rbac-poc\"",
  "reason": "Forbidden",
  "details": {
    "name": "nginx",
    "kind": "pods"
  },
  "code": 403
}# 

* Why?

- Your permission allows:
-------------------------
pods → get
pods → list
pods → watch

but not delete.

*What were we trying to learn in Part 7?*                                                                      -->*important note*
========================================

Until Part 6, we tested RBAC like this:
======================================
You (terminal)
   ↓
kubectl auth can-i
   ↓
"Can developer do this?"
   ↓
YES / NO

- That proves the permission exists.

* But in a real application, nobody normally runs:
        kubectl auth can-i

- Instead, an application running inside a Pod may need to talk to the Kubernetes API.

So Part 7 was:
==============
Application/Pod
     ↓
ServiceAccount
     ↓
Kubernetes API
     ↓
RBAC checks permission
     ↓
Allowed / Forbidden

*Part 6: We tested RBAC from Kubernetes using kubectl auth can-i.*
*Part 7: We tested RBAC from inside a Pod using its ServiceAccount token to call the Kubernetes API.*

# Part 8 — Realistic RBAC scenario:

Scenario
=========
Imagine your application has a backend running in Kubernetes.

The backend needs to:

✅ Read Pods
✅ Read Deployments
❌ Delete Pods
❌ Create Deployments

- We will create a new ServiceAccount called backend-app and give it only these permissions.

* Step 1 — Create ServiceAccount:
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl apply -f backend-sa.yaml
serviceaccount/backend-app created

* Step 2 — Create limited Role:
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl apply -f backend-role.yaml
role.rbac.authorization.k8s.io/backend-role created

* Step 3 — Bind them:
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl apply -f backend-rolebinding.yaml
rolebinding.rbac.authorization.k8s.io/backend-rolebinding created

* Step 4 — Test:
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i get pods \
  --as=system:serviceaccount:rbac-poc:backend-app \
  -n rbac-poc
yes
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i delete pods \
  --as=system:serviceaccount:rbac-poc:backend-app \
  -n rbac-poc
no
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i create deployments \
  --as=system:serviceaccount:rbac-poc:backend-app \
  -n rbac-poc
no
keerthana@Keerthanas-MacBook-Air rbac-poc % 

* The main lesson:
------------------
This is how RBAC is normally designed:

Backend application
       ↓
backend-app ServiceAccount
       ↓
RoleBinding
       ↓
backend-role
       ↓
Only required permissions

- Don't give an application admin just because it is easier. Give it only what it actually needs.

* Results prove exactly what we wanted:
--------------------------------------------
backend-app
   ↓
RoleBinding
   ↓
backend-role
   ↓
┌─────────────────────────────┐
│ pods        get, list   ✅  │
│ deployments get, list   ✅  │
│ delete pods             ❌  │
│ create deployments      ❌  │
└─────────────────────────────┘

# Part 9 - Changing the RBAC permission:

* Here we learn an important practical point:
---------------------------------------------
If we change a Role, the new permission takes effect immediately. We don't need to recreate the ServiceAccount or Pod.

- Our current backend-app has:
-------------------------------
pods → get, list
deployments → get, list

* Step 1 — Add ConfigMap permission:
- Edit backend-role.yaml and add:

keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl apply -f backend-role.yaml
role.rbac.authorization.k8s.io/backend-role configured

* Step 2 — Test before/after permission:
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i create configmaps \
  --as=system:serviceaccount:rbac-poc:backend-app \
  -n rbac-poc
yes

Notice: *we didn't recreate backend-app ServiceAccount*

* Step 3 — Remove the permission:
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl apply -f backend-role.yaml    
role.rbac.authorization.k8s.io/backend-role configured
keerthana@Keerthanas-MacBook-Air rbac-poc % kubectl auth can-i create configmaps \
  --as=system:serviceaccount:rbac-poc:backend-app \
  -n rbac-poc
no

- What Part 9 proves:
=====================
Role changed
     ↓
RoleBinding still exists
     ↓
ServiceAccount still exists
     ↓
Permissions immediately changed

So remember:
=============
RBAC permissions come from the current Role/ClusterRole rules. Changing the Role changes what the ServiceAccount can do.

# Part 10 — Role vs ClusterRole: when to use which:

| Use                                             | Role                            | ClusterRole                         |
| ----------------------------------------------- | ------------------------------- | ----------------------------------- |
| Permissions for one namespace                   | ✅                               | ✅                                   |
| Permissions across namespaces                   | ❌                               | ✅                                   |
| Define permissions for cluster-scoped resources | ❌                               | ✅                                   |
| Example                                         | App can read Pods in `rbac-poc` | Monitoring can read Pods everywhere |

* Practical example:
--------------------

Your `backend-app`:

```text
backend-app
    ↓
RoleBinding
    ↓
Role
    ↓
Only rbac-poc
```

- This is the **better choice** because the backend only needs access to its own namespace.

A monitoring application might need:

```text
monitoring-app
    ↓
ClusterRoleBinding
    ↓
ClusterRole
    ↓
Pods across all namespaces
```

* One rule to remember:
         **Start with Role + RoleBinding. Use ClusterRole only when you actually need broader or cluster-level access.**


---------------------------------------------------------------|
# Summary:                                                     |
---------------------------------------------------------------|
Role                  → namespace permission                   |
ClusterRole           → reusable/broader permission definition |
RoleBinding           → grants permission in a namespace       |
ClusterRoleBinding    → grants ClusterRole cluster-wide        |
ServiceAccount        → identity for workloads                 |
---------------------------------------------------------------|

