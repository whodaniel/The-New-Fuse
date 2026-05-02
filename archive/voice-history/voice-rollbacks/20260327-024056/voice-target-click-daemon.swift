#!/usr/bin/env swift

import AppKit
import ApplicationServices
import Foundation

let targetPath = NSString(string: "~/.openclaw/voice_target.json").expandingTildeInPath
let cliclickPath = "/usr/local/bin/cliclick"
let comboLabel = "Cmd+Option+Click"

func envBool(_ key: String, default defaultValue: Bool) -> Bool {
    guard let value = ProcessInfo.processInfo.environment[key]?.trimmingCharacters(in: .whitespacesAndNewlines).lowercased(),
          !value.isEmpty else {
        return defaultValue
    }
    return ["1", "true", "yes", "on"].contains(value)
}

func shellOutput(_ launchPath: String, _ args: [String]) -> String? {
    let process = Process()
    process.executableURL = URL(fileURLWithPath: launchPath)
    process.arguments = args

    let pipe = Pipe()
    process.standardOutput = pipe
    process.standardError = Pipe()

    do {
        try process.run()
    } catch {
        return nil
    }
    process.waitUntilExit()
    guard process.terminationStatus == 0 else {
        return nil
    }
    let data = pipe.fileHandleForReading.readDataToEndOfFile()
    return String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines)
}

func readPointerFromCliclick() -> (Int, Int)? {
    guard let raw = shellOutput(cliclickPath, ["p"]), !raw.isEmpty else {
        return nil
    }
    let parts = raw.split(separator: ",", maxSplits: 1).map { String($0) }
    guard parts.count == 2, let x = Int(parts[0]), let y = Int(parts[1]) else {
        return nil
    }
    return (x, y)
}

func frontmostAppInfo() -> (String, String) {
    let app = NSWorkspace.shared.frontmostApplication
    let name = app?.localizedName ?? ""
    let bundleId = app?.bundleIdentifier ?? ""
    return (name, bundleId)
}

func readFrontmostTerminalTTY() -> String? {
    let script = """
tell application "Terminal"
    if (count of windows) is 0 then
        return ""
    end if
    try
        return tty of selected tab of front window
    on error
        return ""
    end try
end tell
"""
    guard let tty = shellOutput("/usr/bin/osascript", ["-e", script]), !tty.isEmpty else {
        return nil
    }
    return tty
}

func writeTerminalTarget(tty: String, appName: String, bundleId: String) {
    let parent = URL(fileURLWithPath: targetPath).deletingLastPathComponent()
    try? FileManager.default.createDirectory(at: parent, withIntermediateDirectories: true)

    let payload: [String: Any] = [
        "kind": "terminal",
        "tty": tty,
        "app": appName,
        "bundle_id": bundleId,
        "press_enter": true,
        "updated_at": Int(Date().timeIntervalSince1970),
    ]

    do {
        let data = try JSONSerialization.data(withJSONObject: payload, options: [.prettyPrinted])
        try data.write(to: URL(fileURLWithPath: targetPath), options: .atomic)
        let appLabel = appName.isEmpty ? "unknown-app" : appName
        print("🎯 Terminal lock set: \(tty) in \(appLabel) (Enter: ON)")
        fflush(stdout)
    } catch {
        print("❌ Failed writing terminal target file: \(error)")
        fflush(stdout)
    }
}

func writePointTarget(x: Int, y: Int, appName: String, bundleId: String) {
    let parent = URL(fileURLWithPath: targetPath).deletingLastPathComponent()
    try? FileManager.default.createDirectory(at: parent, withIntermediateDirectories: true)

    let lowerName = appName.lowercased()
    let lowerBundle = bundleId.lowercased()
    let browserHints = ["chrome", "safari", "arc", "firefox", "brave", "edge", "chromium"]
    let isTerminalApp = lowerName.contains("terminal") || lowerName.contains("iterm") || lowerBundle.contains("terminal") || lowerBundle.contains("iterm")
    let isBrowserApp = browserHints.contains { hint in
        lowerName.contains(hint) || lowerBundle.contains(hint)
    }
    let pointEnterDefault = envBool("VOICE_ANCHOR_POINT_ENTER_DEFAULT", default: false)
    let browserEnterDefault = envBool("VOICE_ANCHOR_BROWSER_ENTER_DEFAULT", default: true)
    let pressEnter = isTerminalApp || pointEnterDefault || (browserEnterDefault && isBrowserApp)

    let payload: [String: Any] = [
        "kind": "point",
        "x": x,
        "y": y,
        "app": appName,
        "bundle_id": bundleId,
        "press_enter": pressEnter,
        "updated_at": Int(Date().timeIntervalSince1970),
    ]

    do {
        let data = try JSONSerialization.data(withJSONObject: payload, options: [.prettyPrinted])
        try data.write(to: URL(fileURLWithPath: targetPath), options: .atomic)
        let appLabel = appName.isEmpty ? "unknown-app" : appName
        let enterMode = pressEnter ? "ON" : "OFF"
        print("🎯 Anchor set: \(x),\(y) in \(appLabel) (Enter: \(enterMode))")
        fflush(stdout)
    } catch {
        print("❌ Failed writing target file: \(error)")
        fflush(stdout)
    }
}

