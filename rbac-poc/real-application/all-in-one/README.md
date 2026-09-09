keerthana@Keerthanas-MacBook-Air real-application % kubectl config use-context minikube
Switched to context "minikube".
keerthana@Keerthanas-MacBook-Air real-application % kubectl get nodes
NAME       STATUS   ROLES           AGE    VERSION
minikube   Ready    control-plane   5d3h   v1.35.1
keerthana@Keerthanas-MacBook-Air real-application % kubectl create namespace production-poc
namespace/production-poc created
keerthana@Keerthanas-MacBook-Air real-application % kubectl label namespace production-poc istio-injection=enabled
namespace/production-poc labeled
keerthana@Keerthanas-MacBook-Air real-application % kubectl get namespace production-poc --show-labels
NAME             STATUS   AGE   LABELS
production-poc   Active   7s    istio-injection=enabled,kubernetes.io/metadata.name=production-poc
keerthana@Keerthanas-MacBook-Air real-application % 

keerthana@Keerthanas-MacBook-Air all-in-one % kubectl apply -f user-rbac.yaml
serviceaccount/user-service created
role.rbac.authorization.k8s.io/user-service-role created
rolebinding.rbac.authorization.k8s.io/user-service-binding created
keerthana@Keerthanas-MacBook-Air all-in-one % kubectl get sa,role,rolebinding -n production-poc
NAME                          AGE
serviceaccount/default        67s
serviceaccount/user-service   4s

NAME                                               CREATED AT
role.rbac.authorization.k8s.io/user-service-role   2026-09-09T10:26:35Z

