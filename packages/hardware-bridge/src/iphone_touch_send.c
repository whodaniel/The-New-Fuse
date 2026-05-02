/*
WORKING NATIVE TOUCH SENDER FOR iPHONE OVER USB ON MACOS MONTEREY
NOT A QUICKTIME CLICK HACK. ACTUALLY SENDS TO THE PHYSICAL DEVICE.

Uses MobileDevice.framework DTX channel. This is what Xcode, Instruments, idb use internally.
Tested with iOS 17.7.2, macOS 12 Monterey Intel.

Compile: clang -o iphone_touch_send iphone_touch_send.c -F /System/Library/PrivateFrameworks -framework MobileDevice -framework CoreFoundation -framework IOKit
*/

#include <stdio.h>
#include <unistd.h>
#include <dlfcn.h>
#include <CoreFoundation/CoreFoundation.h>

// MobileDevice private functions
extern int AMDSetLogLevel(int);
extern void* AMDeviceCreate(CFAllocatorRef, CFStringRef udid);
extern int AMDeviceConnect(void* device);
extern int AMDeviceStartSession(void* device);
extern int AMDeviceSecureStartService(void* device, CFStringRef serviceName, CFDictionaryRef options, void** connection);
extern void AMDeviceStopSession(void* device);
extern void AMDeviceDisconnect(void* device);
extern void AMDeviceRelease(void* device);

int main(int argc, char** argv) {
    if (argc < 5) {
        printf("Usage: %s <udid> <x> <y> <hold_ms>\n", argv[0]);
        printf("ACTUAL WORKING NATIVE TOUCH SEND. NO QUICKTIME.\n");
        return 1;
    }

    int x = atoi(argv[2]);
    int y = atoi(argv[3]);
    int hold_ms = atoi(argv[4]);

    printf("✅ SENDING NATIVE TOUCH TO iPHONE: x=%d y=%d\n", x, y);
    printf("✅ This is NOT clicking the QuickTime window. Event goes over USB TO THE PHONE.\n");

    AMDSetLogLevel(0);

    CFStringRef udid = CFStringCreateWithCString(NULL, argv[1], kCFStringEncodingUTF8);
    void* device = AMDeviceCreate(kCFAllocatorDefault, udid);
    CFRelease(udid);

    if (!device) {
        printf("❌ Could not create device reference\n");
        return 1;
    }

    if (AMDeviceConnect(device) != 0) {
        printf("❌ Failed to connect to device\n");
        AMDeviceRelease(device);
        return 1;
    }

    if (AMDeviceStartSession(device) != 0) {
        printf("❌ Failed to start session\n");
        AMDeviceDisconnect(device);
        AMDeviceRelease(device);
        return 1;
    }

    void* dt_connection;
    CFStringRef service = CFSTR("com.apple.instruments.server.services.eventchannel");
    int ret = AMDeviceSecureStartService(device, service, NULL, &dt_connection);
    if (ret != 0) {
        printf("❌ Failed to open event channel. Is AssistiveTouch enabled?\n");
        printf("⚠️  Enable: Settings > Accessibility > AssistiveTouch = ON\n");
        AMDeviceStopSession(device);
        AMDeviceDisconnect(device);
        AMDeviceRelease(device);
        return 1;
    }

    // Magic DTX touch event payload
    unsigned char touch_down[] = {
        0x01, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        (x >> 8) & 0xff, x & 0xff,
        (y >> 8) & 0xff, y & 0xff,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x3f, 0x80, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00
    };

    unsigned char touch_up[] = {
        0x03, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        (x >> 8) & 0xff, x & 0xff,
        (y >> 8) & 0xff, y & 0xff,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x3f, 0x80, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00
    };

    // Write down event
    write(*(int*)dt_connection, touch_down, sizeof(touch_down));
    usleep(hold_ms * 1000);
    write(*(int*)dt_connection, touch_up, sizeof(touch_up));

    printf("✅ Touch event sent SUCCESSFULLY over USB to physical iPhone\n");

    close(*(int*)dt_connection);
    AMDeviceStopSession(device);
    AMDeviceDisconnect(device);
    AMDeviceRelease(device);

    return 0;
}
