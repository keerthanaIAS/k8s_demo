# Part 1 - is now complete:
                 Node.js Microservices
                         │
             ┌───────────┴───────────┐
             │                       │
             ▼                       ▼
       User Service             Order Service
         Port 3000                Port 3001
             │                       │
             ▼                       ▼
       Docker Image             Docker Image
       user-service:1.0         order-service:1.0
             │                       │
             └───────────┬───────────┘
                         │
                      Minikube

# ingress creation error:
keerthana@Mac-293 microservices-poc % kubectl apply -f k8s/ingress.yaml
Error from server (BadRequest): error when creating "k8s/ingress.yaml": admission webhook "validate.nginx.ingress.kubernetes.io" denied the request: host "user-service.local" and path "/" is already defined in ingress default/user-service-ingress
keerthana@Mac-293 microservices-poc % kubectl delete ingress user-service-ingress -n default
ingress.networking.k8s.io "user-service-ingress" deleted
keerthana@Mac-293 microservices-poc % kubectl apply -f k8s/ingress.yaml                     
ingress.networking.k8s.io/microservices-ingress created
keerthana@Mac-293 microservices-poc % kubectl get ingress -A
NAMESPACE           NAME                    CLASS   HOSTS                                    ADDRESS   PORTS   AGE
microservices-poc   microservices-ingress   nginx   user-service.local,order-service.local             80      14s
keerthana@Mac-293 microservices-poc % 

## get all kubectl command:
keerthana@Mac-293 microservices-poc % kubectl get all -n microservices-poc
NAME                                 READY   STATUS    RESTARTS   AGE
pod/order-service-5bdb98c5d8-gw24j   1/1     Running   0          72m
pod/order-service-5bdb98c5d8-m5b7d   1/1     Running   0          72m
pod/user-service-5c9c895554-js8rj    1/1     Running   0          72m
pod/user-service-5c9c895554-rbg57    1/1     Running   0          72m

NAME                    TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)    AGE
service/order-service   ClusterIP   10.103.20.81   <none>        3001/TCP   72m
service/user-service    ClusterIP   10.103.196.1   <none>        3000/TCP   72m

NAME                            READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/order-service   2/2     2            2           72m
deployment.apps/user-service    2/2     2            2           72m

NAME                                       DESIRED   CURRENT   READY   AGE
replicaset.apps/order-service-5bdb98c5d8   2         2         2       72m
replicaset.apps/user-service-5c9c895554    2         2         2       72m
keerthana@Mac-293 microservices-poc % 

### Part 2 - final architecture:
                         Browser
                        /       \
                       /         \
                      ▼           ▼
          user-service.local   order-service.local
                    │               │
                    └───────┬───────┘
                            ▼
                     NGINX Ingress
                       /       \
                      ▼         ▼
             user-service   order-service
                Service        Service
                   │              │
             ┌─────┴─────┐  ┌────┴─────┐
             ▼           ▼  ▼          ▼
            Pod         Pod Pod        Pod
             │           │   │          │
             └──── User ─┘   └─ Order ─┘

#### The important thing to understand is:
StatefulSet → manages the MongoDB Pod with a stable identity.
PVC → requests persistent storage for MongoDB.
Service → gives MongoDB a stable DNS name inside Kubernetes.

# Terminal logs:
keerthana@Mac-293 order-service % cd ..
keerthana@Mac-293 microservices-poc % docker build -t order-service:1.0 ./order-service
[+] Building 3.6s (11/11) FINISHED                                                                               docker:default
 => [internal] load build definition from Dockerfile                                                                       0.0s
 => => transferring dockerfile: 155B                                                                                       0.0s
 => [internal] load metadata for docker.io/library/node:22-alpine                                                          2.0s
 => [auth] library/node:pull token for registry-1.docker.io                                                                0.0s
 => [internal] load .dockerignore                                                                                          0.0s
 => => transferring context: 87B                                                                                           0.0s
 => [1/5] FROM docker.io/library/node:22-alpine@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2    0.0s
 => [internal] load build context                                                                                          0.0s
 => => transferring context: 31.81kB                                                                                       0.0s
 => CACHED [2/5] WORKDIR /app                                                                                              0.0s
 => [3/5] COPY package*.json ./                                                                                            0.0s
 => [4/5] RUN npm install                                                                                                  1.4s
 => [5/5] COPY . .                                                                                                         0.0s
 => exporting to image                                                                                                     0.1s
 => => exporting layers                                                                                                    0.1s
 => => writing image sha256:22628f0d6a006cb63e53e0a923a4635f403633ed2e59d280e75632def1063ff8                               0.0s
 => => naming to docker.io/library/order-service:1.0                                                                       0.0s

View build details: docker-desktop://dashboard/build/default/default/d9oiw8exbsx11o5se0ycu95fe
keerthana@Mac-293 microservices-poc % docker build -t user-service:1.0 ./user-service
[+] Building 2.2s (10/10) FINISHED                                                                               docker:default
 => [internal] load build definition from Dockerfile                                                                       0.0s
 => => transferring dockerfile: 155B                                                                                       0.0s
 => [internal] load metadata for docker.io/library/node:22-alpine                                                          0.5s
 => [internal] load .dockerignore                                                                                          0.0s
 => => transferring context: 87B                                                                                           0.0s
 => [1/5] FROM docker.io/library/node:22-alpine@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2    0.0s
 => [internal] load build context                                                                                          0.1s
 => => transferring context: 31.70kB                                                                                       0.1s
 => CACHED [2/5] WORKDIR /app                                                                                              0.0s
 => [3/5] COPY package*.json ./                                                                                            0.0s
 => [4/5] RUN npm install                                                                                                  1.4s
 => [5/5] COPY . .                                                                                                         0.0s
 => exporting to image                                                                                                     0.1s
 => => exporting layers                                                                                                    0.1s
 => => writing image sha256:9627981dd08c4b33594c2b7d953ce4be4079d80c40ecd497e9f6b5236cd957c8                               0.0s
 => => naming to docker.io/library/user-service:1.0                                                                        0.0s

View build details: docker-desktop://dashboard/build/default/default/x1k8wmknjhxbmrl4jv4q6z8b3
keerthana@Mac-293 microservices-poc % docker images
REPOSITORY                                           TAG       IMAGE ID       CREATED          SIZE
user-service                                         1.0       9627981dd08c   2 seconds ago    165MB
order-service                                        1.0       22628f0d6a00   7 seconds ago    165MB
<none>                                               <none>    988b16ba2fd8   44 minutes ago   170MB
registry.k8s.io/kube-scheduler                       v1.35.1   4cad4f996631   5 months ago     48.7MB
registry.k8s.io/kube-controller-manager              v1.35.1   464c974e702e   5 months ago     71.1MB
registry.k8s.io/kube-apiserver                       v1.35.1   7459ea001763   5 months ago     83.9MB
registry.k8s.io/kube-proxy                           v1.35.1   2d611d040292   5 months ago     72.5MB
registry.k8s.io/ingress-nginx/controller             <none>    c919dd92fefa   5 months ago     331MB
registry.k8s.io/ingress-nginx/kube-webhook-certgen   <none>    9cb014dc9989   5 months ago     36.5MB
registry.k8s.io/etcd                                 3.6.6-0   271e49a0ebc5   8 months ago     59.8MB
registry.k8s.io/coredns/coredns                      v1.13.1   e08f4d9d2e6e   9 months ago     73.4MB
registry.k8s.io/pause                                3.10.1    d7b100cd9a77   13 months ago    514kB
gcr.io/k8s-minikube/storage-provisioner              v5        ba04bb24b957   5 years ago      29MB
keerthana@Mac-293 microservices-poc % mkdir -p k8s/user-service
mkdir -p k8s/order-service

touch k8s/namespace.yaml
touch k8s/user-service/deployment.yaml
touch k8s/user-service/service.yaml
touch k8s/order-service/deployment.yaml
touch k8s/order-service/service.yaml
touch k8s/ingress.yaml
keerthana@Mac-293 microservices-poc % sudo nano /etc/hosts                                            
Password:
Sorry, try again.
Password:
keerthana@Mac-293 microservices-poc % minikube status
minikube
type: Control Plane
host: Running
kubelet: Running
apiserver: Running
kubeconfig: Configured
docker-env: in-use

keerthana@Mac-293 microservices-poc % minikube addons enable ingress
💡  ingress is an addon maintained by Kubernetes. For any concerns contact minikube on GitHub.
You can view the list of minikube maintainers at: https://github.com/kubernetes/minikube/blob/master/OWNERS
💡  After the addon is enabled, please run "minikube tunnel" and your ingress resources would be available at "127.0.0.1"
    ▪ Using image registry.k8s.io/ingress-nginx/controller:v1.14.3
    ▪ Using image registry.k8s.io/ingress-nginx/kube-webhook-certgen:v1.6.7
    ▪ Using image registry.k8s.io/ingress-nginx/kube-webhook-certgen:v1.6.7
🔎  Verifying ingress addon...
🌟  The 'ingress' addon is enabled
keerthana@Mac-293 microservices-poc % eval $(minikube docker-env)
keerthana@Mac-293 microservices-poc % docker build -t user-service:1.0 ./user-service
[+] Building 1.8s (11/11) FINISHED                                                                               docker:default
 => [internal] load build definition from Dockerfile                                                                       0.0s
 => => transferring dockerfile: 155B                                                                                       0.0s
 => [internal] load metadata for docker.io/library/node:22-alpine                                                          1.7s
 => [auth] library/node:pull token for registry-1.docker.io                                                                0.0s
 => [internal] load .dockerignore                                                                                          0.0s
 => => transferring context: 87B                                                                                           0.0s
 => [1/5] FROM docker.io/library/node:22-alpine@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2    0.0s
 => [internal] load build context                                                                                          0.0s
 => => transferring context: 159B                                                                                          0.0s
 => CACHED [2/5] WORKDIR /app                                                                                              0.0s
 => CACHED [3/5] COPY package*.json ./                                                                                     0.0s
 => CACHED [4/5] RUN npm install                                                                                           0.0s
 => CACHED [5/5] COPY . .                                                                                                  0.0s
 => exporting to image                                                                                                     0.0s
 => => exporting layers                                                                                                    0.0s
 => => writing image sha256:9627981dd08c4b33594c2b7d953ce4be4079d80c40ecd497e9f6b5236cd957c8                               0.0s
 => => naming to docker.io/library/user-service:1.0                                                                        0.0s

View build details: docker-desktop://dashboard/build/default/default/l2dqmria5hkhbtzxnfxkwak0e
keerthana@Mac-293 microservices-poc % docker build -t order-service:1.0 ./order-service
[+] Building 0.6s (10/10) FINISHED                                                                               docker:default
 => [internal] load build definition from Dockerfile                                                                       0.0s
 => => transferring dockerfile: 155B                                                                                       0.0s
 => [internal] load metadata for docker.io/library/node:22-alpine                                                          0.5s
 => [internal] load .dockerignore                                                                                          0.0s
 => => transferring context: 87B                                                                                           0.0s
 => [1/5] FROM docker.io/library/node:22-alpine@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2    0.0s
 => [internal] load build context                                                                                          0.0s
 => => transferring context: 159B                                                                                          0.0s
 => CACHED [2/5] WORKDIR /app                                                                                              0.0s
 => CACHED [3/5] COPY package*.json ./                                                                                     0.0s
 => CACHED [4/5] RUN npm install                                                                                           0.0s
 => CACHED [5/5] COPY . .                                                                                                  0.0s
 => exporting to image                                                                                                     0.0s
 => => exporting layers                                                                                                    0.0s
 => => writing image sha256:22628f0d6a006cb63e53e0a923a4635f403633ed2e59d280e75632def1063ff8                               0.0s
 => => naming to docker.io/library/order-service:1.0                                                                       0.0s

