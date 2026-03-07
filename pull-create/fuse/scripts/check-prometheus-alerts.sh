#!/bin/bash

echo "🚨 Prometheus Alert Status"
echo "========================"

# Get all firing alerts
FIRING_ALERTS=$(curl -s http://prometheus:9090/api/v1/alerts | jq '.data.alerts[] | select(.state=="firing")')

# Critical alerts
echo "Critical Alerts:"
echo "$FIRING_ALERTS" | jq 'select(.labels.severity=="critical")'

# Warning alerts
echo "Warning Alerts:"
echo "$FIRING_ALERTS" | jq 'select(.labels.severity=="warning")'

# Alert Manager silences
echo "Active Silences:"
curl -s http://alertmanager:9093/api/v2/silences | jq '.[] | select(.status.state=="active")'

# Alert statistics
CRITICAL_COUNT=$(echo "$FIRING_ALERTS" | jq 'select(.labels.severity=="critical")' | wc -l)
WARNING_COUNT=$(echo "$FIRING_ALERTS" | jq 'select(.labels.severity=="warning")' | wc -l)

echo "Summary:"
echo "- Critical Alerts: $CRITICAL_COUNT"
echo "- Warning Alerts: $WARNING_COUNT"

if [ $CRITICAL_COUNT -eq 0 ] && [ $WARNING_COUNT -eq 0 ]; then
    echo "✅ No active alerts"
else
    echo "⚠️ Active alerts detected - please investigate"
fi