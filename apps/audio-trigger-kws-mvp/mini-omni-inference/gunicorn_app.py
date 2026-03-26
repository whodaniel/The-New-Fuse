import os
import sys

sys.path.append("/srv/mini-omni")

from server import OmniChatServer


def create_app():
    device = os.getenv("OMNI_DEVICE", "cpu")
    server = OmniChatServer(run_app=False, device=device)
    return server.server


app = create_app()
