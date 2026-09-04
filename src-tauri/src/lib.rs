use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct DeviceTelemetry {
    pub platform: String,
    pub timestamp: u64,
    pub mesh_ready: bool,
}

#[tauri::command]
fn get_device_telemetry() -> DeviceTelemetry {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    DeviceTelemetry {
        platform: std::env::consts::OS.to_string(),
        timestamp: now,
        mesh_ready: true,
    }
}

#[tauri::command]
fn ping_mesh_service() -> String {
    "PONG_SANIDYA_MESH_READY".to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[allow(unused_mut)]
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            get_device_telemetry,
            ping_mesh_service
        ]);

    #[cfg(mobile)]
    {
        builder = builder.plugin(tauri_plugin_barcode_scanner::init());
    }

    builder
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
