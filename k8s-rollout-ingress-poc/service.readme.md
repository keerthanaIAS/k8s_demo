keerthana@Mac-375 k8s-rollout-ingress-poc % kubectl apply -f service.yaml
service/nginx-service created
keerthana@Mac-375 k8s-rollout-ingress-poc % kubectl get service
NAME            TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
kubernetes      ClusterIP   10.96.0.1       <none>        443/TCP   8m36s
nginx-service   ClusterIP   10.105.50.204   <none>        80/TCP    4s
keerthana@Mac-375 k8s-rollout-ingress-poc % kubectl port-forward service/nginx-service 8080:80
Forwarding from [::1]:8080 -> 80
Handling connection for 8080
Handling connection for 8080