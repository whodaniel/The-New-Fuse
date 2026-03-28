#!/usr/bin/env swift

import AppKit
import ApplicationServices
import Foundation

let env = ProcessInfo.processInfo.environment

func normalizeProfile(_ raw: String) -> String {
    let lower = raw.lowercased()
    let allowed = CharacterSet(charactersIn: "abcdefghijklmnopqrstuvwxyz0123456789_-")
    let cleanedScalars = lower.unicodeScalars.map { allowed.contains($0) ? Character($0) : "_" }
    let cleaned = String(cleanedScalars).trimmingCharacters(in: CharacterSet(charactersIn: "_"))
    return cleaned.isEmpty ? "main" : cleaned
}

func profileSuffix(_ profile: String) -> String {
    switch profile {
    case "main", "default", "primary":
        return ""
    default:
        return "_\(profile)"
    }
}

func stateFileName(_ name: String, profile: String) -> String {
    let suffix = profileSuffix(profile)
    if suffix.isEmpty {
        return name
    }
    if let dot = name.lastIndex(of: ".") {
        let stem = name[..<dot]
        let ext = name[dot...]
        return "\(stem)\(suffix)\(ext)"
    }
    return "\(name)\(suffix)"
}

func resolveStateDir() -> String {
    if let explicit = env["VOICEBRIDGE_STATE_DIR"], !explicit.isEmpty {
        return NSString(string: explicit).expandingTildeInPath
    }

    let candidates = [
        "~/The-New-Fuse/.voicebridge",
        "~/Desktop/The-New-Fuse/.voicebridge",
        "~/Projects/The-New-Fuse/.voicebridge",
    ].map { NSString(string: $0).expandingTildeInPath }

    for candidate in candidates {
        let parent = NSString(string: candidate).deletingLastPathComponent
        if FileManager.default.fileExists(atPath: parent) {
            return candidate
        }
    }

    return NSString(string: "~/.local/share/The-New-Fuse/.voicebridge").expandingTildeInPath
}

let profile = normalizeProfile(env["VOICEBRIDGE_PROFILE"] ?? "main")
let stateDirPath = resolveStateDir()
let targetFile = stateFileName("voice_target.json", profile: profile)
let targetPath = URL(fileURLWithPath: stateDirPath).appendingPathComponent(targetFile).path
let legacyTargetPath = NSString(string: "~/.openclaw/voice_target.json").expandingTildeInPath
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

func isTerminalLike(appName: String, bundleId: String) -> Bool {
    let lowerName = appName.lowercased()
    let lowerBundle = bundleId.lowercased()
    return lowerName.contains("terminal") || lowerName.contains("iterm") || lowerBundle.contains("terminal") || lowerBundle.contains("iterm")
}

func frontmostTerminalTTY() -> String {
    let script = """
    tell application "Terminal"
        try
            return tty of selected tab of front window
        end try
    end tell
    return ""
    """
    guard let raw = shellOutput("/usr/bin/osascript", ["-e", script]), !raw.isEmpty else {
        return ""
    }
    if raw.hasPrefix("/dev/") {
        return String(raw.dropFirst(5))
    }
    return raw
}

func writePointTarget(x: Int, y: Int, appName: String, bundleId: String, tty: String) {
    let parent = URL(fileURLWithPath: targetPath).deletingLastPathComponent()
    try? FileManager.default.createDirectory(at: parent, withIntermediateDirectories: true)

    let pressEnter = isTerminalLike(appName: appName, bundleId: bundleId)

    var payload: [String: Any] = [
        "kind": "point",
        "x": x,
        "y": y,
        "app": appName,
        "bundle_id": bundleId,
        "press_enter": pressEnter,
        "updated_at": Int(Date().timeIntervalSince1970),
    ]
    if !tty.isEmpty {
        payload["tty"] = tty
    }

    do {
        let data = try JSONSerialization.data(withJSONObject: payload, options: [.prettyPrinted])
        try data.write(to: URL(fileURLWithPath: targetPath), options: .atomic)
        let appLabel = appName.isEmpty ? "unknown-app" : appName
        let enterMode = pressEnter ? "ON" : "OFF"
        if !tty.isEmpty {
            print("🎯 Anchor set: \(x),\(y) in \(appLabel) (tty: \(tty), Enter: \(enterMode))")
        } else {
            print("🎯 Anchor set: \(x),\(y) in \(appLabel) (Enter: \(enterMode))")
        }
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

if profileSuffix(profile).isEmpty &&
    !FileManager.default.fileExists(atPath: targetPath) &&
    FileManager.default.fileExists(atPath: legacyTargetPath) {
    let parent = URL(fileURLWithPath: targetPath).deletingLastPathComponent()
    try? FileManager.default.createDirectory(at: parent, withIntermediateDirectories: true)
    try? FileManager.default.copyItem(atPath: legacyTargetPath, toPath: targetPath)
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
    let tty = isTerminalLike(appName: name, bundleId: bundleId) ? frontmostTerminalTTY() : ""
    writePointTarget(x: x, y: y, appName: name, bundleId: bundleId, tty: tty)
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

print("🖱️ Voice click anchor daemon active (profile: \(profile)).")
print("Hold \(comboLabel) anywhere to set transcription destination.")
print("Target file: \(targetPath)")
fflush(stdout)

CFRunLoopRun()