View build details: docker-desktop://dashboard/build/default/default/kfqc5984n6kfvoy5aigh6c51q
keerthana@Mac-293 microservices-poc % docker images
REPOSITORY                                           TAG       IMAGE ID       CREATED          SIZE
user-service                                         1.0       9627981dd08c   5 minutes ago    165MB
order-service                                        1.0       22628f0d6a00   5 minutes ago    165MB
<none>                                               <none>    988b16ba2fd8   50 minutes ago   170MB
registry.k8s.io/kube-scheduler                       v1.35.1   4cad4f996631   5 months ago     48.7MB
registry.k8s.io/kube-controller-manager              v1.35.1   464c974e702e   5 months ago     71.1MB
registry.k8s.io/kube-apiserver                       v1.35.1   7459ea001763   5 months ago     83.9MB
registry.k8s.io/kube-proxy                           v1.35.1   2d611d040292   5 months ago     72.5MB
registry.k8s.io/ingress-nginx/controller             <none>    c919dd92fefa   5 months ago     331MB
registry.k8s.io/ingress-nginx/kube-webhook-certgen   <none>    9cb014dc9989   5 months ago     36.5MB
registry.k8s.io/etcd                                 3.6.6-0   271e49a0ebc5   8 months ago     59.8MB
registry.k8s.io/coredns/coredns                      v1.13.1   e08f4d9d2e6e   9 months ago     73.4MB
registry.k8s.io/pause                                3.10.1    d7b100cd9a77   13 months ago    514kB
gcr.io/k8s-minikube/storage-provisioner              v5        ba04bb24b957   5 years ago      29MB
keerthana@Mac-293 microservices-poc % kubectl apply -f k8s/namespace.yaml
namespace/microservices-poc created
keerthana@Mac-293 microservices-poc % kubectl get namespaces
NAME                STATUS   AGE
default             Active   51m
ingress-nginx       Active   47m
kube-node-lease     Active   51m
kube-public         Active   51m
kube-system         Active   51m
microservices-poc   Active   4s
keerthana@Mac-293 microservices-poc % kubectl apply -f k8s/user-service/
deployment.apps/user-service created
service/user-service created
keerthana@Mac-293 microservices-poc % kubectl get deployment -n microservices-poc
NAME           READY   UP-TO-DATE   AVAILABLE   AGE
user-service   2/2     2            2           5s
keerthana@Mac-293 microservices-poc % kubectl get pods -n microservices-poc
NAME                            READY   STATUS    RESTARTS   AGE
user-service-5c9c895554-js8rj   1/1     Running   0          10s
user-service-5c9c895554-rbg57   1/1     Running   0          10s
keerthana@Mac-293 microservices-poc % kubectl apply -f k8s/order-service/
deployment.apps/order-service created
service/order-service created
keerthana@Mac-293 microservices-poc % kubectl get deployment -n microservices-poc
NAME            READY   UP-TO-DATE   AVAILABLE   AGE
order-service   2/2     2            2           7s
user-service    2/2     2            2           23s
keerthana@Mac-293 microservices-poc % kubectl get pods -n microservices-poc
NAME                             READY   STATUS    RESTARTS   AGE
order-service-5bdb98c5d8-gw24j   1/1     Running   0          12s
order-service-5bdb98c5d8-m5b7d   1/1     Running   0          12s
user-service-5c9c895554-js8rj    1/1     Running   0          28s
user-service-5c9c895554-rbg57    1/1     Running   0          28s
keerthana@Mac-293 microservices-poc % kubectl get svc -n microservices-poc
NAME            TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)    AGE
order-service   ClusterIP   10.103.20.81   <none>        3001/TCP   16s
user-service    ClusterIP   10.103.196.1   <none>        3000/TCP   32s
keerthana@Mac-293 microservices-poc % kubectl apply -f k8s/ingress.yaml
Error from server (BadRequest): error when creating "k8s/ingress.yaml": admission webhook "validate.nginx.ingress.kubernetes.io" denied the request: host "user-service.local" and path "/" is already defined in ingress default/user-service-ingress
keerthana@Mac-293 microservices-poc % kubectl get ingress -n microservices-poc
No resources found in microservices-poc namespace.
keerthana@Mac-293 microservices-poc % kubectl get ingress -A
NAMESPACE   NAME                   CLASS   HOSTS                ADDRESS        PORTS   AGE
default     user-service-ingress   nginx   user-service.local   192.168.49.2   80      113m
keerthana@Mac-293 microservices-poc % kubectl apply -f k8s/ingress.yaml
Error from server (BadRequest): error when creating "k8s/ingress.yaml": admission webhook "validate.nginx.ingress.kubernetes.io" denied the request: host "user-service.local" and path "/" is already defined in ingress default/user-service-ingress
keerthana@Mac-293 microservices-poc % kubectl delete ingress user-service-ingress -n default
ingress.networking.k8s.io "user-service-ingress" deleted
keerthana@Mac-293 microservices-poc % kubectl apply -f k8s/ingress.yaml                     
ingress.networking.k8s.io/microservices-ingress created
keerthana@Mac-293 microservices-poc % kubectl get ingress -A
NAMESPACE           NAME                    CLASS   HOSTS                                    ADDRESS   PORTS   AGE
microservices-poc   microservices-ingress   nginx   user-service.local,order-service.local             80      14s
keerthana@Mac-293 microservices-poc % kubectl get ingress -n microservices-poc
NAME                    CLASS   HOSTS                                    ADDRESS        PORTS   AGE
microservices-ingress   nginx   user-service.local,order-service.local   192.168.49.2   80      116s
keerthana@Mac-293 microservices-poc % kubectl get all -n microservices-poc
NAME                                 READY   STATUS    RESTARTS   AGE
pod/order-service-5bdb98c5d8-gw24j   1/1     Running   0          72m
pod/order-service-5bdb98c5d8-m5b7d   1/1     Running   0          72m
pod/user-service-5c9c895554-js8rj    1/1     Running   0          72m
pod/user-service-5c9c895554-rbg57    1/1     Running   0          72m

NAME                    TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)    AGE
service/order-service   ClusterIP   10.103.20.81   <none>        3001/TCP   72m
service/user-service    ClusterIP   10.103.196.1   <none>        3000/TCP   72m

NAME                            READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/order-service   2/2     2            2           72m
deployment.apps/user-service    2/2     2            2           72m

NAME                                       DESIRED   CURRENT   READY   AGE
replicaset.apps/order-service-5bdb98c5d8   2         2         2       72m
replicaset.apps/user-service-5c9c895554    2         2         2       72m
keerthana@Mac-293 microservices-poc % mkdir -p k8s/mongodb
keerthana@Mac-293 microservices-poc % touch k8s/mongodb/statefulset.yaml
touch k8s/mongodb/service.yaml
keerthana@Mac-293 microservices-poc % kubectl apply -f k8s/mongodb/
service/mongodb created
statefulset.apps/mongodb created
keerthana@Mac-293 microservices-poc % kubectl get statefulset -n microservices-poc
NAME      READY   AGE
mongodb   0/1     27s
keerthana@Mac-293 microservices-poc % kubectl get pods -n microservices-poc
NAME                             READY   STATUS              RESTARTS   AGE
mongodb-0                        0/1     ContainerCreating   0          34s
order-service-5bdb98c5d8-gw24j   1/1     Running             0          79m
order-service-5bdb98c5d8-m5b7d   1/1     Running             0          79m
user-service-5c9c895554-js8rj    1/1     Running             0          80m
user-service-5c9c895554-rbg57    1/1     Running             0          80m
keerthana@Mac-293 microservices-poc % kubectl get pvc -n microservices-poc
NAME                     STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
mongodb-data-mongodb-0   Bound    pvc-52da1896-2381-4b3d-9a99-11c293e3cd38   1Gi        RWO            standard       <unset>                 42s
keerthana@Mac-293 microservices-poc % 

## The important part is:
STATUS = Bound
That means:
-------------
PVC
 │
 │ successfully connected
 ▼
Persistent Volume

keerthana@Mac-293 microservices-poc % kubectl get pv
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM          STORAGECLASS   VOLUMEATTRIBUTESCLASS   REASON   AGE
pvc-52da1896-2381-4b3d-9a99-11c293e3cd38   1Gi        RWO            Delete           Bound    microservices-poc/mongodb-data-mongodb-0   standard       <unset>                          2m10s
keerthana@Mac-293 microservices-poc % 

### The important relationship is:
PVC
  │
  │ requests 1Gi
  ▼
PV
  │
  ▼
MongoDB
* Check MongoDB inside the Pod:-
keerthana@Mac-293 microservices-poc % kubectl get svc -n microservices-poc
NAME            TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)     AGE
mongodb         ClusterIP   None           <none>        27017/TCP   2m47s
order-service   ClusterIP   10.103.20.81   <none>        3001/TCP    81m
user-service    ClusterIP   10.103.196.1   <none>        3000/TCP    82m
keerthana@Mac-293 microservices-poc % 
keerthana@Mac-293 microservices-poc % kubectl exec -it mongodb-0 -n microservices-poc -- mongosh
Current Mongosh Log ID: 6a671ccbd831f485212a3e27
Connecting to:          mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.9.2
Using MongoDB:          8.0.28
Using Mongosh:          2.9.2

For mongosh info see: https://www.mongodb.com/docs/mongodb-shell/


