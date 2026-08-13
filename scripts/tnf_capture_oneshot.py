import argparse
import sys
import os
import io

# Add parent dir to path for imports if needed
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from tnf_remote_relay import capture_screen_jpeg

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', required=True)
    parser.add_argument('--quality', type=int, default=80)
    args = parser.parse_args()
    
    jpeg = capture_screen_jpeg(quality=args.quality)
    if jpeg:
        with open(args.output, 'wb') as f:
            f.write(jpeg)
        print(f"Captured to {args.output}")
    else:
        print("Capture failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
