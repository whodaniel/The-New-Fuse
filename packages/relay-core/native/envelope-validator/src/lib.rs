use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::ffi::CStr;
use std::os::raw::c_char;

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
#[serde(rename_all = "camelCase")]
pub struct AgentIdentity {
    pub agent_id: String,
    pub canonical_entity_id: Option<String>,
    pub operational_handle: Option<String>,
    pub runtime_session_id: Option<String>,
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
#[serde(rename_all = "camelCase")]
pub struct MessageContext {
    pub workflow_id: Option<String>,
    pub step_id: Option<String>,
    pub session_id: Option<String>,
    pub channel_id: Option<String>,
    pub sequence_id: Option<u64>,
    pub parent_message_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TNFEnvelope {
    pub id: Uuid,
    pub version: String,
    pub trace_id: String,
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
pub extern "C" fn validate_envelope_json(json_ptr: *const c_char) -> bool {
    if json_ptr.is_null() {
        return false;
    }
    
    let c_str = unsafe { CStr::from_ptr(json_ptr) };
    let json_str = match c_str.to_str() {
        Ok(s) => s,
        Err(_) => return false,
    };
    
    let result: Result<TNFEnvelope, _> = serde_json::from_str(json_str);
    result.is_ok()
}
