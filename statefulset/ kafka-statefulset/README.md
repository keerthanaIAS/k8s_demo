keerthana@Keerthanas-MacBook-Air  kafka-statefulset % kubectl apply -f service.yaml
service/kafka created
keerthana@Keerthanas-MacBook-Air  kafka-statefulset % kubectl get svc kafka
NAME    TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)    AGE
kafka   ClusterIP   None         <none>        9092/TCP   3s
keerthana@Keerthanas-MacBook-Air  kafka-statefulset % kubectl apply -f statefulset.yaml
statefulset.apps/kafka created
keerthana@Keerthanas-MacBook-Air  kafka-statefulset % kubectl get pods -w
NAME                 READY   STATUS              RESTARTS        AGE
demo-statefulset-0   1/1     Running             1 (4h44m ago)   24h
demo-statefulset-1   1/1     Running             1 (4h44m ago)   23h
demo-statefulset-2   1/1     Running             1 (4h44m ago)   24h
demo-statefulset-3   1/1     Running             1 (4h44m ago)   24h
demo-statefulset-4   1/1     Running             1 (4h44m ago)   24h
kafka-0              0/1     ContainerCreating   0               5s
redis-0              1/1     Running             0               3h
redis-1              1/1     Running             0               2m58s
redis-2              1/1     Running             0               2m57s
kafka-0              1/1     Running             0               14s
kafka-1              0/1     Pending             0               0s
kafka-1              0/1     Pending             0               0s
kafka-1              0/1     Pending             0               0s
kafka-1              0/1     ContainerCreating   0               0s
kafka-1              0/1     ContainerCreating   0               0s
kafka-0              0/1     Error               0               15s
kafka-1              1/1     Running             0               1s
kafka-0              1/1     Running             1 (2s ago)      16s
kafka-2              0/1     Pending             0               0s
kafka-2              0/1     Pending             0               0s
kafka-2              0/1     Pending             0               0s
kafka-2              0/1     ContainerCreating   0               0s
kafka-2              0/1     ContainerCreating   0               1s
kafka-1              0/1     Error               0               3s
kafka-2              1/1     Running             0               1s
kafka-0              0/1     Error               1 (4s ago)      18s
kafka-1              1/1     Running             1 (2s ago)      4s
kafka-2              0/1     Error               0               3s
kafka-1              0/1     Error               1 (4s ago)      6s
kafka-2              1/1     Running             1 (1s ago)      4s
kafka-2              0/1     Error               1 (2s ago)      5s
^C%                                                                                                                                
keerthana@Keerthanas-MacBook-Air  kafka-statefulset % kubectl get pvc
NAME                              STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
kafka-data-kafka-0                Bound    pvc-a7dfbd21-e8ff-4c7e-bfdc-01441fd176d8   2Gi        RWO            standard       <unset>                 27s
kafka-data-kafka-1                Bound    pvc-a2f21d15-1a5c-494b-ad71-8d1815949885   2Gi        RWO            standard       <unset>                 13s
kafka-data-kafka-2                Bound    pvc-03f0a84c-3d05-46ed-a6ed-f61b809ab02e   2Gi        RWO            standard       <unset>                 11s
keerthana@Keerthanas-MacBook-Air  kafka-statefulset % 




keerthana@Keerthanas-MacBook-Air  kafka-statefulset % kubectl run kafka-client \
  --image=apache/kafka:4.0.0 \
  --restart=Never \
  -it --rm \
  -- bash
If you don't see a command prompt, try pressing enter.
kafka-client:/$ getent hosts kafka-0.kafka
kafka-client:/$ getent hosts kafka-1.kafka
kafka-client:/$ getent hosts kafka-2.kafka
kafka-client:/$ getent hosts kafka
kafka-client:/$ /opt/kafka/bin/kafka-broker-api-versions.sh \
  --bootstrap-server kafka-0.kafka:9092
[2026-08-28 09:42:49,712] WARN Couldn't resolve server kafka-0.kafka:9092 from bootstrap.servers as DNS resolution failed for kafka-0.kafka (org.apache.kafka.clients.ClientUtils)
No resolvable bootstrap urls given in bootstrap.servers
org.apache.kafka.common.config.ConfigException: No resolvable bootstrap urls given in bootstrap.servers
        at org.apache.kafka.clients.ClientUtils.parseAndValidateAddresses(ClientUtils.java:104)
        at org.apache.kafka.clients.ClientUtils.parseAndValidateAddresses(ClientUtils.java:63)
        at org.apache.kafka.tools.BrokerApiVersionsCommand$AdminClient.create(BrokerApiVersionsCommand.java:175)
        at org.apache.kafka.tools.BrokerApiVersionsCommand$AdminClient.create(BrokerApiVersionsCommand.java:162)
        at org.apache.kafka.tools.BrokerApiVersionsCommand.createAdminClient(BrokerApiVersionsCommand.java:104)
        at org.apache.kafka.tools.BrokerApiVersionsCommand.execute(BrokerApiVersionsCommand.java:85)
        at org.apache.kafka.tools.BrokerApiVersionsCommand.mainNoExit(BrokerApiVersionsCommand.java:74)
        at org.apache.kafka.tools.BrokerApiVersionsCommand.main(BrokerApiVersionsCommand.java:69)

