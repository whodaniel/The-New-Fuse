import hmac
import hashlib
import time
import secrets
import json

class A2ASignatureWrapper:
    def __init__(self, agent_id, secret):
        self.agent_id = agent_id
        self.secret = secret

    def wrap(self, message_type, data, resource_pointers=None, conatus_weight=None):
        header = {
            "agent_id": self.agent_id,
            "alg": "HS256",
            "nonce": secrets.token_hex(16),
            "timestamp": int(time.time() * 1000)
        }
        
        if resource_pointers:
            header["resource_pointers"] = resource_pointers

        payload = {
            "type": message_type,
            "data": data
        }
        
        if conatus_weight is not None:
            payload["conatus_weight"] = conatus_weight

        # Sign the packet
        message = json.dumps({"header": header, "payload": payload}, sort_keys=True)
        signature = hmac.new(
            self.secret.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()

        return {
            "header": header,
            "payload": payload,
            "signature": signature
        }
