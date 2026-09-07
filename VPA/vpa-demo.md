# vpa-demo.yaml file:

apiVersion: apps/v1
kind: Deployment
metadata:
  name: vpa-demo
spec:
  replicas: 1
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


# Explain:

vpa-demo.yaml = the application/Pod

- This defines *what we want to run*.

Deployment
   ↓
vpa-demo Pod
   ↓
CPU + Memory workload

It contains things like:

container image
workload/load
initial CPU request
initial memory request
number of replicas

## Job:

vpa-demo.yaml
     ↓
Creates the application