kafka-client:/$ exit
exit
pod "kafka-client" deleted
pod default/kafka-client terminated (Error)
keerthana@Keerthanas-MacBook-Air  kafka-statefulset % kubectl get pods -o wide
NAME                 READY   STATUS             RESTARTS        AGE     IP               NODE       NOMINATED NODE   READINESS GATES
demo-statefulset-0   1/1     Running            1 (4h47m ago)   24h     10.244.120.97    minikube   <none>           <none>
demo-statefulset-1   1/1     Running            1 (4h47m ago)   23h     10.244.120.94    minikube   <none>           <none>
demo-statefulset-2   1/1     Running            1 (4h47m ago)   24h     10.244.120.95    minikube   <none>           <none>
demo-statefulset-3   1/1     Running            1 (4h47m ago)   24h     10.244.120.96    minikube   <none>           <none>
demo-statefulset-4   1/1     Running            1 (4h47m ago)   24h     10.244.120.98    minikube   <none>           <none>
kafka-0              0/1     Error              4 (2m5s ago)    3m      10.244.120.105   minikube   <none>           <none>
kafka-1              0/1     CrashLoopBackOff   4 (73s ago)     2m46s   10.244.120.106   minikube   <none>           <none>
kafka-2              0/1     Error              4 (117s ago)    2m44s   10.244.120.107   minikube   <none>           <none>
redis-0              1/1     Running            0               3h3m    10.244.120.101   minikube   <none>           <none>
redis-1              1/1     Running            0               5m53s   10.244.120.103   minikube   <none>           <none>
redis-2              1/1     Running            0               5m52s   10.244.120.104   minikube   <none>           <none>
keerthana@Keerthanas-MacBook-Air  kafka-statefulset % kubectl get svc
NAME           TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)    AGE
demo-service   ClusterIP   None         <none>        80/TCP     23h
kafka          ClusterIP   None         <none>        9092/TCP   3m50s
kubernetes     ClusterIP   10.96.0.1    <none>        443/TCP    17d
redis          ClusterIP   None         <none>        6379/TCP   3h7m
keerthana@Keerthanas-MacBook-Air  kafka-statefulset % kubectl get endpoints kafka
Warning: v1 Endpoints is deprecated in v1.33+; use discovery.k8s.io/v1 EndpointSlice
NAME    ENDPOINTS   AGE
kafka               3m57s
keerthana@Keerthanas-MacBook-Air  kafka-statefulset % kubectl get endpointslices -l kubernetes.io/service-name=kafka -o wide
NAME          ADDRESSTYPE   PORTS   ENDPOINTS                                      AGE
kafka-mpqf9   IPv4          9092    10.244.120.105,10.244.120.106,10.244.120.107   4m2s
keerthana@Keerthanas-MacBook-Air  kafka-statefulset % kubectl get statefulset kafka
NAME    READY   AGE
kafka   0/3     3m29s
keerthana@Keerthanas-MacBook-Air  kafka-statefulset % kubectl get statefulset kafka -o jsonpath='{.spec.serviceName}{"\n"}'
kafka
keerthana@Keerthanas-MacBook-Air  kafka-statefulset % kubectl get svc kafka -o yaml
apiVersion: v1
kind: Service
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"v1","kind":"Service","metadata":{"annotations":{},"name":"kafka","namespace":"default"},"spec":{"clusterIP":"None","ports":[{"name":"kafka","port":9092,"targetPort":9092}],"selector":{"app":"kafka"}}}
  creationTimestamp: "2026-08-28T09:39:47Z"
  name: kafka
  namespace: default
  resourceVersion: "36525"
  uid: 8be76501-97f0-4305-8630-07ed4a4eee56
spec:
  clusterIP: None
  clusterIPs:
  - None
  internalTrafficPolicy: Cluster
  ipFamilies:
  - IPv4
  ipFamilyPolicy: SingleStack
  ports:
  - name: kafka
    port: 9092
    protocol: TCP
    targetPort: 9092
  selector:
    app: kafka
  sessionAffinity: None
  type: ClusterIP
status:
  loadBalancer: {}
