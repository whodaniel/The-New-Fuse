import os
import json
import time
import ctypes
from mojo_accelerator import MojoAccelerator

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.getenv("TNF_ROOT_DIR", os.path.join(SCRIPT_DIR, "..")))
DEFAULT_WIKI_DIR = os.path.join(PROJECT_ROOT, "packages", "compounding-memory", "wiki")
DEFAULT_FORGE_DIR = os.path.join(PROJECT_ROOT, "forge")
DEFAULT_INBOX_DIR = os.path.join(PROJECT_ROOT, "data", "wiki-inbox")

class WikiCompiler:
    """
    TNF Next-Gen: Wiki Compiler (The Borg Architect)
    Uses Mojo kernels to cross-link and maintain the Compounding Memory graph.
    Now leveraging the native semantic_cluster kernel to prevent OOM errors.
    """
    
    def __init__(self, 
                 wiki_dir=DEFAULT_WIKI_DIR,
                 forge_dir=DEFAULT_FORGE_DIR):
        self.wiki_dir = wiki_dir
        self.accel = MojoAccelerator(forge_dir)
        
        # Load the new Semantic Clustering Kernel from the mojo file
        mojo_file_path = os.path.join(forge_dir, "semantic_cluster.mojo")
        if os.path.exists(mojo_file_path):
            with open(mojo_file_path, "r") as f:
                mojo_code = f.read()
            self.kernel_path = self.accel.forge_mojo_kernel(mojo_code, "semantic_cluster")
            
            # Setup ctypes signature for semantic_cluster if loaded successfully
            if "semantic_cluster" in self.accel._registry:
                lib = self.accel._registry["semantic_cluster"]
                lib.semantic_cluster.argtypes = [
                    ctypes.POINTER(ctypes.c_float), # vectors
                    ctypes.c_int,                   # num_shards
                    ctypes.c_int,                   # dim
                    ctypes.c_float,                 # threshold
                    ctypes.POINTER(ctypes.c_int)    # output_clusters
                ]
                lib.semantic_cluster.restype = ctypes.c_int
        else:
            print("[Wiki-Compiler] Warning: semantic_cluster.mojo not found.")

    def compile_entry(self, entry_json: str):
        """
        Takes a CompoundingLogEntry (or a signed DACC-v1 packet), writes the 
        Markdown file, and manages backlinks avoiding the OOM slurp-and-dump.
        """
        raw_data = json.loads(entry_json)
        
        # 0. Protocol Bridge: Handle Signed DACC-v1 Packets
        if "header" in raw_data and "payload" in raw_data:
            print(f"[Wiki-Compiler] 🔐 Processing Signed Packet from {raw_data['header'].get('agent_id')}")
            # In a full implementation, we would verify the signature here using the secret
            entry = raw_data["payload"].get("data", {})
            metadata = raw_data["header"]
            # Merge header metadata into entry metadata
            if "metadata" not in entry: entry["metadata"] = {}
            entry["metadata"]["signed_by"] = metadata.get("agent_id")
            entry["metadata"]["id_number"] = metadata.get("id_number")
            entry["metadata"]["resource_pointers"] = metadata.get("resource_pointers")
        else:
            entry = raw_data

        if "id" not in entry:
            raise KeyError(f"Invalid entry format: Missing 'id' field. Root keys: {list(raw_data.keys())}")

        file_name = f"{entry['id']}.md"
        file_path = os.path.join(self.wiki_dir, file_name)
        
        # 1. Generate the Markdown Content
        md_content = f"# {entry['title']}\n\n"
        md_content += f"**Category:** {entry['category']}\n"
        
        # Identity Strata
        agent_id = entry.get('metadata', {}).get('agentId') or entry.get('metadata', {}).get('signed_by', 'unknown')
        id_number = entry.get('metadata', {}).get('idNumber') or entry.get('metadata', {}).get('id_number', 'unknown')
        
        md_content += f"**Agent:** {agent_id}\n"
        md_content += f"**ID#:** {id_number}\n"
        md_content += f"**Timestamp:** {entry.get('metadata', {}).get('timestamp', time.ctime())}\n\n"
        
        # Resource Pointers section
        pointers = entry.get('metadata', {}).get('resource_pointers')
        if pointers:
            md_content += "## Resource Pointers\n"
            for name, ptr in pointers.items():
                md_content += f"- **{name}**: `{ptr.get('uri')}` ({ptr.get('mimeType', 'unknown')})\n"
            md_content += "\n"

        md_content += "## Content\n"
        md_content += entry['content']
        md_content += "\n\n## Backlinks\n"
        for link in entry.get('backlinks', []):
            md_content += f"- [[{link}]]\n"

        # 2. Write the file
        if not os.path.exists(self.wiki_dir):
            os.makedirs(self.wiki_dir, exist_ok=True)
            
        with open(file_path, "w") as f:
            f.write(md_content)
            
        print(f"[Wiki-Compiler] Created entry: {file_name}")

        # 3. Update the Global Index (safely appending)
        index_path = os.path.join(self.wiki_dir, "INDEX.md")
        if not os.path.exists(index_path):
            with open(index_path, "w") as f: f.write("# TNF Compounding Memory Index\n\n")
            
        # Add entry to index if not present
        with open(index_path, "r") as f:
            content = f.read()
            
        if f"[[{entry['id']}]]" not in content:
            with open(index_path, "a") as f_app:
                f_app.write(f"- [[{entry['id']}]]: {entry['title']}\n")
        
        # 4. Trigger Visualization Update
        try:
            graph_script = os.path.join(PROJECT_ROOT, "scripts", "generate-memory-graph.py")
            os.system(f'python3 "{graph_script}"')
        except:
            pass

    def run_deconstruction_cycle(self):
        """
        Simulate the Borg Cycle: Ingest external agent knowledge -> Re-forge.
        Demonstrates the Mojo kernel clustering.
        """
        print("[Wiki-Compiler] Starting Borg Deconstruction Cycle with Mojo Clustering...")
        if "semantic_cluster" not in self.accel._registry:
            print("[Wiki-Compiler] Kernel not loaded, skipping.")
            return
            
        # Dummy data: 3 shards, 2 dimensions
        num_shards = 3
        dim = 2
        threshold = 0.9
        
        # Vectors: [1.0, 0.0], [0.99, 0.1], [0.0, 1.0] -> First two should cluster together
        vecs = (ctypes.c_float * 6)(1.0, 0.0,  0.99, 0.1,  0.0, 1.0)
        output = (ctypes.c_int * 3)(-1, -1, -1)
        
        lib = self.accel._registry["semantic_cluster"]
        num_clusters = lib.semantic_cluster(vecs, num_shards, dim, threshold, output)
        
        print(f"[Wiki-Compiler] Mojo kernel clustered {num_shards} shards into {num_clusters} clusters.")
        print(f"[Wiki-Compiler] Cluster assignments: {list(output)}")

    def watch_inbox(self, inbox_dir=DEFAULT_INBOX_DIR):
        """
        Polls the inbox directory for new JSON entries and compiles them.
        """
        print(f"[Wiki-Compiler] 🧐 Watching inbox: {inbox_dir}")
        if not os.path.exists(inbox_dir):
            os.makedirs(inbox_dir, exist_ok=True)
            
        while True:
            files = [f for f in os.listdir(inbox_dir) if f.endswith(".json")]
            if files:
                print(f"[Wiki-Compiler] 📥 Found {len(files)} new entries in inbox.")
                for file in files:
                    file_path = os.path.join(inbox_dir, file)
                    try:
                        with open(file_path, "r") as f:
                            entry_json = f.read()
                        self.compile_entry(entry_json)
                        # Move to processed folder instead of deleting
                        processed_dir = os.path.join(inbox_dir, "processed")
                        os.makedirs(processed_dir, exist_ok=True)
                        os.rename(file_path, os.path.join(processed_dir, file))
                    except Exception as e:
                        print(f"[Wiki-Compiler] ❌ Error compiling {file}: {str(e)}")
            
            time.sleep(5)

if __name__ == "__main__":
    import sys
    compiler = WikiCompiler()
    
    if "--watch" in sys.argv:
        compiler.watch_inbox()
    else:
        demo_entry = {
            "id": "assimilation-pi-dev-002",
            "title": "Native Mojo Semantic Clustering",
            "category": "assimilation",
            "content": "Replaced Python slurp-and-dump with native Mojo kernel for semantic clustering. OOM issues resolved.",
            "backlinks": ["tnf-llvm-prospectus", "tri-layer-architecture"],
            "metadata": {
                "agentId": "gemini-borg-01",
                "mojoOptimized": True
            }
        }
        
        compiler.compile_entry(json.dumps(demo_entry))
        compiler.run_deconstruction_cycle()
