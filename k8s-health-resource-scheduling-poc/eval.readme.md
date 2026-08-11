**Simple Learning eval command**:

* What it does

When you run:

```bash
eval $(minikube docker-env)
```

it configures your **current terminal** so that Docker commands use **Minikube's Docker environment** instead of your normal host Docker environment.

Think:
-------
Before:

docker build
    ↓
Your Mac's Docker environment


After:

eval $(minikube docker-env)

docker build
    ↓
Minikube's Docker environment

* Why is this useful?

Suppose you build your image:

```bash
docker build -t health-resource-poc:1.0 .
```

After:

```bash
eval $(minikube docker-env)
```

the image is built **inside Minikube's Docker environment**.

Then your Kubernetes Pod can use:

```yaml
image: health-resource-poc:1.0
imagePullPolicy: Never
```

without pushing the image to Docker Hub.

* But Docker still needs to be running:

You **still need Docker Desktop / the Docker engine running**, because Minikube is using Docker as its container runtime.

So:

```text
Docker running?              ✅ Required
eval $(minikube docker-env)  → changes which Docker environment your terminal uses
```

Also, this `eval` setting is generally **only for the current terminal session**. If you open a new terminal, you may need to run it again.