NAME                                                         ROLE                     AGE
rolebinding.rbac.authorization.k8s.io/user-service-binding   Role/user-service-role   4s
keerthana@Keerthanas-MacBook-Air all-in-one % kubectl apply -f app-storage.yaml
persistentvolumeclaim/user-data created
keerthana@Keerthanas-MacBook-Air all-in-one % kubectl get pvc -n production-poc
NAME        STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS      VOLUMEATTRIBUTESCLASS   AGE
user-data   Bound    pvc-0d5da5cc-eeae-454f-95bc-50b9abe9c2f6   1Gi        RWO            csi-hostpath-sc   <unset>                 3s
keerthana@Keerthanas-MacBook-Air all-in-one % kubectl apply -f user-service.yaml
deployment.apps/user-service created
service/user-service created
keerthana@Keerthanas-MacBook-Air all-in-one % kubectl get pods -n production-poc
NAME                            READY   STATUS     RESTARTS   AGE
user-service-5c989d655f-j4hs2   0/2     Init:1/2   0          4s
user-service-5c989d655f-n6mvr   0/2     Init:1/2   0          4s
keerthana@Keerthanas-MacBook-Air all-in-one % kubectl get pods -n production-poc -w
NAME                            READY   STATUS    RESTARTS   AGE
user-service-5c989d655f-j4hs2   1/2     Running   0          13s
user-service-5c989d655f-n6mvr   1/2     Running   0          13s
user-service-5c989d655f-j4hs2   2/2     Running   0          15s
user-service-5c989d655f-n6mvr   2/2     Running   0          16s
^C%                                                                                                                                     
keerthana@Keerthanas-MacBook-Air all-in-one % kubectl apply -f order-service.yaml
deployment.apps/order-service created
service/order-service created
keerthana@Keerthanas-MacBook-Air all-in-one % kubectl get pods -n production-poc
NAME                             READY   STATUS            RESTARTS   AGE
order-service-5fbd98fb85-qkdns   1/2     PodInitializing   0          5s
order-service-5fbd98fb85-x7kj7   1/2     PodInitializing   0          5s
user-service-5c989d655f-j4hs2    2/2     Running           0          50s
user-service-5c989d655f-n6mvr    2/2     Running           0          50s
keerthana@Keerthanas-MacBook-Air all-in-one % kubectl get pods -n production-poc -w
NAME                             READY   STATUS    RESTARTS   AGE
order-service-5fbd98fb85-qkdns   1/2     Running   0          10s
order-service-5fbd98fb85-x7kj7   1/2     Running   0          10s
user-service-5c989d655f-j4hs2    2/2     Running   0          55s
user-service-5c989d655f-n6mvr    2/2     Running   0          55s
order-service-5fbd98fb85-qkdns   2/2     Running   0          13s
order-service-5fbd98fb85-x7kj7   2/2     Running   0          16s
^C%                                                                                                                                     
keerthana@Keerthanas-MacBook-Air all-in-one % kubectl exec -it -n production-poc deployment/user-service -c user-service -- bash
root@user-service-5c989d655f-j4hs2:/# curl http://order-service
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
root@user-service-5c989d655f-j4hs2:/# exit
exit
keerthana@Keerthanas-MacBook-Air all-in-one % kubectl apply -f mtls.yaml
peerauthentication.security.istio.io/default created
keerthana@Keerthanas-MacBook-Air all-in-one % kubectl get peerauthentication -n production-poc
NAME      MODE     AGE
default   STRICT   3s
keerthana@Keerthanas-MacBook-Air all-in-one % kubectl apply -f user-hpa.yaml
horizontalpodautoscaler.autoscaling/user-service-hpa created
keerthana@Keerthanas-MacBook-Air all-in-one % kubectl get hpa -n production-poc
NAME               REFERENCE                 TARGETS              MINPODS   MAXPODS   REPLICAS   AGE
user-service-hpa   Deployment/user-service   cpu: <unknown>/50%   2         5         0          3s
keerthana@Keerthanas-MacBook-Air all-in-one % kubectl get pods -n production-poc
NAME                             READY   STATUS    RESTARTS   AGE
order-service-5fbd98fb85-qkdns   2/2     Running   0          104s
order-service-5fbd98fb85-x7kj7   2/2     Running   0          104s
user-service-5c989d655f-j4hs2    2/2     Running   0          2m29s
user-service-5c989d655f-n6mvr    2/2     Running   0          2m29s
keerthana@Keerthanas-MacBook-Air all-in-one % kubectl get svc -n production-poc
NAME            TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)   AGE
order-service   ClusterIP   10.101.216.172   <none>        80/TCP    107s
user-service    ClusterIP   10.107.25.34     <none>        80/TCP    2m32s
keerthana@Keerthanas-MacBook-Air all-in-one % kubectl get pvc -n production-poc
NAME        STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS      VOLUMEATTRIBUTESCLASS   AGE
user-data   Bound    pvc-0d5da5cc-eeae-454f-95bc-50b9abe9c2f6   1Gi        RWO            csi-hostpath-sc   <unset>                 2m55s
keerthana@Keerthanas-MacBook-Air all-in-one % kubectl get hpa -n production-poc
NAME               REFERENCE                 TARGETS              MINPODS   MAXPODS   REPLICAS   AGE
user-service-hpa   Deployment/user-service   cpu: <unknown>/50%   2         5         2          25s
keerthana@Keerthanas-MacBook-Air all-in-one % kubectl get sa -n production-poc
NAME           AGE
default        4m39s
user-service   3m36s
keerthana@Keerthanas-MacBook-Air all-in-one % kubectl get peerauthentication -n production-poc
NAME      MODE     AGE
default   STRICT   55s
keerthana@Keerthanas-MacBook-Air all-in-one % kubectl get pods -n production-poc -o wide
NAME                             READY   STATUS    RESTARTS   AGE     IP            NODE       NOMINATED NODE   READINESS GATES
order-service-5fbd98fb85-qkdns   2/2     Running   0          2m14s   10.244.0.28   minikube   <none>           <none>
order-service-5fbd98fb85-x7kj7   2/2     Running   0          2m14s   10.244.0.29   minikube   <none>           <none>
user-service-5c989d655f-j4hs2    2/2     Running   0          2m59s   10.244.0.26   minikube   <none>           <none>
user-service-5c989d655f-n6mvr    2/2     Running   0          2m59s   10.244.0.27   minikube   <none>           <none>
keerthana@Keerthanas-MacBook-Air all-in-one % kubectl delete namespace production-poc
namespace "production-poc" deleted
keerthana@Keerthanas-MacBook-Air all-in-one % kind delete cluster --name fed-cluster1
kind delete cluster --name fed-cluster2
Deleting cluster "fed-cluster1" ...
Deleted nodes: ["fed-cluster1-control-plane"]
Deleting cluster "fed-cluster2" ...
Deleted nodes: ["fed-cluster2-control-plane"]
keerthana@Keerthanas-MacBook-Air all-in-one % 