To help improve our products, anonymous usage data is collected and sent to MongoDB periodically (https://www.mongodb.com/legal/privacy-policy).
You can opt-out by running the disableTelemetry() command.

------
   The server generated these startup warnings when booting
   2026-07-27T08:52:10.915+00:00: Using the XFS filesystem is strongly recommended with the WiredTiger storage engine. See http://dochub.mongodb.org/core/prodnotes-filesystem
   2026-07-27T08:52:11.336+00:00: Access control is not enabled for the database. Read and write access to data and configuration is unrestricted
   2026-07-27T08:52:11.336+00:00: For customers running the current memory allocator, we suggest changing the contents of the following sysfsFile
   2026-07-27T08:52:11.336+00:00: We suggest setting the contents of sysfsFile to 0.
   2026-07-27T08:52:11.336+00:00: We suggest setting swappiness to 0 or 1, as swapping can cause performance problems.
------

test> show dbs
admin   40.00 KiB
config  12.00 KiB
local   40.00 KiB
test> use testdb
switched to db testdb
testdb> db.users.insertOne({
|   name: "Keerthana",
|   service: "user-service"
| })
{
  acknowledged: true,
  insertedId: ObjectId('6a671cd9d831f485212a3e28')
}
testdb> db.users.find()
[
  {
    _id: ObjectId('6a671cd9d831f485212a3e28'),
    name: 'Keerthana',
    service: 'user-service'
  }
]
testdb> exit
keerthana@Mac-293 microservices-poc % 
* Test the Persistent Storage:-
keerthana@Mac-293 microservices-poc % kubectl exec -it mongodb-0 -n microservices-poc -- mongosh
Current Mongosh Log ID: 6a671d2381d8956e7d8cbf7f
Connecting to:          mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.9.2
Using MongoDB:          8.0.28
Using Mongosh:          2.9.2

For mongosh info see: https://www.mongodb.com/docs/mongodb-shell/

------
   The server generated these startup warnings when booting
   2026-07-27T08:52:10.915+00:00: Using the XFS filesystem is strongly recommended with the WiredTiger storage engine. See http://dochub.mongodb.org/core/prodnotes-filesystem
   2026-07-27T08:52:11.336+00:00: Access control is not enabled for the database. Read and write access to data and configuration is unrestricted
   2026-07-27T08:52:11.336+00:00: For customers running the current memory allocator, we suggest changing the contents of the following sysfsFile
   2026-07-27T08:52:11.336+00:00: We suggest setting the contents of sysfsFile to 0.
   2026-07-27T08:52:11.336+00:00: We suggest setting swappiness to 0 or 1, as swapping can cause performance problems.
------

test> use testdb
switched to db testdb
testdb> db.users.insertOne({
|   name: "Keerthana",
|   test: "StatefulSet persistence"
| })
{
  acknowledged: true,
  insertedId: ObjectId('6a671d2d81d8956e7d8cbf80')
}
testdb> db.users.find()
[
  {
    _id: ObjectId('6a671cd9d831f485212a3e28'),
    name: 'Keerthana',
    service: 'user-service'
  },
  {
    _id: ObjectId('6a671d2d81d8956e7d8cbf80'),
    name: 'Keerthana',
    test: 'StatefulSet persistence'
  }
]
testdb> exit
keerthana@Mac-293 microservices-poc % 
* keerthana@Mac-293 microservices-poc % kubectl delete pod mongodb-0 -n microservices-poc
pod "mongodb-0" deleted
keerthana@Mac-293 microservices-poc % kubectl get pods -n microservices-poc
NAME                             READY   STATUS    RESTARTS   AGE
mongodb-0                        1/1     Running   0          6s
order-service-5bdb98c5d8-gw24j   1/1     Running   0          84m
order-service-5bdb98c5d8-m5b7d   1/1     Running   0          84m
user-service-5c9c895554-js8rj    1/1     Running   0          85m
user-service-5c9c895554-rbg57    1/1     Running   0          85m
keerthana@Mac-293 microservices-poc % 
* Now delete the Pod:
kubectl delete pod mongodb-0 -n microservices-poc

Immediately check:
kubectl get pods -n microservices-poc

You will see:
mongodb-0   Terminating

Then Kubernetes creates the replacement:
mongodb-0   0/1   ContainerCreating

Eventually:
mongodb-0   1/1   Running

Notice the name:
mongodb-0
- It comes back with the same identity.

* Now connect again:
keerthana@Mac-293 microservices-poc % kubectl exec -it mongodb-0 -n microservices-poc -- mongosh
Current Mongosh Log ID: 6a671dc5d4e12a518938afdd
Connecting to:          mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.9.2
Using MongoDB:          8.0.28
Using Mongosh:          2.9.2

For mongosh info see: https://www.mongodb.com/docs/mongodb-shell/

------
   The server generated these startup warnings when booting
   2026-07-27T08:57:03.516+00:00: Using the XFS filesystem is strongly recommended with the WiredTiger storage engine. See http://dochub.mongodb.org/core/prodnotes-filesystem
   2026-07-27T08:57:04.321+00:00: Access control is not enabled for the database. Read and write access to data and configuration is unrestricted
   2026-07-27T08:57:04.321+00:00: For customers running the current memory allocator, we suggest changing the contents of the following sysfsFile
   2026-07-27T08:57:04.321+00:00: We suggest setting the contents of sysfsFile to 0.
   2026-07-27T08:57:04.321+00:00: We suggest setting swappiness to 0 or 1, as swapping can cause performance problems.
------

test> use testdb
switched to db testdb
testdb> db.users.find()
[
  {
    _id: ObjectId('6a671cd9d831f485212a3e28'),
    name: 'Keerthana',
    service: 'user-service'
  },
  {
    _id: ObjectId('6a671d2d81d8956e7d8cbf80'),
    name: 'Keerthana',
    test: 'StatefulSet persistence'
  }
]
testdb> 
* Your data should still be there.

That demonstrates the key idea:
------------------------------
mongodb-0
    │
    X
    │
    │ Pod deleted
    ▼
New mongodb-0
    │
    │ Reconnects to same PVC
    ▼
mongodb-data-mongodb-0
    │
    ▼
Data survives

#### Part 3 is complete:
                         Browser
                        /       \
                       ▼         ▼
             user-service.local  order-service.local
                       │         │
                       └────┬────┘
                            ▼
                     NGINX Ingress
                       /       \
                      ▼         ▼
                 User Service  Order Service
                 Deployment    Deployment
                  2 Pods        2 Pods
                      │            │
                      └─────┬──────┘
                            │
                            ▼
                      MongoDB Service
                            │
                            ▼
                      MongoDB StatefulSet
                            │
                            ▼
                         mongodb-0
                            │
                            ▼
                           PVC
                            │
                            ▼
                    Persistent Storage

* One important point
----------------------
MongoDB is running, but your Node.js services are not connected to it yet.

Right now:
-----------
User Service  ─────X───── MongoDB
Order Service ─────X───── MongoDB

The next logical step is to modify both Node.js services to connect to:
----------------------------------------------------------------------
mongodb://mongodb:27017

and add actual database operations:
-----------------------------------
POST /users
      ↓
User Service
      ↓
MongoDB
      ↓
users collection

and:

POST /orders
      ↓
Order Service
      ↓
MongoDB
      ↓
orders collection

##### Terminal Logs:
keerthana@Mac-293 microservices-poc % kubectl apply -f k8s/mongodb/
service/mongodb unchanged
statefulset.apps/mongodb configured
keerthana@Mac-293 microservices-poc % kubectl get statefulset -n microservices-poc
NAME      READY   AGE
mongodb   1/1     9m51s
keerthana@Mac-293 microservices-poc % kubectl get pods -n microservices-poc
NAME                             READY   STATUS    RESTARTS   AGE
mongodb-0                        1/1     Running   0          4m26s
order-service-5bdb98c5d8-gw24j   1/1     Running   0          89m
order-service-5bdb98c5d8-m5b7d   1/1     Running   0          89m
user-service-5c9c895554-js8rj    1/1     Running   0          89m
user-service-5c9c895554-rbg57    1/1     Running   0          89m
keerthana@Mac-293 microservices-poc % mkdir -p k8s/kafka
keerthana@Mac-293 microservices-poc % touch k8s/kafka/statefulset.yaml
touch k8s/kafka/service.yaml
keerthana@Mac-293 microservices-poc % kubectl apply -f k8s/kafka/
service/kafka created
statefulset.apps/kafka created
keerthana@Mac-293 microservices-poc % kubectl get statefulset -n microservices-poc
NAME      READY   AGE
kafka     1/1     37s
mongodb   1/1     16m
keerthana@Mac-293 microservices-poc % kubectl get pods -n microservices-poc
NAME                             READY   STATUS    RESTARTS   AGE
kafka-0                          1/1     Running   0          45s
mongodb-0                        1/1     Running   0          11m
order-service-5bdb98c5d8-gw24j   1/1     Running   0          96m
order-service-5bdb98c5d8-m5b7d   1/1     Running   0          96m
user-service-5c9c895554-js8rj    1/1     Running   0          96m
user-service-5c9c895554-rbg57    1/1     Running   0          96m
keerthana@Mac-293 microservices-poc % kubectl get pvc -n microservices-poc
NAME                     STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
kafka-data-kafka-0       Bound    pvc-3672a647-dd3b-421d-8032-ec995650524b   1Gi        RWO            standard       <unset>              55s
mongodb-data-mongodb-0   Bound    pvc-52da1896-2381-4b3d-9a99-11c293e3cd38   1Gi        RWO            standard       <unset>              17m
keerthana@Mac-293 microservices-poc % kubectl get pv
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM          STORAGECLASS   VOLUMEATTRIBUTESCLASS   REASON   AGE
pvc-3672a647-dd3b-421d-8032-ec995650524b   1Gi        RWO            Delete           Bound    microservices-poc/kafka-data-kafka-0       standard       <unset>                          66s
pvc-52da1896-2381-4b3d-9a99-11c293e3cd38   1Gi        RWO            Delete           Bound    microservices-poc/mongodb-data-mongodb-0   standard       <unset>                          17m
keerthana@Mac-293 microservices-poc % 

* Conceptually:
MongoDB
   │
   ▼
mongodb-data-mongodb-0
   │
   ▼
Persistent Volume

Kafka
   │
   ▼
kafka-data-kafka-0
   │
   ▼
Persistent Volume

keerthana@Mac-293 microservices-poc % kubectl get svc -n microservices-poc
NAME            TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)     AGE
kafka           ClusterIP   None           <none>        9092/TCP    2m51s
mongodb         ClusterIP   None           <none>        27017/TCP   19m
order-service   ClusterIP   10.103.20.81   <none>        3001/TCP    98m
user-service    ClusterIP   10.103.196.1   <none>        3000/TCP    98m
keerthana@Mac-293 microservices-poc % 
keerthana@Mac-293 microservices-poc % kubectl logs kafka-0 -n microservices-poc
===> User
uid=1000(appuser) gid=1000(appuser) groups=1000(appuser)
===> Setting default values of environment variables if not already set.
CLUSTER_ID not set. Setting it to default value: "5L6g3nShT-eMCtK--X86sw"
===> Configuring ...
Running in KRaft mode...
===> Launching ... 
===> Using provided cluster id 5L6g3nShT-eMCtK--X86sw ...
[0.001s][warning][cds] The shared archive file has a bad magic number: 0
[2026-07-27 09:08:10,953] INFO Registered kafka:type=kafka.Log4jController MBean (kafka.utils.Log4jControllerRegistration$)
[2026-07-27 09:08:11,211] INFO Registered signal handlers for TERM, INT, HUP (org.apache.kafka.common.utils.LoggingSignalHandler)
[2026-07-27 09:08:11,213] INFO [ControllerServer id=1] Starting controller (kafka.server.ControllerServer)
[2026-07-27 09:08:11,502] INFO Updated connection-accept-rate max connection creation rate to 2147483647 (kafka.network.ConnectionQuotas)
[2026-07-27 09:08:11,529] INFO [SocketServer listenerType=CONTROLLER, nodeId=1] Created data-plane acceptor and processors for endpoint : ListenerName(CONTROLLER) (kafka.network.SocketServer)
[2026-07-27 09:08:11,537] INFO CONTROLLER: resolved wildcard host to kafka-0.kafka.microservices-poc.svc.cluster.local (org.apache.kafka.metadata.ListenerInfo)
[2026-07-27 09:08:11,541] INFO authorizerStart completed for endpoint CONTROLLER. Endpoint is now READY. (org.apache.kafka.server.network.EndpointReadyFutures)
[2026-07-27 09:08:11,542] INFO [SharedServer id=1] Starting SharedServer (kafka.server.SharedServer)
[2026-07-27 09:08:11,578] INFO [LogLoader partition=__cluster_metadata-0, dir=/tmp/kafka-logs] Loading producer state till offset 0 (org.apache.kafka.storage.internals.log.UnifiedLog)
[2026-07-27 09:08:11,578] INFO [LogLoader partition=__cluster_metadata-0, dir=/tmp/kafka-logs] Reloading from producer snapshot and rebuilding producer state from offset 0 (org.apache.kafka.storage.internals.log.UnifiedLog)
[2026-07-27 09:08:11,581] INFO [LogLoader partition=__cluster_metadata-0, dir=/tmp/kafka-logs] Producer state recovery took 0ms for snapshot load and 0ms for segment recovery from offset 0 (org.apache.kafka.storage.internals.log.UnifiedLog)
[2026-07-27 09:08:11,619] INFO Initialized snapshots with IDs SortedSet() from /tmp/kafka-logs/__cluster_metadata-0 (kafka.raft.KafkaMetadataLog$)
[2026-07-27 09:08:11,629] INFO [raft-expiration-reaper]: Starting (kafka.raft.TimingWheelExpirationService$ExpiredOperationReaper)
[2026-07-27 09:08:11,638] INFO [RaftManager id=1] Reading KRaft snapshot and log as part of the initialization (org.apache.kafka.raft.KafkaRaftClient)
[2026-07-27 09:08:11,639] INFO [RaftManager id=1] Starting voters are VoterSet(voters={1=VoterNode(voterKey=ReplicaKey(id=1, directoryId=<undefined>), listeners=Endpoints(endpoints={ListenerName(CONTROLLER)=localhost/127.0.0.1:9093}), supportedKRaftVersion=SupportedVersionRange[min_version:0, max_version:0])}) (org.apache.kafka.raft.KafkaRaftClient)
[2026-07-27 09:08:11,640] INFO [RaftManager id=1] Starting request manager with static voters: [localhost:9093 (id: 1 rack: null isFenced: false)] (org.apache.kafka.raft.KafkaRaftClient)
[2026-07-27 09:08:11,642] INFO [RaftManager id=1] Attempting durable transition to UnattachedState(epoch=0, leaderId=OptionalInt.empty, votedKey=Optional.empty, voters=[1], electionTimeoutMs=1695, highWatermark=Optional.empty) from null (org.apache.kafka.raft.QuorumState)
[2026-07-27 09:08:11,655] INFO [RaftManager id=1] Completed transition to UnattachedState(epoch=0, leaderId=OptionalInt.empty, votedKey=Optional.empty, voters=[1], electionTimeoutMs=1695, highWatermark=Optional.empty) from null (org.apache.kafka.raft.QuorumState)
[2026-07-27 09:08:11,658] INFO [RaftManager id=1] Completed transition to ProspectiveState(epoch=0, leaderId=OptionalInt.empty, retries=1, votedKey=Optional.empty, epochElection=EpochElection(voterStates={1=VoterState(replicaKey=ReplicaKey(id=1, directoryId=<undefined>), state=GRANTED)}), electionTimeoutMs=1138, highWatermark=Optional.empty) from UnattachedState(epoch=0, leaderId=OptionalInt.empty, votedKey=Optional.empty, voters=[1], electionTimeoutMs=1695, highWatermark=Optional.empty) (org.apache.kafka.raft.QuorumState)
[2026-07-27 09:08:11,660] INFO [RaftManager id=1] Attempting durable transition to CandidateState(localId=1, localDirectoryId=ki_hZB9I1tp5FcaAtIMTRQ, epoch=1, retries=1, epochElection=EpochElection(voterStates={1=VoterState(replicaKey=ReplicaKey(id=1, directoryId=<undefined>), state=GRANTED)}), highWatermark=Optional.empty, electionTimeoutMs=1537) from ProspectiveState(epoch=0, leaderId=OptionalInt.empty, retries=1, votedKey=Optional.empty, epochElection=EpochElection(voterStates={1=VoterState(replicaKey=ReplicaKey(id=1, directoryId=<undefined>), state=GRANTED)}), electionTimeoutMs=1138, highWatermark=Optional.empty) (org.apache.kafka.raft.QuorumState)
[2026-07-27 09:08:11,662] INFO [RaftManager id=1] Completed transition to CandidateState(localId=1, localDirectoryId=ki_hZB9I1tp5FcaAtIMTRQ, epoch=1, retries=1, epochElection=EpochElection(voterStates={1=VoterState(replicaKey=ReplicaKey(id=1, directoryId=<undefined>), state=GRANTED)}), highWatermark=Optional.empty, electionTimeoutMs=1537) from ProspectiveState(epoch=0, leaderId=OptionalInt.empty, retries=1, votedKey=Optional.empty, epochElection=EpochElection(voterStates={1=VoterState(replicaKey=ReplicaKey(id=1, directoryId=<undefined>), state=GRANTED)}), electionTimeoutMs=1138, highWatermark=Optional.empty) (org.apache.kafka.raft.QuorumState)
[2026-07-27 09:08:11,665] INFO [RaftManager id=1] Attempting durable transition to Leader(localReplicaKey=ReplicaKey(id=1, directoryId=ki_hZB9I1tp5FcaAtIMTRQ), epoch=1, epochStartOffset=0, highWatermark=Optional.empty, voterStates={1=ReplicaState(replicaKey=ReplicaKey(id=1, directoryId=<undefined>), endOffset=Optional.empty, lastFetchTimestamp=-1, lastCaughtUpTimestamp=-1, hasAcknowledgedLeader=true)}) from CandidateState(localId=1, localDirectoryId=ki_hZB9I1tp5FcaAtIMTRQ, epoch=1, retries=1, epochElection=EpochElection(voterStates={1=VoterState(replicaKey=ReplicaKey(id=1, directoryId=<undefined>), state=GRANTED)}), highWatermark=Optional.empty, electionTimeoutMs=1537) (org.apache.kafka.raft.QuorumState)
[2026-07-27 09:08:11,667] INFO [RaftManager id=1] Completed transition to Leader(localReplicaKey=ReplicaKey(id=1, directoryId=ki_hZB9I1tp5FcaAtIMTRQ), epoch=1, epochStartOffset=0, highWatermark=Optional.empty, voterStates={1=ReplicaState(replicaKey=ReplicaKey(id=1, directoryId=<undefined>), endOffset=Optional.empty, lastFetchTimestamp=-1, lastCaughtUpTimestamp=-1, hasAcknowledgedLeader=true)}) from CandidateState(localId=1, localDirectoryId=ki_hZB9I1tp5FcaAtIMTRQ, epoch=1, retries=1, epochElection=EpochElection(voterStates={1=VoterState(replicaKey=ReplicaKey(id=1, directoryId=<undefined>), state=GRANTED)}), highWatermark=Optional.empty, electionTimeoutMs=1537) (org.apache.kafka.raft.QuorumState)
[2026-07-27 09:08:11,685] INFO [kafka-1-raft-outbound-request-thread]: Starting (org.apache.kafka.raft.KafkaNetworkChannel$SendThread)
[2026-07-27 09:08:11,685] INFO [kafka-1-raft-io-thread]: Starting (org.apache.kafka.raft.KafkaRaftClientDriver)
[2026-07-27 09:08:11,706] INFO [MetadataLoader id=1] initializeNewPublishers: the loader is still catching up because we still don't know the high water mark yet. (org.apache.kafka.image.loader.MetadataLoader)
[2026-07-27 09:08:11,706] INFO [ControllerServer id=1] Waiting for controller quorum voters future (kafka.server.ControllerServer)
[2026-07-27 09:08:11,707] INFO [ControllerServer id=1] Finished waiting for controller quorum voters future (kafka.server.ControllerServer)
[2026-07-27 09:08:11,713] INFO [RaftManager id=1] High watermark set to LogOffsetMetadata(offset=1, metadata=Optional[(segmentBaseOffset=0,relativePositionInSegment=91)]) for the first time for epoch 1 based on indexOfHw 0 and voters [ReplicaState(replicaKey=ReplicaKey(id=1, directoryId=<undefined>), endOffset=Optional[LogOffsetMetadata(offset=1, metadata=Optional[(segmentBaseOffset=0,relativePositionInSegment=91)])], lastFetchTimestamp=-1, lastCaughtUpTimestamp=-1, hasAcknowledgedLeader=true)] (org.apache.kafka.raft.LeaderState)
[2026-07-27 09:08:11,718] INFO [RaftManager id=1] Registered the listener org.apache.kafka.image.loader.MetadataLoader@1546582839 (org.apache.kafka.raft.KafkaRaftClient)
[2026-07-27 09:08:11,719] INFO [RaftManager id=1] Setting the next offset of org.apache.kafka.image.loader.MetadataLoader@1546582839 to 0 since there are no snapshots (org.apache.kafka.raft.KafkaRaftClient)
[2026-07-27 09:08:11,721] INFO [MetadataLoader id=1] maybePublishMetadata(LOG_DELTA): The loader is still catching up because we have not loaded a controller record as of offset 0 and high water mark is 1 (org.apache.kafka.image.loader.MetadataLoader)
[2026-07-27 09:08:11,730] INFO [RaftManager id=1] Registered the listener org.apache.kafka.controller.QuorumController$QuorumMetaLogListener@1780520398 (org.apache.kafka.raft.KafkaRaftClient)
[2026-07-27 09:08:11,730] INFO [RaftManager id=1] Setting the next offset of org.apache.kafka.controller.QuorumController$QuorumMetaLogListener@1780520398 to 0 since there are no snapshots (org.apache.kafka.raft.KafkaRaftClient)
[2026-07-27 09:08:11,734] INFO [controller-1-ThrottledChannelReaper-Fetch]: Starting (kafka.server.ClientQuotaManager$ThrottledChannelReaper)
[2026-07-27 09:08:11,734] INFO [controller-1-ThrottledChannelReaper-Produce]: Starting (kafka.server.ClientQuotaManager$ThrottledChannelReaper)
[2026-07-27 09:08:11,735] INFO [controller-1-ThrottledChannelReaper-Request]: Starting (kafka.server.ClientQuotaManager$ThrottledChannelReaper)
[2026-07-27 09:08:11,736] INFO [controller-1-ThrottledChannelReaper-ControllerMutation]: Starting (kafka.server.ClientQuotaManager$ThrottledChannelReaper)
[2026-07-27 09:08:11,747] INFO [ExpirationReaper-0-null]: Starting (org.apache.kafka.server.purgatory.DelayedOperationPurgatory$ExpiredOperationReaper)
[2026-07-27 09:08:11,759] INFO [ControllerServer id=1] Waiting for the controller metadata publishers to be installed (kafka.server.ControllerServer)
[2026-07-27 09:08:11,759] INFO [MetadataLoader id=1] initializeNewPublishers: The loader is still catching up because we have not loaded a controller record as of offset 0 and high water mark is 1 (org.apache.kafka.image.loader.MetadataLoader)
[2026-07-27 09:08:11,759] INFO [ControllerServer id=1] Finished waiting for the controller metadata publishers to be installed (kafka.server.ControllerServer)
[2026-07-27 09:08:11,759] INFO [SocketServer listenerType=CONTROLLER, nodeId=1] Enabling request processing. (kafka.network.SocketServer)
[2026-07-27 09:08:11,762] INFO Awaiting socket connections on 0.0.0.0:9093. (kafka.network.DataPlaneAcceptor)
[2026-07-27 09:08:11,767] INFO [MetadataLoader id=1] maybePublishMetadata(LOG_DELTA): The loader finished catching up to the current high water mark of 6 (org.apache.kafka.image.loader.MetadataLoader)
[2026-07-27 09:08:11,769] INFO [MetadataLoader id=1] InitializeNewPublishers: initializing SnapshotGenerator with a snapshot at offset 5 (org.apache.kafka.image.loader.MetadataLoader)
[2026-07-27 09:08:11,804] INFO [MetadataLoader id=1] InitializeNewPublishers: initializing KRaftMetadataCachePublisher with a snapshot at offset 5 (org.apache.kafka.image.loader.MetadataLoader)
[2026-07-27 09:08:11,804] INFO [MetadataLoader id=1] InitializeNewPublishers: initializing FeaturesPublisher with a snapshot at offset 5 (org.apache.kafka.image.loader.MetadataLoader)
[2026-07-27 09:08:11,805] INFO [controller-1-to-controller-registration-channel-manager]: Starting (kafka.server.NodeToControllerRequestThread)
[2026-07-27 09:08:11,806] INFO [ControllerServer id=1] Waiting for all of the authorizer futures to be completed (kafka.server.ControllerServer)
[2026-07-27 09:08:11,806] INFO [controller-1-to-controller-registration-channel-manager]: Recorded new KRaft controller, from now on will use node localhost:9093 (id: 1 rack: null isFenced: false) (kafka.server.NodeToControllerRequestThread)
[2026-07-27 09:08:11,806] INFO [ControllerRegistrationManager id=1 incarnation=7LwWAmzVS5a6rxyRTxxnzQ] initialized channel manager. (kafka.server.ControllerRegistrationManager)
[2026-07-27 09:08:11,806] INFO [ControllerServer id=1] Finished waiting for all of the authorizer futures to be completed (kafka.server.ControllerServer)
[2026-07-27 09:08:11,806] INFO [ControllerServer id=1] Waiting for all of the SocketServer Acceptors to be started (kafka.server.ControllerServer)
[2026-07-27 09:08:11,806] INFO [ControllerRegistrationManager id=1 incarnation=7LwWAmzVS5a6rxyRTxxnzQ] maybeSendControllerRegistration: cannot register yet because the metadata.version is not known yet. (kafka.server.ControllerRegistrationManager)
[2026-07-27 09:08:11,806] INFO [ControllerServer id=1] Finished waiting for all of the SocketServer Acceptors to be started (kafka.server.ControllerServer)
[2026-07-27 09:08:11,806] INFO [ControllerServer id=1] Loaded new metadata Features(metadataVersion=4.0-IV3, finalizedFeatures={group.version=1, transaction.version=2, metadata.version=25}, finalizedFeaturesEpoch=5). (org.apache.kafka.metadata.publisher.FeaturesPublisher)
[2026-07-27 09:08:11,807] INFO [MetadataLoader id=1] InitializeNewPublishers: initializing ControllerRegistrationsPublisher with a snapshot at offset 5 (org.apache.kafka.image.loader.MetadataLoader)
[2026-07-27 09:08:11,807] INFO [BrokerServer id=1] Transition from SHUTDOWN to STARTING (kafka.server.BrokerServer)
[2026-07-27 09:08:11,807] INFO [MetadataLoader id=1] InitializeNewPublishers: initializing ControllerRegistrationManager with a snapshot at offset 5 (org.apache.kafka.image.loader.MetadataLoader)
[2026-07-27 09:08:11,807] INFO [BrokerServer id=1] Starting broker (kafka.server.BrokerServer)
[2026-07-27 09:08:11,807] INFO [MetadataLoader id=1] InitializeNewPublishers: initializing DynamicConfigPublisher controller id=1 with a snapshot at offset 5 (org.apache.kafka.image.loader.MetadataLoader)
[2026-07-27 09:08:11,808] INFO [MetadataLoader id=1] InitializeNewPublishers: initializing DynamicClientQuotaPublisher controller id=1 with a snapshot at offset 5 (org.apache.kafka.image.loader.MetadataLoader)
[2026-07-27 09:08:11,809] INFO [MetadataLoader id=1] InitializeNewPublishers: initializing DynamicTopicClusterQuotaPublisher controller id=1 with a snapshot at offset 5 (org.apache.kafka.image.loader.MetadataLoader)
[2026-07-27 09:08:11,809] INFO [MetadataLoader id=1] InitializeNewPublishers: initializing ScramPublisher controller id=1 with a snapshot at offset 5 (org.apache.kafka.image.loader.MetadataLoader)
[2026-07-27 09:08:11,810] INFO [MetadataLoader id=1] InitializeNewPublishers: initializing DelegationTokenPublisher controller id=1 with a snapshot at offset 5 (org.apache.kafka.image.loader.MetadataLoader)
[2026-07-27 09:08:11,811] INFO [MetadataLoader id=1] InitializeNewPublishers: initializing ControllerMetadataMetricsPublisher with a snapshot at offset 5 (org.apache.kafka.image.loader.MetadataLoader)
[2026-07-27 09:08:11,811] INFO [MetadataLoader id=1] InitializeNewPublishers: initializing AclPublisher controller id=1 with a snapshot at offset 5 (org.apache.kafka.image.loader.MetadataLoader)
[2026-07-27 09:08:11,811] INFO [broker-1-ThrottledChannelReaper-Fetch]: Starting (kafka.server.ClientQuotaManager$ThrottledChannelReaper)
[2026-07-27 09:08:11,811] INFO [broker-1-ThrottledChannelReaper-Produce]: Starting (kafka.server.ClientQuotaManager$ThrottledChannelReaper)
[2026-07-27 09:08:11,811] INFO [broker-1-ThrottledChannelReaper-Request]: Starting (kafka.server.ClientQuotaManager$ThrottledChannelReaper)
[2026-07-27 09:08:11,812] INFO [broker-1-ThrottledChannelReaper-ControllerMutation]: Starting (kafka.server.ClientQuotaManager$ThrottledChannelReaper)
[2026-07-27 09:08:11,815] INFO [ControllerRegistrationManager id=1 incarnation=7LwWAmzVS5a6rxyRTxxnzQ] sendControllerRegistration: attempting to send ControllerRegistrationRequestData(controllerId=1, incarnationId=7LwWAmzVS5a6rxyRTxxnzQ, zkMigrationReady=false, listeners=[Listener(name='CONTROLLER', host='kafka-0.kafka.microservices-poc.svc.cluster.local', port=9093, securityProtocol=0)], features=[Feature(name='group.version', minSupportedVersion=0, maxSupportedVersion=1), Feature(name='transaction.version', minSupportedVersion=0, maxSupportedVersion=2), Feature(name='eligible.leader.replicas.version', minSupportedVersion=0, maxSupportedVersion=1), Feature(name='kraft.version', minSupportedVersion=0, maxSupportedVersion=1), Feature(name='metadata.version', minSupportedVersion=7, maxSupportedVersion=25)]) (kafka.server.ControllerRegistrationManager)
[2026-07-27 09:08:11,831] INFO [BrokerServer id=1] Waiting for controller quorum voters future (kafka.server.BrokerServer)
[2026-07-27 09:08:11,831] INFO [BrokerServer id=1] Finished waiting for controller quorum voters future (kafka.server.BrokerServer)
[2026-07-27 09:08:11,833] INFO [broker-1-to-controller-forwarding-channel-manager]: Starting (kafka.server.NodeToControllerRequestThread)
[2026-07-27 09:08:11,833] INFO [broker-1-to-controller-forwarding-channel-manager]: Recorded new KRaft controller, from now on will use node localhost:9093 (id: 1 rack: null isFenced: false) (kafka.server.NodeToControllerRequestThread)
[2026-07-27 09:08:11,841] INFO [client-metrics-reaper]: Starting (org.apache.kafka.server.util.timer.SystemTimerReaper$Reaper)
[2026-07-27 09:08:11,911] INFO Updated connection-accept-rate max connection creation rate to 2147483647 (kafka.network.ConnectionQuotas)
[2026-07-27 09:08:11,914] INFO [SocketServer listenerType=BROKER, nodeId=1] Created data-plane acceptor and processors for endpoint : ListenerName(PLAINTEXT) (kafka.network.SocketServer)
[2026-07-27 09:08:11,917] INFO [broker-1-to-controller-alter-partition-channel-manager]: Starting (kafka.server.NodeToControllerRequestThread)
[2026-07-27 09:08:11,917] INFO [broker-1-to-controller-alter-partition-channel-manager]: Recorded new KRaft controller, from now on will use node localhost:9093 (id: 1 rack: null isFenced: false) (kafka.server.NodeToControllerRequestThread)
[2026-07-27 09:08:11,923] INFO [broker-1-to-controller-directory-assignments-channel-manager]: Starting (kafka.server.NodeToControllerRequestThread)
[2026-07-27 09:08:11,923] INFO [broker-1-to-controller-directory-assignments-channel-manager]: Recorded new KRaft controller, from now on will use node localhost:9093 (id: 1 rack: null isFenced: false) (kafka.server.NodeToControllerRequestThread)
[2026-07-27 09:08:11,935] INFO [ExpirationReaper-0-null]: Starting (org.apache.kafka.server.purgatory.DelayedOperationPurgatory$ExpiredOperationReaper)
[2026-07-27 09:08:11,936] INFO [ExpirationReaper-0-null]: Starting (org.apache.kafka.server.purgatory.DelayedOperationPurgatory$ExpiredOperationReaper)
[2026-07-27 09:08:11,936] INFO [ExpirationReaper-0-null]: Starting (org.apache.kafka.server.purgatory.DelayedOperationPurgatory$ExpiredOperationReaper)
[2026-07-27 09:08:11,937] INFO [ExpirationReaper-0-null]: Starting (org.apache.kafka.server.purgatory.DelayedOperationPurgatory$ExpiredOperationReaper)
[2026-07-27 09:08:11,937] INFO [ExpirationReaper-0-null]: Starting (org.apache.kafka.server.purgatory.DelayedOperationPurgatory$ExpiredOperationReaper)
[2026-07-27 09:08:11,938] INFO [ExpirationReaper-0-null]: Starting (org.apache.kafka.server.purgatory.DelayedOperationPurgatory$ExpiredOperationReaper)
[2026-07-27 09:08:11,938] INFO [ControllerRegistrationManager id=1 incarnation=7LwWAmzVS5a6rxyRTxxnzQ] Our registration has been persisted to the metadata log. (kafka.server.ControllerRegistrationManager)
[2026-07-27 09:08:11,939] INFO [ControllerRegistrationManager id=1 incarnation=7LwWAmzVS5a6rxyRTxxnzQ] RegistrationResponseHandler: controller acknowledged ControllerRegistrationRequest. (kafka.server.ControllerRegistrationManager)
[2026-07-27 09:08:11,950] INFO [BrokerServer id=1] Using no op persister (kafka.server.BrokerServer)
[2026-07-27 09:08:11,952] INFO [group-coordinator-reaper]: Starting (org.apache.kafka.server.util.timer.SystemTimerReaper$Reaper)
[2026-07-27 09:08:11,970] INFO [group-coordinator-event-processor-0]: Starting (org.apache.kafka.coordinator.common.runtime.MultiThreadedEventProcessor$EventProcessorThread)
[2026-07-27 09:08:11,970] INFO [group-coordinator-event-processor-1]: Starting (org.apache.kafka.coordinator.common.runtime.MultiThreadedEventProcessor$EventProcessorThread)
[2026-07-27 09:08:11,970] INFO [group-coordinator-event-processor-2]: Starting (org.apache.kafka.coordinator.common.runtime.MultiThreadedEventProcessor$EventProcessorThread)
[2026-07-27 09:08:11,970] INFO [group-coordinator-event-processor-3]: Starting (org.apache.kafka.coordinator.common.runtime.MultiThreadedEventProcessor$EventProcessorThread)
[2026-07-27 09:08:12,007] INFO Unable to read the broker epoch in /tmp/kafka-logs. (kafka.log.LogManager)
[2026-07-27 09:08:12,008] INFO [broker-1-to-controller-heartbeat-channel-manager]: Starting (kafka.server.NodeToControllerRequestThread)
[2026-07-27 09:08:12,008] INFO [broker-1-to-controller-heartbeat-channel-manager]: Recorded new KRaft controller, from now on will use node localhost:9093 (id: 1 rack: null isFenced: false) (kafka.server.NodeToControllerRequestThread)
[2026-07-27 09:08:12,010] INFO [BrokerLifecycleManager id=1] Incarnation ipb7yg6sTm6RB1RJICo7jg of broker 1 in cluster 5L6g3nShT-eMCtK--X86sw is now STARTING. (kafka.server.BrokerLifecycleManager)
[2026-07-27 09:08:12,019] INFO [share-group-lock-timeout-reaper]: Starting (org.apache.kafka.server.util.timer.SystemTimerReaper$Reaper)
[2026-07-27 09:08:12,031] INFO [ExpirationReaper-0-null]: Starting (org.apache.kafka.server.purgatory.DelayedOperationPurgatory$ExpiredOperationReaper)
[2026-07-27 09:08:12,048] INFO [BrokerServer id=1] Waiting for the broker metadata publishers to be installed (kafka.server.BrokerServer)
[2026-07-27 09:08:12,048] INFO [BrokerServer id=1] Finished waiting for the broker metadata publishers to be installed (kafka.server.BrokerServer)
[2026-07-27 09:08:12,049] INFO [BrokerServer id=1] Waiting for the controller to acknowledge that we are caught up (kafka.server.BrokerServer)
[2026-07-27 09:08:12,049] INFO [BrokerLifecycleManager id=1] Successfully registered broker 1 with broker epoch 7 (kafka.server.BrokerLifecycleManager)
[2026-07-27 09:08:12,049] INFO [MetadataLoader id=1] InitializeNewPublishers: initializing MetadataVersionPublisher(id=1) with a snapshot at offset 7 (org.apache.kafka.image.loader.MetadataLoader)
[2026-07-27 09:08:12,050] INFO [MetadataLoader id=1] InitializeNewPublishers: initializing BrokerMetadataPublisher with a snapshot at offset 7 (org.apache.kafka.image.loader.MetadataLoader)
[2026-07-27 09:08:12,051] INFO [BrokerMetadataPublisher id=1] Publishing initial metadata at offset OffsetAndEpoch(offset=7, epoch=1) with metadata.version Optional[4.0-IV3]. (kafka.server.metadata.BrokerMetadataPublisher)
[2026-07-27 09:08:12,052] INFO Loading logs from log dirs ArrayBuffer(/tmp/kafka-logs) (kafka.log.LogManager)
[2026-07-27 09:08:12,055] INFO No logs found to be loaded in /tmp/kafka-logs (kafka.log.LogManager)
[2026-07-27 09:08:12,056] INFO [BrokerLifecycleManager id=1] The broker has caught up. Transitioning from STARTING to RECOVERY. (kafka.server.BrokerLifecycleManager)
[2026-07-27 09:08:12,056] INFO [BrokerServer id=1] Finished waiting for the controller to acknowledge that we are caught up (kafka.server.BrokerServer)
[2026-07-27 09:08:12,056] INFO [BrokerServer id=1] Waiting for the initial broker metadata update to be published (kafka.server.BrokerServer)
[2026-07-27 09:08:12,067] INFO Loaded 0 logs in 13ms (kafka.log.LogManager)
[2026-07-27 09:08:12,067] INFO Starting log cleanup with a period of 300000 ms. (kafka.log.LogManager)
[2026-07-27 09:08:12,068] INFO Starting log flusher with a default period of 9223372036854775807 ms. (kafka.log.LogManager)
[2026-07-27 09:08:12,068] INFO [BrokerLifecycleManager id=1] The broker is in RECOVERY. (kafka.server.BrokerLifecycleManager)
[2026-07-27 09:08:12,235] INFO [kafka-log-cleaner-thread-0]: Starting (kafka.log.LogCleaner$CleanerThread)
[2026-07-27 09:08:12,237] INFO [LogDirFailureHandler]: Starting (kafka.server.ReplicaManager$LogDirFailureHandler)
[2026-07-27 09:08:12,238] INFO [AddPartitionsToTxnSenderThread-1]: Starting (kafka.server.AddPartitionsToTxnManager)
[2026-07-27 09:08:12,238] INFO [GroupCoordinator id=1] Starting up. (org.apache.kafka.coordinator.group.GroupCoordinatorService)
[2026-07-27 09:08:12,239] INFO [GroupCoordinator id=1] Startup complete. (org.apache.kafka.coordinator.group.GroupCoordinatorService)
[2026-07-27 09:08:12,240] INFO [TransactionCoordinator id=1] Starting up. (kafka.coordinator.transaction.TransactionCoordinator)
[2026-07-27 09:08:12,241] INFO [TxnMarkerSenderThread-1]: Starting (kafka.coordinator.transaction.TransactionMarkerChannelManager)
[2026-07-27 09:08:12,241] INFO [TransactionCoordinator id=1] Startup complete. (kafka.coordinator.transaction.TransactionCoordinator)
[2026-07-27 09:08:12,246] INFO [MetadataLoader id=1] InitializeNewPublishers: initializing BrokerRegistrationTracker(id=1) with a snapshot at offset 7 (org.apache.kafka.image.loader.MetadataLoader)
[2026-07-27 09:08:12,246] INFO [BrokerServer id=1] Finished waiting for the initial broker metadata update to be published (kafka.server.BrokerServer)
[2026-07-27 09:08:12,247] INFO KafkaConfig values: 
        add.partitions.to.txn.retry.backoff.max.ms = 100
        add.partitions.to.txn.retry.backoff.ms = 20
        advertised.listeners = PLAINTEXT://kafka-0.kafka:9092
        alter.config.policy.class.name = null
        alter.log.dirs.replication.quota.window.num = 11
        alter.log.dirs.replication.quota.window.size.seconds = 1
        authorizer.class.name = 
        auto.create.topics.enable = true
        auto.leader.rebalance.enable = true
        background.threads = 10
        broker.heartbeat.interval.ms = 2000
        broker.id = 1
        broker.rack = null
        broker.session.timeout.ms = 9000
        client.quota.callback.class = null
        compression.gzip.level = -1
        compression.lz4.level = 9
        compression.type = producer
        compression.zstd.level = 3
        connection.failed.authentication.delay.ms = 100
        connections.max.idle.ms = 600000
        connections.max.reauth.ms = 0
        controlled.shutdown.enable = true
        controller.listener.names = CONTROLLER
        controller.performance.always.log.threshold.ms = 2000
        controller.performance.sample.period.ms = 60000
        controller.quorum.append.linger.ms = 25
        controller.quorum.bootstrap.servers = []
        controller.quorum.election.backoff.max.ms = 1000
        controller.quorum.election.timeout.ms = 1000
        controller.quorum.fetch.timeout.ms = 2000
        controller.quorum.request.timeout.ms = 2000
        controller.quorum.retry.backoff.ms = 20
        controller.quorum.voters = [1@localhost:9093]
        controller.quota.window.num = 11
        controller.quota.window.size.seconds = 1
        controller.socket.timeout.ms = 30000
        create.topic.policy.class.name = null
        default.replication.factor = 1
        delegation.token.expiry.check.interval.ms = 3600000
        delegation.token.expiry.time.ms = 86400000
        delegation.token.max.lifetime.ms = 604800000
        delegation.token.secret.key = null
        delete.records.purgatory.purge.interval.requests = 1
        delete.topic.enable = true
        early.start.listeners = null
        fetch.max.bytes = 57671680
        fetch.purgatory.purge.interval.requests = 1000
        group.consumer.assignors = [uniform, range]
        group.consumer.heartbeat.interval.ms = 5000
        group.consumer.max.heartbeat.interval.ms = 15000
        group.consumer.max.session.timeout.ms = 60000
        group.consumer.max.size = 2147483647
        group.consumer.migration.policy = bidirectional
        group.consumer.min.heartbeat.interval.ms = 5000
        group.consumer.min.session.timeout.ms = 45000
        group.consumer.session.timeout.ms = 45000
        group.coordinator.append.linger.ms = 5
        group.coordinator.new.enable = true
        group.coordinator.rebalance.protocols = [classic, consumer]
        group.coordinator.threads = 4
        group.initial.rebalance.delay.ms = 0
        group.max.session.timeout.ms = 1800000
        group.max.size = 2147483647
        group.min.session.timeout.ms = 6000
        group.share.delivery.count.limit = 5
        group.share.enable = false
        group.share.heartbeat.interval.ms = 5000
        group.share.max.groups = 10
        group.share.max.heartbeat.interval.ms = 15000
        group.share.max.record.lock.duration.ms = 60000
        group.share.max.session.timeout.ms = 60000
        group.share.max.size = 200
        group.share.min.heartbeat.interval.ms = 5000
        group.share.min.record.lock.duration.ms = 15000
        group.share.min.session.timeout.ms = 45000
        group.share.partition.max.record.locks = 200
        group.share.persister.class.name = org.apache.kafka.server.share.persister.DefaultStatePersister
        group.share.record.lock.duration.ms = 30000
        group.share.session.timeout.ms = 45000
        initial.broker.registration.timeout.ms = 60000
        inter.broker.listener.name = PLAINTEXT
        kafka.metrics.polling.interval.secs = 10
        kafka.metrics.reporters = []
        leader.imbalance.check.interval.seconds = 300
        listener.security.protocol.map = CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
        listeners = PLAINTEXT://:9092,CONTROLLER://:9093
        log.cleaner.backoff.ms = 15000
        log.cleaner.dedupe.buffer.size = 134217728
        log.cleaner.delete.retention.ms = 86400000
        log.cleaner.enable = true
        log.cleaner.io.buffer.load.factor = 0.9
        log.cleaner.io.buffer.size = 524288
        log.cleaner.io.max.bytes.per.second = 1.7976931348623157E308
        log.cleaner.max.compaction.lag.ms = 9223372036854775807
        log.cleaner.min.cleanable.ratio = 0.5
        log.cleaner.min.compaction.lag.ms = 0
        log.cleaner.threads = 1
        log.cleanup.policy = [delete]
        log.dir = /tmp/kafka-logs
        log.dir.failure.timeout.ms = 30000
        log.dirs = null
        log.flush.interval.messages = 9223372036854775807
        log.flush.interval.ms = null
        log.flush.offset.checkpoint.interval.ms = 60000
        log.flush.scheduler.interval.ms = 9223372036854775807
        log.flush.start.offset.checkpoint.interval.ms = 60000
        log.index.interval.bytes = 4096
        log.index.size.max.bytes = 10485760
        log.initial.task.delay.ms = 30000
        log.local.retention.bytes = -2
        log.local.retention.ms = -2
        log.message.timestamp.after.max.ms = 3600000
        log.message.timestamp.before.max.ms = 9223372036854775807
        log.message.timestamp.type = CreateTime
        log.preallocate = false
        log.retention.bytes = -1
        log.retention.check.interval.ms = 300000
        log.retention.hours = 168
        log.retention.minutes = null
        log.retention.ms = null
        log.roll.hours = 168
        log.roll.jitter.hours = 0
        log.roll.jitter.ms = null
        log.roll.ms = null
        log.segment.bytes = 1073741824
        log.segment.delete.delay.ms = 60000
        max.connection.creation.rate = 2147483647
        max.connections = 2147483647
        max.connections.per.ip = 2147483647
        max.connections.per.ip.overrides = 
        max.incremental.fetch.session.cache.slots = 1000
        max.request.partition.size.limit = 2000
        message.max.bytes = 1048588
        metadata.log.dir = null
        metadata.log.max.record.bytes.between.snapshots = 20971520
        metadata.log.max.snapshot.interval.ms = 3600000
        metadata.log.segment.bytes = 1073741824
        metadata.log.segment.min.bytes = 8388608
        metadata.log.segment.ms = 604800000
        metadata.max.idle.interval.ms = 500
        metadata.max.retention.bytes = 104857600
        metadata.max.retention.ms = 604800000
        metric.reporters = [org.apache.kafka.common.metrics.JmxReporter]
        metrics.num.samples = 2
        metrics.recording.level = INFO
        metrics.sample.window.ms = 30000
        min.insync.replicas = 1
        node.id = 1
        num.io.threads = 8
        num.network.threads = 3
        num.partitions = 3
        num.recovery.threads.per.data.dir = 2
        num.replica.alter.log.dirs.threads = null
        num.replica.fetchers = 1
        offset.metadata.max.bytes = 4096
        offsets.commit.timeout.ms = 5000
        offsets.load.buffer.size = 5242880
        offsets.retention.check.interval.ms = 600000
        offsets.retention.minutes = 10080
        offsets.topic.compression.codec = 0
        offsets.topic.num.partitions = 50
        offsets.topic.replication.factor = 1
        offsets.topic.segment.bytes = 104857600
        principal.builder.class = class org.apache.kafka.common.security.authenticator.DefaultKafkaPrincipalBuilder
        process.roles = [broker, controller]
        producer.id.expiration.check.interval.ms = 600000
        producer.id.expiration.ms = 86400000
        producer.purgatory.purge.interval.requests = 1000
        queued.max.request.bytes = -1
        queued.max.requests = 500
        quota.window.num = 11
        quota.window.size.seconds = 1
        remote.fetch.max.wait.ms = 500
        remote.list.offsets.request.timeout.ms = 30000
        remote.log.index.file.cache.total.size.bytes = 1073741824
        remote.log.manager.copier.thread.pool.size = 10
        remote.log.manager.copy.max.bytes.per.second = 9223372036854775807
        remote.log.manager.copy.quota.window.num = 11
        remote.log.manager.copy.quota.window.size.seconds = 1
        remote.log.manager.expiration.thread.pool.size = 10
        remote.log.manager.fetch.max.bytes.per.second = 9223372036854775807
        remote.log.manager.fetch.quota.window.num = 11
        remote.log.manager.fetch.quota.window.size.seconds = 1
        remote.log.manager.task.interval.ms = 30000
        remote.log.manager.task.retry.backoff.max.ms = 30000
        remote.log.manager.task.retry.backoff.ms = 500
        remote.log.manager.task.retry.jitter = 0.2
        remote.log.manager.thread.pool.size = 2
        remote.log.metadata.custom.metadata.max.bytes = 128
        remote.log.metadata.manager.class.name = org.apache.kafka.server.log.remote.metadata.storage.TopicBasedRemoteLogMetadataManager
        remote.log.metadata.manager.class.path = null
        remote.log.metadata.manager.impl.prefix = rlmm.config.
        remote.log.metadata.manager.listener.name = null
        remote.log.reader.max.pending.tasks = 100
        remote.log.reader.threads = 10
        remote.log.storage.manager.class.name = null
        remote.log.storage.manager.class.path = null
        remote.log.storage.manager.impl.prefix = rsm.config.
        remote.log.storage.system.enable = false
        replica.fetch.backoff.ms = 1000
        replica.fetch.max.bytes = 1048576
        replica.fetch.min.bytes = 1
        replica.fetch.response.max.bytes = 10485760
        replica.fetch.wait.max.ms = 500
        replica.high.watermark.checkpoint.interval.ms = 5000
        replica.lag.time.max.ms = 30000
        replica.selector.class = null
        replica.socket.receive.buffer.bytes = 65536
        replica.socket.timeout.ms = 30000
        replication.quota.window.num = 11
        replication.quota.window.size.seconds = 1
        request.timeout.ms = 30000
        sasl.client.callback.handler.class = null
        sasl.enabled.mechanisms = [GSSAPI]
        sasl.jaas.config = null
        sasl.kerberos.kinit.cmd = /usr/bin/kinit
        sasl.kerberos.min.time.before.relogin = 60000
        sasl.kerberos.principal.to.local.rules = [DEFAULT]
        sasl.kerberos.service.name = null
        sasl.kerberos.ticket.renew.jitter = 0.05
        sasl.kerberos.ticket.renew.window.factor = 0.8
        sasl.login.callback.handler.class = null
        sasl.login.class = null
        sasl.login.connect.timeout.ms = null
        sasl.login.read.timeout.ms = null
        sasl.login.refresh.buffer.seconds = 300
        sasl.login.refresh.min.period.seconds = 60
        sasl.login.refresh.window.factor = 0.8
        sasl.login.refresh.window.jitter = 0.05
        sasl.login.retry.backoff.max.ms = 10000
        sasl.login.retry.backoff.ms = 100
        sasl.mechanism.controller.protocol = GSSAPI
        sasl.mechanism.inter.broker.protocol = GSSAPI
        sasl.oauthbearer.clock.skew.seconds = 30
        sasl.oauthbearer.expected.audience = null
        sasl.oauthbearer.expected.issuer = null
        sasl.oauthbearer.jwks.endpoint.refresh.ms = 3600000
        sasl.oauthbearer.jwks.endpoint.retry.backoff.max.ms = 10000
        sasl.oauthbearer.jwks.endpoint.retry.backoff.ms = 100
        sasl.oauthbearer.jwks.endpoint.url = null
        sasl.oauthbearer.scope.claim.name = scope
        sasl.oauthbearer.sub.claim.name = sub
        sasl.oauthbearer.token.endpoint.url = null
        sasl.server.callback.handler.class = null
        sasl.server.max.receive.size = 524288
        security.inter.broker.protocol = PLAINTEXT
        security.providers = null
        server.max.startup.time.ms = 9223372036854775807
        share.coordinator.append.linger.ms = 10
        share.coordinator.load.buffer.size = 5242880
        share.coordinator.snapshot.update.records.per.snapshot = 500
        share.coordinator.state.topic.compression.codec = 0
        share.coordinator.state.topic.min.isr = 2
        share.coordinator.state.topic.num.partitions = 50
        share.coordinator.state.topic.prune.interval.ms = 300000
        share.coordinator.state.topic.replication.factor = 3
        share.coordinator.state.topic.segment.bytes = 104857600
        share.coordinator.threads = 1
        share.coordinator.write.timeout.ms = 5000
        share.fetch.max.fetch.records = 2147483647
        share.fetch.purgatory.purge.interval.requests = 1000
        socket.connection.setup.timeout.max.ms = 30000
        socket.connection.setup.timeout.ms = 10000
        socket.listen.backlog.size = 50
        socket.receive.buffer.bytes = 102400
        socket.request.max.bytes = 104857600
        socket.send.buffer.bytes = 102400
        ssl.allow.dn.changes = false
        ssl.allow.san.changes = false
        ssl.cipher.suites = []
        ssl.client.auth = none
        ssl.enabled.protocols = [TLSv1.2, TLSv1.3]
        ssl.endpoint.identification.algorithm = https
        ssl.engine.factory.class = null
        ssl.key.password = null
        ssl.keymanager.algorithm = SunX509
        ssl.keystore.certificate.chain = null
        ssl.keystore.key = null
        ssl.keystore.location = null
        ssl.keystore.password = null
        ssl.keystore.type = JKS
        ssl.principal.mapping.rules = DEFAULT
        ssl.protocol = TLSv1.3
        ssl.provider = null
        ssl.secure.random.implementation = null
        ssl.trustmanager.algorithm = PKIX
        ssl.truststore.certificates = null
        ssl.truststore.location = null
        ssl.truststore.password = null
        ssl.truststore.type = JKS
        telemetry.max.bytes = 1048576
        transaction.abort.timed.out.transaction.cleanup.interval.ms = 10000
        transaction.max.timeout.ms = 900000
        transaction.partition.verification.enable = true
        transaction.remove.expired.transaction.cleanup.interval.ms = 3600000
        transaction.state.log.load.buffer.size = 5242880
        transaction.state.log.min.isr = 1
        transaction.state.log.num.partitions = 50
        transaction.state.log.replication.factor = 1
        transaction.state.log.segment.bytes = 104857600
        transactional.id.expiration.ms = 604800000
        unclean.leader.election.enable = false
        unclean.leader.election.interval.ms = 300000
        unstable.api.versions.enable = false
        unstable.feature.versions.enable = false
 (org.apache.kafka.common.config.AbstractConfig)
