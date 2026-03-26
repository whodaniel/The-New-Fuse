#!/usr/bin/env swift

import AppKit
import ApplicationServices
import Foundation

let targetPath = NSString(string: "~/.openclaw/voice_target.json").expandingTildeInPath
let cliclickPath = "/usr/local/bin/cliclick"
let comboLabel = "Cmd+Option+Click"

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

func writePointTarget(x: Int, y: Int, appName: String, bundleId: String) {
    let parent = URL(fileURLWithPath: targetPath).deletingLastPathComponent()
    try? FileManager.default.createDirectory(at: parent, withIntermediateDirectories: true)

    let lowerName = appName.lowercased()
    let lowerBundle = bundleId.lowercased()
    let pressEnter = lowerName.contains("terminal") || lowerName.contains("iterm") || lowerBundle.contains("terminal") || lowerBundle.contains("iterm")

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

if !FileManager.default.fileExists(atPath: cliclickPath) {
    fputs("❌ Missing dependency: \(cliclickPath)\n", stderr)
    exit(1)
}

let trusted = AXIsProcessTrusted()
if !trusted {
    fputs("❌ Accessibility permission is required for global click capture.\n", stderr)
    fputs("Open System Settings -> Privacy & Security -> Accessibility and allow Terminal.\n", stderr)
    exit(1)
}

let callback: CGEventTapCallBack = { _, type, event, _ in
    guard type == .leftMouseDown else {
        return Unmanaged.passUnretained(event)
    }
    guard hasAnchorModifiers(event.flags) else {
        return Unmanaged.passUnretained(event)
    }

    guard let (x, y) = readPointerFromCliclick() else {
        print("❌ Could not read pointer from cliclick.")
        fflush(stdout)
        return Unmanaged.passUnretained(event)
    }

    let (name, bundleId) = frontmostAppInfo()
    writePointTarget(x: x, y: y, appName: name, bundleId: bundleId)
    return Unmanaged.passUnretained(event)
}

let eventMask = (1 << CGEventType.leftMouseDown.rawValue)
guard let tap = CGEvent.tapCreate(
    tap: .cgSessionEventTap,
    place: .headInsertEventTap,
    options: .defaultTap,
    eventsOfInterest: CGEventMask(eventMask),
    callback: callback,
    userInfo: nil
) else {
    fputs("❌ Failed to create event tap. Check Accessibility permissions.\n", stderr)
    exit(1)
}

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