keerthana@Keerthanas-MacBook-Air  kafka-statefulset % kubectl get pods --show-labels
NAME                 READY   STATUS             RESTARTS        AGE     LABELS
demo-statefulset-0   1/1     Running            1 (4h49m ago)   25h     app=demo,apps.kubernetes.io/pod-index=0,controller-revision-hash=demo-statefulset-78c49f8b,statefulset.kubernetes.io/pod-name=demo-statefulset-0
demo-statefulset-1   1/1     Running            1 (4h49m ago)   23h     app=demo,apps.kubernetes.io/pod-index=1,controller-revision-hash=demo-statefulset-78c49f8b,statefulset.kubernetes.io/pod-name=demo-statefulset-1
demo-statefulset-2   1/1     Running            1 (4h49m ago)   24h     app=demo,apps.kubernetes.io/pod-index=2,controller-revision-hash=demo-statefulset-78c49f8b,statefulset.kubernetes.io/pod-name=demo-statefulset-2
demo-statefulset-3   1/1     Running            1 (4h49m ago)   24h     app=demo,apps.kubernetes.io/pod-index=3,controller-revision-hash=demo-statefulset-78c49f8b,statefulset.kubernetes.io/pod-name=demo-statefulset-3
demo-statefulset-4   1/1     Running            1 (4h49m ago)   24h     app=demo,apps.kubernetes.io/pod-index=4,controller-revision-hash=demo-statefulset-78c49f8b,statefulset.kubernetes.io/pod-name=demo-statefulset-4
kafka-0              0/1     CrashLoopBackOff   5 (80s ago)     4m30s   app=kafka,apps.kubernetes.io/pod-index=0,controller-revision-hash=kafka-d5b744cfc,statefulset.kubernetes.io/pod-name=kafka-0
kafka-1              0/1     Error              5 (2m43s ago)   4m16s   app=kafka,apps.kubernetes.io/pod-index=1,controller-revision-hash=kafka-d5b744cfc,statefulset.kubernetes.io/pod-name=kafka-1
kafka-2              0/1     Error              5 (2m37s ago)   4m14s   app=kafka,apps.kubernetes.io/pod-index=2,controller-revision-hash=kafka-d5b744cfc,statefulset.kubernetes.io/pod-name=kafka-2
redis-0              1/1     Running            0               3h5m    app=redis,apps.kubernetes.io/pod-index=0,controller-revision-hash=redis-7f46748689,statefulset.kubernetes.io/pod-name=redis-0
redis-1              1/1     Running            0               7m23s   app=redis,apps.kubernetes.io/pod-index=1,controller-revision-hash=redis-7f46748689,statefulset.kubernetes.io/pod-name=redis-1
redis-2              1/1     Running            0               7m22s   app=redis,apps.kubernetes.io/pod-index=2,controller-revision-hash=redis-7f46748689,statefulset.kubernetes.io/pod-name=redis-2
keerthana@Keerthanas-MacBook-Air  kafka-statefulset % 



keerthana@Keerthanas-MacBook-Air  kafka-statefulset % 
keerthana@Keerthanas-MacBook-Air  kafka-statefulset % kubectl describe pod kafka-0
Name:             kafka-0
Namespace:        default
Priority:         0
Service Account:  default
Node:             minikube/192.168.49.2
Start Time:       Fri, 28 Aug 2026 15:10:26 +0530
Labels:           app=kafka
                  apps.kubernetes.io/pod-index=0
                  controller-revision-hash=kafka-d5b744cfc
                  statefulset.kubernetes.io/pod-name=kafka-0
Annotations:      cni.projectcalico.org/containerID: ff4091656491d3ca940acd13eaa594e327c03f6be9a77638fb5e522d7e4d97ec
                  cni.projectcalico.org/podIP: 10.244.120.105/32
                  cni.projectcalico.org/podIPs: 10.244.120.105/32
Status:           Running
IP:               10.244.120.105
IPs:
  IP:           10.244.120.105
Controlled By:  StatefulSet/kafka
Containers:
  kafka:
    Container ID:  docker://02d9e3c9422c59be9e99234535a26f5ca9ea1601c8d47b55bd321c9df822df1e
    Image:         apache/kafka:4.0.0
    Image ID:      docker-pullable://apache/kafka@sha256:3f7b939115cd4872e9cee9369d80bd69712fde55f9902f46d793f64848dedc75
    Port:          9092/TCP
    Host Port:     0/TCP
    Command:
      sh
      -c
      export KAFKA_NODE_ID=$(echo $POD_NAME | sed 's/kafka-//')
      exec /etc/kafka/docker/run
      
    State:          Waiting
      Reason:       CrashLoopBackOff
    Last State:     Terminated
      Reason:       Error
      Exit Code:    1
      Started:      Fri, 28 Aug 2026 15:13:35 +0530
      Finished:     Fri, 28 Aug 2026 15:13:36 +0530
    Ready:          False
    Restart Count:  5
    Environment:
      KAFKA_NODE_ID:                                   kafka-0 (v1:metadata.name)
      KAFKA_PROCESS_ROLES:                             broker,controller
      KAFKA_LISTENERS:                                 PLAINTEXT://:9092,CONTROLLER://:9093
      KAFKA_ADVERTISED_LISTENERS:                      PLAINTEXT://$(POD_NAME).kafka.default.svc.cluster.local:9092
      KAFKA_CONTROLLER_LISTENER_NAMES:                 CONTROLLER
      KAFKA_CONTROLLER_QUORUM_VOTERS:                  kafka-0@kafka-0.kafka:9093,kafka-1@kafka-1.kafka:9093,kafka-2@kafka-2.kafka:9093
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP:            CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME:                PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR:          3
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR:  3
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR:             2
      KAFKA_MIN_INSYNC_REPLICAS:                       2
      KAFKA_LOG_DIRS:                                  /var/lib/kafka/data
      POD_NAME:                                        kafka-0 (v1:metadata.name)
    Mounts:
      /var/lib/kafka/data from kafka-data (rw)
      /var/run/secrets/kubernetes.io/serviceaccount from kube-api-access-t89s7 (ro)
