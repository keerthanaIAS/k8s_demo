# vpa.yaml file:

apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: vpa-demo
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: vpa-demo

  updatePolicy:
    updateMode: "Recreate"

# Explain:

vpa.yaml = the VPA controller rule

- This defines *how VPA should manage that application*.

vpa.yaml
   ↓
Watch vpa-demo
   ↓
Calculate CPU/Memory recommendation
   ↓
Recreate Pod when needed

It tells VPA:

“Watch the Deployment called vpa-demo and adjust its CPU/memory resources.”

## Job:

vpa.yaml
     ↓
Tells VPA how to manage that application