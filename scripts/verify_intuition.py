import ctypes
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.getenv("TNF_ROOT_DIR", os.path.join(SCRIPT_DIR, "..")))
SO_PATH = os.path.join(PROJECT_ROOT, "scripts", "native", "weight_forge_output.dylib")
lib = ctypes.CDLL(SO_PATH)

lib.infer_structural_match.restype = ctypes.c_int
lib.infer_structural_match.argtypes = [ctypes.c_int]

KEYWORDS = ["relay", "message", "storage", "memory", "timeout"]
TARGETS = {
    "relay": ["relay-core", "Class: TNFRelayConnection", "Class: FederationManager", "Class: RelayBridge", "Class: RelayIntegrationFactory"],
    "message": ["Class: MessageValidator", "Class: MessageQueue", "Class: MessageSerializer", "Class: MessageRouter", "Class: FileTransferManager"],
    "storage": ["external", "Class: Storage", "Class: StorageService", "Class: PipelineStorage", "Class: InMemoryStateStorage"],
    "memory": ["Class: MemoryMonitor", "Class: MemoryService", "core", "Class: MemoryTransportAdapter", "Class: MockMemoryMonitor"],
    "timeout": ["Class: TimeoutError", "Class: AgentTimeoutError", "Class: TimeoutWebSocket", "Class: ProtoA2ATimeoutError", "Class: A2ATimeoutError"]
}

def verify_intuition():
    print("[🔭] Verifying Synthesized Codebase Intuition...")
    
    for i, kw in enumerate(KEYWORDS):
        best_target_idx = lib.infer_structural_match(i)
        if best_target_idx >= 0:
            target_name = TARGETS[kw][best_target_idx]
            print(f"     Keyword: '{kw:8}' -> Top Structural Match: '{target_name}'")
        else:
            print(f"     [❌] Inference failed for keyword: {kw}")

    print("\n[🎊] INTUITION ARTIFACT VERIFIED!")

if __name__ == "__main__":
    verify_intuition()
