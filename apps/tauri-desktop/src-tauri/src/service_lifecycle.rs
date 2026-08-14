//! Allowlisted local service lifecycle commands.
//!
//! SCOPE NOTE: this is deliberately NOT a general command runner. The generic
//! `execute_command` was removed as the CRIT-1 RCE remediation and must not come
//! back. Each command spawns one fixed program with fixed argv; caller input is
//! limited to validated ports / project roots.

use serde::Serialize;
use std::net::TcpStream;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::Duration;
use tauri::AppHandle;
use tauri::Manager;

#[derive(Debug, Serialize, Clone)]
pub struct ServiceLifecycleResult {
    pub ok: bool,
    pub message: String,
    pub command: String,
    pub already_running: bool,
    pub port: Option<u16>,
}

fn dirs_home() -> PathBuf {
    dirs::home_dir().unwrap_or_else(|| PathBuf::from("/"))
}

fn resolve_python3() -> Option<PathBuf> {
    if let Ok(explicit) = std::env::var("PYTHON3") {
        let path = PathBuf::from(explicit);
        if path.is_file() {
            return Some(path);
        }
    }
    if let Ok(path_var) = std::env::var("PATH") {
        for dir in std::env::split_paths(&path_var) {
            let candidate = dir.join("python3");
            if candidate.is_file() {
                return Some(candidate);
            }
        }
    }
    let home = dirs_home();
    for candidate in [
        PathBuf::from("/opt/homebrew/bin/python3"),
        PathBuf::from("/usr/local/bin/python3"),
        PathBuf::from("/usr/bin/python3"),
        home.join(".local").join("bin").join("python3"),
    ] {
        if candidate.is_file() {
            return Some(candidate);
        }
    }
    None
}

fn resolve_node() -> Option<PathBuf> {
    if let Ok(explicit) = std::env::var("NODE") {
        let path = PathBuf::from(explicit);
        if path.is_file() {
            return Some(path);
        }
    }
    if let Ok(path_var) = std::env::var("PATH") {
        for dir in std::env::split_paths(&path_var) {
            let candidate = dir.join("node");
            if candidate.is_file() {
                return Some(candidate);
            }
        }
    }
    let home = dirs_home();
    for candidate in [
        home.join(".local").join("bin").join("node"),
        PathBuf::from("/opt/homebrew/bin/node"),
        PathBuf::from("/usr/local/bin/node"),
        PathBuf::from("/usr/bin/node"),
    ] {
        if candidate.is_file() {
            return Some(candidate);
        }
    }
    None
}

fn resolve_pnpm() -> Option<PathBuf> {
    if let Ok(explicit) = std::env::var("PNPM") {
        let path = PathBuf::from(explicit);
        if path.is_file() {
            return Some(path);
        }
    }
    if let Ok(path_var) = std::env::var("PATH") {
        for dir in std::env::split_paths(&path_var) {
            for name in ["pnpm", "pnpm.cjs"] {
                let candidate = dir.join(name);
                if candidate.is_file() {
                    return Some(candidate);
                }
            }
        }
    }
    let home = dirs_home();
    for candidate in [
        home.join(".local").join("share").join("pnpm").join("pnpm"),
        PathBuf::from("/opt/homebrew/bin/pnpm"),
        PathBuf::from("/usr/local/bin/pnpm"),
    ] {
        if candidate.is_file() {
            return Some(candidate);
        }
    }
    None
}

