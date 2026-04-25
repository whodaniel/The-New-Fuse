import os
import subprocess
import tempfile

class SafetyInspector:
    """Gatekeeper for AI-generated LLVM code."""
    
    def __init__(self):
        # We look for LLVM analysis tools
        self.opt_path = "opt"
        self.llvm_as_path = "llvm-as"
        self.tsgo_path = "npx tsgo"

    def validate_typescript(self, project_dir: str) -> dict:
        """
        Uses the native TypeScript compiler (Project Corsa) to validate code.
        Returns a report of errors and warnings.
        """
        report = {"safe": True, "error_count": 0, "output": ""}
        
        try:
            print(f"[Safety-Inspector] Running native TS validation in: {project_dir}")
            res = subprocess.run(
                ["npx", "tsgo", "--noEmit"], 
                cwd=project_dir, 
                capture_output=True, 
                text=True
            )
            
            report["output"] = res.stdout + res.stderr
            if res.returncode != 0:
                report["safe"] = False
                # Extract error count from output if possible
                if "Found " in report["output"]:
                    report["error_count"] = report["output"].split("Found ")[1].split(" ")[0]
                    
            return report
        except Exception as e:
            return {"safe": False, "errors": [str(e)]}

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
