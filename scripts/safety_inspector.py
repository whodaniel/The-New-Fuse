import os
import subprocess
import tempfile

class SafetyInspector:
    """Gatekeeper for AI-generated LLVM code."""
    
    def __init__(self):
        import shutil
        # Look for LLVM analysis tools dynamically or use Homebrew paths
        self.opt_path = shutil.which("opt") or "/opt/homebrew/opt/llvm/bin/opt"
        self.llvm_as_path = shutil.which("llvm-as") or "/opt/homebrew/opt/llvm/bin/llvm-as"
        
        # Fallback to Intel Homebrew path if Apple Silicon path doesn't exist
        if not os.path.exists(self.opt_path): self.opt_path = "/usr/local/opt/llvm/bin/opt"
        if not os.path.exists(self.llvm_as_path): self.llvm_as_path = "/usr/local/opt/llvm/bin/llvm-as"
        
        # Final fallback to standard PATH
        if not os.path.exists(self.opt_path): self.opt_path = "opt"
        if not os.path.exists(self.llvm_as_path): self.llvm_as_path = "llvm-as"

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
        report = {"safe": True, "warnings": [], "errors": [], "risk_score": 0}
        
        # 0. Pattern-based pre-scan (Fast & Reliable)
        dangerous_patterns = {
            "@system": "Direct system call potential",
            "@exec": "External execution attempt",
            "@malloc": "Unmanaged heap allocation",
            "@free": "Manual memory deallocation",
            "inlineasm": "Embedded assembly (High Risk)",
            "addrspacecast": "Pointer address space manipulation",
            "inttoptr": "Integer to pointer conversion (Arbitrary Memory Access)",
            "ptrtoint": "Pointer to integer leakage",
            "@fopen": "File system access",
            "@socket": "Network socket creation",
        }
        
        for pattern, risk in dangerous_patterns.items():
            if pattern in ir_code:
                report["warnings"].append(f"CRITICAL: {risk} detected ({pattern})")
                report["risk_score"] += 25

        with tempfile.NamedTemporaryFile(suffix=".ll", delete=False) as f:
            f.write(ir_code.encode())
            ir_path = f.name

        try:
            # 1. Syntactic Validation (Assemble to Bitcode)
            validate = subprocess.run([self.llvm_as_path, ir_path, "-o", "/dev/null"], 
                                    capture_output=True, text=True)
            if validate.returncode == 0:
                # 2. Optimization and Safety Pass (Using LLVM 'opt')
                analysis = subprocess.run([self.opt_path, "-verify", ir_path, "-o", "/dev/null"],
                                        capture_output=True, text=True)
                
                if analysis.returncode != 0:
                    report["safe"] = False
                    report["errors"].append(f"Safety Violation: {analysis.stderr}")
                    report["risk_score"] += 50
            else:
                 # Fallback: Basic check if llvm-as fails or is missing
                 if validate.returncode == 127 or "command not found" in validate.stderr:
                     # Try clang fallback
                     try:
                         clang_check = subprocess.run(["clang", "-fsyntax-only", "-x", "ir", ir_path], 
                                                    capture_output=True, text=True)
                         if clang_check.returncode != 0:
                             report["safe"] = False
                             report["errors"].append(f"IR Syntax Error (Clang): {clang_check.stderr}")
                         else:
                             report["warnings"].append("LLVM tools missing; using basic Clang syntax check.")
                     except FileNotFoundError:
                         report["warnings"].append("No verification tools found. Heuristic scan only.")
                 else:
                    report["safe"] = False
                    report["errors"].append(f"Invalid IR Syntax: {validate.stderr}")

        except Exception as e:
            report["warnings"].append(f"Analysis Exception: {str(e)}")
        finally:
            if os.path.exists(ir_path): os.unlink(ir_path)

        if report["risk_score"] >= 25:
            report["safe"] = False
            report["errors"].append(f"Risk score too high: {report['risk_score']}")

        return report

if __name__ == "__main__":
    inspector = SafetyInspector()
    
    # 1. TEST GOOD CODE
    good_ir = """
    define i32 @main() {
        ret i32 0
    }
    """
    
    # 2. TEST DANGEROUS CODE
    dangerous_ir = """
    define void @attack() {
        %1 = call i32 @system(i8* null)
        ret void
    }
    """

    print("Analyzing 'Good' IR...")
    print(inspector.analyze_ir(good_ir))

    print("\nAnalyzing 'Dangerous' IR...")
    print(inspector.analyze_ir(dangerous_ir))
