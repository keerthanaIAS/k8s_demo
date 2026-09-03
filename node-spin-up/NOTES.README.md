# Terminal log after the machine health check works not full:

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
 Containers: 38
  Running: 19
  Paused: 0
  Stopped: 19
 Images: 21
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
keerthana@Mac-356 node-spin-up % docker ps
CONTAINER ID   IMAGE                  COMMAND                  CREATED          STATUS          PORTS                       NAMES
2fc9b467e8c4   kindest/node:v1.36.1   "/usr/local/bin/entr…"   35 minutes ago   Up 35 minutes   127.0.0.1:50748->6443/tcp   capi-management-control-plane
keerthana@Mac-356 node-spin-up % kubectl get deployment capd-controller-manager \
  -n capd-system \
  -o yaml | grep -A10 -B10 docker.sock
          timeoutSeconds: 1
        resources: {}
        securityContext:
          privileged: true
        terminationMessagePath: /dev/termination-log
        terminationMessagePolicy: FallbackToLogsOnError
        volumeMounts:
        - mountPath: /tmp/k8s-webhook-server/serving-certs
          name: cert
          readOnly: true
        - mountPath: /var/run/docker.sock
          name: dockersock
      dnsPolicy: ClusterFirst
      restartPolicy: Always
      schedulerName: default-scheduler
      securityContext: {}
      serviceAccount: capd-manager
      serviceAccountName: capd-manager
      terminationGracePeriodSeconds: 10
      tolerations:
      - effect: NoSchedule
        key: node-role.kubernetes.io/master
      - effect: NoSchedule
        key: node-role.kubernetes.io/control-plane
      volumes:
      - name: cert
        secret:
          defaultMode: 420
          secretName: capd-webhook-service-cert
      - hostPath:
          path: /var/run/docker.sock
          type: ""
        name: dockersock
status:
  availableReplicas: 1
  conditions:
  - lastTransitionTime: "2026-08-31T05:58:08Z"
    lastUpdateTime: "2026-08-31T05:58:08Z"
    message: Deployment has minimum availability.
    reason: MinimumReplicasAvailable
    status: "True"
keerthana@Mac-356 node-spin-up % kubectl get deployment capd-controller-manager \
  -n capd-system \
  -o jsonpath='{.spec.template.spec.volumes}' | jq .
[
  {
    "name": "cert",
    "secret": {
      "defaultMode": 420,
      "secretName": "capd-webhook-service-cert"
    }
  },
  {
    "hostPath": {
      "path": "/var/run/docker.sock",
      "type": ""
    },
    "name": "dockersock"
  }
]
keerthana@Mac-356 node-spin-up % kubectl get deployment capd-controller-manager \
  -n capd-system \
  -o jsonpath='{.spec.template.spec.containers[0].volumeMounts}' | jq .
[
  {
    "mountPath": "/tmp/k8s-webhook-server/serving-certs",
    "name": "cert",
    "readOnly": true
  },
  {
    "mountPath": "/var/run/docker.sock",
    "name": "dockersock"
  }
]
keerthana@Mac-356 node-spin-up % kubectl get pods -n capd-system
NAME                                      READY   STATUS    RESTARTS   AGE
capd-controller-manager-65d6fdfd4-gpxtq   1/1     Running   0          26m
keerthana@Mac-356 node-spin-up % kubectl exec -n capd-system \
  deployment/capd-controller-manager \
  -- ls -l /var/run/docker.sock
error: Internal error occurred: Internal error occurred: error executing command in container: failed to exec in container: failed to start exec "5ee86c36cb29a5581d150cd5b790c703fa0080fc220f941aa30eb88443ac7cea": OCI runtime exec failed: exec failed: unable to start container process: exec: "ls": executable file not found in $PATH
keerthana@Mac-356 node-spin-up % kubectl exec -n capd-system \
  deployment/capd-controller-manager \
  -- sh -c 'echo $DOCKER_HOST'
error: Internal error occurred: Internal error occurred: error executing command in container: failed to exec in container: failed to start exec "3212fda970bb0609a9f10d5459a57c489b484b3cc486734bb9ab811adce6aa5e": OCI runtime exec failed: exec failed: unable to start container process: exec: "sh": executable file not found in $PATH
keerthana@Mac-356 node-spin-up % kubectl get nodes -o wide
NAME                            STATUS   ROLES           AGE   VERSION   INTERNAL-IP   EXTERNAL-IP   OS-IMAGE                       KERNEL-VERSION             CONTAINER-RUNTIME
capi-management-control-plane   Ready    control-plane   36m   v1.36.1   172.18.0.2    <none>        Debian GNU/Linux 13 (trixie)   6.10.14-linuxkit (arm64)   containerd://2.3.1
keerthana@Mac-356 node-spin-up % kubectl get devmachine -A
No resources found
keerthana@Mac-356 node-spin-up % docker context show
desktop-linux
keerthana@Mac-356 node-spin-up % kubectl get pods -A | grep -E 'capd|capi|kubeadm'
capd-system                         capd-controller-manager-65d6fdfd4-gpxtq                          1/1     Running   0          26m
capi-kubeadm-bootstrap-system       capi-kubeadm-bootstrap-controller-manager-5774db566c-6n9rv       1/1     Running   0          34m
capi-kubeadm-control-plane-system   capi-kubeadm-control-plane-controller-manager-7658546997-ktb76   1/1     Running   0          21m
capi-system                         capi-controller-manager-7c45d98f8f-6pcbp                         1/1     Running   0          26m
kube-system                         etcd-capi-management-control-plane                               1/1     Running   0          36m
kube-system                         kube-apiserver-capi-management-control-plane                     1/1     Running   0          36m
kube-system                         kube-controller-manager-capi-management-control-plane            1/1     Running   0          36m
kube-system                         kube-scheduler-capi-management-control-plane                     1/1     Running   0          36m
keerthana@Mac-356 node-spin-up % docker context ls
NAME              DESCRIPTION                               DOCKER ENDPOINT                                   ERROR
default           Current DOCKER_HOST based configuration   unix:///var/run/docker.sock                       
desktop-linux *   Docker Desktop                            unix:///Users/keerthana/.docker/run/docker.sock   
keerthana@Mac-356 node-spin-up % kind delete cluster --name capi-management
Deleting cluster "capi-management" ...
Deleted nodes: ["capi-management-control-plane"]
keerthana@Mac-356 node-spin-up % kind get clusters
No kind clusters found.
keerthana@Mac-356 node-spin-up % cat > kind-capi.yaml <<'EOF'
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraMounts:
  - hostPath: /var/run/docker.sock
    containerPath: /var/run/docker.sock
EOF
keerthana@Mac-356 node-spin-up % kind create cluster --name capi-management --config kind-capi.yaml
Creating cluster "capi-management" ...
 ✓ Ensuring node image (kindest/node:v1.36.1) 🖼
 ✓ Preparing nodes 📦  
 ✓ Writing configuration 📜 
 ✓ Starting control-plane 🕹️ 
 ✓ Installing CNI 🔌 
 ✓ Installing StorageClass 💾 
Set kubectl context to "kind-capi-management"
You can now use your cluster with:

kubectl cluster-info --context kind-capi-management

