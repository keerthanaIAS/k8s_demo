#!/bin/bash

NODE_NAME="minikube-m02"

FAILURE_THRESHOLD=2
FAILURE_COUNT=0
RECOVERY_REQUIRED=false

echo "======================================"
echo " Kubernetes Node Health Monitor"
echo " Monitoring Node: $NODE_NAME"
echo " Failure Threshold: $FAILURE_THRESHOLD"
echo "======================================"

while true
do
    NODE_STATUS=$(kubectl get node "$NODE_NAME" \
        -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>/dev/null)

    CURRENT_TIME=$(date '+%Y-%m-%d %H:%M:%S')

    if [ "$NODE_STATUS" == "True" ]; then

        FAILURE_COUNT=0
        RECOVERY_REQUIRED=false

        echo "$CURRENT_TIME | Node: $NODE_NAME | Status: READY | Failure Count: $FAILURE_COUNT"

    else

        FAILURE_COUNT=$((FAILURE_COUNT + 1))

        echo "$CURRENT_TIME | Node: $NODE_NAME | Status: NOT READY | Failure Count: $FAILURE_COUNT"

        if [ "$FAILURE_COUNT" -ge "$FAILURE_THRESHOLD" ]; then

            RECOVERY_REQUIRED=true

            echo ""
            echo "⚠️  $CURRENT_TIME | NODE FAILURE CONFIRMED"
            echo "⚠️  Recovery Required: $RECOVERY_REQUIRED"
            echo ""

            break
        fi
    fi

    sleep 5
done


# ======================================
# REMEDIATION
# ======================================

if [ "$RECOVERY_REQUIRED" == "true" ]; then

    echo "======================================"
    echo " REMEDIATION STARTED"
    echo " Node: $NODE_NAME"
    echo " Action: Starting failed node"
    echo "======================================"

    echo ""
    echo "Executing: minikube node start $NODE_NAME"
    echo ""

    minikube node start "$NODE_NAME"

    if [ $? -ne 0 ]; then

        echo ""
        echo "❌ Failed to start node"
        exit 1

    fi

    echo ""
    echo "✅ Node start command completed"
    echo "⏳ Waiting for Kubernetes to recognize the node..."
    echo ""

fi


# ======================================
# VERIFICATION
# ======================================

echo "======================================"
echo " VERIFICATION STARTED"
echo " Waiting for Node: $NODE_NAME"
echo "======================================"

MAX_ATTEMPTS=12
ATTEMPT=1

while [ "$ATTEMPT" -le "$MAX_ATTEMPTS" ]
do

    NODE_STATUS=$(kubectl get node "$NODE_NAME" \
        -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>/dev/null)

    CURRENT_TIME=$(date '+%Y-%m-%d %H:%M:%S')

    if [ "$NODE_STATUS" == "True" ]; then

        echo ""
        echo "$CURRENT_TIME | Node: $NODE_NAME | Status: READY"

        echo ""
        echo "======================================"
        echo " 🎉 NODE AUTO-HEALING COMPLETE"
        echo "======================================"

        echo "Node: $NODE_NAME"
        echo "Status: Ready"
        echo "Recovery: Successful"

        exit 0

    else

        echo "$CURRENT_TIME | Attempt $ATTEMPT/$MAX_ATTEMPTS | Node: $NODE_NAME | Status: NOT READY"

    fi

    ATTEMPT=$((ATTEMPT + 1))

    sleep 5

done


echo ""
echo "======================================"
echo " ❌ NODE AUTO-HEALING FAILED"
echo "======================================"

echo "Node: $NODE_NAME"
echo "Reason: Node did not become Ready within expected time"

exit 1