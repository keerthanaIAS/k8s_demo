keerthana@Mac-375 k8s-rollout-ingress-poc % kubectl apply -f deployment.yaml
deployment.apps/nginx-deployment created
keerthana@Mac-375 k8s-rollout-ingress-poc % kubectl get deployments
NAME               READY   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment   0/3     3            0           7s
keerthana@Mac-375 k8s-rollout-ingress-poc % kubectl get pods
NAME                                READY   STATUS              RESTARTS   AGE
nginx-deployment-569f95f5cb-4tqb6   0/1     ContainerCreating   0          14s
nginx-deployment-569f95f5cb-htqtl   0/1     ContainerCreating   0          14s
nginx-deployment-569f95f5cb-rqkdz   0/1     ContainerCreating   0          14s
keerthana@Mac-375 k8s-rollout-ingress-poc % kubectl get pods
NAME                                READY   STATUS    RESTARTS   AGE
nginx-deployment-569f95f5cb-4tqb6   1/1     Running   0          48s
nginx-deployment-569f95f5cb-htqtl   1/1     Running   0          48s
nginx-deployment-569f95f5cb-rqkdz   1/1     Running   0          48s
keerthana@Mac-375 k8s-rollout-ingress-poc % kubectl apply -f deployment.yaml
deployment.apps/nginx-deployment configured
keerthana@Mac-375 k8s-rollout-ingress-poc % kubectl rollout status deployment/nginx-deployment
Waiting for deployment "nginx-deployment" rollout to finish: 1 out of 3 new replicas have been updated...
Waiting for deployment "nginx-deployment" rollout to finish: 1 out of 3 new replicas have been updated...
Waiting for deployment "nginx-deployment" rollout to finish: 1 out of 3 new replicas have been updated...
Waiting for deployment "nginx-deployment" rollout to finish: 2 out of 3 new replicas have been updated...
Waiting for deployment "nginx-deployment" rollout to finish: 2 out of 3 new replicas have been updated...
Waiting for deployment "nginx-deployment" rollout to finish: 2 out of 3 new replicas have been updated...
Waiting for deployment "nginx-deployment" rollout to finish: 2 out of 3 new replicas have been updated...
Waiting for deployment "nginx-deployment" rollout to finish: 1 old replicas are pending termination...
Waiting for deployment "nginx-deployment" rollout to finish: 1 old replicas are pending termination...
Waiting for deployment "nginx-deployment" rollout to finish: 1 old replicas are pending termination...
deployment "nginx-deployment" successfully rolled out
keerthana@Mac-375 k8s-rollout-ingress-poc % kubectl rollout history deployment/nginx-deployment
deployment.apps/nginx-deployment 
REVISION  CHANGE-CAUSE
1         <none>
2         <none>

keerthana@Mac-375 k8s-rollout-ingress-poc % kubectl rollout history deployment/nginx-deployment
deployment.apps/nginx-deployment 
REVISION  CHANGE-CAUSE
1         <none>
2         <none>

keerthana@Mac-375 k8s-rollout-ingress-poc % kubectl rollout undo deployment/nginx-deployment
deployment.apps/nginx-deployment rolled back
keerthana@Mac-375 k8s-rollout-ingress-poc % kubectl rollout status deployment/nginx-deployment
deployment "nginx-deployment" successfully rolled out
keerthana@Mac-375 k8s-rollout-ingress-poc % 