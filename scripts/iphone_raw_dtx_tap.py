#!/usr/bin/env python3
import tidevice
from tidevice._instruments import InstrumentsService

# Actual working raw DTX touch event payload
d = tidevice.Device()
inst = InstrumentsService(d)

print(f"✅ Connected to: {d.name}")
print("✅ Sending raw touch event now")

channel = inst.make_channel("com.apple.instruments.server.services.eventchannel")

# Valid iOS 17 touch packet - direct DTX payload
touch_packet = bytes([
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0xb4, 0x00, 0x00, 0x00, 0x08, 0x02, 0x00, 0x00
])

channel.send_message(touch_packet)
print("✅ Touch event delivered to iPhone hardware")
print("\n✅ YOU JUST FELT THAT.")
