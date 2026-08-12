keerthana@Mac-182 k8s_demo % minikube start
😄  minikube v1.38.1 on Darwin 26.4.1 (arm64)
✨  Using the docker driver based on existing profile
👍  Starting "minikube" primary control-plane node in "minikube" cluster
🚜  Pulling base image v0.0.50 ...
🔄  Restarting existing docker container for "minikube" ...
🐳  Preparing Kubernetes v1.35.1 on Docker 29.2.1 ...
🔎  Verifying Kubernetes components...
🌟  Enabled addons: 

👍  Starting "minikube-m02" worker node in "minikube" cluster
🚜  Pulling base image v0.0.50 ...
🔄  Restarting existing docker container for "minikube-m02" ...
🌐  Found network options:
    ▪ NO_PROXY=192.168.49.2
🐳  Preparing Kubernetes v1.35.1 on Docker 29.2.1 ...
    ▪ env NO_PROXY=192.168.49.2
🔎  Verifying Kubernetes components...

❗  /usr/local/bin/kubectl is version 1.32.2, which may have incompatibilities with Kubernetes 1.35.1.
    ▪ Want kubectl v1.35.1? Try 'minikube kubectl -- get pods -A'
🏄  Done! kubectl is now configured to use "minikube" cluster and "default" namespace by default
keerthana@Mac-182 k8s_demo % eval $(minikube docker-env)
❌  Exiting due to ENV_MULTINODE_CONFLICT: The docker-env command is incompatible with multi-node clusters. Use the 'registry' add-on: https://minikube.sigs.k8s.io/docs/handbook/registry/
keerthana@Mac-182 k8s_demo % docker ps
CONTAINER ID   IMAGE                                 COMMAND                  CREATED        STATUS          PORTS                                                                                                                                  NAMES
f46e49029cfd   gcr.io/k8s-minikube/kicbase:v0.0.50   "/usr/local/bin/entr…"   22 hours ago   Up 31 seconds   127.0.0.1:50764->22/tcp, 127.0.0.1:50767->2376/tcp, 127.0.0.1:50766->5000/tcp, 127.0.0.1:50768->8443/tcp, 127.0.0.1:50765->32443/tcp   minikube-m02
c6390208a4a5   gcr.io/k8s-minikube/kicbase:v0.0.50   "/usr/local/bin/entr…"   23 hours ago   Up 52 seconds   127.0.0.1:50726->22/tcp, 127.0.0.1:50728->2376/tcp, 127.0.0.1:50727->5000/tcp, 127.0.0.1:50730->8443/tcp, 127.0.0.1:50729->32443/tcp   minikube
keerthana@Mac-182 k8s_demo % kubectl delete minikube-02
error: the server doesn't have a resource type "minikube-02"
keerthana@Mac-182 k8s_demo % kubectl node delete minikube-02
error: unknown command "node" for "kubectl"
keerthana@Mac-182 k8s_demo % minikube node delete minikube-m02
🔥  Deleting node minikube-m02 from cluster minikube
✋  Stopping node "minikube-m02"  ...
🛑  Powering off "minikube-m02" via SSH ...
🔥  Deleting "minikube-m02" in docker ...
💀  Node minikube-m02 was successfully deleted.
keerthana@Mac-182 k8s_demo % eval $(minikube docker-env)                                                                -->*important note*
keerthana@Mac-182 k8s_demo % docker ps
CONTAINER ID   IMAGE                          COMMAND                  CREATED          STATUS          PORTS     NAMES
1d56dbfce742   e08f4d9d2e6e                   "/coredns -conf /etc…"   17 seconds ago   Up 16 seconds             k8s_coredns_coredns-7d764666f9-h899n_kube-system_24f8f58b-f4f7-4695-ae7e-3e65dfedd968_0
e863cde53816   f91182157dd9                   "/usr/bin/wrapper /u…"   17 seconds ago   Up 17 seconds             k8s_calico-kube-controllers_calico-kube-controllers-565c89d6df-mfhjs_kube-system_3378b532-0512-40bd-bc6c-d8ef11114c84_0
308dd1eff629   registry.k8s.io/pause:3.10.1   "/pause"                 17 seconds ago   Up 17 seconds             k8s_POD_coredns-7d764666f9-h899n_kube-system_24f8f58b-f4f7-4695-ae7e-3e65dfedd968_0
0111b81b2600   registry.k8s.io/pause:3.10.1   "/pause"                 17 seconds ago   Up 17 seconds             k8s_POD_calico-kube-controllers-565c89d6df-mfhjs_kube-system_3378b532-0512-40bd-bc6c-d8ef11114c84_0
6f6c5c0c744b   98788f64d6ca                   "start_runit"            3 minutes ago    Up 3 minutes              k8s_calico-node_calico-node-5c5z8_kube-system_c66583ca-db70-49f2-a37e-79d4907b1ebf_1
16a4dbe5293a   2d611d040292                   "/usr/local/bin/kube…"   3 minutes ago    Up 3 minutes              k8s_kube-proxy_kube-proxy-8x7gx_kube-system_b2a26bbd-1db3-4e01-aa10-6aaa028eed92_1
4560846f8945   registry.k8s.io/pause:3.10.1   "/pause"                 3 minutes ago    Up 3 minutes              k8s_POD_calico-node-5c5z8_kube-system_c66583ca-db70-49f2-a37e-79d4907b1ebf_1
b67021736966   registry.k8s.io/pause:3.10.1   "/pause"                 3 minutes ago    Up 3 minutes              k8s_POD_kube-proxy-8x7gx_kube-system_b2a26bbd-1db3-4e01-aa10-6aaa028eed92_1
aeb9002690f4   7459ea001763                   "kube-apiserver --ad…"   3 minutes ago    Up 3 minutes              k8s_kube-apiserver_kube-apiserver-minikube_kube-system_a6dc00f40d27725f15407f95751ce5f7_1
932e4625a752   4cad4f996631                   "kube-scheduler --au…"   3 minutes ago    Up 3 minutes              k8s_kube-scheduler_kube-scheduler-minikube_kube-system_1c7123a121598343200ffd5b015ca580_1
072aab82301a   271e49a0ebc5                   "etcd --advertise-cl…"   3 minutes ago    Up 3 minutes              k8s_etcd_etcd-minikube_kube-system_5ff8e3b06bbaa8cb7ebc2bf531e48a2f_1
3cdcc26a0da5   464c974e702e                   "kube-controller-man…"   3 minutes ago    Up 3 minutes              k8s_kube-controller-manager_kube-controller-manager-minikube_kube-system_740363cf4388c2d0df59fc97f96b889c_1
658f8dc75712   registry.k8s.io/pause:3.10.1   "/pause"                 3 minutes ago    Up 3 minutes              k8s_POD_kube-scheduler-minikube_kube-system_1c7123a121598343200ffd5b015ca580_1
1c023d6f7468   registry.k8s.io/pause:3.10.1   "/pause"                 3 minutes ago    Up 3 minutes              k8s_POD_etcd-minikube_kube-system_5ff8e3b06bbaa8cb7ebc2bf531e48a2f_1
e2974a331b6e   registry.k8s.io/pause:3.10.1   "/pause"                 3 minutes ago    Up 3 minutes              k8s_POD_kube-controller-manager-minikube_kube-system_740363cf4388c2d0df59fc97f96b889c_1
93b7459a87b9   registry.k8s.io/pause:3.10.1   "/pause"                 3 minutes ago    Up 3 minutes              k8s_POD_kube-apiserver-minikube_kube-system_a6dc00f40d27725f15407f95751ce5f7_1
keerthana@Mac-182 k8s_demo % 

-- we can see here what are all the components have in kubernetes that all are run in minikube --
--  this command to use what are all running in the minikube *eval $(minikube docker-env)*--