Conditions:
  Type                        Status
  PodReadyToStartContainers   True 
  Initialized                 True 
  Ready                       False 
  ContainersReady             False 
  PodScheduled                True 
Volumes:
  kafka-data:
    Type:       PersistentVolumeClaim (a reference to a PersistentVolumeClaim in the same namespace)
    ClaimName:  kafka-data-kafka-0
    ReadOnly:   false
  kube-api-access-t89s7:
    Type:                    Projected (a volume that contains injected data from multiple sources)
    TokenExpirationSeconds:  3607
    ConfigMapName:           kube-root-ca.crt
    ConfigMapOptional:       <nil>
    DownwardAPI:             true
QoS Class:                   BestEffort
Node-Selectors:              <none>
Tolerations:                 node.kubernetes.io/not-ready:NoExecute op=Exists for 300s
                             node.kubernetes.io/unreachable:NoExecute op=Exists for 300s
Events:
  Type     Reason            Age                    From               Message
  ----     ------            ----                   ----               -------
  Warning  FailedScheduling  5m29s (x3 over 5m29s)  default-scheduler  0/1 nodes are available: pod has unbound immediate PersistentVolumeClaims. not found
  Normal   Scheduled         5m29s                  default-scheduler  Successfully assigned default/kafka-0 to minikube
  Normal   Pulling           5m29s                  kubelet            Pulling image "apache/kafka:4.0.0"
  Normal   Pulled            5m16s                  kubelet            Successfully pulled image "apache/kafka:4.0.0" in 12.775s (12.775s including waiting). Image size: 388183091 bytes.
  Normal   Created           2m20s (x6 over 5m16s)  kubelet            Container created
  Normal   Started           2m20s (x6 over 5m16s)  kubelet            Container started
  Normal   Pulled            2m20s (x5 over 5m14s)  kubelet            Container image "apache/kafka:4.0.0" already present on machine and can be accessed by the pod
  Warning  BackOff           70s (x6 over 5m11s)    kubelet            Back-off restarting failed container kafka in pod kafka-0_default(4c927390-3029-4f25-a728-470aa9f273e2)
keerthana@Keerthanas-MacBook-Air  kafka-statefulset % 


Change:

KAFKA_CONTROLLER_QUORUM_VOTERS: kafka-0@kafka-0.kafka:9093,kafka-1@kafka-1.kafka:9093,kafka-2@kafka-2.kafka:9093

to:

KAFKA_CONTROLLER_QUORUM_VOTERS: 0@kafka-0.kafka:9093,1@kafka-1.kafka:9093,2@kafka-2.kafka:9093


* Why?

Kafka KRaft uses:

node-id@host:port

So:

0@kafka-0.kafka:9093

means:

0 → Kafka broker/controller ID
kafka-0.kafka → DNS name
9093 → controller port

# Terminal Log Output:
-----------------------
keerthana@Keerthanas-MacBook-Air  kafka-statefulset % kubectl apply -f statefulset.yaml
statefulset.apps/kafka configured
keerthana@Keerthanas-MacBook-Air  kafka-statefulset % kubectl delete pod kafka-0 kafka-1 kafka-2
pod "kafka-0" deleted
pod "kafka-1" deleted
pod "kafka-2" deleted
keerthana@Keerthanas-MacBook-Air  kafka-statefulset % kubectl get pods -w
NAME                 READY   STATUS              RESTARTS       AGE
demo-statefulset-0   1/1     Running             1 (5h2m ago)   25h
demo-statefulset-1   1/1     Running             1 (5h2m ago)   23h
demo-statefulset-2   1/1     Running             1 (5h2m ago)   24h
demo-statefulset-3   1/1     Running             1 (5h2m ago)   24h
demo-statefulset-4   1/1     Running             1 (5h2m ago)   24h
kafka-0              1/1     Running             0              2s
kafka-1              0/1     ContainerCreating   0              1s
redis-0              1/1     Running             0              3h18m
redis-1              1/1     Running             0              20m
redis-2              1/1     Running             0              20m
kafka-1              0/1     ContainerCreating   0              1s
kafka-1              1/1     Running             0              1s
kafka-2              0/1     Pending             0              0s
kafka-2              0/1     Pending             0              0s
kafka-2              0/1     ContainerCreating   0              0s
kafka-2              0/1     ContainerCreating   0              1s
kafka-2              1/1     Running             0              1s
^C%                                                                                                                                
keerthana@Keerthanas-MacBook-Air  kafka-statefulset % kubectl run kafka-client \
  --image=apache/kafka:4.0.0 \
  --restart=Never \
  -it --rm \
  -- bash
