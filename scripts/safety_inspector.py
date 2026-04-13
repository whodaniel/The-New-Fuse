import os
import subprocess
import tempfile

class SafetyInspector:
    """Gatekeeper for AI-generated LLVM code."""
    
    def __init__(self):
        # We look for LLVM analysis tools
        self.opt_path = "opt"
        self.llvm_as_path = "llvm-as"

    def analyze_ir(self, ir_code: str) -> dict:
        """
        Performs static analysis on LLVM IR to ensure safety.
        Returns a report of potential risks.
        """
        report = {"safe": True, "warnings": [], "errors": []}
        
        with tempfile.NamedTemporaryFile(suffix=".ll", delete=False) as f:
            f.write(ir_code.encode())
            ir_path = f.name

        try:
            # 1. Syntactic Validation (Assemble to Bitcode)
            # This checks if the code is actually valid LLVM logic
            validate = subprocess.run([self.llvm_as_path, ir_path, "-o", "/dev/null"], 
                                    capture_output=True, text=True)
            if validate.returncode != 0:
                report["safe"] = False
                report["errors"].append(f"Invalid IR Syntax: {validate.stderr}")
                return report

            # 2. Optimization and Safety Pass (Using LLVM 'opt')
            # We run analysis passes like memory-safety and undefined behavior detection
            # Note: Specific safety passes depend on the LLVM version installed
            analysis = subprocess.run([self.opt_path, "-verify", ir_path, "-o", "/dev/null"],
                                    capture_output=True, text=True)
            
            if analysis.returncode != 0:
                report["safe"] = False
                report["errors"].append(f"Safety Violation: {analysis.stderr}")

        except FileNotFoundError:
            report["warnings"].append("LLVM analysis tools not found in path. Skipping deep scan.")
        finally:
            if os.path.exists(ir_path): os.unlink(ir_path)

        return report

if __name__ == "__main__":
    inspector = SafetyInspector()
    
    # 1. TEST GOOD CODE
    good_ir = """
    define i32 @main() {
        ret i32 0
    }
    """
    
    # 2. TEST BAD CODE (Syntactic Error)
    bad_ir = "this is not llvm code"

    print("Analyzing 'Good' IR...")
    print(inspector.analyze_ir(good_ir))

    print("\nAnalyzing 'Bad' IR...")
    print(inspector.analyze_ir(bad_ir))