/// Walk up from cwd / CARGO_MANIFEST_DIR looking for the TNF monorepo root.
fn resolve_repo_root(app: &AppHandle) -> Option<PathBuf> {
    if let Ok(explicit) = std::env::var("TNF_PROJECT_ROOT") {
        let path = PathBuf::from(explicit);
        if path.join("package.json").is_file() && path.join("scripts").is_dir() {
            return Some(path);
        }
    }

    let mut roots: Vec<PathBuf> = Vec::new();
    if let Ok(cwd) = std::env::current_dir() {
        roots.push(cwd);
    }
    if let Ok(manifest) = std::env::var("CARGO_MANIFEST_DIR") {
        roots.push(PathBuf::from(manifest));
    }
    if let Ok(resource_dir) = app.path().resource_dir() {
        roots.push(resource_dir);
    }

    for root in roots {
        let mut cursor = root.as_path();
        for _ in 0..8 {
            let pkg = cursor.join("package.json");
            let voice = cursor.join("scripts").join("system").join("voice_server.py");
            if pkg.is_file() && (voice.is_file() || cursor.join("apps").is_dir()) {
                return Some(cursor.to_path_buf());
            }
            match cursor.parent() {
                Some(parent) => cursor = parent,
                None => break,
            }
        }
    }
    None
}

fn port_open(host: &str, port: u16) -> bool {
    let addr = match format!("{}:{}", host, port).parse() {
        Ok(a) => a,
        Err(_) => return false,
    };
    TcpStream::connect_timeout(&addr, Duration::from_millis(400)).is_ok()
}

/// Poll until a local port accepts connections, or give up after `timeout_ms`.
async fn wait_for_port(host: &str, port: u16, timeout_ms: u64) -> bool {
    let deadline = std::time::Instant::now() + Duration::from_millis(timeout_ms);
    while std::time::Instant::now() < deadline {
        if port_open(host, port) {
            return true;
        }
        tokio::time::sleep(Duration::from_millis(250)).await;
    }
    false
}

/// After a successful spawn, require the service port to open within the timeout.
async fn result_after_spawn(
    cmd_display: String,
    port: u16,
    label: &str,
    timeout_ms: u64,
) -> ServiceLifecycleResult {
    if wait_for_port("127.0.0.1", port, timeout_ms).await {
        ServiceLifecycleResult {
            ok: true,
            message: format!("{} ready on :{}", label, port),
            command: cmd_display,
            already_running: false,
            port: Some(port),
        }
    } else {
        ServiceLifecycleResult {
            ok: false,
            message: format!(
                "{} spawned but :{} did not open within {}ms — check logs / process exit",
                label, port, timeout_ms
            ),
            command: cmd_display,
            already_running: false,
            port: Some(port),
        }
    }
}

fn validate_project_root(project_root: &str) -> Result<PathBuf, String> {
    let trimmed = project_root.trim();
    if trimmed.is_empty() {
        return Err("Project root is required".into());
    }
    let path = PathBuf::from(trimmed);
    if !path.is_absolute() {
        return Err("Project root must be an absolute path".into());
    }
    if !path.is_dir() {
        return Err(format!("Project root does not exist: {}", path.display()));
    }
    Ok(path)
}

/// Expand filesystem sandbox roots for voice bridge state under a validated project root.
#[allow(dead_code)]
pub fn voicebridge_state_allowed(project_root: &Path) -> PathBuf {
    project_root.join(".voicebridge")
}

#[tauri::command]
pub async fn delete_file(path: String) -> Result<(), String> {
    // Re-use the same sandbox validation as write_file by calling into lib helpers
    // via duplicate path checks here — voicebridge + sandbox roots.
    let candidate = Path::new(&path);
    let resolved = if candidate.exists() {
        candidate
            .canonicalize()
            .map_err(|e| format!("Path resolution failed: {}", e))?
    } else {
        return Err(format!("File not found: {}", path));
    };

    let mut allowed = Vec::new();
    if let Some(home) = dirs::home_dir() {
        allowed.push(home.join(".tnf-sandbox"));
    }
    if let Some(data) = dirs::data_dir() {
        allowed.push(data.join("com.thenewfuse.desktop"));
    }
    // Voice bridge flag files live under <project>/.voicebridge
    if let Ok(cwd) = std::env::current_dir() {
        allowed.push(cwd.join(".voicebridge"));
    }
    if let Ok(root) = std::env::var("TNF_PROJECT_ROOT") {
        allowed.push(PathBuf::from(root).join(".voicebridge"));
    }

    let ok = allowed.iter().any(|root| {
        if let Ok(canonical) = root.canonicalize() {
            resolved.starts_with(&canonical)
        } else {
            resolved.starts_with(root)
        }
    });
    if !ok {
        return Err(format!(
            "Access denied: path '{}' is outside allowed delete roots",
            path
        ));
    }

    tokio::fs::remove_file(&resolved)
        .await
        .map_err(|e| format!("Failed to delete file: {}", e))
}

