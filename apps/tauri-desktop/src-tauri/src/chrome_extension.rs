use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use tauri::{AppHandle, Manager};

#[derive(serde::Serialize)]
pub struct ChromeLaunchResult {
    pub launched: bool,
    pub chrome_path: Option<String>,
    pub extension_path: Option<String>,
    pub profile_dir: String,
    pub pid: Option<u32>,
    pub message: String,
}

fn home_dir() -> PathBuf {
    std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("/tmp"))
}

fn profile_dir() -> PathBuf {
    home_dir().join(".tnf").join("chrome-profile")
}

fn path_exists(path: &Path) -> bool {
    path.join("manifest.json").is_file()
}

fn dev_extension_candidates() -> Vec<PathBuf> {
    let cwd = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let mut candidates = vec![
        cwd.join("apps").join("chrome-extension").join("dist-v7"),
        cwd.join("..").join("chrome-extension").join("dist-v7"),
        cwd.join("..").join("..").join("chrome-extension").join("dist-v7"),
        cwd.join("..").join("..").join("..").join("chrome-extension").join("dist-v7"),
        cwd.join("apps").join("chrome-extension").join("dist-v6"),
        cwd.join("apps").join("chrome-extension").join("dist"),
    ];

    if let Ok(manifest_dir) = std::env::var("CARGO_MANIFEST_DIR") {
        let tauri_dir = PathBuf::from(manifest_dir);
        candidates.push(
            tauri_dir
                .join("..")
                .join("..")
                .join("chrome-extension")
                .join("dist-v7"),
        );
    }

    candidates
}

#[tauri::command]
pub fn resolve_chrome_extension_path(app: AppHandle) -> Result<Option<String>, String> {
    if let Ok(resource_dir) = app.path().resource_dir() {
        let bundled = resource_dir.join("chrome-extension");
        if path_exists(&bundled) {
            return Ok(Some(bundled.display().to_string()));
        }
    }

    for candidate in dev_extension_candidates() {
        if path_exists(&candidate) {
            return Ok(Some(candidate.display().to_string()));
        }
    }

    Ok(None)
}

#[tauri::command]
pub fn find_chrome_executable() -> Result<Option<String>, String> {
    let candidates: Vec<PathBuf> = {
        let mut list = Vec::new();
        #[cfg(target_os = "macos")]
        {
            list.push(PathBuf::from(
                "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            ));
            list.push(PathBuf::from(
                "/Applications/Chromium.app/Contents/MacOS/Chromium",
            ));
        }
        #[cfg(target_os = "linux")]
        {
            list.push(PathBuf::from("/usr/bin/google-chrome"));
            list.push(PathBuf::from("/usr/bin/google-chrome-stable"));
            list.push(PathBuf::from("/usr/bin/chromium"));
            list.push(PathBuf::from("/usr/bin/chromium-browser"));
            list.push(PathBuf::from("/snap/bin/chromium"));
        }
        #[cfg(target_os = "windows")]
        {
            if let Ok(local) = std::env::var("LOCALAPPDATA") {
                list.push(
                    PathBuf::from(local)
                        .join("Google")
                        .join("Chrome")
                        .join("Application")
                        .join("chrome.exe"),
                );
            }
            list.push(PathBuf::from(
                r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            ));
            list.push(PathBuf::from(
                r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            ));
        }
        list
    };

    for candidate in candidates {
        if candidate.is_file() {
            return Ok(Some(candidate.display().to_string()));
        }
    }

    Ok(None)
}

fn chrome_running_with_profile(profile: &Path) -> bool {
    let marker = profile.display().to_string();
    #[cfg(any(target_os = "macos", target_os = "linux"))]
    {
        let output = Command::new("pgrep")
            .arg("-f")
            .arg(&marker)
            .output();
        if let Ok(out) = output {
            return out.status.success();
        }
    }
    false
}

#[tauri::command]
pub fn launch_chrome_with_extension(
    app: AppHandle,
    start_url: Option<String>,
) -> Result<ChromeLaunchResult, String> {
    let profile = profile_dir();
    std::fs::create_dir_all(&profile).map_err(|e| format!("Failed to create profile dir: {e}"))?;

    let extension_path = resolve_chrome_extension_path(app)?
        .ok_or_else(|| "TNF Chrome extension bundle not found (dist-v7)".to_string())?;

    let chrome_path = find_chrome_executable()?
        .ok_or_else(|| "Google Chrome or Chromium is not installed".to_string())?;

    if chrome_running_with_profile(&profile) {
        return Ok(ChromeLaunchResult {
            launched: false,
            chrome_path: Some(chrome_path),
            extension_path: Some(extension_path),
            profile_dir: profile.display().to_string(),
            pid: None,
            message: "Chrome already running with TNF profile".to_string(),
        });
    }

    let landing_url = match start_url {
        Some(raw) => crate::browser_webview::validate_external_webview_url(&raw)?.to_string(),
        None => "https://thenewfuse.com".to_string(),
    };

    let child = Command::new(&chrome_path)
        .arg(format!("--user-data-dir={}", profile.display()))
        .arg("--no-first-run")
        .arg("--no-default-browser-check")
        .arg(format!("--disable-extensions-except={extension_path}"))
        .arg(format!("--load-extension={extension_path}"))
        .arg(&landing_url)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| format!("Failed to launch Chrome: {e}"))?;

    Ok(ChromeLaunchResult {
        launched: true,
        chrome_path: Some(chrome_path),
        extension_path: Some(extension_path),
        profile_dir: profile.display().to_string(),
        pid: Some(child.id()),
        message: "Chrome launched with TNF extension".to_string(),
    })
}