Have a nice day! 👋
keerthana@Mac-356 node-spin-up % kubectl get nodes
NAME                            STATUS     ROLES           AGE   VERSION
capi-management-control-plane   NotReady   control-plane   8s    v1.36.1
keerthana@Mac-356 node-spin-up % kubectl get nodes
NAME                            STATUS     ROLES           AGE   VERSION
capi-management-control-plane   NotReady   control-plane   12s   v1.36.1
keerthana@Mac-356 node-spin-up % kubectl get nodes -w
NAME                            STATUS     ROLES           AGE   VERSION
capi-management-control-plane   NotReady   control-plane   20s   v1.36.1
capi-management-control-plane   Ready      control-plane   21s   v1.36.1
capi-management-control-plane   Ready      control-plane   21s   v1.36.1
^C%                                                                                                                                     
keerthana@Mac-356 node-spin-up % docker exec capi-management-control-plane ls -l /var/run/docker.sock
srw-rw---- 1 root root 0 Aug 31 05:29 /var/run/docker.sock
keerthana@Mac-356 node-spin-up % clusterctl init --infrastructure docker
Fetching providers
Installing cert-manager version="v1.20.3"
Waiting for cert-manager to be available...
Installing provider="cluster-api" version="v1.14.0" targetNamespace="capi-system"
Installing provider="bootstrap-kubeadm" version="v1.14.0" targetNamespace="capi-kubeadm-bootstrap-system"
Installing provider="control-plane-kubeadm" version="v1.14.0" targetNamespace="capi-kubeadm-control-plane-system"
Installing provider="infrastructure-docker" version="v1.14.0" targetNamespace="capd-system"

Your management cluster has been initialized successfully!

You can now create your first workload cluster by running the following:

  clusterctl generate cluster [name] --kubernetes-version [version] | kubectl apply -f -

keerthana@Mac-356 node-spin-up % kubectl get pods -A
NAMESPACE                           NAME                                                             READY   STATUS              RESTARTS   AGE
capd-system                         capd-controller-manager-84569fcf67-92bhh                         0/1     ContainerCreating   0          5s
capi-kubeadm-bootstrap-system       capi-kubeadm-bootstrap-controller-manager-5774db566c-mjrzg       1/1     Running             0          6s
capi-kubeadm-control-plane-system   capi-kubeadm-control-plane-controller-manager-669648c68d-prsc7   0/1     ContainerCreating   0          6s
capi-system                         capi-controller-manager-7b7465cf98-mh66x                         0/1     ContainerCreating   0          7s
cert-manager                        cert-manager-6f4d7cf4fc-7rb7l                                    1/1     Running             0          27s
cert-manager                        cert-manager-cainjector-7f4db9f785-zhfr4                         1/1     Running             0          27s
cert-manager                        cert-manager-webhook-7877c997b-6ds82                             1/1     Running             0          27s
kube-system                         coredns-589f44dc88-b72sv                                         1/1     Running             0          95s
kube-system                         coredns-589f44dc88-xkrp9                                         1/1     Running             0          95s
kube-system                         etcd-capi-management-control-plane                               1/1     Running             0          102s
kube-system                         kindnet-456v8                                                    1/1     Running             0          95s
kube-system                         kube-apiserver-capi-management-control-plane                     1/1     Running             0          102s
kube-system                         kube-controller-manager-capi-management-control-plane            1/1     Running             0          102s
kube-system                         kube-proxy-gp4nd                                                 1/1     Running             0          95s
kube-system                         kube-scheduler-capi-management-control-plane                     1/1     Running             0          102s
local-path-storage                  local-path-provisioner-855c7b7774-q45q7                          1/1     Running             0          95s
keerthana@Mac-356 node-spin-up % kubectl get pods -A
NAMESPACE                           NAME                                                             READY   STATUS    RESTARTS   AGE
capd-system                         capd-controller-manager-84569fcf67-92bhh                         1/1     Running   0          32s
capi-kubeadm-bootstrap-system       capi-kubeadm-bootstrap-controller-manager-5774db566c-mjrzg       1/1     Running   0          33s
capi-kubeadm-control-plane-system   capi-kubeadm-control-plane-controller-manager-669648c68d-prsc7   1/1     Running   0          33s
capi-system                         capi-controller-manager-7b7465cf98-mh66x                         1/1     Running   0          34s
cert-manager                        cert-manager-6f4d7cf4fc-7rb7l                                    1/1     Running   0          54s
cert-manager                        cert-manager-cainjector-7f4db9f785-zhfr4                         1/1     Running   0          54s
cert-manager                        cert-manager-webhook-7877c997b-6ds82                             1/1     Running   0          54s
kube-system                         coredns-589f44dc88-b72sv                                         1/1     Running   0          2m2s
kube-system                         coredns-589f44dc88-xkrp9                                         1/1     Running   0          2m2s
kube-system                         etcd-capi-management-control-plane                               1/1     Running   0          2m9s
kube-system                         kindnet-456v8                                                    1/1     Running   0          2m2s
kube-system                         kube-apiserver-capi-management-control-plane                     1/1     Running   0          2m9s
kube-system                         kube-controller-manager-capi-management-control-plane            1/1     Running   0          2m9s
kube-system                         kube-proxy-gp4nd                                                 1/1     Running   0          2m2s
kube-system                         kube-scheduler-capi-management-control-plane                     1/1     Running   0          2m9s
local-path-storage                  local-path-provisioner-855c7b7774-q45q7                          1/1     Running   0          2m2s
keerthana@Mac-356 node-spin-up % clusterctl generate cluster node-spinup \
  --kubernetes-version v1.35.1 \
  --control-plane-machine-count=1 \
  --worker-machine-count=1 \
  > node-spinup.yaml
Error: failed to read "cluster-template.yaml" from provider's repository "infrastructure-docker": failed to download files from GitHub release v1.14.0: failed to get file "cluster-template.yaml" from "v1.14.0" release
keerthana@Mac-356 node-spin-up % kubectl apply -f node-spinup.yaml
error: no objects passed to apply
keerthana@Mac-356 node-spin-up % wc -l node-spinup.yaml
       0 node-spinup.yaml
keerthana@Mac-356 node-spin-up % kubectl apply -f node-spinup.yaml
error: no objects passed to apply
keerthana@Mac-356 node-spin-up % kubectl get cluster,machine,kubeadmcontrolplane,machinedeployment -A
No resources found
keerthana@Mac-356 node-spin-up % clusterctl get templates
Get info from a management or workload cluster

Usage:
  clusterctl get [command]

Available Commands:
  kubeconfig  Gets the kubeconfig file for accessing a workload cluster

Flags:
  -h, --help   help for get