#[tauri::command]
pub async fn voice_server_status(port: Option<u16>) -> Result<ServiceLifecycleResult, String> {
    let port = port.unwrap_or(50005);
    let running = port_open("127.0.0.1", port);
    Ok(ServiceLifecycleResult {
        ok: running,
        message: if running {
            format!("Voice server responding on :{}", port)
        } else {
            format!("Voice server not reachable on :{}", port)
        },
        command: format!("python3 scripts/system/voice_server.py --port {}", port),
        already_running: running,
        port: Some(port),
    })
}

fn listen_process_running(profile: &str) -> bool {
    let patterns = [
        format!("scripts/system/listen.*--profile[ =]{}", profile),
        format!("/listen.*--profile[ =]{}", profile),
        format!("listen --profile {}", profile),
        format!("listen --profile={}", profile),
    ];
    for pattern in patterns {
        if let Ok(output) = Command::new("pgrep").args(["-f", &pattern]).output() {
            if output.status.success() && !output.stdout.is_empty() {
                return true;
            }
        }
    }
    // Default profile often runs without an explicit --profile flag.
    if profile == "main" || profile == "default" || profile == "primary" {
        if let Ok(output) = Command::new("pgrep")
            .args(["-f", r"(^|[/\s])listen([/\s]|$)"])
            .output()
        {
            if output.status.success() && !output.stdout.is_empty() {
                // Exclude this probe itself and editor buffers when possible by
                // requiring the scripts/system or ~/bin listen path in ps output.
                if let Ok(ps) = Command::new("ps").args(["-ax", "-o", "command="]).output() {
                    let text = String::from_utf8_lossy(&ps.stdout);
                    for line in text.lines() {
                        let lower = line.to_lowercase();
                        if lower.contains("pgrep") {
                            continue;
                        }
                        if (lower.contains("/scripts/system/listen")
                            || lower.contains("/bin/listen"))
                            && !lower.contains("--profile")
                        {
                            return true;
                        }
                    }
                }
            }
        }
    }
    false
}

fn resolve_listen_script(repo: &Path) -> Option<PathBuf> {
    let candidate = repo.join("scripts").join("system").join("listen");
    if candidate.is_file() {
        return Some(candidate);
    }
    // PATH / ~/bin fallback (same resolution order as tnf voice listen)
    if let Ok(path_var) = std::env::var("PATH") {
        for dir in std::env::split_paths(&path_var) {
            let c = dir.join("listen");
            if c.is_file() {
                return Some(c);
            }
        }
    }
    let home = dirs_home().join("bin").join("listen");
    if home.is_file() {
        return Some(home);
    }
    None
}

fn detach_spawn(mut child: Command) -> Result<std::process::Child, std::io::Error> {
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        unsafe {
            child.pre_exec(|| {
                libc::setsid();
                Ok(())
            });
        }
    }
    child.spawn()
}

#[tauri::command]
pub async fn voice_listen_status(profile: Option<String>) -> Result<ServiceLifecycleResult, String> {
    let profile = profile.unwrap_or_else(|| "main".to_string());
    let running = listen_process_running(&profile);
    Ok(ServiceLifecycleResult {
        ok: running,
        message: if running {
            format!("Listen STT sidecar running for profile '{}'", profile)
        } else {
            format!("Listen STT sidecar not running for profile '{}'", profile)
        },
        command: format!("tnf voice listen --profile {}", profile),
        already_running: running,
        port: None,
    })
}