If you don't see a command prompt, try pressing enter.
kafka-client:/$ getent hosts kafka-0.kafka
10.244.120.112    kafka-0.kafka.default.svc.cluster.local  kafka-0.kafka.default.svc.cluster.local kafka-0.kafka
kafka-client:/$ getent hosts kafka-1.kafka
10.244.120.113    kafka-1.kafka.default.svc.cluster.local  kafka-1.kafka.default.svc.cluster.local kafka-1.kafka
kafka-client:/$ getent hosts kafka-2.kafka
10.244.120.114    kafka-2.kafka.default.svc.cluster.local  kafka-2.kafka.default.svc.cluster.local kafka-2.kafka
kafka-client:/$ /opt/kafka/bin/kafka-broker-api-versions.sh \
  --bootstrap-server kafka-0.kafka:9092
kafka-2.kafka.default.svc.cluster.local:9092 (id: 2 rack: null isFenced: false) -> (
        Produce(0): 0 to 12 [usable: 12],
        Fetch(1): 4 to 17 [usable: 17],
        ListOffsets(2): 1 to 10 [usable: 10],
        Metadata(3): 0 to 13 [usable: 13],
        OffsetCommit(8): 2 to 9 [usable: 9],
        OffsetFetch(9): 1 to 9 [usable: 9],
        FindCoordinator(10): 0 to 6 [usable: 6],
        JoinGroup(11): 2 to 9 [usable: 9],
        Heartbeat(12): 0 to 4 [usable: 4],
        LeaveGroup(13): 0 to 5 [usable: 5],
        SyncGroup(14): 0 to 5 [usable: 5],
        DescribeGroups(15): 0 to 6 [usable: 6],
        ListGroups(16): 0 to 5 [usable: 5],
        SaslHandshake(17): 0 to 1 [usable: 1],
        ApiVersions(18): 0 to 4 [usable: 4],
        CreateTopics(19): 2 to 7 [usable: 7],
        DeleteTopics(20): 1 to 6 [usable: 6],
        DeleteRecords(21): 0 to 2 [usable: 2],
        InitProducerId(22): 0 to 5 [usable: 5],
        OffsetForLeaderEpoch(23): 2 to 4 [usable: 4],
        AddPartitionsToTxn(24): 0 to 5 [usable: 5],
        AddOffsetsToTxn(25): 0 to 4 [usable: 4],
        EndTxn(26): 0 to 5 [usable: 5],
        WriteTxnMarkers(27): 1 [usable: 1],
        TxnOffsetCommit(28): 0 to 5 [usable: 5],
        DescribeAcls(29): 1 to 3 [usable: 3],
        CreateAcls(30): 1 to 3 [usable: 3],
        DeleteAcls(31): 1 to 3 [usable: 3],
        DescribeConfigs(32): 1 to 4 [usable: 4],
        AlterConfigs(33): 0 to 2 [usable: 2],
        AlterReplicaLogDirs(34): 1 to 2 [usable: 2],
        DescribeLogDirs(35): 1 to 4 [usable: 4],
        SaslAuthenticate(36): 0 to 2 [usable: 2],
        CreatePartitions(37): 0 to 3 [usable: 3],
        CreateDelegationToken(38): 1 to 3 [usable: 3],
        RenewDelegationToken(39): 1 to 2 [usable: 2],
        ExpireDelegationToken(40): 1 to 2 [usable: 2],
        DescribeDelegationToken(41): 1 to 3 [usable: 3],
        DeleteGroups(42): 0 to 2 [usable: 2],
        ElectLeaders(43): 0 to 2 [usable: 2],
        IncrementalAlterConfigs(44): 0 to 1 [usable: 1],
        AlterPartitionReassignments(45): 0 [usable: 0],
        ListPartitionReassignments(46): 0 [usable: 0],
        OffsetDelete(47): 0 [usable: 0],
        DescribeClientQuotas(48): 0 to 1 [usable: 1],
        AlterClientQuotas(49): 0 to 1 [usable: 1],
        DescribeUserScramCredentials(50): 0 [usable: 0],
        AlterUserScramCredentials(51): 0 [usable: 0],
        DescribeQuorum(55): 0 to 2 [usable: 2],
        UpdateFeatures(57): 0 to 2 [usable: 2],
        DescribeCluster(60): 0 to 2 [usable: 2],
        DescribeProducers(61): 0 [usable: 0],
        UnregisterBroker(64): 0 [usable: 0],
        DescribeTransactions(65): 0 [usable: 0],
        ListTransactions(66): 0 to 1 [usable: 1],
        ConsumerGroupHeartbeat(68): 0 to 1 [usable: 1],
        ConsumerGroupDescribe(69): 0 to 1 [usable: 1],
        GetTelemetrySubscriptions(71): UNSUPPORTED,
        PushTelemetry(72): UNSUPPORTED,
        ListClientMetricsResources(74): 0 [usable: 0],
        DescribeTopicPartitions(75): 0 [usable: 0],
        ShareGroupHeartbeat(76): UNSUPPORTED,
        ShareGroupDescribe(77): UNSUPPORTED,
        ShareFetch(78): UNSUPPORTED,
        ShareAcknowledge(79): UNSUPPORTED,
        AddRaftVoter(80): 0 [usable: 0],
        RemoveRaftVoter(81): 0 [usable: 0],
        InitializeShareGroupState(83): UNSUPPORTED,
        ReadShareGroupState(84): UNSUPPORTED,
        WriteShareGroupState(85): UNSUPPORTED,
        DeleteShareGroupState(86): UNSUPPORTED,
        ReadShareGroupStateSummary(87): UNSUPPORTED
)
kafka-0.kafka.default.svc.cluster.local:9092 (id: 0 rack: null isFenced: false) -> (
        Produce(0): 0 to 12 [usable: 12],
        Fetch(1): 4 to 17 [usable: 17],
        ListOffsets(2): 1 to 10 [usable: 10],
        Metadata(3): 0 to 13 [usable: 13],
        OffsetCommit(8): 2 to 9 [usable: 9],
        OffsetFetch(9): 1 to 9 [usable: 9],
        FindCoordinator(10): 0 to 6 [usable: 6],
        JoinGroup(11): 2 to 9 [usable: 9],
        Heartbeat(12): 0 to 4 [usable: 4],
        LeaveGroup(13): 0 to 5 [usable: 5],
        SyncGroup(14): 0 to 5 [usable: 5],
        DescribeGroups(15): 0 to 6 [usable: 6],
        ListGroups(16): 0 to 5 [usable: 5],
        SaslHandshake(17): 0 to 1 [usable: 1],
        ApiVersions(18): 0 to 4 [usable: 4],
        CreateTopics(19): 2 to 7 [usable: 7],
        DeleteTopics(20): 1 to 6 [usable: 6],
        DeleteRecords(21): 0 to 2 [usable: 2],
        InitProducerId(22): 0 to 5 [usable: 5],
        OffsetForLeaderEpoch(23): 2 to 4 [usable: 4],
        AddPartitionsToTxn(24): 0 to 5 [usable: 5],
        AddOffsetsToTxn(25): 0 to 4 [usable: 4],
        EndTxn(26): 0 to 5 [usable: 5],
        WriteTxnMarkers(27): 1 [usable: 1],
        TxnOffsetCommit(28): 0 to 5 [usable: 5],
        DescribeAcls(29): 1 to 3 [usable: 3],
        CreateAcls(30): 1 to 3 [usable: 3],
        DeleteAcls(31): 1 to 3 [usable: 3],
        DescribeConfigs(32): 1 to 4 [usable: 4],
        AlterConfigs(33): 0 to 2 [usable: 2],
        AlterReplicaLogDirs(34): 1 to 2 [usable: 2],
        DescribeLogDirs(35): 1 to 4 [usable: 4],
        SaslAuthenticate(36): 0 to 2 [usable: 2],
        CreatePartitions(37): 0 to 3 [usable: 3],
        CreateDelegationToken(38): 1 to 3 [usable: 3],
        RenewDelegationToken(39): 1 to 2 [usable: 2],
        ExpireDelegationToken(40): 1 to 2 [usable: 2],
        DescribeDelegationToken(41): 1 to 3 [usable: 3],
        DeleteGroups(42): 0 to 2 [usable: 2],
        ElectLeaders(43): 0 to 2 [usable: 2],
        IncrementalAlterConfigs(44): 0 to 1 [usable: 1],
        AlterPartitionReassignments(45): 0 [usable: 0],
        ListPartitionReassignments(46): 0 [usable: 0],
        OffsetDelete(47): 0 [usable: 0],
        DescribeClientQuotas(48): 0 to 1 [usable: 1],
        AlterClientQuotas(49): 0 to 1 [usable: 1],
        DescribeUserScramCredentials(50): 0 [usable: 0],
        AlterUserScramCredentials(51): 0 [usable: 0],
        DescribeQuorum(55): 0 to 2 [usable: 2],
        UpdateFeatures(57): 0 to 2 [usable: 2],
        DescribeCluster(60): 0 to 2 [usable: 2],
        DescribeProducers(61): 0 [usable: 0],
        UnregisterBroker(64): 0 [usable: 0],
        DescribeTransactions(65): 0 [usable: 0],
        ListTransactions(66): 0 to 1 [usable: 1],
        ConsumerGroupHeartbeat(68): 0 to 1 [usable: 1],
        ConsumerGroupDescribe(69): 0 to 1 [usable: 1],
        GetTelemetrySubscriptions(71): UNSUPPORTED,
        PushTelemetry(72): UNSUPPORTED,
        ListClientMetricsResources(74): 0 [usable: 0],
        DescribeTopicPartitions(75): 0 [usable: 0],
        ShareGroupHeartbeat(76): UNSUPPORTED,
        ShareGroupDescribe(77): UNSUPPORTED,
        ShareFetch(78): UNSUPPORTED,
        ShareAcknowledge(79): UNSUPPORTED,
        AddRaftVoter(80): 0 [usable: 0],
        RemoveRaftVoter(81): 0 [usable: 0],
        InitializeShareGroupState(83): UNSUPPORTED,
        ReadShareGroupState(84): UNSUPPORTED,
        WriteShareGroupState(85): UNSUPPORTED,
        DeleteShareGroupState(86): UNSUPPORTED,
        ReadShareGroupStateSummary(87): UNSUPPORTED
)
kafka-1.kafka.default.svc.cluster.local:9092 (id: 1 rack: null isFenced: false) -> (
        Produce(0): 0 to 12 [usable: 12],
        Fetch(1): 4 to 17 [usable: 17],
        ListOffsets(2): 1 to 10 [usable: 10],
        Metadata(3): 0 to 13 [usable: 13],
        OffsetCommit(8): 2 to 9 [usable: 9],
        OffsetFetch(9): 1 to 9 [usable: 9],
        FindCoordinator(10): 0 to 6 [usable: 6],
        JoinGroup(11): 2 to 9 [usable: 9],
        Heartbeat(12): 0 to 4 [usable: 4],
        LeaveGroup(13): 0 to 5 [usable: 5],
        SyncGroup(14): 0 to 5 [usable: 5],
        DescribeGroups(15): 0 to 6 [usable: 6],
        ListGroups(16): 0 to 5 [usable: 5],
        SaslHandshake(17): 0 to 1 [usable: 1],
        ApiVersions(18): 0 to 4 [usable: 4],
        CreateTopics(19): 2 to 7 [usable: 7],
        DeleteTopics(20): 1 to 6 [usable: 6],
        DeleteRecords(21): 0 to 2 [usable: 2],
        InitProducerId(22): 0 to 5 [usable: 5],
        OffsetForLeaderEpoch(23): 2 to 4 [usable: 4],
        AddPartitionsToTxn(24): 0 to 5 [usable: 5],
        AddOffsetsToTxn(25): 0 to 4 [usable: 4],
        EndTxn(26): 0 to 5 [usable: 5],
        WriteTxnMarkers(27): 1 [usable: 1],
        TxnOffsetCommit(28): 0 to 5 [usable: 5],
        DescribeAcls(29): 1 to 3 [usable: 3],
        CreateAcls(30): 1 to 3 [usable: 3],
        DeleteAcls(31): 1 to 3 [usable: 3],
        DescribeConfigs(32): 1 to 4 [usable: 4],
        AlterConfigs(33): 0 to 2 [usable: 2],
        AlterReplicaLogDirs(34): 1 to 2 [usable: 2],
        DescribeLogDirs(35): 1 to 4 [usable: 4],
        SaslAuthenticate(36): 0 to 2 [usable: 2],
        CreatePartitions(37): 0 to 3 [usable: 3],
        CreateDelegationToken(38): 1 to 3 [usable: 3],
        RenewDelegationToken(39): 1 to 2 [usable: 2],
        ExpireDelegationToken(40): 1 to 2 [usable: 2],
        DescribeDelegationToken(41): 1 to 3 [usable: 3],
        DeleteGroups(42): 0 to 2 [usable: 2],
        ElectLeaders(43): 0 to 2 [usable: 2],
        IncrementalAlterConfigs(44): 0 to 1 [usable: 1],
        AlterPartitionReassignments(45): 0 [usable: 0],
        ListPartitionReassignments(46): 0 [usable: 0],
        OffsetDelete(47): 0 [usable: 0],
        DescribeClientQuotas(48): 0 to 1 [usable: 1],
        AlterClientQuotas(49): 0 to 1 [usable: 1],
        DescribeUserScramCredentials(50): 0 [usable: 0],
        AlterUserScramCredentials(51): 0 [usable: 0],
        DescribeQuorum(55): 0 to 2 [usable: 2],
        UpdateFeatures(57): 0 to 2 [usable: 2],
        DescribeCluster(60): 0 to 2 [usable: 2],
        DescribeProducers(61): 0 [usable: 0],
        UnregisterBroker(64): 0 [usable: 0],
        DescribeTransactions(65): 0 [usable: 0],
        ListTransactions(66): 0 to 1 [usable: 1],
        ConsumerGroupHeartbeat(68): 0 to 1 [usable: 1],
        ConsumerGroupDescribe(69): 0 to 1 [usable: 1],
        GetTelemetrySubscriptions(71): UNSUPPORTED,
        PushTelemetry(72): UNSUPPORTED,
        ListClientMetricsResources(74): 0 [usable: 0],
        DescribeTopicPartitions(75): 0 [usable: 0],
        ShareGroupHeartbeat(76): UNSUPPORTED,
        ShareGroupDescribe(77): UNSUPPORTED,
        ShareFetch(78): UNSUPPORTED,
        ShareAcknowledge(79): UNSUPPORTED,
        AddRaftVoter(80): 0 [usable: 0],
        RemoveRaftVoter(81): 0 [usable: 0],
        InitializeShareGroupState(83): UNSUPPORTED,
        ReadShareGroupState(84): UNSUPPORTED,
        WriteShareGroupState(85): UNSUPPORTED,
        DeleteShareGroupState(86): UNSUPPORTED,
        ReadShareGroupStateSummary(87): UNSUPPORTED
)
kafka-client:/$ 