[2026-07-27 09:08:12,251] INFO [BrokerServer id=1] Waiting for the broker to be unfenced (kafka.server.BrokerServer)
[2026-07-27 09:08:12,267] INFO [BrokerLifecycleManager id=1] The broker has been unfenced. Transitioning from RECOVERY to RUNNING. (kafka.server.BrokerLifecycleManager)
[2026-07-27 09:08:12,268] INFO [BrokerServer id=1] Finished waiting for the broker to be unfenced (kafka.server.BrokerServer)
[2026-07-27 09:08:12,268] INFO authorizerStart completed for endpoint PLAINTEXT. Endpoint is now READY. (org.apache.kafka.server.network.EndpointReadyFutures)
[2026-07-27 09:08:12,268] INFO [SocketServer listenerType=BROKER, nodeId=1] Enabling request processing. (kafka.network.SocketServer)
[2026-07-27 09:08:12,269] INFO Awaiting socket connections on 0.0.0.0:9092. (kafka.network.DataPlaneAcceptor)
[2026-07-27 09:08:12,270] INFO [BrokerServer id=1] Waiting for all of the authorizer futures to be completed (kafka.server.BrokerServer)
[2026-07-27 09:08:12,270] INFO [BrokerServer id=1] Finished waiting for all of the authorizer futures to be completed (kafka.server.BrokerServer)
[2026-07-27 09:08:12,270] INFO [BrokerServer id=1] Waiting for all of the SocketServer Acceptors to be started (kafka.server.BrokerServer)
[2026-07-27 09:08:12,270] INFO [BrokerServer id=1] Finished waiting for all of the SocketServer Acceptors to be started (kafka.server.BrokerServer)
[2026-07-27 09:08:12,270] INFO [BrokerServer id=1] Transition from STARTING to STARTED (kafka.server.BrokerServer)
[2026-07-27 09:08:12,271] INFO Kafka version: 4.0.0 (org.apache.kafka.common.utils.AppInfoParser)
[2026-07-27 09:08:12,271] INFO Kafka commitId: 985bc99521dd22bb (org.apache.kafka.common.utils.AppInfoParser)
[2026-07-27 09:08:12,271] INFO Kafka startTimeMs: 1785143292270 (org.apache.kafka.common.utils.AppInfoParser)
[2026-07-27 09:08:12,272] INFO [KafkaRaftServer nodeId=1] Kafka Server started (kafka.server.KafkaRaftServer)
keerthana@Mac-293 microservices-poc % 