#[tauri::command]
pub async fn start_voice_listen(
    app: AppHandle,
    project_root: Option<String>,
    profile: Option<String>,
) -> Result<ServiceLifecycleResult, String> {
    let profile = profile.unwrap_or_else(|| "main".to_string());
    if !profile
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    {
        return Err("Invalid voice profile".into());
    }

    if listen_process_running(&profile) {
        return Ok(ServiceLifecycleResult {
            ok: true,
            message: format!("Listen STT already running for profile '{}'", profile),
            command: format!("tnf voice listen --profile {}", profile),
            already_running: true,
            port: None,
        });
    }

    let repo = if let Some(root) = project_root.as_ref().filter(|s| !s.trim().is_empty()) {
        validate_project_root(root)?
    } else {
        resolve_repo_root(&app).ok_or_else(|| {
            "Could not locate TNF repo root. Set project root in Voice Bridge settings.".to_string()
        })?
    };

    let script = resolve_listen_script(&repo).ok_or_else(|| {
        "listen script not found. Install Voice Bridge scripts or ensure scripts/system/listen exists."
            .to_string()
    })?;

    let cmd_display = format!("{} --profile {}", script.display(), profile);
    let mut child = Command::new(&script);
    child
        .arg("--profile")
        .arg(&profile)
        .current_dir(&repo)
        .env("VOICEBRIDGE_PROFILE", &profile)
        .env(
            "LISTEN_DELIVERY_MODE",
            std::env::var("LISTEN_DELIVERY_MODE").unwrap_or_else(|_| "auto".into()),
        )
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    match detach_spawn(child) {
        Ok(_) => {
            // Listen has no TCP port — confirm the process marker appears.
            let deadline = std::time::Instant::now() + Duration::from_millis(4_000);
            while std::time::Instant::now() < deadline {
                if listen_process_running(&profile) {
                    return Ok(ServiceLifecycleResult {
                        ok: true,
                        message: format!(
                            "Listen STT ready for profile '{}' (same as `tnf voice listen`)",
                            profile
                        ),
                        command: cmd_display,
                        already_running: false,
                        port: None,
                    });
                }
                tokio::time::sleep(Duration::from_millis(200)).await;
            }
            Ok(ServiceLifecycleResult {
                ok: false,
                message: format!(
                    "Listen STT spawned for profile '{}' but process did not stay up",
                    profile
                ),
                command: cmd_display,
                already_running: false,
                port: None,
            })
        }
        Err(err) => Ok(ServiceLifecycleResult {
            ok: false,
            message: format!("Failed to start listen STT: {}", err),
            command: cmd_display,
            already_running: false,
            port: None,
        }),
    }
}

/// Mirrors `tnf voice up --with-listen`: server + STT sidecar for one profile.
#[tauri::command]
pub async fn ensure_voice_stack(
    app: AppHandle,
    project_root: Option<String>,
    port: Option<u16>,
    profile: Option<String>,
) -> Result<ServiceLifecycleResult, String> {
    let profile = profile.unwrap_or_else(|| "main".to_string());
    let port = port.unwrap_or(50005);

    let server = start_voice_server(
        app.clone(),
        project_root.clone(),
        Some(port),
        Some(profile.clone()),
    )
    .await?;
    if !server.ok && !server.already_running {
        return Ok(server);
    }

    // Give Flask a moment before listen begins posting transcripts.
    tokio::time::sleep(Duration::from_millis(800)).await;

    let listen = start_voice_listen(app, project_root, Some(profile.clone())).await?;
    let ok = (server.ok || server.already_running) && (listen.ok || listen.already_running);
    Ok(ServiceLifecycleResult {
        ok,
        message: format!(
            "Voice stack: server={} · listen={} (CLI equivalent: tnf voice up --with-listen --profile {})",
            if server.already_running {
                "already up"
            } else if server.ok {
                "started"
            } else {
                "failed"
            },
            if listen.already_running {
                "already up"
            } else if listen.ok {
                "started"
            } else {
                "failed"
            },
            profile
        ),
        command: format!(
            "tnf voice up --with-listen --profile {} --port {}",
            profile, port
        ),
        already_running: server.already_running && listen.already_running,
        port: Some(port),
    })
}

