# WhatsApp Bridge Health Endpoint Behavior

The WhatsApp bridge health endpoint (`http://localhost:3000/health`) returns
HTTP 426 (Upgrade Required) when:

1. The endpoint is reachable and the service is running
2. The client needs to upgrade its protocol (typically to WebSocket) for full
   communication
3. This is not an error condition - it indicates the service is operational

In TNF directive rotation:

- HTTP 426 should be treated as healthy (service is reachable)
- Only HTTP 5xx or connection failures indicate actual degradation
- HTTP 200 is also healthy
- Any 4xx other than 426 may indicate issues

This behavior is specific to the WhatsApp bridge implementation and should not
be confused with general HTTP error semantics.