func hasAnchorModifiers(_ flags: CGEventFlags) -> Bool {
    return flags.contains(.maskCommand) && flags.contains(.maskAlternate)
}

func hasAnchorModifiers(_ flags: NSEvent.ModifierFlags) -> Bool {
    return flags.contains(.command) && flags.contains(.option)
}

func commitAnchorFromCurrentContext() {
    guard let (x, y) = readPointerFromCliclick() else {
        print("❌ Could not read pointer from cliclick.")
        fflush(stdout)
        return
    }

    let (name, bundleId) = frontmostAppInfo()
    let lowerName = name.lowercased()
    let lowerBundle = bundleId.lowercased()

    let isTerminalApp = lowerName.contains("terminal") || lowerBundle.contains("terminal")
    if isTerminalApp, let tty = readFrontmostTerminalTTY(), !tty.isEmpty {
        writeTerminalTarget(tty: tty, appName: name, bundleId: bundleId)
    } else {
        writePointTarget(x: x, y: y, appName: name, bundleId: bundleId)
    }
}

var globalEventTap: CFMachPort?

if !FileManager.default.fileExists(atPath: cliclickPath) {
    fputs("❌ Missing dependency: \(cliclickPath)\n", stderr)
    exit(1)
}

let trusted = AXIsProcessTrusted()
if !trusted {
    fputs("⚠️ Accessibility not fully trusted in this launch context. Attempting event tap anyway.\n", stderr)
    fputs("If click capture fails, allow your terminal/daemon in System Settings -> Privacy & Security -> Accessibility.\n", stderr)
}

let callback: CGEventTapCallBack = { _, type, event, _ in
    if type == .tapDisabledByTimeout || type == .tapDisabledByUserInput {
        if let tap = globalEventTap {
            CGEvent.tapEnable(tap: tap, enable: true)
        }
        print("⚠️ Event tap disabled (\(type.rawValue)); re-enabled.")
        fflush(stdout)
        return Unmanaged.passUnretained(event)
    }

    guard type == .leftMouseDown else {
        return Unmanaged.passUnretained(event)
    }
    guard hasAnchorModifiers(event.flags) else {
        return Unmanaged.passUnretained(event)
    }

    commitAnchorFromCurrentContext()
    return Unmanaged.passUnretained(event)
}

let eventMask =
    (1 << CGEventType.leftMouseDown.rawValue) |
    (1 << CGEventType.tapDisabledByTimeout.rawValue) |
    (1 << CGEventType.tapDisabledByUserInput.rawValue)
guard let tap = CGEvent.tapCreate(
    tap: .cgSessionEventTap,
    place: .headInsertEventTap,
    options: .defaultTap,
    eventsOfInterest: CGEventMask(eventMask),
    callback: callback,
    userInfo: nil
) else {
    fputs("⚠️ Failed to create CG event tap. Falling back to NSEvent global monitor.\n", stderr)
    fflush(stderr)

    let monitor = NSEvent.addGlobalMonitorForEvents(matching: [.leftMouseDown]) { event in
        guard hasAnchorModifiers(event.modifierFlags) else { return }
        commitAnchorFromCurrentContext()
    }

    guard monitor != nil else {
        fputs("❌ Failed to install fallback global monitor.\n", stderr)
        exit(1)
    }

    print("🖱️ Voice click anchor daemon active (fallback monitor).")
    print("Hold \(comboLabel) anywhere to set transcription destination.")
    print("Target file: \(targetPath)")
    fflush(stdout)
    RunLoop.current.run()
    exit(0)
}
globalEventTap = tap

guard let source = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, tap, 0) else {
    fputs("❌ Failed to create run loop source for event tap.\n", stderr)
    exit(1)
}

CFRunLoopAddSource(CFRunLoopGetCurrent(), source, .commonModes)
CGEvent.tapEnable(tap: tap, enable: true)

print("🖱️ Voice click anchor daemon active.")
print("Hold \(comboLabel) anywhere to set transcription destination.")
print("Target file: \(targetPath)")
fflush(stdout)

CFRunLoopRun()
