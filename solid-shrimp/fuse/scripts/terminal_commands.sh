redis-cli publish agent:augment '{
    "id": "'$(uuidgen)'",
    "type": "message",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "sender": "human",
    "recipient": "augment",
    "content": "Hello Augment, I am ready to begin our collaboration. Please confirm you are receiving messages.",
    "metadata": {
        "type": "initialization",
        "priority": "high",
        "status": "ready"
    }
}'
