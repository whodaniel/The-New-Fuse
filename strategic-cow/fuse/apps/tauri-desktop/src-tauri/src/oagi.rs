// OAGI Computer Use Module for Tauri
//
// Provides native Rust commands for computer automation
// Based on the OAGI/Lux protocol from https://github.com/agiopen-org/oagi-python
//
// To use: Add to src-tauri/src/main.rs:
//   mod oagi;
//   .invoke_handler(tauri::generate_handler![...oagi commands...])

use base64::{engine::general_purpose, Engine as _};
use enigo::{Enigo, Keyboard, Mouse, Settings};
use screenshots::Screen;
use std::thread;
use std::time::Duration;
use tauri::command;

// ============================================================================
// TYPES
// ============================================================================

#[derive(serde::Deserialize)]
pub struct Region {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

// ============================================================================
// SCREEN CAPTURE
// ============================================================================

/// Capture the screen and return as base64-encoded image
#[command]
pub fn capture_screen(
    format: String,
    quality: u8,
    region: Option<Region>,
) -> Result<String, String> {
    let screens = Screen::all().map_err(|e| e.to_string())?;

    if screens.is_empty() {
        return Err("No screens found".to_string());
    }

    let screen = &screens[0]; // Primary screen

    let image = if let Some(r) = region {
        screen
            .capture_area(r.x, r.y, r.width, r.height)
            .map_err(|e| e.to_string())?
    } else {
        screen.capture().map_err(|e| e.to_string())?
    };

    // Convert to bytes based on format
    let bytes = match format.to_lowercase().as_str() {
        "png" => {
            let mut buf = Vec::new();
            image.write_to(
                &mut std::io::Cursor::new(&mut buf),
                image::ImageOutputFormat::Png,
            ).map_err(|e| e.to_string())?;
            buf
        },
        "jpeg" | "jpg" => {
            let mut buf = Vec::new();
            image.write_to(
                &mut std::io::Cursor::new(&mut buf),
                image::ImageOutputFormat::Jpeg(quality),
            ).map_err(|e| e.to_string())?;
            buf
        },
        _ => return Err(format!("Unsupported format: {}", format)),
    };

    // Encode as base64
    let encoded = general_purpose::STANDARD.encode(bytes);
    Ok(format!("data:image/{};base64,{}", format.to_lowercase(), encoded))
}

// ============================================================================
// MOUSE ACTIONS
// ============================================================================

/// Execute a click at the specified coordinates
#[command]
pub fn execute_click(x: i32, y: i32, button: String) -> Result<(), String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;

    // Move to position
    enigo.move_mouse(x, y, enigo::Coordinate::Abs).map_err(|e| e.to_string())?;

    // Click
    let btn = match button.to_lowercase().as_str() {
        "left" => enigo::Button::Left,
        "right" => enigo::Button::Right,
        "middle" => enigo::Button::Middle,
        _ => enigo::Button::Left,
    };

    enigo.button(btn, enigo::Direction::Click).map_err(|e| e.to_string())?;

    Ok(())
}

/// Execute a drag from start to end position
#[command]
pub fn execute_drag(
    start_x: i32,
    start_y: i32,
    end_x: i32,
    end_y: i32,
    duration: f32,
) -> Result<(), String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;

    // Move to start position
    enigo.move_mouse(start_x, start_y, enigo::Coordinate::Abs).map_err(|e| e.to_string())?;

    // Press mouse button
    enigo.button(enigo::Button::Left, enigo::Direction::Press).map_err(|e| e.to_string())?;

    // Calculate steps based on duration
    let steps = ((duration * 60.0) as usize).max(10);
    let step_duration = Duration::from_millis((duration * 1000.0 / steps as f32) as u64);

    let dx = (end_x - start_x) as f32 / steps as f32;
    let dy = (end_y - start_y) as f32 / steps as f32;

    for i in 1..=steps {
        let x = start_x + (dx * i as f32) as i32;
        let y = start_y + (dy * i as f32) as i32;
        enigo.move_mouse(x, y, enigo::Coordinate::Abs).map_err(|e| e.to_string())?;
        thread::sleep(step_duration);
    }

    // Release mouse button
    enigo.button(enigo::Button::Left, enigo::Direction::Release).map_err(|e| e.to_string())?;

    Ok(())
}

/// Execute a scroll action
#[command]
pub fn execute_scroll(amount: i32, x: i32, y: i32) -> Result<(), String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;

    // Move to position if specified
    if x != 0 || y != 0 {
        enigo.move_mouse(x, y, enigo::Coordinate::Abs).map_err(|e| e.to_string())?;
    }

    // Scroll
    enigo.scroll(amount, enigo::Axis::Vertical).map_err(|e| e.to_string())?;

    Ok(())
}

// ============================================================================
// KEYBOARD ACTIONS
// ============================================================================