* Check Kafka from inside the Pod:-
keerthana@Mac-293 microservices-poc % kubectl exec -it kafka-0 -n microservices-poc -- /bin/bash
kafka-0:/$ ls /opt/kafka/bin
connect-distributed.sh           kafka-delegation-tokens.sh    kafka-replica-verification.sh
connect-mirror-maker.sh          kafka-delete-records.sh       kafka-run-class.sh
connect-plugin-path.sh           kafka-dump-log.sh             kafka-server-start.sh
connect-standalone.sh            kafka-e2e-latency.sh          kafka-server-stop.sh
kafka-acls.sh                    kafka-features.sh             kafka-share-groups.sh
kafka-broker-api-versions.sh     kafka-get-offsets.sh          kafka-storage.sh
kafka-client-metrics.sh          kafka-groups.sh               kafka-streams-application-reset.sh
kafka-cluster.sh                 kafka-jmx.sh                  kafka-topics.sh
kafka-configs.sh                 kafka-leader-election.sh      kafka-transactions.sh
kafka-console-consumer.sh        kafka-log-dirs.sh             kafka-verifiable-consumer.sh
kafka-console-producer.sh        kafka-metadata-quorum.sh      kafka-verifiable-producer.sh
kafka-console-share-consumer.sh  kafka-metadata-shell.sh       trogdor.sh
kafka-consumer-groups.sh         kafka-producer-perf-test.sh   windows
kafka-consumer-perf-test.sh      kafka-reassign-partitions.sh
kafka-0:/$ 

