// Agent-browser backend for the TNF desktop browser console.
//
// Default interactive path. Replaces the legacy packages/tnf-browser
// extension + ws://127.0.0.1:7331 stack unless TNF_BROWSER_BACKEND=legacy.
//
// SCOPE NOTE: spawns only the agent-browser binary with fixed subcommands and
// validated string params (URLs / selectors / text). No shell, no caller argv.

use serde_json::{json, Value};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone)]
pub struct AgentBrowserStatus {
    pub listening: bool,
    pub has_token: bool,
    pub connected: bool,
    pub runtime_connected: bool,
    pub last_error: Option<String>,
    pub port: u16,
    pub token_path: String,
}

#[derive(Debug, Clone)]
pub struct AgentBrowserStartResult {
    pub ok: bool,
    pub message: String,
    pub command: String,
    pub already_running: bool,
}

pub fn preferred_backend() -> &'static str {
    match std::env::var("TNF_BROWSER_BACKEND")
        .unwrap_or_else(|_| "agent-browser".into())
        .to_lowercase()
        .as_str()
    {
        "legacy" | "tnf-browser" | "webpilot" => "legacy",
        _ => "agent-browser",
    }
}

fn dirs_home() -> PathBuf {
    std::env::var_os("HOME")
        .or_else(|| std::env::var_os("USERPROFILE"))
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("."))
}

fn resolve_agent_browser_bin(app: Option<&AppHandle>) -> PathBuf {
    if let Ok(explicit) = std::env::var("AGENT_BROWSER_BIN") {
        let path = PathBuf::from(explicit);
        if path.is_file() {
            return path;
        }
    }

    let mut roots: Vec<PathBuf> = Vec::new();
    if let Ok(cwd) = std::env::current_dir() {
        roots.push(cwd);
    }
    if let Ok(manifest) = std::env::var("CARGO_MANIFEST_DIR") {
        roots.push(PathBuf::from(manifest));
    }
    if let Some(app) = app {
        if let Ok(resource_dir) = app.path().resource_dir() {
            roots.push(resource_dir);
        }
    }

    for root in &roots {
        let mut cursor = root.as_path();
        for _ in 0..6 {
            for rel in [
                Path::new("node_modules/.bin/agent-browser"),
                Path::new("packages/tnf-cli/node_modules/.bin/agent-browser"),
            ] {
                let candidate = cursor.join(rel);
                if candidate.is_file() {
                    return candidate;
                }
            }
            match cursor.parent() {
                Some(parent) => cursor = parent,
                None => break,
            }
        }
    }

    PathBuf::from("agent-browser")
}

fn run_agent_browser(app: Option<&AppHandle>, args: &[&str]) -> Result<(i32, String, String), String> {
    let bin = resolve_agent_browser_bin(app);
    let output = Command::new(&bin)
        .args(args)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|err| {
            if err.kind() == std::io::ErrorKind::NotFound {
                "agent-browser not found. Install agent-browser or set AGENT_BROWSER_BIN.".into()
            } else {
                format!("Failed to run agent-browser: {}", err)
            }
        })?;
    let code = output.status.code().unwrap_or(1);
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    Ok((code, stdout, stderr))
}

fn parse_json_safe(text: &str) -> Value {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return Value::Null;
    }
    if let Ok(v) = serde_json::from_str::<Value>(trimmed) {
        return v;
    }
    if let (Some(start), Some(end)) = (trimmed.rfind('{'), trimmed.rfind('}')) {
        if end > start {
            if let Ok(v) = serde_json::from_str::<Value>(&trimmed[start..=end]) {
                return v;
            }
        }
    }
    json!({ "raw": trimmed })
}

fn json_string_field(value: &Value, keys: &[&str]) -> String {
    for key in keys {
        if let Some(v) = value.get(*key) {
            if let Some(s) = v.as_str() {
                return s.to_string();
            }
        }
    }
    if let Some(s) = value.as_str() {
        return s.to_string();
    }
    String::new()
}

