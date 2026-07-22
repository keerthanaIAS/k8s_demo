# creating my own docker hub image:

## Step 1 — Create a Docker Hub repository

Go to Docker Hub and log in.

Create a new repository:

Repository name: node-k8s-poc
Visibility: Public

Your Docker Hub image will eventually look like:

YOUR_DOCKERHUB_USERNAME/node-k8s-poc:1.0

Replace YOUR_DOCKERHUB_USERNAME with your actual Docker Hub username.

## Step 2 — Login from terminal
docker login

Enter your Docker Hub username and password/token.

Verify:

docker info

## Step 3 — Build your image

You already have:

node-k8s-poc/
├── app.js
├── package.json
├── package-lock.json
├── Dockerfile
└── .dockerignore

Build:

docker build -t node-k8s-poc:1.0 .

You currently have:

node-k8s-poc:1.0

This is your local image.

## Step 4 — Tag the image for Docker Hub

This is important.

Docker Hub needs the image name in this format:

USERNAME/REPOSITORY:TAG

Run:

docker tag node-k8s-poc:1.0 YOUR_DOCKERHUB_USERNAME/node-k8s-poc:1.0

For example, if your Docker Hub username were keerthana123:

docker tag node-k8s-poc:1.0 keerthana123/node-k8s-poc:1.0

Check:

docker images

You will see both:

node-k8s-poc                         1.0
keerthana123/node-k8s-poc            1.0

These are actually referring to the same underlying image. The second name tells Docker where you're going to push it.

## Step 5 — Push to Docker Hub
docker push YOUR_DOCKERHUB_USERNAME/node-k8s-poc:1.0

For example:

docker push keerthana123/node-k8s-poc:1.0

You'll see Docker uploading image layers.

Then open Docker Hub and you should see:

node-k8s-poc
   └── 1.0

Now your image is no longer only on your Mac. It's stored in Docker Hub.

### Terminal Logs:
keerthana@Mac-585 node-k8s-poc % docker login
Authenticating with existing credentials... [Username: keerthanalp]

i Info → To login with a different account, run 'docker logout' followed by 'docker login'


Login Succeeded
keerthana@Mac-585 node-k8s-poc % docker info
Client:
 Version:    28.3.2
 Context:    desktop-linux
 Debug Mode: false
 Plugins:
  ai: Docker AI Agent - Ask Gordon (Docker Inc.)
    Version:  v1.9.11
    Path:     /Users/keerthana/.docker/cli-plugins/docker-ai
  buildx: Docker Buildx (Docker Inc.)
    Version:  v0.26.1-desktop.1
    Path:     /Users/keerthana/.docker/cli-plugins/docker-buildx
  cloud: Docker Cloud (Docker Inc.)
    Version:  v0.4.18
    Path:     /Users/keerthana/.docker/cli-plugins/docker-cloud
  compose: Docker Compose (Docker Inc.)
    Version:  v2.39.1-desktop.1
    Path:     /Users/keerthana/.docker/cli-plugins/docker-compose
  debug: Get a shell into any image or container (Docker Inc.)
    Version:  0.0.42
    Path:     /Users/keerthana/.docker/cli-plugins/docker-debug
  desktop: Docker Desktop commands (Docker Inc.)
    Version:  v0.2.0
    Path:     /Users/keerthana/.docker/cli-plugins/docker-desktop
  extension: Manages Docker extensions (Docker Inc.)
    Version:  v0.2.29
    Path:     /Users/keerthana/.docker/cli-plugins/docker-extension
  init: Creates Docker-related starter files for your project (Docker Inc.)
    Version:  v1.4.0
    Path:     /Users/keerthana/.docker/cli-plugins/docker-init
  mcp: Docker MCP Plugin (Docker Inc.)
    Version:  v0.13.0
    Path:     /Users/keerthana/.docker/cli-plugins/docker-mcp
  model: Docker Model Runner (EXPERIMENTAL) (Docker Inc.)
    Version:  v0.1.36
    Path:     /Users/keerthana/.docker/cli-plugins/docker-model
  sbom: View the packaged-based Software Bill Of Materials (SBOM) for an image (Anchore Inc.)
    Version:  0.6.0
    Path:     /Users/keerthana/.docker/cli-plugins/docker-sbom
  scout: Docker Scout (Docker Inc.)
    Version:  v1.18.2
    Path:     /Users/keerthana/.docker/cli-plugins/docker-scout

