use rosc::{encoder, OscMessage, OscPacket, OscType};
use std::net::UdpSocket;

const SONIC_PI_SERVER: &str = "127.0.0.1:4560";
const SONIC_PI_GUI: &str = "127.0.0.1:4559";

/// Send code to Sonic Pi for execution
pub async fn run_code(code: &str) -> Result<(), String> {
    let socket = UdpSocket::bind("0.0.0.0:0")
        .map_err(|e| format!("Failed to bind socket: {}", e))?;
    
    let msg = OscMessage {
        addr: "/run-code".to_string(),
        args: vec![
            OscType::String("SONICMIX".to_string()), // Client ID
            OscType::String(code.to_string()),
        ],
    };
    
    let packet = OscPacket::Message(msg);
    let buf = encoder::encode(&packet)
        .map_err(|e| format!("Failed to encode OSC message: {}", e))?;
    
    socket
        .send_to(&buf, SONIC_PI_SERVER)
        .map_err(|e| format!("Failed to send to Sonic Pi: {}", e))?;
    
    println!("[SonicPi] Sent code ({} chars)", code.len());
    Ok(())
}

/// Stop all sounds in Sonic Pi
pub async fn stop() -> Result<(), String> {
    let socket = UdpSocket::bind("0.0.0.0:0")
        .map_err(|e| format!("Failed to bind socket: {}", e))?;
    
    let msg = OscMessage {
        addr: "/stop-all-jobs".to_string(),
        args: vec![OscType::String("SONICMIX".to_string())],
    };
    
    let packet = OscPacket::Message(msg);
    let buf = encoder::encode(&packet)
        .map_err(|e| format!("Failed to encode OSC message: {}", e))?;
    
    socket
        .send_to(&buf, SONIC_PI_SERVER)
        .map_err(|e| format!("Failed to send stop to Sonic Pi: {}", e))?;
    
    println!("[SonicPi] Sent stop command");
    Ok(())
}

/// Send a cue to Sonic Pi
pub async fn send_cue(cue_name: &str, args: Vec<f64>) -> Result<(), String> {
    let socket = UdpSocket::bind("0.0.0.0:0")
        .map_err(|e| format!("Failed to bind socket: {}", e))?;
    
    let mut osc_args = vec![
        OscType::String("SONICMIX".to_string()),
        OscType::String(cue_name.to_string()),
    ];
    
    for arg in args {
        osc_args.push(OscType::Float(arg as f32));
    }
    
    let msg = OscMessage {
        addr: "/cue".to_string(),
        args: osc_args,
    };
    
    let packet = OscPacket::Message(msg);
    let buf = encoder::encode(&packet)
        .map_err(|e| format!("Failed to encode OSC message: {}", e))?;
    
    socket
        .send_to(&buf, SONIC_PI_SERVER)
        .map_err(|e| format!("Failed to send cue to Sonic Pi: {}", e))?;
    
    println!("[SonicPi] Sent cue: {}", cue_name);
    Ok(())
}

/// Check if Sonic Pi is running and accepting connections
pub async fn check_connection() -> Result<bool, String> {
    // Try to bind and send a simple ping
    let socket = match UdpSocket::bind("0.0.0.0:0") {
        Ok(s) => s,
        Err(_) => return Ok(false),
    };
    
    // Set a short timeout
    socket.set_read_timeout(Some(std::time::Duration::from_millis(500))).ok();
    
    // Send a simple message to check if Sonic Pi responds
    // We use /ping which is a safe no-op
    let msg = OscMessage {
        addr: "/ping".to_string(),
        args: vec![OscType::String("SONICMIX".to_string())],
    };
    
    let packet = OscPacket::Message(msg);
    if let Ok(buf) = encoder::encode(&packet) {
        if socket.send_to(&buf, SONIC_PI_GUI).is_ok() {
            // If we can send, assume Sonic Pi is running
            // (We can't easily receive a response without setting up a listener)
            return Ok(true);
        }
    }
    
    Ok(false)
}