#[tauri::command]
pub async fn start_voice_server(
    app: AppHandle,
    project_root: Option<String>,
    port: Option<u16>,
    profile: Option<String>,
) -> Result<ServiceLifecycleResult, String> {
    let port = port.unwrap_or(50005);
    let profile = profile.unwrap_or_else(|| "main".to_string());
    if !(1..=65535).contains(&port) {
        return Err("Invalid voice server port".into());
    }
    if !profile
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    {
        return Err("Invalid voice profile".into());
    }

    if port_open("127.0.0.1", port) {
        return Ok(ServiceLifecycleResult {
            ok: true,
            message: format!("Voice server already running on :{}", port),
            command: format!("python3 scripts/system/voice_server.py --port {}", port),
            already_running: true,
            port: Some(port),
        });
    }

    let repo = if let Some(root) = project_root.as_ref().filter(|s| !s.trim().is_empty()) {
        validate_project_root(root)?
    } else {
        resolve_repo_root(&app).ok_or_else(|| {
            "Could not locate TNF repo root. Set project root in Voice Bridge settings.".to_string()
        })?
    };

    let script = repo.join("scripts").join("system").join("voice_server.py");
    if !script.is_file() {
        return Err(format!("voice_server.py not found at {}", script.display()));
    }

    let python = resolve_python3().ok_or_else(|| "python3 not found on PATH".to_string())?;
    let cmd_display = format!(
        "{} {} --port {} --profile {}",
        python.display(),
        script.display(),
        port,
        profile
    );

    let mut child = Command::new(&python);
    child
        .arg(&script)
        .arg("--port")
        .arg(port.to_string())
        .arg("--profile")
        .arg(&profile)
        .current_dir(&repo)
        .env("VOICEBRIDGE_PROFILE", &profile)
        .env("VOICEBRIDGE_PORT", port.to_string())
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    match detach_spawn(child) {
        Ok(_) => Ok(result_after_spawn(cmd_display, port, "Voice server", 10_000).await),
        Err(err) => Ok(ServiceLifecycleResult {
            ok: false,
            message: format!("Failed to start voice server: {}", err),
            command: cmd_display,
            already_running: false,
            port: Some(port),
        }),
    }
}

#[tauri::command]
pub async fn start_tnf_api(app: AppHandle) -> Result<ServiceLifecycleResult, String> {
    if port_open("127.0.0.1", 3001) {
        return Ok(ServiceLifecycleResult {
            ok: true,
            message: "TNF API already responding on :3001".into(),
            command: "pnpm run dev:api".into(),
            already_running: true,
            port: Some(3001),
        });
    }

    let repo = resolve_repo_root(&app)
        .ok_or_else(|| "Could not locate TNF repo root for API start".to_string())?;
    let pnpm = resolve_pnpm().ok_or_else(|| "pnpm not found on PATH".to_string())?;
    let cmd_display = format!("{} run dev:api", pnpm.display());

    let mut child = Command::new(&pnpm);
    child
        .arg("run")
        .arg("dev:api")
        .current_dir(&repo)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        unsafe {
            child.pre_exec(|| {
                libc::setsid();
                Ok(())
            });
        }
    }

    match child.spawn() {
        Ok(_) => Ok(result_after_spawn(cmd_display, 3001, "TNF API", 15_000).await),
        Err(err) => Ok(ServiceLifecycleResult {
            ok: false,
            message: format!("Failed to start TNF API: {}", err),
            command: cmd_display,
            already_running: false,
            port: Some(3001),
        }),
    }
}

