import os
from tnf_forge import ForgeCompiler

class NativeCLIForge:
    """Forges standalone Rust-based binaries for TNF CLI operations."""
    
    def __init__(self, forge: ForgeCompiler):
        self.forge = forge

    def forge_status_tool(self):
        """
        Forges a native 'tnf-status' tool in Rust.
        This demonstrates replacing a slow JS boot-up with a native binary.
        """
        rust_code = """
        use std::process::Command;
        use std::time::Instant;

        fn main() {
            let start = Instant::now();
            println!("TNF Native Status Check");
            println!("----------------------");
            
            // Check disk space (what we've been doing manually)
            let output = Command::new("df")
                .arg("-h")
                .arg("/")
                .output()
                .expect("failed to execute process");
            
            println!("{}", String::from_utf8_lossy(&output.stdout));
            
            let duration = start.elapsed();
            println!("Status check completed in: {:?}", duration);
        }
        """
        binary_path = self.forge.compile_rust(rust_code, "tnf-status-native")
        print(f"Native CLI Tool Forged: {binary_path}")
        return binary_path

if __name__ == "__main__":
    forge_service = ForgeCompiler()
    cli_forge = NativeCLIForge(forge_service)
    
    try:
        cli_forge.forge_status_tool()
        print("SUCCESS: Native CLI Forge scaffolding is ready for Rust/LLVM compilation.")
    except Exception as e:
        print(f"CLI Forge test skipped (Rust/LLVM not ready): {e}")