Global Flags:
      --config $XDG_CONFIG_HOME/cluster-api/clusterctl.yaml   Path to clusterctl configuration (default is $XDG_CONFIG_HOME/cluster-api/clusterctl.yaml) or to a remote location (i.e. https://example.com/clusterctl.yaml)
  -v, --v int                                                 Set the log level verbosity. This overrides the CLUSTERCTL_LOG_LEVEL environment variable.

Use "clusterctl get [command] --help" for more information about a command.
keerthana@Mac-356 node-spin-up % clusterctl version
clusterctl version: &version.Info{Major:"1", Minor:"13", GitVersion:"v1.13.4", GitCommit:"Homebrew", GitTreeState:"clean", BuildDate:"2026-07-14T11:31:17Z", GoVersion:"go1.26.5", Compiler:"gc", Platform:"darwin/arm64"}
keerthana@Mac-356 node-spin-up % clusterctl version
clusterctl version: &version.Info{Major:"1", Minor:"14", GitVersion:"v1.14.0", GitCommit:"Homebrew", GitTreeState:"clean", BuildDate:"2026-07-30T16:27:41Z", GoVersion:"go1.26.5", Compiler:"gc", Platform:"darwin/arm64"}
keerthana@Mac-356 node-spin-up % curl -L https://raw.githubusercontent.com/kubernetes-sigs/cluster-api/v1.14.0/test/e2e/data/infrastructure-docker/cluster-template.yaml -o node-spinup.yaml
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100    14  100    14    0     0     23      0 --:--:-- --:--:-- --:--:--    23
keerthana@Mac-356 node-spin-up % wc -l node-spinup.yaml
       0 node-spinup.yaml
keerthana@Mac-356 node-spin-up % find "$(brew --prefix)/Cellar/clusterctl" -type f -name 'cluster-template.yaml' 2>/dev/null
keerthana@Mac-356 node-spin-up % clusterctl config repositories
NAME                       TYPE                       URL                                                                                               FILE
cluster-api                CoreProvider               https://github.com/kubernetes-sigs/cluster-api/releases/latest/                                   core-components.yaml
canonical-kubernetes       BootstrapProvider          https://github.com/canonical/cluster-api-k8s/releases/latest/                                     bootstrap-components.yaml
k0sproject-k0smotron       BootstrapProvider          https://github.com/k0sproject/k0smotron/releases/latest/                                          bootstrap-components.yaml
kubeadm                    BootstrapProvider          https://github.com/kubernetes-sigs/cluster-api/releases/latest/                                   bootstrap-components.yaml
kubekey-k3s                BootstrapProvider          https://github.com/kubesphere/kubekey/releases/latest/                                            bootstrap-components.yaml
microk8s                   BootstrapProvider          https://github.com/canonical/cluster-api-bootstrap-provider-microk8s/releases/latest/             bootstrap-components.yaml
rke2                       BootstrapProvider          https://github.com/rancher/cluster-api-provider-rke2/releases/latest/                             bootstrap-components.yaml
talos                      BootstrapProvider          https://github.com/siderolabs/cluster-api-bootstrap-provider-talos/releases/latest/               bootstrap-components.yaml
canonical-kubernetes       ControlPlaneProvider       https://github.com/canonical/cluster-api-k8s/releases/latest/                                     control-plane-components.yaml
hosted-control-plane       ControlPlaneProvider       https://github.com/teutonet/cluster-api-provider-hosted-control-plane/releases/latest/            control-plane-components.yaml
k0sproject-k0smotron       ControlPlaneProvider       https://github.com/k0sproject/k0smotron/releases/latest/                                          control-plane-components.yaml
kamaji                     ControlPlaneProvider       https://github.com/clastix/cluster-api-control-plane-provider-kamaji/releases/latest/             control-plane-components.yaml
kubeadm                    ControlPlaneProvider       https://github.com/kubernetes-sigs/cluster-api/releases/latest/                                   control-plane-components.yaml
kubekey-k3s                ControlPlaneProvider       https://github.com/kubesphere/kubekey/releases/latest/                                            control-plane-components.yaml
microk8s                   ControlPlaneProvider       https://github.com/canonical/cluster-api-control-plane-provider-microk8s/releases/latest/         control-plane-components.yaml
nested                     ControlPlaneProvider       https://github.com/kubernetes-sigs/cluster-api-provider-nested/releases/latest/                   control-plane-components.yaml
rke2                       ControlPlaneProvider       https://github.com/rancher/cluster-api-provider-rke2/releases/latest/                             control-plane-components.yaml
talos                      ControlPlaneProvider       https://github.com/siderolabs/cluster-api-control-plane-provider-talos/releases/latest/           control-plane-components.yaml
aws                        InfrastructureProvider     https://github.com/kubernetes-sigs/cluster-api-provider-aws/releases/latest/                      infrastructure-components.yaml
azure                      InfrastructureProvider     https://github.com/kubernetes-sigs/cluster-api-provider-azure/releases/latest/                    infrastructure-components.yaml
byoh                       InfrastructureProvider     https://github.com/vmware-tanzu/cluster-api-provider-bringyourownhost/releases/latest/            infrastructure-components.yaml
cloudscale-ch-cloudscale   InfrastructureProvider     https://github.com/cloudscale-ch/cluster-api-provider-cloudscale/releases/latest/                 infrastructure-components.yaml
cloudstack                 InfrastructureProvider     https://github.com/kubernetes-sigs/cluster-api-provider-cloudstack/releases/latest/               infrastructure-components.yaml
coxedge                    InfrastructureProvider     https://github.com/coxedge/cluster-api-provider-coxedge/releases/latest/                          infrastructure-components.yaml
digitalocean               InfrastructureProvider     https://github.com/kubernetes-sigs/cluster-api-provider-digitalocean/releases/latest/             infrastructure-components.yaml
docker                     InfrastructureProvider     https://github.com/kubernetes-sigs/cluster-api/releases/latest/                                   infrastructure-components-development.yaml
gcp                        InfrastructureProvider     https://github.com/kubernetes-sigs/cluster-api-provider-gcp/releases/latest/                      infrastructure-components.yaml
harvester-harvester        InfrastructureProvider     https://github.com/rancher-sandbox/cluster-api-provider-harvester/releases/latest/                infrastructure-components.yaml
hetzner                    InfrastructureProvider     https://github.com/syself/cluster-api-provider-hetzner/releases/latest/                           infrastructure-components.yaml
hivelocity-hivelocity      InfrastructureProvider     https://github.com/hivelocity/cluster-api-provider-hivelocity/releases/latest/                    infrastructure-components.yaml
huawei                     InfrastructureProvider     https://github.com/HuaweiCloudDeveloper/cluster-api-provider-huawei/releases/latest/              infrastructure-components.yaml
ibmcloud                   InfrastructureProvider     https://github.com/kubernetes-sigs/cluster-api-provider-ibmcloud/releases/latest/                 infrastructure-components.yaml
ionoscloud-ionoscloud      InfrastructureProvider     https://github.com/ionos-cloud/cluster-api-provider-ionoscloud/releases/latest/                   infrastructure-components.yaml
k0sproject-k0smotron       InfrastructureProvider     https://github.com/k0sproject/k0smotron/releases/latest/                                          infrastructure-components.yaml
kubekey                    InfrastructureProvider     https://github.com/kubesphere/kubekey/releases/latest/                                            infrastructure-components.yaml
kubeswift-io               InfrastructureProvider     https://github.com/kubeswift-io/cluster-api-provider-kubeswift/releases/latest/                   infrastructure-components.yaml
kubevirt                   InfrastructureProvider     https://github.com/kubernetes-sigs/cluster-api-provider-kubevirt/releases/latest/                 infrastructure-components.yaml
linode-linode              InfrastructureProvider     https://github.com/linode/cluster-api-provider-linode/releases/latest/                            infrastructure-components.yaml
maas                       InfrastructureProvider     https://github.com/spectrocloud/cluster-api-provider-maas/releases/latest/                        infrastructure-components.yaml
metal-stack                InfrastructureProvider     https://github.com/metal-stack/cluster-api-provider-metal-stack/releases/latest/                  infrastructure-components.yaml
metal3                     InfrastructureProvider     https://github.com/metal3-io/cluster-api-provider-metal3/releases/latest/                         infrastructure-components.yaml
nested                     InfrastructureProvider     https://github.com/kubernetes-sigs/cluster-api-provider-nested/releases/latest/                   infrastructure-components.yaml
nutanix                    InfrastructureProvider     https://github.com/nutanix-cloud-native/cluster-api-provider-nutanix/releases/latest/             infrastructure-components.yaml
oci                        InfrastructureProvider     https://github.com/oracle/cluster-api-provider-oci/releases/latest/                               infrastructure-components.yaml
opennebula                 InfrastructureProvider     https://github.com/OpenNebula/cluster-api-provider-opennebula/releases/latest/                    infrastructure-components.yaml
openstack                  InfrastructureProvider     https://github.com/kubernetes-sigs/cluster-api-provider-openstack/releases/latest/                infrastructure-components.yaml
outscale                   InfrastructureProvider     https://github.com/outscale/cluster-api-provider-outscale/releases/latest/                        infrastructure-components.yaml
oxide                      InfrastructureProvider     https://github.com/oxidecomputer/cluster-api-provider-oxide/releases/latest/                      infrastructure-components.yaml
proxmox                    InfrastructureProvider     https://github.com/ionos-cloud/cluster-api-provider-proxmox/releases/latest/                      infrastructure-components.yaml
scaleway                   InfrastructureProvider     https://github.com/scaleway/cluster-api-provider-scaleway/releases/latest/                        infrastructure-components.yaml
sidero                     InfrastructureProvider     https://github.com/siderolabs/sidero/releases/latest/                                             infrastructure-components.yaml
tinkerbell-tinkerbell      InfrastructureProvider     https://github.com/tinkerbell/cluster-api-provider-tinkerbell/releases/latest/                    infrastructure-components.yaml
vcd                        InfrastructureProvider     https://github.com/vmware/cluster-api-provider-cloud-director/releases/latest/                    infrastructure-components.yaml
vcluster                   InfrastructureProvider     https://github.com/loft-sh/cluster-api-provider-vcluster/releases/latest/                         infrastructure-components.yaml
virtink                    InfrastructureProvider     https://github.com/smartxworks/cluster-api-provider-virtink/releases/latest/                      infrastructure-components.yaml
vsphere                    InfrastructureProvider     https://github.com/kubernetes-sigs/cluster-api-provider-vsphere/releases/latest/                  infrastructure-components.yaml
vultr-vultr                InfrastructureProvider     https://github.com/vultr/cluster-api-provider-vultr/releases/latest/                              infrastructure-components.yaml
in-cluster                 IPAMProvider               https://github.com/kubernetes-sigs/cluster-api-ipam-provider-in-cluster/releases/latest/          ipam-components.yaml
metal3                     IPAMProvider               https://github.com/metal3-io/ip-address-manager/releases/latest/                                  ipam-components.yaml
nutanix                    IPAMProvider               https://github.com/nutanix-cloud-native/cluster-api-ipam-provider-nutanix/releases/latest/        ipam-components.yaml
nutanix                    RuntimeExtensionProvider   https://github.com/nutanix-cloud-native/cluster-api-runtime-extensions-nutanix/releases/latest/   runtime-extensions-components.yaml
eitco-cdk8s                AddonProvider              https://github.com/eitco/cluster-api-addon-provider-cdk8s/releases/latest/                        addon-components.yaml
helm                       AddonProvider              https://github.com/kubernetes-sigs/cluster-api-addon-provider-helm/releases/latest/               addon-components.yaml
rancher-fleet              AddonProvider              https://github.com/rancher/cluster-api-addon-provider-fleet/releases/latest/                      addon-components.yaml
keerthana@Mac-356 node-spin-up % clusterctl generate cluster node-spinup \
  --infrastructure docker \
  --flavor development \
  --kubernetes-version v1.35.1 \
  --control-plane-machine-count=1 \
  --worker-machine-count=1 \
  > node-spinup.yaml
keerthana@Mac-356 node-spin-up % wc -l node-spinup.yaml
     411 node-spinup.yaml
keerthana@Mac-356 node-spin-up % kubectl apply -f node-spinup.yaml
devmachinetemplate.infrastructure.cluster.x-k8s.io/quick-start-control-plane created
devmachinetemplate.infrastructure.cluster.x-k8s.io/quick-start-default-worker-machinetemplate created
devmachinepooltemplate.infrastructure.cluster.x-k8s.io/quick-start-default-worker-machinepooltemplate created
kubeadmconfigtemplate.bootstrap.cluster.x-k8s.io/quick-start-default-worker-bootstraptemplate created
Error from server (Forbidden): error when creating "node-spinup.yaml": admission webhook "validation.clusterclass.cluster.x-k8s.io" denied the request: spec: Forbidden: can be set only if the ClusterTopology feature flag is enabled
Error from server (Forbidden): error when creating "node-spinup.yaml": admission webhook "validation.devclustertemplate.infrastructure.cluster.x-k8s.io" denied the request: spec: Forbidden: can be set only if the ClusterTopology feature flag is enabled
Error from server (Forbidden): error when creating "node-spinup.yaml": admission webhook "validation.kubeadmcontrolplanetemplate.controlplane.cluster.x-k8s.io" denied the request: spec: Forbidden: can be set only if the ClusterTopology feature flag is enabled
Error from server (Invalid): error when creating "node-spinup.yaml": admission webhook "validation.cluster.cluster.x-k8s.io" denied the request: Cluster.cluster.x-k8s.io "node-spinup" is invalid: spec.topology: Forbidden: can be set only if the ClusterTopology feature flag is enabled
keerthana@Mac-356 node-spin-up % kubectl -n capi-system edit deployment capi-controller-manager
Edit cancelled, no changes made.
keerthana@Mac-356 node-spin-up % kubectl -n capi-system edit deployment capi-controller-manager
deployment.apps/capi-controller-manager edited
keerthana@Mac-356 node-spin-up % kubectl rollout status deployment/capi-controller-manager -n capi-system
deployment "capi-controller-manager" successfully rolled out
keerthana@Mac-356 node-spin-up % kubectl get pods -n capi-system
NAME                                       READY   STATUS    RESTARTS   AGE
capi-controller-manager-7c45d98f8f-mv4jw   1/1     Running   0          12s
keerthana@Mac-356 node-spin-up % kubectl apply -f node-spinup.yaml
clusterclass.cluster.x-k8s.io/quick-start created
devmachinetemplate.infrastructure.cluster.x-k8s.io/quick-start-control-plane unchanged
devmachinetemplate.infrastructure.cluster.x-k8s.io/quick-start-default-worker-machinetemplate unchanged
devmachinepooltemplate.infrastructure.cluster.x-k8s.io/quick-start-default-worker-machinepooltemplate unchanged
kubeadmconfigtemplate.bootstrap.cluster.x-k8s.io/quick-start-default-worker-bootstraptemplate unchanged
Warning: Cluster refers to ClusterClass default/quick-start, but this ClusterClass hasn't been successfully reconciled. Cluster topology has not been fully validated. Please take a look at the ClusterClass status
cluster.cluster.x-k8s.io/node-spinup created
Error from server (Forbidden): error when creating "node-spinup.yaml": admission webhook "validation.devclustertemplate.infrastructure.cluster.x-k8s.io" denied the request: spec: Forbidden: can be set only if the ClusterTopology feature flag is enabled
Error from server (Forbidden): error when creating "node-spinup.yaml": admission webhook "validation.kubeadmcontrolplanetemplate.controlplane.cluster.x-k8s.io" denied the request: spec: Forbidden: can be set only if the ClusterTopology feature flag is enabled
keerthana@Mac-356 node-spin-up % kubectl get cluster,machine,kubeadmcontrolplane,machinedeployment
NAME                                   CLUSTERCLASS   AVAILABLE   CP DESIRED   CP AVAILABLE   CP UP-TO-DATE   W DESIRED   W AVAILABLE   W UP-TO-DATE   PHASE   AGE   VERSION
cluster.cluster.x-k8s.io/node-spinup   quick-start                                                                                                             3s    v1.35.1
keerthana@Mac-356 node-spin-up % kubectl delete cluster node-spinup --ignore-not-found
kubectl delete clusterclass quick-start --ignore-not-found
kubectl delete devmachinetemplate quick-start-control-plane --ignore-not-found
kubectl delete devmachinetemplate quick-start-default-worker-machinetemplate --ignore-not-found
kubectl delete devmachinepooltemplate quick-start-default-worker-machinepooltemplate --ignore-not-found
kubectl delete kubeadmconfigtemplate quick-start-default-worker-bootstraptemplate --ignore-not-found
cluster.cluster.x-k8s.io "node-spinup" deleted
clusterclass.cluster.x-k8s.io "quick-start" deleted
keerthana@Mac-356 node-spin-up % kubectl get cluster,machine,kubeadmcontrolplane,machinedeployment
No resources found in default namespace.
keerthana@Mac-356 node-spin-up % kubectl get cluster,machine,kubeadmcontrolplane,machinedeployment
No resources found in default namespace.
keerthana@Mac-356 node-spin-up % clusterctl generate cluster node-spinup \
  --infrastructure docker \
  --kubernetes-version v1.35.1 \
  --control-plane-machine-count=1 \
  --worker-machine-count=1 \
  > node-spinup.yaml
Error: failed to read "cluster-template.yaml" from provider's repository "infrastructure-docker": failed to download files from GitHub release v1.14.0: failed to get file "cluster-template.yaml" from "v1.14.0" release
keerthana@Mac-356 node-spin-up % wc -l node-spinup.yaml
       0 node-spinup.yaml
keerthana@Mac-356 node-spin-up % kubectl api-resources | grep -E 'DevCluster|DevMachine|DevMachineTemplate'
devclusters                                      infrastructure.cluster.x-k8s.io/v1beta2   true         DevCluster
devclustertemplates                              infrastructure.cluster.x-k8s.io/v1beta2   true         DevClusterTemplate
devmachinepools                                  infrastructure.cluster.x-k8s.io/v1beta2   true         DevMachinePool
devmachinepooltemplates                          infrastructure.cluster.x-k8s.io/v1beta2   true         DevMachinePoolTemplate
devmachines                                      infrastructure.cluster.x-k8s.io/v1beta2   true         DevMachine
devmachinetemplates                              infrastructure.cluster.x-k8s.io/v1beta2   true         DevMachineTemplate
keerthana@Mac-356 node-spin-up % kubectl -n capi-kubeadm-control-plane-system edit deployment capi-kubeadm-control-plane-controller-manager
deployment.apps/capi-kubeadm-control-plane-controller-manager edited
keerthana@Mac-356 node-spin-up % kubectl -n capd-system edit deployment capd-controller-manager
deployment.apps/capd-controller-manager edited
keerthana@Mac-356 node-spin-up % kubectl rollout status deployment/capi-kubeadm-control-plane-controller-manager -n capi-kubeadm-control-plane-system
kubectl rollout status deployment/capd-controller-manager -n capd-system
deployment "capi-kubeadm-control-plane-controller-manager" successfully rolled out
Waiting for deployment "capd-controller-manager" rollout to finish: 1 old replicas are pending termination...
Waiting for deployment "capd-controller-manager" rollout to finish: 1 old replicas are pending termination...
deployment "capd-controller-manager" successfully rolled out
keerthana@Mac-356 node-spin-up % clusterctl generate cluster node-spinup \
  --infrastructure docker \
  --flavor development \
  --kubernetes-version v1.35.1 \
  --control-plane-machine-count=1 \
  --worker-machine-count=1 \
  > node-spinup.yaml
keerthana@Mac-356 node-spin-up % wc -l node-spinup.yaml
     411 node-spinup.yaml
keerthana@Mac-356 node-spin-up % kubectl apply -f node-spinup.yaml
clusterclass.cluster.x-k8s.io/quick-start created
devclustertemplate.infrastructure.cluster.x-k8s.io/quick-start-cluster created
kubeadmcontrolplanetemplate.controlplane.cluster.x-k8s.io/quick-start-control-plane created
devmachinetemplate.infrastructure.cluster.x-k8s.io/quick-start-control-plane created
devmachinetemplate.infrastructure.cluster.x-k8s.io/quick-start-default-worker-machinetemplate created
devmachinepooltemplate.infrastructure.cluster.x-k8s.io/quick-start-default-worker-machinepooltemplate created
kubeadmconfigtemplate.bootstrap.cluster.x-k8s.io/quick-start-default-worker-bootstraptemplate created
cluster.cluster.x-k8s.io/node-spinup created
keerthana@Mac-356 node-spin-up % kubectl get cluster,machine,kubeadmcontrolplane,machinedeployment
NAME                                   CLUSTERCLASS   AVAILABLE   CP DESIRED   CP AVAILABLE   CP UP-TO-DATE   W DESIRED   W AVAILABLE   W UP-TO-DATE   PHASE         AGE   VERSION
cluster.cluster.x-k8s.io/node-spinup   quick-start    False       1            0              1               1           0             1              Provisioned   40s   v1.35.1

NAME                                                          CLUSTER       NODE NAME   FAILURE DOMAIN   READY   AVAILABLE   UP-TO-DATE   PHASE          AGE   VERSION
machine.cluster.x-k8s.io/node-spinup-md-0-vxpv9-hxbg2-4bz9z   node-spinup                                False   False       True         Pending        18s   v1.35.1
machine.cluster.x-k8s.io/node-spinup-p8tkc-cswbr              node-spinup                                False   False       True         Provisioning   34s   v1.35.1

NAME                                                                  CLUSTER       AVAILABLE   DESIRED   CURRENT   READY   AVAILABLE   UP-TO-DATE   INITIALIZED   AGE   VERSION
kubeadmcontrolplane.controlplane.cluster.x-k8s.io/node-spinup-p8tkc   node-spinup   False       1         1         0       0           1                          40s   v1.35.1

NAME                                                        CLUSTER       AVAILABLE   DESIRED   CURRENT   READY   AVAILABLE   UP-TO-DATE   PHASE     AGE   VERSION
machinedeployment.cluster.x-k8s.io/node-spinup-md-0-vxpv9   node-spinup   False       1         1         0       0           1            Running   40s   v1.35.1
keerthana@Mac-356 node-spin-up % kubectl get cluster,machine,kubeadmcontrolplane,machinedeployment
NAME                                   CLUSTERCLASS   AVAILABLE   CP DESIRED   CP AVAILABLE   CP UP-TO-DATE   W DESIRED   W AVAILABLE   W UP-TO-DATE   PHASE         AGE   VERSION
cluster.cluster.x-k8s.io/node-spinup   quick-start    False       1            0              1               1           0             1              Provisioned   65s   v1.35.1

NAME                                                          CLUSTER       NODE NAME   FAILURE DOMAIN   READY   AVAILABLE   UP-TO-DATE   PHASE         AGE   VERSION
machine.cluster.x-k8s.io/node-spinup-md-0-vxpv9-hxbg2-4bz9z   node-spinup                                False   False       True         Pending       43s   v1.35.1
machine.cluster.x-k8s.io/node-spinup-p8tkc-cswbr              node-spinup               fd5              False   False       True         Provisioned   59s   v1.35.1

NAME                                                                  CLUSTER       AVAILABLE   DESIRED   CURRENT   READY   AVAILABLE   UP-TO-DATE   INITIALIZED   AGE   VERSION
kubeadmcontrolplane.controlplane.cluster.x-k8s.io/node-spinup-p8tkc   node-spinup   False       1         1         0       0           1                          65s   v1.35.1

NAME                                                        CLUSTER       AVAILABLE   DESIRED   CURRENT   READY   AVAILABLE   UP-TO-DATE   PHASE     AGE   VERSION
machinedeployment.cluster.x-k8s.io/node-spinup-md-0-vxpv9   node-spinup   False       1         1         0       0           1            Running   65s   v1.35.1
keerthana@Mac-356 node-spin-up % kubectl get cluster,machine,kubeadmcontrolplane,machinedeployment
NAME                                   CLUSTERCLASS   AVAILABLE   CP DESIRED   CP AVAILABLE   CP UP-TO-DATE   W DESIRED   W AVAILABLE   W UP-TO-DATE   PHASE         AGE   VERSION
cluster.cluster.x-k8s.io/node-spinup   quick-start    False       1            0              1               1           0             1              Provisioned   87s   v1.35.1

NAME                                                          CLUSTER       NODE NAME                 FAILURE DOMAIN   READY   AVAILABLE   UP-TO-DATE   PHASE         AGE   VERSION
machine.cluster.x-k8s.io/node-spinup-md-0-vxpv9-hxbg2-4bz9z   node-spinup                                              False   False       True         Provisioned   65s   v1.35.1
machine.cluster.x-k8s.io/node-spinup-p8tkc-cswbr              node-spinup   node-spinup-p8tkc-cswbr   fd5              False   False       True         Running       81s   v1.35.1

NAME                                                                  CLUSTER       AVAILABLE   DESIRED   CURRENT   READY   AVAILABLE   UP-TO-DATE   INITIALIZED   AGE   VERSION
kubeadmcontrolplane.controlplane.cluster.x-k8s.io/node-spinup-p8tkc   node-spinup   False       1         1         0       0           1            true          87s   v1.35.1

NAME                                                        CLUSTER       AVAILABLE   DESIRED   CURRENT   READY   AVAILABLE   UP-TO-DATE   PHASE     AGE   VERSION
machinedeployment.cluster.x-k8s.io/node-spinup-md-0-vxpv9   node-spinup   False       1         1         0       0           1            Running   87s   v1.35.1
keerthana@Mac-356 node-spin-up % docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"
NAMES                                STATUS                    IMAGE
node-spinup-md-0-vxpv9-hxbg2-4bz9z   Up 27 seconds             kindest/node:v1.35.1
node-spinup-p8tkc-cswbr              Up 58 seconds             kindest/node:v1.35.1
node-spinup-lb                       Up About a minute         kindest/haproxy:v20230606-42a2262b
capi-management-control-plane        Up 18 minutes             kindest/node:v1.36.1
minikube                             Exited (137) 2 days ago   gcr.io/k8s-minikube/kicbase:v0.0.50
cicd-test                            Exited (1) 2 days ago     cicd-demo:v1
keerthana@Mac-356 node-spin-up % clusterctl get kubeconfig node-spinup > node-spinup-kubeconfig.yaml
keerthana@Mac-356 node-spin-up % KUBECONFIG=node-spinup-kubeconfig.yaml kubectl get nodes -o wide
E0831 12:40:05.935758   29988 memcache.go:265] "Unhandled Error" err="couldn't get current server API group list: Get \"https://172.18.0.3:6443/api?timeout=32s\": dial tcp 172.18.0.3:6443: i/o timeout"
E0831 12:40:35.941536   29988 memcache.go:265] "Unhandled Error" err="couldn't get current server API group list: Get \"https://172.18.0.3:6443/api?timeout=32s\": dial tcp 172.18.0.3:6443: i/o timeout"
E0831 12:41:05.945542   29988 memcache.go:265] "Unhandled Error" err="couldn't get current server API group list: Get \"https://172.18.0.3:6443/api?timeout=32s\": dial tcp 172.18.0.3:6443: i/o timeout"
^C
keerthana@Mac-356 node-spin-up % docker exec node-spinup-p8tkc-cswbr kubectl get nodes
NAME                                 STATUS     ROLES           AGE     VERSION
node-spinup-md-0-vxpv9-hxbg2-4bz9z   NotReady   <none>          3m18s   v1.35.1
node-spinup-p8tkc-cswbr              NotReady   control-plane   3m37s   v1.35.1
keerthana@Mac-356 node-spin-up % docker exec node-spinup-p8tkc-cswbr kubectl get pods -A
NAMESPACE     NAME                                              READY   STATUS    RESTARTS   AGE
kube-system   coredns-7d764666f9-9h7dx                          0/1     Pending   0          3m55s
kube-system   coredns-7d764666f9-9zpwz                          0/1     Pending   0          3m55s
kube-system   etcd-node-spinup-p8tkc-cswbr                      1/1     Running   0          4m2s
kube-system   kube-apiserver-node-spinup-p8tkc-cswbr            1/1     Running   0          4m2s
kube-system   kube-controller-manager-node-spinup-p8tkc-cswbr   1/1     Running   0          4m2s
kube-system   kube-proxy-8hdwz                                  1/1     Running   0          3m44s
kube-system   kube-proxy-zxfqt                                  1/1     Running   0          3m55s
kube-system   kube-scheduler-node-spinup-p8tkc-cswbr            1/1     Running   0          4m2s
keerthana@Mac-356 node-spin-up % docker exec node-spinup-p8tkc-cswbr kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.30.3/manifests/calico.yaml
poddisruptionbudget.policy/calico-kube-controllers created
serviceaccount/calico-kube-controllers created
serviceaccount/calico-node created
serviceaccount/calico-cni-plugin created
configmap/calico-config created
customresourcedefinition.apiextensions.k8s.io/bgpconfigurations.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/bgpfilters.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/bgppeers.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/blockaffinities.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/caliconodestatuses.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/clusterinformations.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/felixconfigurations.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/globalnetworkpolicies.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/globalnetworksets.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/hostendpoints.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/ipamblocks.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/ipamconfigs.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/ipamhandles.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/ippools.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/ipreservations.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/kubecontrollersconfigurations.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/networkpolicies.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/networksets.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/stagedglobalnetworkpolicies.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/stagedkubernetesnetworkpolicies.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/stagednetworkpolicies.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/tiers.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/adminnetworkpolicies.policy.networking.k8s.io created
customresourcedefinition.apiextensions.k8s.io/baselineadminnetworkpolicies.policy.networking.k8s.io created
clusterrole.rbac.authorization.k8s.io/calico-kube-controllers created
clusterrole.rbac.authorization.k8s.io/calico-node created
clusterrole.rbac.authorization.k8s.io/calico-cni-plugin created
clusterrole.rbac.authorization.k8s.io/calico-tier-getter created
clusterrolebinding.rbac.authorization.k8s.io/calico-kube-controllers created
clusterrolebinding.rbac.authorization.k8s.io/calico-node created
clusterrolebinding.rbac.authorization.k8s.io/calico-cni-plugin created
clusterrolebinding.rbac.authorization.k8s.io/calico-tier-getter created
daemonset.apps/calico-node created
deployment.apps/calico-kube-controllers created
keerthana@Mac-356 node-spin-up % docker exec node-spinup-p8tkc-cswbr kubectl get pods -A
NAMESPACE     NAME                                              READY   STATUS     RESTARTS   AGE
kube-system   calico-kube-controllers-7679b9ffb8-mc2vw          0/1     Pending    0          17s
kube-system   calico-node-j5zq5                                 0/1     Init:0/3   0          17s
kube-system   calico-node-nf46x                                 0/1     Init:2/3   0          17s
kube-system   coredns-7d764666f9-9h7dx                          0/1     Pending    0          4m39s
kube-system   coredns-7d764666f9-9zpwz                          0/1     Pending    0          4m39s
kube-system   etcd-node-spinup-p8tkc-cswbr                      1/1     Running    0          4m46s
kube-system   kube-apiserver-node-spinup-p8tkc-cswbr            1/1     Running    0          4m46s
kube-system   kube-controller-manager-node-spinup-p8tkc-cswbr   1/1     Running    0          4m46s
kube-system   kube-proxy-8hdwz                                  1/1     Running    0          4m28s
kube-system   kube-proxy-zxfqt                                  1/1     Running    0          4m39s
kube-system   kube-scheduler-node-spinup-p8tkc-cswbr            1/1     Running    0          4m46s
keerthana@Mac-356 node-spin-up % docker exec node-spinup-p8tkc-cswbr kubectl get pods -A
NAMESPACE     NAME                                              READY   STATUS              RESTARTS   AGE
kube-system   calico-kube-controllers-7679b9ffb8-mc2vw          0/1     ContainerCreating   0          32s
kube-system   calico-node-j5zq5                                 0/1     Init:2/3            0          32s
kube-system   calico-node-nf46x                                 0/1     Init:2/3            0          32s
kube-system   coredns-7d764666f9-9h7dx                          0/1     ContainerCreating   0          4m54s
kube-system   coredns-7d764666f9-9zpwz                          0/1     ContainerCreating   0          4m54s
kube-system   etcd-node-spinup-p8tkc-cswbr                      1/1     Running             0          5m1s
kube-system   kube-apiserver-node-spinup-p8tkc-cswbr            1/1     Running             0          5m1s
kube-system   kube-controller-manager-node-spinup-p8tkc-cswbr   1/1     Running             0          5m1s
kube-system   kube-proxy-8hdwz                                  1/1     Running             0          4m43s
kube-system   kube-proxy-zxfqt                                  1/1     Running             0          4m54s
kube-system   kube-scheduler-node-spinup-p8tkc-cswbr            1/1     Running             0          5m1s
keerthana@Mac-356 node-spin-up % docker exec node-spinup-p8tkc-cswbr kubectl get pods -A
NAMESPACE     NAME                                              READY   STATUS              RESTARTS   AGE
kube-system   calico-kube-controllers-7679b9ffb8-mc2vw          0/1     ContainerCreating   0          46s
kube-system   calico-node-j5zq5                                 0/1     Init:2/3            0          46s
kube-system   calico-node-nf46x                                 1/1     Running             0          46s
kube-system   coredns-7d764666f9-9h7dx                          1/1     Running             0          5m8s
kube-system   coredns-7d764666f9-9zpwz                          1/1     Running             0          5m8s
kube-system   etcd-node-spinup-p8tkc-cswbr                      1/1     Running             0          5m15s
kube-system   kube-apiserver-node-spinup-p8tkc-cswbr            1/1     Running             0          5m15s
kube-system   kube-controller-manager-node-spinup-p8tkc-cswbr   1/1     Running             0          5m15s
kube-system   kube-proxy-8hdwz                                  1/1     Running             0          4m57s
kube-system   kube-proxy-zxfqt                                  1/1     Running             0          5m8s
kube-system   kube-scheduler-node-spinup-p8tkc-cswbr            1/1     Running             0          5m15s
keerthana@Mac-356 node-spin-up % 
keerthana@Mac-356 node-spin-up % docker exec node-spinup-p8tkc-cswbr kubectl get nodes
NAME                                 STATUS   ROLES           AGE     VERSION
node-spinup-md-0-vxpv9-hxbg2-4bz9z   Ready    <none>          5m21s   v1.35.1
node-spinup-p8tkc-cswbr              Ready    control-plane   5m40s   v1.35.1
keerthana@Mac-356 node-spin-up % docker exec node-spinup-p8tkc-cswbr kubectl get nodes
NAME                                 STATUS   ROLES           AGE     VERSION
node-spinup-md-0-vxpv9-hxbg2-4bz9z   Ready    <none>          5m46s   v1.35.1
node-spinup-p8tkc-cswbr              Ready    control-plane   6m5s    v1.35.1
keerthana@Mac-356 node-spin-up % kubectl get machines -o wide
NAME                                 CLUSTER       NODE NAME                            PROVIDER ID                                     FAILURE DOMAIN   READY   AVAILABLE   UP-TO-DATE   INTERNAL-IP   EXTERNAL-IP   OS-IMAGE                       PAUSED   PHASE     AGE     VERSION
node-spinup-md-0-vxpv9-hxbg2-4bz9z   node-spinup   node-spinup-md-0-vxpv9-hxbg2-4bz9z   docker:////node-spinup-md-0-vxpv9-hxbg2-4bz9z                    True    True        True         172.18.0.5    172.18.0.5    Debian GNU/Linux 13 (trixie)   False    Running   7m17s   v1.35.1
node-spinup-p8tkc-cswbr              node-spinup   node-spinup-p8tkc-cswbr              docker:////node-spinup-p8tkc-cswbr              fd5              True    True        True         172.18.0.4    172.18.0.4    Debian GNU/Linux 13 (trixie)   False    Running   7m33s   v1.35.1
keerthana@Mac-356 node-spin-up % cat > machine-health-check.yaml <<'EOF'
apiVersion: cluster.x-k8s.io/v1beta2
kind: MachineHealthCheck
metadata:
  name: node-spinup-worker-health
  namespace: default