* What your output proves
kafka-0 → ID 0 → 10.244.120.112
kafka-1 → ID 1 → 10.244.120.113
kafka-2 → ID 2 → 10.244.120.114

* And all three are:

1/1 Running

* Your DNS also works:

kafka-0.kafka → 10.244.120.112
kafka-1.kafka → 10.244.120.113
kafka-2.kafka → 10.244.120.114

* Most importantly, this command:

/opt/kafka/bin/kafka-broker-api-versions.sh \
  --bootstrap-server kafka-0.kafka:9092

* returned all three brokers:

kafka-0... (id: 0)
kafka-1... (id: 1)
kafka-2... (id: 2)

- So the cluster is communicating.

# Create a topic:
------------------

kafka-client:/$ 
kafka-client:/$ /opt/kafka/bin/kafka-topics.sh \
  --create \
  --topic orders \
  --bootstrap-server kafka-0.kafka:9092 \
  --partitions 3 \
  --replication-factor 3
Created topic orders.
kafka-client:/$ /opt/kafka/bin/kafka-topics.sh \
  --describe \
  --topic orders \
  --bootstrap-server kafka-0.kafka:9092
Topic: orders   TopicId: XMgGYRtoSpyGtxQxesuN-A PartitionCount: 3       ReplicationFactor: 3    Configs: min.insync.replicas=2
        Topic: orders   Partition: 0    Leader: 2       Replicas: 2,0,1 Isr: 2,0,1      Elr:    LastKnownElr: 
        Topic: orders   Partition: 1    Leader: 0       Replicas: 0,1,2 Isr: 0,1,2      Elr:    LastKnownElr: 
        Topic: orders   Partition: 2    Leader: 1       Replicas: 1,2,0 Isr: 1,2,0      Elr:    LastKnownElr: 
