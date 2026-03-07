import subprocess
import os

def run(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    with open("output.txt", "a") as f:
        f.write(f"Command: {cmd}\n")
        f.write(f"Stdout:\n{result.stdout}\n")
        f.write(f"Stderr:\n{result.stderr}\n")
        f.write("-" * 20 + "\n")

if __name__ == "__main__":
    if os.path.exists("output.txt"):
        os.remove("output.txt")
    run("pwd")
    run("git branch --show-current")
    run("git status")
    run("gh auth status")
    run("gh pr list")