spec:
  clusterName: node-spinup
  maxUnhealthy: 1
  nodeStartupTimeout: 10m
  unhealthyConditions:
    - type: Ready
      status: "Unknown"
      timeout: 2m
    - type: Ready
      status: "False"
      timeout: 2m
EOF
keerthana@Mac-356 node-spin-up % kubectl apply -f machine-health-check.yaml
Error from server (BadRequest): error when creating "machine-health-check.yaml": MachineHealthCheck in version "v1beta2" cannot be handled as a MachineHealthCheck: strict decoding error: unknown field "spec.maxUnhealthy", unknown field "spec.nodeStartupTimeout", unknown field "spec.unhealthyConditions"
keerthana@Mac-356 node-spin-up % cat > machine-health-check.yaml <<'EOF'
apiVersion: cluster.x-k8s.io/v1beta2
kind: MachineHealthCheck
metadata:
  name: node-spinup-mhc
  namespace: default
spec:
  clusterName: node-spinup
  checks:
    nodeStartupTimeoutSeconds: 600
    unhealthyNodeConditions:
      - type: Ready
        status: "False"
        timeoutSeconds: 300
  remediation:
    maxInFlight: 1
EOF
keerthana@Mac-356 node-spin-up % kubectl apply -f machine-health-check.yaml
Error from server (BadRequest): error when creating "machine-health-check.yaml": MachineHealthCheck in version "v1beta2" cannot be handled as a MachineHealthCheck: strict decoding error: unknown field "spec.remediation.maxInFlight"
keerthana@Mac-356 node-spin-up % cat > machine-health-check.yaml <<'EOF'
apiVersion: cluster.x-k8s.io/v1beta2
kind: MachineHealthCheck
metadata:
  name: node-spinup-mhc
  namespace: default
