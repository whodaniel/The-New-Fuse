# Minimal OpenClaw Gateway container (prototype)
# NOTE: This is a starting point; we will tune once we confirm Cloudflare Container runtime expectations.

FROM node:20-bookworm

# Install OpenClaw
RUN npm i -g openclaw

# Create state dir
ENV HOME=/root
RUN mkdir -p /root/.openclaw

# Default ports (adjust to Container platform requirements)
EXPOSE 18789

# Start gateway
CMD ["openclaw","gateway","start"]