kafka-client:/$ 

* You now have:

                Kafka Cluster
        ┌──────────┬──────────┬──────────┐
        │ kafka-0  │ kafka-1  │ kafka-2  │
        │ broker 0 │ broker 1 │ broker 2 │
        └──────────┴──────────┴──────────┘
                    │
                 orders
                    │
             ┌──────┼──────┐
             │      │      │
          Part 0  Part 1  Part 2

And each partition has replicas across brokers.

# Start a consumer:
-------------------

keerthana@Mac-564  kafka-statefulset % kubectl run kafka-consumer \
  --image=apache/kafka:4.0.0 \
  --restart=Never \
  -it --rm \
  -- bash
If you don't see a command prompt, try pressing enter.
kafka-consumer:/$ /opt/kafka/bin/kafka-console-consumer.sh \
>   --bootstrap-server kafka-0.kafka:9092 \
>   --topic orders \
>   --from-beginning

order-101
order-102
order-103

## in producer terminal log:

kafka-client:/$ 
kafka-client:/$ /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server kafka-0.kafka:9092 \
  --topic orders
>order-101
>order-102
>order-103
>

- That proves your Kafka cluster isn't merely alive — it's processing messages.

# Stable statefulset Test:
-------------------------
keerthana@Mac-564  kafka-statefulset % kubectl delete pod kafka-1
pod "kafka-1" deleted
keerthana@Mac-564  kafka-statefulset % kubectl get pods -w
NAME                 READY   STATUS    RESTARTS       AGE
kafka-0              1/1     Running   0              6m55s
kafka-1              1/1     Running   0              1s
kafka-2              1/1     Running   0              6m53s
kafka-client         1/1     Running   0              6m34s
kafka-consumer       1/1     Running   0              2m36s
                                                                                                                             
keerthana@Mac-564  kafka-statefulset % kubectl get pods
NAME                 READY   STATUS    RESTARTS       AGE
kafka-0              1/1     Running   0              7m4s
kafka-1              1/1     Running   0              10s
kafka-2              1/1     Running   0              7m2s
kafka-client         1/1     Running   0              6m43s
kafka-consumer       1/1     Running   0              2m45s
keerthana@Mac-564  kafka-statefulset % kubectl get pvc
NAME                              STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
kafka-data-kafka-0                Bound    pvc-a7dfbd21-e8ff-4c7e-bfdc-01441fd176d8   2Gi        RWO            standard       <unset>                 24m
kafka-data-kafka-1                Bound    pvc-a2f21d15-1a5c-494b-ad71-8d1815949885   2Gi        RWO            standard       <unset>                 24m
kafka-data-kafka-2                Bound    pvc-03f0a84c-3d05-46ed-a6ed-f61b809ab02e   2Gi        RWO            standard       <unset>                 24m
keerthana@Mac-564  kafka-statefulset % 

* The important thing is:

kafka-1
   ↓
deleted
   ↓
new kafka-1
   ↓
same StatefulSet identity
   ↓
same kafka-data-kafka-1 PVC

