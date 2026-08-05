#!/bin/bash

echo "=========================================="
echo "🚀 CAPI NODE AUTO-HEALING POC"
echo "=========================================="

# Step 1: Create Kind cluster
echo "📦 Creating Kind cluster..."
kind delete cluster --name capi-mgmt 2>/dev/null

cat <<EOF > kind-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: capi-mgmt
nodes:
  - role: control-plane
    extraMounts:
      - hostPath: /var/run/docker.sock
        containerPath: /var/run/docker.sock
EOF

kind create cluster --name capi-mgmt --config kind-config.yaml

# Step 2: Install CAPI
echo "📦 Installing CAPI v1.12.0..."
export CLUSTER_TOPOLOGY=true
clusterctl init --infrastructure docker:v1.12.0 --core cluster-api:v1.12.0 --bootstrap kubeadm:v1.12.0 --control-plane kubeadm:v1.12.0

sleep 30
kubectl wait --for=condition=Ready pod -n capi-system --all --timeout=120s
kubectl wait --for=condition=Ready pod -n capd-system --all --timeout=120s

# Step 3: Create workload cluster
echo "📦 Creating workload cluster..."
clusterctl generate cluster my-cluster --flavor development --kubernetes-version v1.28.0 > workload-cluster.yaml
kubectl apply -f workload-cluster.yaml

# Step 4: Create workers
echo "📦 Creating workers..."
cat <<EOF | kubectl apply -f -
apiVersion: cluster.x-k8s.io/v1beta1
kind: MachineDeployment
metadata:
  name: my-cluster-md-0
  namespace: default
spec:
  clusterName: my-cluster
  replicas: 2
  selector:
    matchLabels:
      cluster.x-k8s.io/cluster-name: my-cluster
      cluster.x-k8s.io/role: worker
  template:
    metadata:
      labels:
        cluster.x-k8s.io/cluster-name: my-cluster
        cluster.x-k8s.io/role: worker
    spec:
      bootstrap:
        configRef:
          apiVersion: bootstrap.cluster.x-k8s.io/v1beta1
          kind: KubeadmConfigTemplate
          name: my-cluster-md-0
      clusterName: my-cluster
      infrastructureRef:
        apiVersion: infrastructure.cluster.x-k8s.io/v1beta1
        kind: DockerMachineTemplate
        name: my-cluster-md-0
      version: v1.28.0
---
apiVersion: bootstrap.cluster.x-k8s.io/v1beta1
kind: KubeadmConfigTemplate
metadata:
  name: my-cluster-md-0
  namespace: default
spec:
  template:
    spec:
      joinConfiguration:
        nodeRegistration:
          kubeletExtraArgs:
            cloud-provider: external
---
apiVersion: infrastructure.cluster.x-k8s.io/v1beta1
kind: DockerMachineTemplate
metadata:
  name: my-cluster-md-0
  namespace: default
spec:
  template:
    spec:
      extraMounts:
        - containerPath: /var/run/docker.sock
          hostPath: /var/run/docker.sock
EOF

sleep 60

# Step 5: Get kubeconfig
echo "📦 Getting kubeconfig..."
clusterctl get kubeconfig my-cluster > workload-kubeconfig.yaml
LB_PORT=$(docker port my-cluster-lb 6443 | cut -d: -f2)
sed -i '' "s|server: https://.*:6443|server: https://127.0.0.1:$LB_PORT|g" workload-kubeconfig.yaml

# Step 6: Install Calico
echo "📦 Installing Calico..."
kubectl --kubeconfig workload-kubeconfig.yaml apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.26.1/manifests/calico.yaml 2>/dev/null

# Step 7: Install MachineHealthCheck
echo "📦 Installing MachineHealthCheck..."
cat <<EOF | kubectl apply -f -
apiVersion: cluster.x-k8s.io/v1beta1
kind: MachineHealthCheck
metadata:
  name: worker-health-check
spec:
  clusterName: my-cluster
  selector:
    matchLabels:
      cluster.x-k8s.io/cluster-name: my-cluster
      cluster.x-k8s.io/role: worker
  unhealthyConditions:
    - type: Ready
      status: Unknown
      timeout: 30s
    - type: Ready
      status: "False"
      timeout: 30s
  maxUnhealthy: 100%
  nodeStartupTimeout: 10m
EOF

echo ""
echo "=========================================="
echo "✅ SETUP COMPLETE!"
echo "=========================================="
echo ""
echo "📊 Watch nodes become Ready:"
echo "  kubectl --kubeconfig workload-kubeconfig.yaml get nodes -w"
echo ""
echo "🔧 Test auto-healing (after nodes are Ready):"
echo "  WORKER=\$(docker ps --filter 'name=my-cluster-md-0' --format '{{.Names}}' | head -1)"
echo "  docker stop \$WORKER"
echo "  kubectl get machines -w"
echo ""
echo "=========================================="