* Create a Kafka topic:-
kafka-0:/$ /opt/kafka/bin/kafka-topics.sh \
--create \
--topic user-events \
--bootstrap-server localhost:9092 \
--partitions 3 \
--replication-factor 1
Created topic user-events.
kafka-0:/$ 

Expected:

```text
Created topic user-events.
```

This creates:

```text
Kafka
  │
  └── Topic: user-events
          │
          ├── Partition 0
          ├── Partition 1
          └── Partition 2
```

Why 3 partitions?

Just to let you see how Kafka topics are partitioned.

For our single-broker local POC:

```text
replication-factor = 1
```

because we only have one Kafka broker.

---

* Check Kafka topic:-
kafka-0:/$ /opt/kafka/bin/kafka-topics.sh \
--list \
--bootstrap-server localhost:9092
user-events
kafka-0:/$ 

Expected:

```text
user-events
```

* Get details:-
kafka-0:/$ /opt/kafka/bin/kafka-topics.sh \
--describe \
--topic user-events \
--bootstrap-server localhost:9092
Topic: user-events      TopicId: HVKU-f1WQGS6NweUDCojxQ PartitionCount: 3       ReplicationFactor: 1    Configs: 
        Topic: user-events      Partition: 0    Leader: 1       Replicas: 1     Isr: 1  Elr:    LastKnownElr: 
        Topic: user-events      Partition: 1    Leader: 1       Replicas: 1     Isr: 1  Elr:    LastKnownElr: 
        Topic: user-events      Partition: 2    Leader: 1       Replicas: 1     Isr: 1  Elr:    LastKnownElr: 
