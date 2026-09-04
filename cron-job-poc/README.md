# The goal is simple: 

    CronJob = run a Kubernetes Job automatically on a schedule, like Linux cron.

## POC flow:

CronJob
   ↓
creates Job
   ↓
Job creates Pod
   ↓
Pod runs command
   ↓
command finishes
   ↓
Pod completes

### Tells Kubernetes:

* spec:
  schedule: "*/1 * * * *"

"This resource should run something repeatedly according to a schedule."

schedule: "*/1 * * * *"

Means:
------
Run every 1 minute.

* jobTemplate:
This defines the Job that Kubernetes should create each time the schedule triggers.


# Terminal Log:

keerthana@Keerthanas-MacBook-Air cron-job-poc % minikube start
😄  minikube v1.38.1 on Darwin 26.4.1 (arm64)
🎉  minikube 1.39.0 is available! Download it: https://github.com/kubernetes/minikube/releases/tag/v1.39.0
💡  To disable this notice, run: 'minikube config set WantUpdateNotification false'

✨  Using the docker driver based on existing profile
👍  Starting "minikube" primary control-plane node in "minikube" cluster
🚜  Pulling base image v0.0.50 ...
🔄  Restarting existing docker container for "minikube" ...
🐳  Preparing Kubernetes v1.35.1 on Docker 29.2.1 ...
🔎  Verifying Kubernetes components...
    ▪ Using image gcr.io/k8s-minikube/storage-provisioner:v5
🌟  Enabled addons: storage-provisioner, default-storageclass

❗  /usr/local/bin/kubectl is version 1.32.2, which may have incompatibilities with Kubernetes 1.35.1.
    ▪ Want kubectl v1.35.1? Try 'minikube kubectl -- get pods -A'
🏄  Done! kubectl is now configured to use "minikube" cluster and "default" namespace by default
keerthana@Keerthanas-MacBook-Air cron-job-poc % kubectl apply -f cronjob-poc.yaml
cronjob.batch/hello-cron created
keerthana@Keerthanas-MacBook-Air cron-job-poc % kubectl get cronjob
NAME         SCHEDULE      TIMEZONE   SUSPEND   ACTIVE   LAST SCHEDULE   AGE
hello-cron   */1 * * * *   <none>     False     0        <none>          5s
keerthana@Keerthanas-MacBook-Air cron-job-poc % kubectl get jobs
NAME                  STATUS    COMPLETIONS   DURATION   AGE
hello-cron-29807126   Running   0/1           7s         7s
keerthana@Keerthanas-MacBook-Air cron-job-poc % kubectl get jobs
NAME                  STATUS     COMPLETIONS   DURATION   AGE
hello-cron-29807126   Complete   1/1           8s         18s
keerthana@Keerthanas-MacBook-Air cron-job-poc % kubectl get pods
NAME                         READY   STATUS      RESTARTS      AGE
cicd-demo-85d65887c7-cscbq   1/1     Running     1 (63s ago)   5d21h
cicd-demo-85d65887c7-r5n9k   1/1     Running     1 (63s ago)   5d21h
hello-cron-29807126-l2lph    0/1     Completed   0             20s
keerthana@Keerthanas-MacBook-Air cron-job-poc % 

* CronJob does NOT directly create the Pod.

It does:
---------
CronJob
   ↓
Job
   ↓
Pod


keerthana@Keerthanas-MacBook-Air cron-job-poc % kubectl logs hello-cron-29807126-l2lph
Thu Sep  3 09:26:06 UTC 2026
Hello from Kubernetes CronJob
keerthana@Keerthanas-MacBook-Air cron-job-poc % kubectl get jobs -w
NAME                  STATUS     COMPLETIONS   DURATION   AGE
hello-cron-29807126   Complete   1/1           8s         2m18s
hello-cron-29807127   Complete   1/1           3s         78s
hello-cron-29807128   Complete   1/1           3s         18s
hello-cron-29807129   Running    0/1                      0s
hello-cron-29807129   Running    0/1           0s         0s
hello-cron-29807129   SuccessCriteriaMet   0/1           3s         3s
hello-cron-29807129   Complete             1/1           3s         3s
hello-cron-29807126   Complete             1/1           8s         3m3s

- Each one represents one execution of the CronJob.

- So conceptually:

14:23 → Job A → Pod A → Completed
14:24 → Job B → Pod B → Completed
14:25 → Job C → Pod C → Completed

That's the core CronJob behavior.


# Kubernetes CronJob

With Kubernetes:

```text
Kubernetes CronJob
       ↓
      Job
       ↓
      Pod
       ↓
   Node.js/script
       ↓
    task runs
```

Kubernetes itself owns the schedule.

For example:

```text
Every day 2 AM
       ↓
Kubernetes creates Job
       ↓
Job creates Pod
       ↓
Pod performs backup
       ↓
Pod finishes
```

The application doesn't need to stay running just to wait for 2 AM.

---

### So where would we actually use Kubernetes CronJob?

Real examples:

* **Database backup** every night
* Delete old records every hour
* Generate daily reports
* Process files periodically
* Send scheduled notifications
* Cleanup temporary data
* Sync data with another system
* Run maintenance scripts

### The key distinction

**Node.js cron:**

> "My application needs to perform something periodically."

**Kubernetes CronJob:**

> "The Kubernetes environment needs to start a workload periodically."
