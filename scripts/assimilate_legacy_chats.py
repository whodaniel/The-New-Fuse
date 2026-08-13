import os
import json
import re
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.getenv("TNF_ROOT_DIR", os.path.join(SCRIPT_DIR, "..")))

# Add scripts dir to path for imports
if SCRIPT_DIR not in sys.path:
    sys.path.append(SCRIPT_DIR)
from signature_wrapper import A2ASignatureWrapper

CHATS_DIR = os.path.join(PROJECT_ROOT, "packages", "gemini-browser-skill", "data", "library_import")
WIKI_INBOX = os.path.join(PROJECT_ROOT, "data", "wiki-inbox")

def assimilate_legacy_chats():
    print(f"🦾 Starting Legacy Chat Assimilation (Scanning {CHATS_DIR})...")
    
    if not os.path.exists(CHATS_DIR):
        print("❌ Chats directory not found.")
        return

    signer = A2ASignatureWrapper('AGENT-LEGACY-ASSIMILATOR', 'sovereign-secret')
    
    count = 0
    skipped = 0
    
    files = [f for f in os.listdir(CHATS_DIR) if f.startswith("chat_") and f.endswith(".json")]
    
    for file_name in files:
        file_path = os.path.join(CHATS_DIR, file_name)
        
        try:
            with open(file_path, "r") as f:
                chat = json.load(f)
            
            # Look for video analysis prompts
            analysis_turn = None
            for turn in chat.get("turns", []):
                text = turn.get("text", "")
                if "analyzing a YouTube video transcript" in text or "Extract and structure the following information as valid JSON" in text:
                    # Found it. Now find the model's response (usually the last turn or the turn after)
                    # For simplicity, we search for the JSON in any turn after this one
                    continue # Keep looking for the response
                
                # Check if this turn contains the JSON result
                if "{\"summary\":" in text and "\"keyPoints\":" in text:
                    analysis_turn = turn
                    break
            
            if not analysis_turn:
                skipped += 1
                continue

            # Extract JSON from model text
            # Model text often starts with 'editmore_vert'
            clean_text = analysis_turn["text"].replace("editmore_vert", "").strip()
            # Find the JSON block
            json_match = re.search(r'(\{.*\})', clean_text, re.DOTALL)
            if not json_match:
                skipped += 1
                continue
            
            analysis = json.loads(json_match.group(1))
            
            # Construct Wiki Entry
            entry_id = f"legacy-{chat['id']}"
            title = analysis.get("summary", "Legacy Analysis").split('.')[0][:50]
            
            # Find video title/id if possible from prompt
            prompt_text = chat["turns"][0]["text"]
            video_title_match = re.search(r'Analysis: (.*?)\n', prompt_text)
            if video_title_match:
                title = video_title_match.group(1)
            
            entry_data = {
                "id": entry_id,
                "title": title,
                "category": "legacy-video-analysis",
                "content": f"## Summary\n{analysis.get('summary')}\n\n## Key Points\n" + "\n".join([f"- {p}" for p in analysis.get('keyPoints', [])]) + "\n\n## AI Concepts\n" + ", ".join(analysis.get('aiConcepts', [])),
                "backlinks": analysis.get("aiConcepts", []) + ["legacy-import", "sovereign-state"]
            }

            handoff = signer.wrap("COMPOUNDING_LOG_ENTRY", entry_data)
            
            # Assign a generic ID# for legacy
            handoff['header']['id_number'] = f"ID#:LEGACY-{chat['id'][:4]}"

            # Save to Wiki Inbox
            os.makedirs(WIKI_INBOX, exist_ok=True)
            with open(os.path.join(WIKI_INBOX, f"{entry_id}.json"), "w") as f:
                json.dump(handoff, f, indent=2)
            
            count += 1
            if count % 50 == 0:
                print(f"   Assimilated {count} nodes...")

        except Exception as e:
            # print(f"   ❌ Error processing {file_name}: {str(e)}")
            skipped += 1
            
    print(f"✅ [Assimilator] Successfully rebirthed {count} legacy analyses into the Wiki.")
    print(f"ℹ️ [Assimilator] Skipped {skipped} non-analysis chats.")

if __name__ == "__main__":
    assimilate_legacy_chats()