#[tauri::command]
pub async fn start_local_relay(app: AppHandle) -> Result<ServiceLifecycleResult, String> {
    for port in [3007u16, 3000, 3010] {
        if port_open("127.0.0.1", port) {
            return Ok(ServiceLifecycleResult {
                ok: true,
                message: format!("Relay already responding on :{}", port),
                command: "pnpm run relay:start".into(),
                already_running: true,
                port: Some(port),
            });
        }
    }

    let repo = resolve_repo_root(&app)
        .ok_or_else(|| "Could not locate TNF repo root for relay start".to_string())?;
    let pnpm = resolve_pnpm().ok_or_else(|| "pnpm not found on PATH".to_string())?;
    let cmd_display = format!("{} run relay:start", pnpm.display());

    let mut child = Command::new(&pnpm);
    child
        .arg("run")
        .arg("relay:start")
        .current_dir(&repo)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        unsafe {
            child.pre_exec(|| {
                libc::setsid();
                Ok(())
            });
        }
    }

    match child.spawn() {
        Ok(_) => {
            let deadline = std::time::Instant::now() + Duration::from_millis(15_000);
            let mut ready_port: Option<u16> = None;
            while std::time::Instant::now() < deadline {
                for port in [3007u16, 3000, 3010] {
                    if port_open("127.0.0.1", port) {
                        ready_port = Some(port);
                        break;
                    }
                }
                if ready_port.is_some() {
                    break;
                }
                tokio::time::sleep(Duration::from_millis(250)).await;
            }
            match ready_port {
                Some(port) => Ok(ServiceLifecycleResult {
                    ok: true,
                    message: format!("Local relay ready on :{}", port),
                    command: cmd_display,
                    already_running: false,
                    port: Some(port),
                }),
                None => Ok(ServiceLifecycleResult {
                    ok: false,
                    message:
                        "Relay spawned but ports 3007/3000/3010 did not open within 15s".into(),
                    command: cmd_display,
                    already_running: false,
                    port: Some(3007),
                }),
            }
        }
        Err(err) => Ok(ServiceLifecycleResult {
            ok: false,
            message: format!("Failed to start relay: {}", err),
            command: cmd_display,
            already_running: false,
            port: Some(3007),
        }),
    }
}

#[tauri::command]
pub async fn start_forefront_boot(app: AppHandle) -> Result<ServiceLifecycleResult, String> {
    let repo = resolve_repo_root(&app)
        .ok_or_else(|| "Could not locate TNF repo root for forefront boot".to_string())?;
    let script = repo
        .join("scripts")
        .join("local-ui")
        .join("tnf-forefront-boot.cjs");
    if !script.is_file() {
        return Err(format!("Forefront boot script not found at {}", script.display()));
    }
    let node = resolve_node().ok_or_else(|| "node not found on PATH".to_string())?;
    let cmd_display = format!("{} {}", node.display(), script.display());

    let mut child = Command::new(&node);
    child
        .arg(&script)
        .current_dir(&repo)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        unsafe {
            child.pre_exec(|| {
                libc::setsid();
                Ok(())
            });
        }
    }

    match child.spawn() {
        Ok(_) => Ok(ServiceLifecycleResult {
            ok: true,
            message: "Started forefront boot stack".into(),
            command: cmd_display,
            already_running: false,
            port: None,
        }),
        Err(err) => Ok(ServiceLifecycleResult {
            ok: false,
            message: format!("Failed to start forefront boot: {}", err),
            command: cmd_display,
            already_running: false,
            port: None,
        }),
    }
}

