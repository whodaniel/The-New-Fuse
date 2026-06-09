use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize)]
pub enum MessageType {
    #[serde(rename = "command")]
    Command,
    #[serde(rename = "event")]
    Event,
    #[serde(rename = "task")]
    Task,
    #[serde(rename = "handoff")]
    Handoff,
    #[serde(rename = "handoff-ack")]
    HandoffAck,
    #[serde(rename = "state-sync")]
    StateSync,
    #[serde(rename = "query")]
    Query,
    #[serde(rename = "response")]
    Response,
    #[serde(rename = "resource-negotiate")]
    ResourceNegotiate,
    #[serde(rename = "auction")]
    Auction,
    #[serde(rename = "bid")]
    Bid,
    #[serde(rename = "award")]
    Award,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AgentIdentity {
    pub agentId: String,
    pub canonicalEntityId: Option<String>,
    pub operationalHandle: Option<String>,
    pub runtimeSessionId: Option<String>,
    pub aliases: Option<Vec<String>>,
    pub role: Option<String>,
    pub platform: Option<String>,
    pub capabilities: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Recipient {
    Identity(AgentIdentity),
    Broadcast { broadcast: bool },
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MessageContext {
    pub workflowId: Option<String>,
    pub stepId: Option<String>,
    pub sessionId: Option<String>,
    pub channelId: Option<String>,
    pub sequenceId: Option<u64>,
    pub parentMessageId: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TNFEnvelope {
    pub id: Uuid,
    pub version: String,
    pub traceId: String,
    pub timestamp: DateTime<Utc>,
    pub r#type: MessageType,
    pub from: AgentIdentity,
    pub to: Recipient,
    pub payload: HashMap<String, Value>,
    pub context: Option<MessageContext>,
    pub resource: Option<Value>,
    pub metadata: Option<HashMap<String, Value>>,
}

#[no_mangle]
pub extern "C" fn validate_envelope_json(json_ptr: *const i8) -> bool {
    if json_ptr.is_null() {
        return false;
    }
    
    let c_str = unsafe { std::ffi::CStr::from_ptr(json_ptr) };
    let json_str = match c_str.to_str() {
        Ok(s) => s,
        Err(_) => return false,
    };
    
    let result: Result<TNFEnvelope, _> = serde_json::from_str(json_str);
    result.is_ok()
}