Server:
 Containers: 39
  Running: 36
  Paused: 0
  Stopped: 3
 Images: 134
 Server Version: 28.3.2
 Storage Driver: overlayfs
  driver-type: io.containerd.snapshotter.v1
 Logging Driver: json-file
 Cgroup Driver: cgroupfs
 Cgroup Version: 2
 Plugins:
  Volume: local
  Network: bridge host ipvlan macvlan null overlay
  Log: awslogs fluentd gcplogs gelf journald json-file local splunk syslog
 CDI spec directories:
  /etc/cdi
  /var/run/cdi
 Discovered Devices:
  cdi: docker.com/gpu=webgpu
 Swarm: inactive
 Runtimes: io.containerd.runc.v2 runc
 Default Runtime: runc
 Init Binary: docker-init
 containerd version: 05044ec0a9a75232cad458027ca83437aae3f4da
 runc version: v1.2.5-0-g59923ef
 init version: de40ad0
 Security Options:
  seccomp
   Profile: builtin
  cgroupns
 Kernel Version: 6.10.14-linuxkit
 Operating System: Docker Desktop
 OSType: linux
 Architecture: aarch64
 CPUs: 10
 Total Memory: 7.654GiB
 Name: docker-desktop
 ID: 07874e0c-7daf-47eb-a164-189c2ef2e86e
 Docker Root Dir: /var/lib/docker
 Debug Mode: false
 HTTP Proxy: http.docker.internal:3128
 HTTPS Proxy: http.docker.internal:3128
 No Proxy: hubproxy.docker.internal
 Labels:
  com.docker.desktop.address=unix:///Users/keerthana/Library/Containers/com.docker.docker/Data/docker-cli.sock
 Experimental: false
 Insecure Registries:
  hubproxy.docker.internal:5555
  ::1/128
  127.0.0.0/8
 Live Restore Enabled: false

WARNING: DOCKER_INSECURE_NO_IPTABLES_RAW is set
keerthana@Mac-585 node-k8s-poc % docker build -t node-k8s-poc:1.0 .
[+] Building 2.4s (11/11) FINISHED                                                                         docker:desktop-linux
 => [internal] load build definition from Dockerfile                                                                       0.0s
 => => transferring dockerfile: 148B                                                                                       0.0s
 => [internal] load metadata for docker.io/library/node:22                                                                 2.2s
 => [auth] library/node:pull token for registry-1.docker.io                                                                0.0s
 => [internal] load .dockerignore                                                                                          0.0s
 => => transferring context: 76B                                                                                           0.0s
 => [1/5] FROM docker.io/library/node:22@sha256:5647be709086c696ff32edaaf1c70cd26d1da6ab2b39c32f3c7b4c4a31957e37           0.0s
 => => resolve docker.io/library/node:22@sha256:5647be709086c696ff32edaaf1c70cd26d1da6ab2b39c32f3c7b4c4a31957e37           0.0s
 => [internal] load build context                                                                                          0.0s
 => => transferring context: 20.25kB                                                                                       0.0s
 => CACHED [2/5] WORKDIR /app                                                                                              0.0s
 => CACHED [3/5] COPY package*.json ./                                                                                     0.0s
 => CACHED [4/5] RUN npm install                                                                                           0.0s
 => [5/5] COPY . .                                                                                                         0.0s
 => exporting to image                                                                                                     0.1s
 => => exporting layers                                                                                                    0.0s
 => => exporting manifest sha256:42db88a4cbb7a272b337c4c359314bc5c178c99f0f6cfb6fc3738a027a9238a7                          0.0s
 => => exporting config sha256:8ed3da1619994d265f55b56d4ab4a99df1ff35c4f72a642355b4b9da05766466                            0.0s
 => => exporting attestation manifest sha256:7f8153da5116a141e03d133a2ac8457d261402fba77615c03ae88f43c1e7c176              0.0s
 => => exporting manifest list sha256:4d91adfb0e50f5a7da7b369b6b4fa772b07e8a7ad90e9473014d0d02f506c6a3                     0.0s
 => => naming to docker.io/library/node-k8s-poc:1.0                                                                        0.0s
 => => unpacking to docker.io/library/node-k8s-poc:1.0                                                                     0.0s

View build details: docker-desktop://dashboard/build/desktop-linux/desktop-linux/ixkgskduqfw428lczhs39s86a
keerthana@Mac-585 node-k8s-poc % docker tag node-k8s-poc:1.0 keerthanalp/node-k8s-poc:1.0
keerthana@Mac-585 node-k8s-poc % docker images
REPOSITORY                                      TAG                                                                           IMAGE ID       CREATED              SIZE
keerthanalp/node-k8s-poc                        1.0                                                                           4d91adfb0e50   About a minute ago   1.63GB
node-k8s-poc                                    1.0                                                                           4d91adfb0e50   About a minute ago   1.63GB
client-side-auto-encrypt-decrypt-app            latest                                                                        daf86a072dba   45 hours ago         227MB
client-side-auto-encrypt-decrypt-node-app       latest                                                                        63f7afc11f51   46 hours ago         1.57GB

## Step 6 — Test pulling the image

First remove your local image:

docker rmi YOUR_DOCKERHUB_USERNAME/node-k8s-poc:1.0

Then pull it again:

docker pull YOUR_DOCKERHUB_USERNAME/node-k8s-poc:1.0

Run it:

docker run -d \
  --name node-dockerhub-poc \
  -p 3000:3000 \
  YOUR_DOCKERHUB_USERNAME/node-k8s-poc:1.0

Test:
curl http://localhost:3000

Expected:

{
  "message": "Hello from Node.js Kubernetes POC",
  "version": "1.0.0"
}

* Now you have proven:

Local Code
    ↓
Docker Build
    ↓
Local Docker Image
    ↓
Docker Hub
    ↓
Docker Pull
    ↓
Docker Container
    ↓
Node.js Application

#### After Docker Hub:

Your Mac
  │
  ├── Build Image
  │
  ▼
Docker Hub
  │
  │ pull
  ▼
Kubernetes Cluster
  │
  ▼
Pods
  │
  ▼
Node.js Application

# 1. Stop Docker containers
docker stop $(docker ps -aq) 2>/dev/null