pub fn agent_browser_available(app: Option<&AppHandle>) -> bool {
    matches!(run_agent_browser(app, &["--version"]), Ok((0, _, _)))
}

/// True when a live agent-browser session answers `get url` (not merely `--version`).
pub fn agent_browser_session_live(app: Option<&AppHandle>) -> bool {
    match run_agent_browser(app, &["get", "url", "--json"]) {
        Ok((0, stdout, _)) => !stdout.trim().is_empty(),
        _ => false,
    }
}

fn session_marker_path() -> PathBuf {
    dirs_home().join(".tnf").join("agent-browser-session")
}

/// Validate navigations for agent-browser. Allows `about:blank` only when `allow_blank`.
fn validate_agent_browser_url(url: &str, allow_blank: bool) -> Result<String, String> {
    let trimmed = url.trim();
    if allow_blank && (trimmed.is_empty() || trimmed.eq_ignore_ascii_case("about:blank")) {
        return Ok("about:blank".into());
    }
    crate::browser_webview::validate_external_webview_url(trimmed).map(|u| u.to_string())
}

pub fn status_agent_browser(last_error: Option<String>, app: Option<&AppHandle>) -> AgentBrowserStatus {
    let available = agent_browser_available(app);
    let live = available && agent_browser_session_live(app);
    let marker = session_marker_path();
    AgentBrowserStatus {
        listening: available,
        has_token: marker.is_file() || live,
        connected: live,
        runtime_connected: live,
        last_error,
        port: 0,
        token_path: marker.display().to_string(),
    }
}

pub fn start_agent_browser(app: &AppHandle) -> AgentBrowserStartResult {
    let mut args: Vec<String> = Vec::new();
    if let Ok(profile) = std::env::var("TNF_BROWSER_PROFILE")
        .or_else(|_| std::env::var("AGENT_BROWSER_PROFILE"))
    {
        if !profile.is_empty() {
            args.push("--profile".into());
            args.push(profile);
        }
    }
    if let Ok(state) = std::env::var("TNF_BROWSER_STATE").or_else(|_| std::env::var("AGENT_BROWSER_STATE"))
    {
        if !state.is_empty() {
            args.push("--state".into());
            args.push(state);
        }
    }
    args.extend(["open".into(), "about:blank".into(), "--headed".into(), "--json".into()]);

    let bin = resolve_agent_browser_bin(Some(app));
    let command = format!("{} {}", bin.display(), args.join(" "));
    let arg_refs: Vec<&str> = args.iter().map(|s| s.as_str()).collect();

    match run_agent_browser(Some(app), &arg_refs) {
        Ok((0, _, _)) => AgentBrowserStartResult {
            ok: true,
            message: "agent-browser session started (headed). Use Discover / Navigate in the console."
                .into(),
            command,
            already_running: false,
        },
        Ok((code, stdout, stderr)) => AgentBrowserStartResult {
            ok: false,
            message: if !stderr.is_empty() {
                stderr
            } else if !stdout.is_empty() {
                stdout
            } else {
                format!("agent-browser exited {}", code)
            },
            command,
            already_running: false,
        },
        Err(message) => AgentBrowserStartResult {
            ok: false,
            message,
            command,
            already_running: false,
        },
    }
}

fn ref_or_selector(value: &str) -> String {
    if value.starts_with("el_") {
        format!("@{}", value)
    } else {
        value.to_string()
    }
}

