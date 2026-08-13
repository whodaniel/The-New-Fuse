#!/usr/bin/env python3
import requests
import time
import os

LOG_FILE = "/tmp/qos_observer.log"
API_URL = "http://127.0.0.1:50005/observer_status"

def log(msg):
    with open(LOG_FILE, "a") as f:
        f.write(f"[{time.ctime()}] {msg}\n")
    print(msg)

log("QoS Observer Started.")

last_event_count = 0

while True:
    try:
        response = requests.get(API_URL, timeout=2)
        if response.status_code == 200:
            data = response.json()
            events = data.get("log", [])
            
            if len(events) > last_event_count:
                new_events = events[last_event_count:]
                for e in new_events:
                    log(f"EVENT: {e['type']} - {e['detail']}")
                    if e['type'] == "INTERRUPT":
                        # Check for self-mute
                        for prev in reversed(events[:events.index(e)]):
                            if prev['type'] == "AI_SPEAKING":
                                if e['time'] - prev['time'] < 1.5:
                                    log("⚠️ ALERT: Possible Self-Mute detected!")
                                break
                last_event_count = len(events)
        else:
            log(f"Error: Server returned {response.status_code}")
    except Exception as e:
        log(f"Observer Error: {e}")
    
    time.sleep(5)
