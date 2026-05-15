import os
import json
import hmac
import hashlib
import time
import secrets
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.getenv("TNF_ROOT_DIR", os.path.join(SCRIPT_DIR, "..")))
WORKSPACE_ROOT = os.path.abspath(os.getenv("TNF_WORKSPACE_DIR", os.path.join(PROJECT_ROOT, "..")))
KB_ROOT = os.path.abspath(os.getenv("TNF_KB_DIR", os.path.join(WORKSPACE_ROOT, "my-ai-knowledge-base")))

# Add scripts dir to path for imports
if SCRIPT_DIR not in sys.path:
    sys.path.append(SCRIPT_DIR)
from signature_wrapper import A2ASignatureWrapper

def sign_entry(index, entry_id, title, content, category, backlinks, transcript_path):
    signer = A2ASignatureWrapper('AGENT-VIDEO-DISTILLER', 'sovereign-secret')
    
    resource_pointers = {
        'raw-transcript': {
            'uri': f'file://{transcript_path}',
            'mimeType': 'text/plain'
        }
    }

    handoff = signer.wrap('COMPOUNDING_LOG_ENTRY', 
        data={
            'id': entry_id,
            'title': title,
            'category': category,
            'content': content,
            'backlinks': backlinks
        },
        resource_pointers=resource_pointers
    )

    alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    num = index
    id_code = ''
    while num > 0:
        id_code = alphabet[num % 58] + id_code
        num = num // 58
    handoff['header']['id_number'] = f'ID#:{id_code or alphabet[0]}'

    inbox_dir = os.path.join(PROJECT_ROOT, "data", "wiki-inbox")
    os.makedirs(inbox_dir, exist_ok=True)
    with open(os.path.join(inbox_dir, f"{entry_id}.json"), 'w') as f:
        json.dump(handoff, f, indent=2)
    print(f"✅ Distilled and signed video #{index}: {entry_id}")

if __name__ == "__main__":
    # #459
    sign_entry(
        459,
        'video-analysis-6H9S0I5X9N4', # Using a placeholder ID since I don't have the exact videoId for this transcript from the filename
        'The AI x Crypto Convergence: 2025 Trends & DeFAi',
        '''
# The AI x Crypto Convergence: 2025 Trends & DeFAi
This analysis explores the strategic intersection of artificial intelligence and blockchain technology, specifically the rise of "DeFAi" (Decentralized Finance + AI).

## Key Technical Insights
- **DeFAi Evolution**: AI is moving from an infrastructure role (compute/data) to an execution role in financial markets.
- **Agent Engines**: Deployment of natural language interfaces (Griffin, Wayfinder) that abstract away the complexity of DeFi operations (bridging, liquidity provision).
- **The Metaverse Rebirth**: AI agents are being used to populate virtual worlds (HyperFi, Arc), providing the "Interactivity Layer" that was missing in the 2021 metaverse attempts.
- **Body vs. Brain**: Differentiation between the LLM (Brain) and agentic frameworks like Eliza (Body), which provide the tools, appendages, and social connectivity for the AI.
- **Rust-Based Performance**: Emergence of Rust-based frameworks (Arc.fun) for high-performance agentic operations at scale.

## Market Observation Primitives
- **Cookie.fun**: Mind-share and mind-market-cap tracking for the agent economy.
- **Kaido**: Real-time sentiment analysis and alpha discovery via social graph processing.

## Strategic Value
The video confirms the shift towards an "Agent-First" internet where the clunky rails of crypto are finally abstracted away by intelligent, wallet-holding autonomous entities.
''',
        'ai-crypto',
        ['defai', 'agentic-metaverse', 'sovereign-state', 'eliza-framework'],
        os.path.join(KB_ROOT, "video-transcripts", "459_The_Hottest_AI_Crypto_Trends_of_2025.txt")
    )