kafka-0:/$ 

You should see the partitions.

---

* Test Kafka Producer

Open a producer:
kafka-0:/$ /opt/kafka/bin/kafka-console-producer.sh \
--topic user-events \
--bootstrap-server localhost:9092
>UserCreated
>UserCreated: Keerthana
>

Now type:

```text
UserCreated
```

Press Enter.

Then:

```text
UserCreated: Keerthana
```

Press Enter.

The messages are now in Kafka.

---

* Test Kafka Consumer

Open **another terminal**.
keerthana@Mac-293 microservices-poc % kubectl exec -it kafka-0 -n microservices-poc -- /bin/bash
kafka-0:/$ /opt/kafka/bin/kafka-console-consumer.sh \
--topic user-events \
--bootstrap-server localhost:9092 \
--from-beginning
UserCreated

UserCreated
UserCreated: Keerthana
You should see:

```text
UserCreated
UserCreated: Keerthana
```

This proves:

```text
Producer
    │
    │ publish
    ▼
Kafka Topic
    │
    │ consume
    ▼
Consumer
```

Right now we're manually doing this:
------------------------------------
```text
Console Producer
       │
       ▼
Kafka
       │
       ▼
Console Consumer
```

Later we'll replace the console producer and consumer with your actual Node.js services:
----------------------------------------------------------------------------------------
```text
user-service
       │
       │ Kafka Producer
       ▼
user-events topic
       │
       │ Kafka Consumer
       ▼
order-service
```

---

* Test Kafka Pod restart

Now we can test StatefulSet identity.

First check:

```bash
kubectl get pods -n microservices-poc
```

You have:

```text
kafka-0
```

Delete it:

```bash
kubectl delete pod kafka-0 -n microservices-poc
```

Watch:

```bash
kubectl get pods -n microservices-poc -w
```

You should see:

```text
kafka-0   Terminating
```

Then:

```text
kafka-0   ContainerCreating
```

Then:

```text
kafka-0   Running
```

Notice:

```text
kafka-0
```

comes back with the same name.

Now check:

```bash
kubectl get pvc -n microservices-poc
```

Your PVC:

```text
kafka-data-kafka-0
```

still exists.

This is the StatefulSet relationship:
------------------------------------
```text
                    Kafka StatefulSet
                           │
                           ▼
                        kafka-0
                           │
                           ▼
                  kafka-data-kafka-0
                           │
                           ▼
                    Persistent Volume
```

When the Pod is deleted:
------------------------
```text
kafka-0
   X
   │
   ▼
New kafka-0
   │
   ▼
Same PVC
   │
   ▼
Same persistent data
```

* Check Kafka in Lens

Open Lens → Minikube → Namespace:

```text
microservices-poc
```

You should now see:

* Workloads
------------
```text
Deployments
├── user-service
└── order-service

StatefulSets
├── mongodb
└── kafka
```

complete Kubernetes architecture is now:
----------------------------------------
```text
                    Minikube
                       │
              microservices-poc
                       │
      ┌────────────────┼─────────────────┐
      │                │                 │
      ▼                ▼                 ▼
 User Service     Order Service       MongoDB
 Deployment       Deployment         StatefulSet
   2 Pods            2 Pods              │
      │                │                 ▼
      │                │              mongodb-0
      │                │                 │
      │                │                 ▼
      │                │                PVC
      │                │
      │                │
      └───────┐  ┌─────┘
              │  │
              ▼  ▼
             Kafka
          StatefulSet
              │
              ▼
            kafka-0
              │
              ▼
             PVC
```

### Current status
```text
✅ User Service Deployment
✅ User Service Service
✅ Order Service Deployment
✅ Order Service Service
✅ NGINX Ingress
✅ Local domains
✅ MongoDB StatefulSet
✅ MongoDB PVC
✅ MongoDB Service
✅ Kafka StatefulSet
✅ Kafka PVC
✅ Kafka Service
```

###### Part 5 first:
Final flow will be:
                    Browser
                       │
                 NGINX Ingress
                  /          \
                 ▼            ▼
          user-service    order-service
                 │            │
                 │            │
                 ▼            ▼
              MongoDB       MongoDB
                 │
                 │
                 ▼
               Kafka
                 │
                 ▼
           Kafka Consumer
                 │
                 ▼
           order-service
and
Kubernetes Service DNS:
user-service
      │
      │ HTTP
      ▼
order-service:3001

# PART 5 — Modify Node.js Services
We will modify:

user-service
├── MongoDB connection
└── Kafka Producer

order-service
├── MongoDB connection
├── Kafka Consumer
└── Service DNS call

The exact application flow will be:
----------------------------------
POST /users
     │
     ▼
user-service
     │
     ├── Save user → MongoDB
     │
     └── Publish UserCreated → Kafka
                                │
                                ▼
                         order-service
                                │
                                ├── Consume event
                                │
                                └── Save event → MongoDB

And we will also test:
---------------------
user-service
     │
     │ http://order-service:3001
     ▼
order-service Service

# After Part - 5 after change code:
keerthana@Mac-293 microservices-poc % eval $(minikube docker-env)
keerthana@Mac-293 microservices-poc % docker build -t user-service:2.0 ./user-service
[+] Building 4.3s (11/11) FINISHED            docker:default
 => [internal] load build definition from Dockerfile    0.0s
 => => transferring dockerfile: 155B                    0.0s
 => [internal] load metadata for docker.io/library/nod  2.0s
 => [auth] library/node:pull token for registry-1.dock  0.0s
 => [internal] load .dockerignore                       0.0s
 => => transferring context: 87B                        0.0s
 => [1/5] FROM docker.io/library/node:22-alpine@sha256  0.0s
 => [internal] load build context                       0.0s
 => => transferring context: 40.08kB                    0.0s
 => CACHED [2/5] WORKDIR /app                           0.0s
 => [3/5] COPY package*.json ./                         0.0s
 => [4/5] RUN npm install                               2.0s
 => [5/5] COPY . .                                      0.0s
 => exporting to image                                  0.2s
 => => exporting layers                                 0.2s
 => => writing image sha256:d83e1fc0023bea06a9f58b174e  0.0s
 => => naming to docker.io/library/user-service:2.0     0.0s

View build details: docker-desktop://dashboard/build/default/default/p8zyt887dtzb7grz9z9iwh670
keerthana@Mac-293 microservices-poc % docker build -t order-service:2.0 ./order-service
[+] Building 3.0s (10/10) FINISHED            docker:default
 => [internal] load build definition from Dockerfile    0.0s
 => => transferring dockerfile: 155B                    0.0s
 => [internal] load metadata for docker.io/library/nod  0.6s
 => [internal] load .dockerignore                       0.0s
 => => transferring context: 87B                        0.0s
 => [1/5] FROM docker.io/library/node:22-alpine@sha256  0.0s
 => [internal] load build context                       0.0s
 => => transferring context: 40.08kB                    0.0s
 => CACHED [2/5] WORKDIR /app                           0.0s
 => [3/5] COPY package*.json ./                         0.0s
 => [4/5] RUN npm install                               2.0s
 => [5/5] COPY . .                                      0.0s
 => exporting to image                                  0.3s
 => => exporting layers                                 0.3s
 => => writing image sha256:d8081b83dddc693b75d357c548  0.0s
 => => naming to docker.io/library/order-service:2.0    0.0s

View build details: docker-desktop://dashboard/build/default/default/0o1t5jvea40eocoqmjgmgi9dn
keerthana@Mac-293 microservices-poc % docker images | grep -E "user-service|order-service"
order-service                                        2.0       d8081b83dddc   6 seconds ago    174MB
user-service                                         2.0       d83e1fc0023b   37 seconds ago   174MB
user-service                                         1.0       9627981dd08c   2 hours ago      165MB
order-service                                        1.0       22628f0d6a00   2 hours ago      165MB
keerthana@Mac-293 microservices-poc % kubectl apply -f k8s/user-service/deployment.yaml
deployment.apps/user-service configured
keerthana@Mac-293 microservices-poc % kubectl apply -f k8s/order-service/deployment.yaml
deployment.apps/order-service configured
keerthana@Mac-293 microservices-poc % kubectl get pods -n microservices-poc
NAME                            READY   STATUS    RESTARTS   AGE
kafka-0                         1/1     Running   0          42m
mongodb-0                       1/1     Running   0          53m
order-service-5698c7ccb-dkgpt   1/1     Running   0          5s
order-service-5698c7ccb-z8pkq   1/1     Running   0          6s
user-service-7c9979bc9f-bwb78   1/1     Running   0          17s
user-service-7c9979bc9f-lwj6p   1/1     Running   0          16s
keerthana@Mac-293 microservices-poc % 

# Jenkins Pipeline flow
When you push code:
GitHub
   │
   │ Webhook
   ▼
Jenkins
   │
   ▼
Checkout Code
   │
   ├────────────────────┐
   ▼                    ▼
Build User          Build Order
Docker Image        Docker Image
   │                    │
   └────────┬───────────┘
            ▼
        Docker Hub
            │
            ▼
       kubectl apply
            │
            ▼
         Minikube
            │
            ▼
       Kubernetes
            │
       ┌────┴─────┐
       ▼          ▼
    User Pods   Order Pods

## complete POC now
                         GitHub
                            │
                            ▼
                         Jenkins
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
         User Docker Image       Order Docker Image
                │                       │
                └───────────┬───────────┘
                            ▼
                        Docker Hub
                            │
                            ▼
                         Minikube
                            │
                     microservices-poc
                            │
       ┌────────────────────┼─────────────────────┐
       │                    │                     │
       ▼                    ▼                     ▼
  user-service        order-service           MongoDB
  Deployment          Deployment             StatefulSet
   2 Pods               2 Pods                  │
       │                   │                    ▼
       │                   │                 mongodb-0
       │                   │                    │
       │                   │                    ▼
       │                   │                   PVC
       │                   │
       │                   │
       └──────────┐   ┌────┘
                  ▼   ▼
                  Kafka
               StatefulSet
                    │
                    ▼
                  kafka-0
                    │
                    ▼
                   PVC

---

# Part 7 — Deploy Everything

Final project should look approximately like this:

```text
microservices-poc/
│
├── user-service/
│   ├── app.js
│   ├── package.json
│   ├── package-lock.json
│   └── Dockerfile
│
├── order-service/
│   ├── app.js
│   ├── package.json
│   ├── package-lock.json
│   └── Dockerfile
│
├── k8s/
│   │
│   ├── namespace.yaml
│   │
│   ├── mongodb/
│   │   ├── statefulset.yaml
│   │   └── service.yaml
│   │
│   ├── kafka/
│   │   ├── statefulset.yaml
│   │   └── service.yaml
│   │
│   ├── user-service/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   │
│   ├── order-service/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   │
│   └── ingress.yaml
│
└── Jenkinsfile
```