spec:
  clusterName: node-spinup
  checks:
    nodeStartupTimeoutSeconds: 600
    unhealthyNodeConditions:
      - type: Ready
        status: "False"
        timeoutSeconds: 300
EOF
keerthana@Mac-356 node-spin-up % kubectl apply -f machine-health-check.yaml
The MachineHealthCheck "node-spinup-mhc" is invalid: 
* spec.selector: Required value
* <nil>: Invalid value: null: some validation rules were not checked because the object was invalid; correct the existing errors to complete validation
keerthana@Mac-356 node-spin-up % cat > machine-health-check.yaml <<'EOF'
apiVersion: cluster.x-k8s.io/v1beta2
kind: MachineHealthCheck
metadata:
  name: node-spinup-mhc
  namespace: default
spec:
  clusterName: node-spinup
  selector:
    matchLabels:
      cluster.x-k8s.io/cluster-name: node-spinup
  checks:
    nodeStartupTimeoutSeconds: 600
    unhealthyNodeConditions:
      - type: Ready
        status: "False"
        timeoutSeconds: 300
EOF
keerthana@Mac-356 node-spin-up % kubectl apply -f machine-health-check.yaml
machinehealthcheck.cluster.x-k8s.io/node-spinup-mhc created
keerthana@Mac-356 node-spin-up % kubectl get machinehealthcheck
NAME                     CLUSTER       REPLICAS   HEALTHY   AGE
node-spinup-md-0-vxpv9   node-spinup   1          1         9m13s
node-spinup-mhc          node-spinup                        4s
node-spinup-p8tkc        node-spinup   1          1         9m13s
keerthana@Mac-356 node-spin-up % kubectl describe machinehealthcheck node-spinup-mhc
Name:         node-spinup-mhc
Namespace:    default
Labels:       cluster.x-k8s.io/cluster-name=node-spinup
Annotations:  <none>
API Version:  cluster.x-k8s.io/v1beta2
Kind:         MachineHealthCheck
Metadata:
  Creation Timestamp:  2026-08-31T07:15:57Z
  Generation:          1
  Owner References:
    API Version:     cluster.x-k8s.io/v1beta2
    Kind:            Cluster
    Name:            node-spinup
    UID:             2d2519cc-6eee-4026-851f-e29a15116b38
  Resource Version:  6534
  UID:               d8fc96a1-e374-443a-8cf3-9424d447a90f
