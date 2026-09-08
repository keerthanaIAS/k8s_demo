Think of the **ServiceAccount and Binding as two separate things**.

### 1. ServiceAccount = WHO

```text
ServiceAccount
      ↓
"backend-app"
```

It represents the identity of your Pod/application.

By itself, it has **almost no special permissions**.

---

### 2. Role = WHAT

Your Role says:

```text
backend-role

pods        → get, list
deployments → get, list
```

It defines what actions are allowed.

But the Role doesn't automatically belong to `backend-app`.

---

### 3. RoleBinding = CONNECT WHO + WHAT

This is why we need the binding:

```text
backend-app ServiceAccount
          ↓
     RoleBinding
          ↓
     backend-role
          ↓
   get/list Pods
   get/list Deployments
```

The binding basically says:

> **"Give this ServiceAccount the permissions defined in this Role."**

---

### What happens WITHOUT the binding?

Suppose you create:

```text
ServiceAccount: backend-app
```

and:

```text
Role: backend-role
```

but **no RoleBinding**.

Then:

```text
backend-app
     ↓
   no binding
     ↓
   no Role permissions
     ↓
   Access denied ❌
```

For example:

```bash
kubectl auth can-i get pods \
  --as=system:serviceaccount:rbac-poc:backend-app \
  -n rbac-poc
```

would return:

```text
no
```

### Very simple memory trick

> **ServiceAccount = WHO**
> **Role = WHAT**
> **RoleBinding = CONNECT WHO to WHAT**

And for cluster-wide access:

```text
ServiceAccount
      ↓
ClusterRoleBinding
      ↓
ClusterRole
```

That's the main reason we use the binding YAML.