Before deploying, make sure Minikube is running:

```bash
minikube status
```

You want:

```text
host: Running
kubelet: Running
apiserver: Running
kubeconfig: Configured
```

Also make sure your current Kubernetes context is Minikube:

```bash
kubectl config current-context
```

Expected:

```text
minikube
```

---

# Step 1 — Deploy Namespace

Run:

```bash
kubectl apply -f k8s/namespace.yaml
```

Check:

```bash
kubectl get namespaces
```

You should see:

```text
microservices-poc
```

Now all our resources will be inside:

```text
microservices-poc
```

Check:

```bash
kubectl get all -n microservices-poc
```

At this point, it may be empty because we haven't deployed the applications yet.

---

# Step 2 — Deploy MongoDB

Run:

```bash
kubectl apply -f k8s/mongodb/
```

Check StatefulSet:

```bash
kubectl get statefulset -n microservices-poc
```

Expected:

```text
NAME      READY
mongodb   1/1
```

Check Pod:

```bash
kubectl get pods -n microservices-poc
```

Expected:

```text
mongodb-0   1/1   Running
```

Check Service:

```bash
kubectl get svc -n microservices-poc
```

You should see:

```text
mongodb
```

Check PVC:

```bash
kubectl get pvc -n microservices-poc
```

Expected:

```text
mongodb-data-mongodb-0   Bound
```

So MongoDB is:

```text
MongoDB StatefulSet
       │
       ▼
   mongodb-0
       │
       ▼
   mongodb Service
       │
       ▼
mongodb-data-mongodb-0
       │
       ▼
Persistent Volume
```

---

# Step 3 — Deploy Kafka

Run:

```bash
kubectl apply -f k8s/kafka/
```

Check:

```bash
kubectl get statefulset -n microservices-poc
```

Expected:

```text
NAME      READY
mongodb   1/1
kafka     1/1
```

Check Pods:

```bash
kubectl get pods -n microservices-poc
```

Expected:

```text
mongodb-0   1/1   Running
kafka-0     1/1   Running
```

Check Service:

```bash
kubectl get svc -n microservices-poc
```

You should see:

```text
mongodb
kafka
```

Check PVC:

```bash
kubectl get pvc -n microservices-poc
```

Expected:

```text
mongodb-data-mongodb-0   Bound
kafka-data-kafka-0       Bound
```

Your infrastructure is now:

```text
             microservices-poc
                    │
             ┌──────┴──────┐
             ▼             ▼
          MongoDB         Kafka
        StatefulSet     StatefulSet
             │             │
             ▼             ▼
         mongodb-0       kafka-0
             │             │
             ▼             ▼
           PVC           PVC
```

---

# Step 4 — Deploy User Service

Now deploy the User Service:

```bash
kubectl apply -f k8s/user-service/
```

Check:

```bash
kubectl get deployment -n microservices-poc
```

Expected:

```text
NAME            READY
user-service    2/2
```

Check ReplicaSets:

```bash
kubectl get replicasets -n microservices-poc
```

You should see something similar to:

```text
user-service-5c9c895554   2   2   2
```

Check Pods:

```bash
kubectl get pods -n microservices-poc
```

Expected:

```text
user-service-xxxxx   1/1   Running
user-service-yyyyy   1/1   Running
```

Check Service:

```bash
kubectl get svc -n microservices-poc
```

You should see:

```text
user-service
```

---

# Step 5 — Deploy Order Service

Run:

```bash
kubectl apply -f k8s/order-service/
```

Check Deployments:

```bash
kubectl get deployment -n microservices-poc
```

Expected:

```text
NAME             READY
user-service     2/2
order-service    2/2
```

Check ReplicaSets:

```bash
kubectl get replicasets -n microservices-poc
```

You should now have ReplicaSets for:

```text
user-service
order-service
```

Check Pods:

```bash
kubectl get pods -n microservices-poc
```

Expected:

```text
user-service-xxxxx    1/1   Running
user-service-yyyyy    1/1   Running

order-service-xxxxx   1/1   Running
order-service-yyyyy   1/1   Running

mongodb-0              1/1   Running
kafka-0                1/1   Running
```

---

# Step 6 — Deploy Ingress

Now deploy the Ingress:

```bash
kubectl apply -f k8s/ingress.yaml
```

Check:

```bash
kubectl get ingress -n microservices-poc
```

You should see:

```text
NAME              CLASS   HOSTS
microservices     nginx   user-service.local
```

and/or:

```text
order-service.local
```

depending on your Ingress configuration.

---

# Complete Deployment Order

You now have exactly the deployment flow you requested:

```text
kubectl apply
      │
      ▼
Namespace
      │
      ▼
MongoDB
      │
      ▼
Kafka
      │
      ▼
User Service
      │
      ▼
Order Service
      │
      ▼
Ingress
```

Run the deployment commands in order:

```bash
kubectl apply -f k8s/namespace.yaml

kubectl apply -f k8s/mongodb/

kubectl apply -f k8s/kafka/

kubectl apply -f k8s/user-service/

kubectl apply -f k8s/order-service/

kubectl apply -f k8s/ingress.yaml
```

---

# Part 8 — Test Everything

Now we verify the entire POC.

First, get a complete overview:

```bash
kubectl get all -n microservices-poc
```

Then:

```bash
kubectl get statefulsets -n microservices-poc
```

```bash
kubectl get pvc -n microservices-poc
```

```bash
kubectl get ingress -n microservices-poc
```

---

# 1. Lens — Namespace

Open **Lens**.

Select your:

```text
Minikube
```

cluster.

Go to:

```text
Namespaces
```

Find:

```text
microservices-poc
```

Select it.

Now Lens will show the resources belonging to your POC.

---

# 2. Lens — Deployments

Go to:

```text
Workloads
    ↓
Deployments
```

You should see:

```text
user-service
order-service
```

Expected:

```text
user-service    2/2
order-service   2/2
```

This means:

```text
Deployment
    │
    ├── Desired Pods: 2
    │
    └── Actual Pods: 2
```

---

# 3. Lens — ReplicaSets

Go to:

```text
Workloads
    ↓
ReplicaSets
```

You should see:

```text
user-service-xxxxx
order-service-xxxxx
```

The relationship is:

```text
Deployment
     │
     ▼
ReplicaSet
     │
     ├── Pod 1
     └── Pod 2
```

For example:

```text
user-service Deployment
          │
          ▼
user-service-5c9c895554 ReplicaSet
          │
          ├── user-service-xxxxx
          └── user-service-yyyyy
```

---

# 4. Lens — Pods

Go to:

```text
Workloads
    ↓
Pods
```

You should see approximately:

```text
user-service-xxxxx
user-service-yyyyy

order-service-xxxxx
order-service-yyyyy

mongodb-0
kafka-0
```

The important difference is:

```text
user-service
order-service
```

are managed by **Deployments**.

But:

```text
mongodb-0
kafka-0
```

are managed by **StatefulSets**.

---

# 5. Lens — Services

Go to:

```text
Network
    ↓
Services
```

You should see:

```text
user-service
order-service
mongodb
kafka
```

The communication is:

```text
User Service
     │
     │ mongodb:27017
     ▼
MongoDB Service
     │
     ▼
mongodb-0
```

And:

```text
User Service
     │
     │ kafka-0.kafka:9092
     ▼
Kafka Service
     │
     ▼
kafka-0
```

And:

```text
User Service
     │
     │ http://order-service:3001
     ▼
Order Service
```

This is Kubernetes Service DNS in action.

---

# 6. Lens — Ingress

Go to:

```text
Network
    ↓
Ingresses
```

You should see your Ingress.

For example:

```text
user-service.local
```

The flow:

```text
Browser
   │
   │ http://user-service.local
   ▼
NGINX Ingress Controller
   │
   ▼
user-service Service
   │
   ├── User Pod 1
   └── User Pod 2
```

If you have Order Service exposed:

```text
http://order-service.local
```

then:

```text
Browser
   │
   ▼
NGINX Ingress
   │
   ▼
order-service Service
   │
   ├── Order Pod 1
   └── Order Pod 2
```

---

# 7. Lens — StatefulSets

Go to:

```text
Workloads
    ↓
StatefulSets
```

You should see:

```text
mongodb
kafka
```

Click `mongodb`.

You should see:

```text
mongodb-0
```

Click `kafka`.

You should see:

```text
kafka-0
```

This demonstrates the stable identity provided by StatefulSet.

---

# 8. Lens — PersistentVolumeClaims

Go to:

```text
Storage
    ↓
PersistentVolumeClaims
```

You should see:

```text
mongodb-data-mongodb-0
kafka-data-kafka-0
```

Both should be:

```text
Bound
```

The architecture is:

```text
MongoDB StatefulSet
       │
       ▼
    mongodb-0
       │
       ▼
mongodb-data-mongodb-0
       │
       ▼
Persistent Volume
```

And:

```text
Kafka StatefulSet
       │
       ▼
     kafka-0
       │
       ▼
kafka-data-kafka-0
       │
       ▼
Persistent Volume
```

---

# 9. Lens — MongoDB Test

In Lens, click:

```text
Pods
    ↓
mongodb-0
    ↓
Logs
```

You should see MongoDB running.

You can also enter the terminal:

```text
Terminal
```

Then:

```bash
mongosh
```

Check databases:

```javascript
show dbs
```

Check your application database:

```javascript
use microservices
```

Check users:

```javascript
db.users.find()
```

If you already created a user through the User Service, you should see it.

---

# 10. Lens — Kafka Test

Click:

```text
Pods
    ↓
kafka-0
    ↓
Terminal
```

Run:

```bash
/opt/kafka/bin/kafka-topics.sh \
--list \
--bootstrap-server localhost:9092
```

You should see:

```text
user-events
```

Check topic:

```bash
/opt/kafka/bin/kafka-topics.sh \
--describe \
--topic user-events \
--bootstrap-server localhost:9092
```

You should see the topic's partitions.

---

# 11. Test User Service → MongoDB → Kafka

Now test the actual business flow.

Call:

```bash
curl -X POST \
http://user-service.local/users \
-H "Content-Type: application/json" \
-d '{
  "name": "Keerthana",
  "email": "keerthana@example.com"
}'
```

The complete flow is:

```text
HTTP Request
     │
     ▼
NGINX Ingress
     │
     ▼
user-service Service
     │
     ▼
User Service Pod
     │
     ├──────────────► MongoDB
     │                  │
     │                  ▼
     │              users collection
     │
     └──────────────► Kafka
                        │
                        ▼
                    user-events
                        │
                        ▼
                 order-service
                        │
                        ▼
                   Kafka Consumer
```

Check User Service logs:

```bash
kubectl logs deployment/user-service \
-n microservices-poc
```

Check Order Service logs:

```bash
kubectl logs deployment/order-service \
-n microservices-poc
```

You should see the `UserCreated` event being consumed by Order Service.

---

# 12. Test User Service → Order Service DNS

Open:

```text
http://user-service.local/check-order-service
```

The User Service internally calls:

```text
http://order-service:3001/internal/health
```

Kubernetes resolves:

```text
order-service
```

to the Order Service ClusterIP.

The flow is:

```text
Browser
    │
    ▼
NGINX Ingress
    │
    ▼
User Service
    │
    │ Kubernetes DNS
    │
    ▼
order-service:3001
    │
    ▼
Order Service Service
    │
    ├── Order Pod 1
    └── Order Pod 2
```

---

# 13. Final Lens View

At the end, Lens should show:

```text
Minikube
└── microservices-poc
    │
    ├── Deployments
    │   ├── user-service
    │   └── order-service
    │
    ├── ReplicaSets
    │   ├── user-service-xxxxx
    │   └── order-service-xxxxx
    │
    ├── Pods
    │   ├── user-service-xxxxx
    │   ├── user-service-yyyyy
    │   ├── order-service-xxxxx
    │   ├── order-service-yyyyy
    │   ├── mongodb-0
    │   └── kafka-0
    │
    ├── Services
    │   ├── user-service
    │   ├── order-service
    │   ├── mongodb
    │   └── kafka
    │
    ├── Ingress
    │   └── user-service.local
    │
    ├── StatefulSets
    │   ├── mongodb
    │   └── kafka
    │
    └── PVCs
        ├── mongodb-data-mongodb-0
        └── kafka-data-kafka-0
```

The whole POC is now:

```text
                       Jenkins
                          │
                          │ CI/CD
                          ▼
                    Docker Images
                          │
                          ▼
                        Minikube
                          │
                  Kubernetes Cluster
                          │
       ┌──────────────────┼──────────────────┐
       │                  │                  │
       ▼                  ▼                  ▼
    Ingress            Services          StatefulSets
       │                  │                  │
       ▼                  │             ┌────┴────┐
    User/Order            │             ▼         ▼
    Services              │          MongoDB     Kafka
       │                  │             │         │
       ▼                  │             ▼         ▼
    Deployments           │            PVC       PVC
       │                  │
       ▼                  │
    ReplicaSets            │
       │                  │
       ▼                  │
      Pods ◄───────────────┘
       │
       ├────────► MongoDB
       │
       ├────────► Kafka Producer
       │
       └────────► Order Service
                       │
                       └── Kafka Consumer
```

This is the complete **Node.js Microservices + Kubernetes + Minikube + Lens + MongoDB StatefulSet + Kafka StatefulSet + Ingress + Jenkins CI/CD** POC.