pub fn run_mapped_command(
    app: &AppHandle,
    action: &str,
    params: Option<Value>,
) -> Result<Value, String> {
    let params = params.unwrap_or_else(|| json!({}));

    match action {
        "tabs.navigate" => {
            let raw = params
                .get("url")
                .and_then(|v| v.as_str())
                .ok_or_else(|| "url required".to_string())?;
            let url = validate_agent_browser_url(raw, false)?;
            let (code, stdout, stderr) =
                run_agent_browser(Some(app), &["open", &url, "--json"])?;
            if code != 0 {
                return Err(if !stderr.is_empty() {
                    stderr
                } else {
                    stdout
                });
            }
            let parsed = parse_json_safe(&stdout);
            Ok(if parsed.is_null() {
                json!({ "ok": true, "url": url })
            } else {
                parsed
            })
        }
        "tabs.reload" => {
            let (code, stdout, stderr) = run_agent_browser(Some(app), &["reload", "--json"])?;
            if code != 0 {
                return Err(if !stderr.is_empty() { stderr } else { stdout });
            }
            Ok(parse_json_safe(&stdout))
        }
        "tabs.goBack" => {
            let (code, stdout, stderr) = run_agent_browser(Some(app), &["back", "--json"])?;
            if code != 0 {
                return Err(if !stderr.is_empty() { stderr } else { stdout });
            }
            Ok(parse_json_safe(&stdout))
        }
        "tabs.goForward" => {
            let (code, stdout, stderr) = run_agent_browser(Some(app), &["forward", "--json"])?;
            if code != 0 {
                return Err(if !stderr.is_empty() { stderr } else { stdout });
            }
            Ok(parse_json_safe(&stdout))
        }
        "tabs.list" => {
            let (_, url_out, _) = run_agent_browser(Some(app), &["get", "url", "--json"])?;
            let (_, title_out, _) = run_agent_browser(Some(app), &["get", "title", "--json"])?;
            let url_parsed = parse_json_safe(&url_out);
            let title_parsed = parse_json_safe(&title_out);
            let url = json_string_field(&url_parsed, &["value", "url", "raw"]);
            let title = json_string_field(&title_parsed, &["value", "title", "raw"]);
            Ok(json!([{
                "id": 1,
                "url": if url.is_empty() { "about:blank" } else { &url },
                "title": if title.is_empty() { "agent-browser" } else { &title },
                "active": true,
                "index": 0
            }]))
        }
        "tabs.create" => {
            let raw = params
                .get("url")
                .and_then(|v| v.as_str())
                .unwrap_or("about:blank");
            let url = validate_agent_browser_url(raw, true)?;
            if url == "about:blank" {
                let (code, stdout, stderr) =
                    run_agent_browser(Some(app), &["open", "about:blank", "--json"])?;
                if code != 0 {
                    return Err(if !stderr.is_empty() { stderr } else { stdout });
                }
            } else {
                run_mapped_command(app, "tabs.navigate", Some(json!({ "url": url.clone() })))?;
            }
            Ok(json!({ "id": 1, "url": url, "title": "", "active": true, "index": 0 }))
        }
        "tabs.close" => Err(
            "tabs.close is not supported by the agent-browser backend — refuse silent success"
                .into(),
        ),
        "tabs.activate" => Err(
            "tabs.activate is not supported by the agent-browser backend — refuse silent success"
                .into(),
        ),
        "tabs.screenshot" => {
            let millis = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map(|d| d.as_millis())
                .unwrap_or(0);
            let out = std::env::temp_dir().join(format!("tnf-agent-browser-{}.png", millis));
            let out_str = out.display().to_string();
            let (code, stdout, stderr) =
                run_agent_browser(Some(app), &["screenshot", &out_str, "--json"])?;
            if code != 0 {
                return Err(if !stderr.is_empty() { stderr } else { stdout });
            }
            let bytes = std::fs::read(&out).map_err(|e| format!("screenshot read failed: {}", e))?;
            let _ = std::fs::remove_file(&out);
            use base64::Engine;
            let b64 = base64::engine::general_purpose::STANDARD.encode(bytes);
            Ok(json!({ "dataUrl": format!("data:image/png;base64,{}", b64) }))
        }
        "dom.discoverElements" => {
            let (code, stdout, stderr) =
                run_agent_browser(Some(app), &["snapshot", "-i", "--json"])?;
            if code != 0 {
                return Err(if !stderr.is_empty() { stderr } else { stdout });
            }
            let parsed = parse_json_safe(&stdout);
            if let Some(arr) = parsed.as_array() {
                return Ok(json!({ "elements": arr }));
            }
            if parsed.get("elements").and_then(|v| v.as_array()).is_some() {
                return Ok(parsed);
            }
            let refs = parsed
                .get("refs")
                .or_else(|| parsed.get("nodes"))
                .and_then(|v| v.as_array())
                .cloned()
                .unwrap_or_default();
            let elements: Vec<Value> = refs
                .into_iter()
                .enumerate()
                .map(|(index, node)| {
                    json!({
                        "handleId": node.get("ref").or_else(|| node.get("id")).cloned()
                            .unwrap_or_else(|| json!(format!("@e{}", index + 1))),
                        "tag": node.get("role").or_else(|| node.get("tag")).cloned()
                            .unwrap_or_else(|| json!("element")),
                        "text": node.get("name").or_else(|| node.get("text")).cloned()
                            .unwrap_or_else(|| json!("")),
                        "role": node.get("role").cloned()
                    })
                })
                .collect();
            Ok(json!({ "elements": elements, "raw": parsed }))
        }
        "dom.getHTML" => {
            let (_, html_out, _) = run_agent_browser(Some(app), &["get", "html", "--json"])?;
            let (_, title_out, _) = run_agent_browser(Some(app), &["get", "title", "--json"])?;
            let (_, url_out, _) = run_agent_browser(Some(app), &["get", "url", "--json"])?;
            let html_parsed = parse_json_safe(&html_out);
            let title_parsed = parse_json_safe(&title_out);
            let url_parsed = parse_json_safe(&url_out);
            Ok(json!({
                "html": json_string_field(&html_parsed, &["value", "html", "raw"]),
                "title": json_string_field(&title_parsed, &["value", "title", "raw"]),
                "url": json_string_field(&url_parsed, &["value", "url", "raw"]),
            }))
        }
        "dom.click" => {
            let target = params
                .get("handleId")
                .or_else(|| params.get("selector"))
                .and_then(|v| v.as_str())
                .ok_or_else(|| "selector or handleId required".to_string())?;
            let sel = ref_or_selector(target);
            let (code, stdout, stderr) =
                run_agent_browser(Some(app), &["click", &sel, "--json"])?;
            if code != 0 {
                return Err(if !stderr.is_empty() { stderr } else { stdout });
            }
            Ok(parse_json_safe(&stdout))
        }
        "dom.type" => {
            let text = params
                .get("text")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let target = params
                .get("handleId")
                .or_else(|| params.get("selector"))
                .and_then(|v| v.as_str());
            if let Some(target) = target {
                let sel = ref_or_selector(target);
                let (code, stdout, stderr) =
                    run_agent_browser(Some(app), &["fill", &sel, &text, "--json"])?;
                if code != 0 {
                    return Err(if !stderr.is_empty() { stderr } else { stdout });
                }
                Ok(parse_json_safe(&stdout))
            } else {
                let (code, stdout, stderr) =
                    run_agent_browser(Some(app), &["type", &text, "--json"])?;
                if code != 0 {
                    return Err(if !stderr.is_empty() { stderr } else { stdout });
                }
                Ok(parse_json_safe(&stdout))
            }
        }
        "dom.keyPress" => {
            let key = params
                .get("key")
                .and_then(|v| v.as_str())
                .ok_or_else(|| "key required".to_string())?;
            let (code, stdout, stderr) =
                run_agent_browser(Some(app), &["press", key, "--json"])?;
            if code != 0 {
                return Err(if !stderr.is_empty() { stderr } else { stdout });
            }
            Ok(parse_json_safe(&stdout))
        }
        other => Err(format!(
            "Unsupported action \"{}\" on agent-browser backend. Use TNF_BROWSER_BACKEND=legacy only for the old :7331 extension runtime.",
            other
        )),
    }
}