/// Story Architect AI relay used by Virtual Library (`ai-relay` on :43120).
#[tauri::command]
pub async fn start_story_architect_relay(app: AppHandle) -> Result<ServiceLifecycleResult, String> {
    if port_open("127.0.0.1", 43120) {
        return Ok(ServiceLifecycleResult {
            ok: true,
            message: "Story Architect relay already responding on :43120".into(),
            command: "npm run relay:start (apps/virtual-library-blueprints)".into(),
            already_running: true,
            port: Some(43120),
        });
    }

    let repo = resolve_repo_root(&app)
        .ok_or_else(|| "Could not locate TNF repo root for Story Architect relay".to_string())?;
    // Canonical path lives under apps/extensions/; keep legacy apps/ path as fallback.
    let relay_candidates = [
        repo
            .join("apps")
            .join("extensions")
            .join("virtual-library-blueprints")
            .join("ai-relay"),
        repo
            .join("apps")
            .join("virtual-library-blueprints")
            .join("ai-relay"),
    ];
    let relay_dir = relay_candidates
        .into_iter()
        .find(|dir| dir.join("server.mjs").is_file())
        .ok_or_else(|| {
            format!(
                "Story Architect relay not found under apps/extensions/virtual-library-blueprints/ai-relay (or legacy apps/virtual-library-blueprints/ai-relay) in {}",
                repo.display()
            )
        })?;
    let server = relay_dir.join("server.mjs");
    let node = resolve_node().ok_or_else(|| "node not found on PATH".to_string())?;
    let cmd_display = format!("{} {}", node.display(), server.display());

    let mut child = Command::new(&node);
    child
        .arg(&server)
        .current_dir(&relay_dir)
        .env("PORT", "43120")
        .env("RELAY_PORT", "43120")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    match detach_spawn(child) {
        Ok(_) => Ok(result_after_spawn(
            cmd_display,
            43120,
            "Story Architect relay",
            12_000,
        )
        .await),
        Err(err) => Ok(ServiceLifecycleResult {
            ok: false,
            message: format!("Failed to start Story Architect relay: {}", err),
            command: cmd_display,
            already_running: false,
            port: Some(43120),
        }),
    }
}

/// Local KWS / audio-trigger service used by Library voice + rule ingest (:43110).
#[tauri::command]
pub async fn start_kws_server(app: AppHandle) -> Result<ServiceLifecycleResult, String> {
    if port_open("127.0.0.1", 43110) {
        return Ok(ServiceLifecycleResult {
            ok: true,
            message: "KWS already responding on :43110".into(),
            command: "pnpm --filter @the-new-fuse/audio-trigger-kws-mvp serve".into(),
            already_running: true,
            port: Some(43110),
        });
    }

    let repo = resolve_repo_root(&app)
        .ok_or_else(|| "Could not locate TNF repo root for KWS start".to_string())?;
    let pnpm = resolve_pnpm().ok_or_else(|| "pnpm not found on PATH".to_string())?;
    let cmd_display = format!(
        "{} --filter @the-new-fuse/audio-trigger-kws-mvp serve",
        pnpm.display()
    );

    let mut child = Command::new(&pnpm);
    child
        .arg("--filter")
        .arg("@the-new-fuse/audio-trigger-kws-mvp")
        .arg("serve")
        .current_dir(&repo)
        .env("APP_PORT", "43110")
        .env("PORT", "43110")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    match detach_spawn(child) {
        Ok(_) => Ok(result_after_spawn(cmd_display, 43110, "KWS", 12_000).await),
        Err(err) => Ok(ServiceLifecycleResult {
            ok: false,
            message: format!("Failed to start KWS: {}", err),
            command: cmd_display,
            already_running: false,
            port: Some(43110),
        }),
    }
}

/// Library voice path: Story Architect relay + KWS.
/// Intentionally does NOT start Whisper `listen` — Library STT uses Web Speech
/// inside the iframe (mic permission required on the embed).
#[tauri::command]
pub async fn ensure_library_audio_stack(app: AppHandle) -> Result<ServiceLifecycleResult, String> {
    let relay = start_story_architect_relay(app.clone()).await?;
    if !relay.ok && !relay.already_running {
        return Ok(relay);
    }

    tokio::time::sleep(Duration::from_millis(400)).await;

    let kws = start_kws_server(app).await?;
    let ok = (relay.ok || relay.already_running) && (kws.ok || kws.already_running);
    Ok(ServiceLifecycleResult {
        ok,
        message: format!(
            "Library audio stack: story-architect={} · kws={} (browser STT in Library UI; Whisper beam stays on Voice Hub)",
            if relay.already_running {
                "already up"
            } else if relay.ok {
                "started"
            } else {
                "failed"
            },
            if kws.already_running {
                "already up"
            } else if kws.ok {
                "started"
            } else {
                "failed"
            }
        ),
        command: "Story Architect :43120 + KWS :43110".into(),
        already_running: relay.already_running && kws.already_running,
        port: Some(43120),
    })
}