Spec:
  Checks:
    Node Startup Timeout Seconds:  600
    Unhealthy Node Conditions:
      Status:           False
      Timeout Seconds:  300
      Type:             Ready
  Cluster Name:         node-spinup
  Selector:
    Match Labels:
      cluster.x-k8s.io/cluster-name:  node-spinup
Status:
  Conditions:
    Last Transition Time:  2026-08-31T07:16:12Z
    Message:               
    Observed Generation:   1
    Reason:                RemediationAllowed
    Status:                True
    Type:                  RemediationAllowed
    Last Transition Time:  2026-08-31T07:15:57Z
    Message:               
    Observed Generation:   1
    Reason:                NotPaused
    Status:                False
    Type:                  Paused
  Current Healthy:         2
  Deprecated:
    v1beta1:
      Conditions:
        Last Transition Time:  2026-08-31T07:16:12Z
        Status:                True
        Type:                  RemediationAllowed
  Expected Machines:           2
  Observed Generation:         1
  Remediations Allowed:        2
  Targets:
    node-spinup-md-0-vxpv9-hxbg2-4bz9z
    node-spinup-p8tkc-cswbr
Events:  <none>
keerthana@Mac-356 node-spin-up % docker stop node-spinup-md-0-vxpv9-hxbg2-4bz9z
node-spinup-md-0-vxpv9-hxbg2-4bz9z
keerthana@Mac-356 node-spin-up % kubectl get machines -w
NAME                                 CLUSTER       NODE NAME                            FAILURE DOMAIN   READY   AVAILABLE   UP-TO-DATE   PHASE     AGE   VERSION
node-spinup-md-0-vxpv9-hxbg2-4bz9z   node-spinup   node-spinup-md-0-vxpv9-hxbg2-4bz9z                    True    True        True         Running   10m   v1.35.1
node-spinup-p8tkc-cswbr              node-spinup   node-spinup-p8tkc-cswbr              fd5              True    True        True         Running   10m   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-4bz9z   node-spinup   node-spinup-md-0-vxpv9-hxbg2-4bz9z                    Unknown   False       True         Running   10m   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-4bz9z   node-spinup   node-spinup-md-0-vxpv9-hxbg2-4bz9z                    False     False       True         Running   10m   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-4bz9z   node-spinup   node-spinup-md-0-vxpv9-hxbg2-4bz9z                    False     False       True         Running   15m   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-4bz9z   node-spinup   node-spinup-md-0-vxpv9-hxbg2-4bz9z                    False     False       True         Running   15m   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-4bz9z   node-spinup   node-spinup-md-0-vxpv9-hxbg2-4bz9z                    False     False       True         Running   15m   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-4bz9z   node-spinup   node-spinup-md-0-vxpv9-hxbg2-4bz9z                    False     False       True         Running   15m   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-4bz9z   node-spinup   node-spinup-md-0-vxpv9-hxbg2-4bz9z                    False     False       True         Running   15m   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-4bz9z   node-spinup   node-spinup-md-0-vxpv9-hxbg2-4bz9z                    False     False       True         Running   15m   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-4bz9z   node-spinup   node-spinup-md-0-vxpv9-hxbg2-4bz9z                    False     False       True         Running   15m   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-4bz9z   node-spinup   node-spinup-md-0-vxpv9-hxbg2-4bz9z                    False     False       True         Running   15m   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-4bz9z   node-spinup   node-spinup-md-0-vxpv9-hxbg2-4bz9z                    False     False       True         Deleting   15m   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-4bz9z   node-spinup   node-spinup-md-0-vxpv9-hxbg2-4bz9z                    False     False       True         Deleting   16m   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-4bz9z   node-spinup   node-spinup-md-0-vxpv9-hxbg2-4bz9z                    False     False       True         Deleting   16m   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-4bz9z   node-spinup   node-spinup-md-0-vxpv9-hxbg2-4bz9z                    False     False       True         Deleting   16m   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-4bz9z   node-spinup   node-spinup-md-0-vxpv9-hxbg2-4bz9z                    False     False       True         Deleting   16m   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-4bz9z   node-spinup   node-spinup-md-0-vxpv9-hxbg2-4bz9z                    False     False       True         Deleting   16m   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-4bz9z   node-spinup   node-spinup-md-0-vxpv9-hxbg2-4bz9z                    False     False       True         Deleting   16m   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-4bz9z   node-spinup   node-spinup-md-0-vxpv9-hxbg2-4bz9z                    False     False       True         Deleting   16m   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-4bz9z   node-spinup   node-spinup-md-0-vxpv9-hxbg2-4bz9z                    False     False       True         Deleting   16m   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-k5h98   node-spinup                                                                                                       0s    v1.35.1
node-spinup-md-0-vxpv9-hxbg2-k5h98   node-spinup                                                                                                       0s    v1.35.1
node-spinup-md-0-vxpv9-hxbg2-k5h98   node-spinup                                                         False     False       True                    1s    v1.35.1
node-spinup-md-0-vxpv9-hxbg2-k5h98   node-spinup                                                         False     False       True         Pending    1s    v1.35.1
node-spinup-md-0-vxpv9-hxbg2-k5h98   node-spinup                                                         False     False       True         Pending    4s    v1.35.1
node-spinup-md-0-vxpv9-hxbg2-k5h98   node-spinup                                                         False     False       True         Pending    4s    v1.35.1
node-spinup-md-0-vxpv9-hxbg2-k5h98   node-spinup                                                         False     False       True         Provisioning   4s    v1.35.1
node-spinup-md-0-vxpv9-hxbg2-k5h98   node-spinup                                                         False     False       True         Provisioning   5s    v1.35.1
node-spinup-md-0-vxpv9-hxbg2-k5h98   node-spinup                                                         False     False       True         Provisioning   5s    v1.35.1
node-spinup-md-0-vxpv9-hxbg2-k5h98   node-spinup                                                         False     False       True         Provisioning   7s    v1.35.1
node-spinup-md-0-vxpv9-hxbg2-k5h98   node-spinup                                                         False     False       True         Provisioning   8s    v1.35.1
node-spinup-md-0-vxpv9-hxbg2-k5h98   node-spinup                                                         False     False       True         Provisioning   12s   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-k5h98   node-spinup                                                         False     False       True         Provisioning   14s   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-k5h98   node-spinup                                                         False     False       True         Provisioning   14s   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-k5h98   node-spinup                                                         False     False       True         Provisioned    14s   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-k5h98   node-spinup                                                         False     False       True         Provisioned    15s   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-k5h98   node-spinup                                                         False     False       True         Provisioned    15s   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-k5h98   node-spinup                                                         False     False       True         Provisioned    16s   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-k5h98   node-spinup                                                         False     False       True         Provisioned    17s   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-k5h98   node-spinup   node-spinup-md-0-vxpv9-hxbg2-k5h98                    False     False       True         Running        17s   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-k5h98   node-spinup   node-spinup-md-0-vxpv9-hxbg2-k5h98                    False     False       True         Running        26s   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-k5h98   node-spinup   node-spinup-md-0-vxpv9-hxbg2-k5h98                    True      True        True         Running        33s   v1.35.1
node-spinup-md-0-vxpv9-hxbg2-k5h98   node-spinup   node-spinup-md-0-vxpv9-hxbg2-k5h98                    True      True        True         Running        46s   v1.35.1
^C%                                                                                                                                     
keerthana@Mac-356 node-spin-up % docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"
NAMES                                STATUS          IMAGE
node-spinup-md-0-vxpv9-hxbg2-k5h98   Up 49 seconds   kindest/node:v1.35.1
node-spinup-p8tkc-cswbr              Up 17 minutes   kindest/node:v1.35.1
node-spinup-lb                       Up 17 minutes   kindest/haproxy:v20230606-42a2262b
capi-management-control-plane        Up 35 minutes   kindest/node:v1.36.1
keerthana@Mac-356 node-spin-up % 