/// Type text with optional delay between characters
#[command]
pub fn execute_type(text: String, delay: u32) -> Result<(), String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;

    if delay > 0 {
        // Type character by character with delay
        for c in text.chars() {
            enigo.text(&c.to_string()).map_err(|e| e.to_string())?;
            thread::sleep(Duration::from_millis(delay as u64));
        }
    } else {
        // Type all at once
        enigo.text(&text).map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Execute a hotkey combination
#[command]
pub fn execute_hotkey(keys: Vec<String>, interval: f32) -> Result<(), String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;

    let interval_duration = Duration::from_secs_f32(interval.max(0.05));

    // Press all keys
    for key_str in &keys {
        let key = parse_key(key_str)?;
        enigo.key(key, enigo::Direction::Press).map_err(|e| e.to_string())?;
        thread::sleep(interval_duration);
    }

    // Release all keys in reverse order
    for key_str in keys.iter().rev() {
        let key = parse_key(key_str)?;
        enigo.key(key, enigo::Direction::Release).map_err(|e| e.to_string())?;
        thread::sleep(interval_duration);
    }

    Ok(())
}

/// Parse a key string to enigo Key
fn parse_key(key_str: &str) -> Result<enigo::Key, String> {
    match key_str.to_lowercase().as_str() {
        // Modifiers
        "cmd" | "command" | "meta" | "super" => Ok(enigo::Key::Meta),
        "ctrl" | "control" => Ok(enigo::Key::Control),
        "alt" | "option" => Ok(enigo::Key::Alt),
        "shift" => Ok(enigo::Key::Shift),

        // Special keys
        "enter" | "return" => Ok(enigo::Key::Return),
        "tab" => Ok(enigo::Key::Tab),
        "space" => Ok(enigo::Key::Space),
        "backspace" => Ok(enigo::Key::Backspace),
        "delete" => Ok(enigo::Key::Delete),
        "escape" | "esc" => Ok(enigo::Key::Escape),

        // Arrow keys
        "up" => Ok(enigo::Key::UpArrow),
        "down" => Ok(enigo::Key::DownArrow),
        "left" => Ok(enigo::Key::LeftArrow),
        "right" => Ok(enigo::Key::RightArrow),

        // Navigation
        "home" => Ok(enigo::Key::Home),
        "end" => Ok(enigo::Key::End),
        "pageup" => Ok(enigo::Key::PageUp),
        "pagedown" => Ok(enigo::Key::PageDown),

        // Function keys
        "f1" => Ok(enigo::Key::F1),
        "f2" => Ok(enigo::Key::F2),
        "f3" => Ok(enigo::Key::F3),
        "f4" => Ok(enigo::Key::F4),
        "f5" => Ok(enigo::Key::F5),
        "f6" => Ok(enigo::Key::F6),
        "f7" => Ok(enigo::Key::F7),
        "f8" => Ok(enigo::Key::F8),
        "f9" => Ok(enigo::Key::F9),
        "f10" => Ok(enigo::Key::F10),
        "f11" => Ok(enigo::Key::F11),
        "f12" => Ok(enigo::Key::F12),

        // Single character
        s if s.len() == 1 => {
            let c = s.chars().next().unwrap();
            Ok(enigo::Key::Unicode(c))
        },

        _ => Err(format!("Unknown key: {}", key_str)),
    }
}

// ============================================================================
// UTILITY COMMANDS
// ============================================================================

/// Get screen dimensions
#[command]
pub fn get_screen_size() -> Result<(u32, u32), String> {
    let screens = Screen::all().map_err(|e| e.to_string())?;

    if screens.is_empty() {
        return Err("No screens found".to_string());
    }

    let screen = &screens[0];
    Ok((screen.display_info.width, screen.display_info.height))
}

/// Get current mouse position
#[command]
pub fn get_mouse_position() -> Result<(i32, i32), String> {
    let enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    Ok(enigo.location().map_err(|e| e.to_string())?)
}

/// Wait for specified duration (in seconds)
#[command]
pub fn wait_duration(seconds: f32) -> Result<(), String> {
    thread::sleep(Duration::from_secs_f32(seconds));
    Ok(())
}

// ============================================================================
// EXPORTS FOR MAIN.RS
// ============================================================================

// Add these to your main.rs invoke_handler:
//
// tauri::Builder::default()
//     .invoke_handler(tauri::generate_handler![
//         oagi::capture_screen,
//         oagi::execute_click,
//         oagi::execute_drag,
//         oagi::execute_scroll,
//         oagi::execute_type,
//         oagi::execute_hotkey,
//         oagi::get_screen_size,
//         oagi::get_mouse_position,
//         oagi::wait_duration,
//     ])
//
// And add these dependencies to Cargo.toml:
//
// [dependencies]
// enigo = "0.2"
// screenshots = "0.8"
// image = "0.24"
// base64 = "0.21"
