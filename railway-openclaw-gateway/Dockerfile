FROM node:22-bookworm

# Install OpenClaw globally
RUN npm i -g openclaw@2026.2.13

# Create state directories
ENV HOME=/root
RUN mkdir -p /root/.openclaw /root/.local/share/kilo

# Copy configuration
COPY openclaw.json /root/.openclaw/openclaw.json
COPY kilo-auth.json /root/.local/share/kilo/auth.json
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# OpenClaw gateway port
ENV PORT=18789
ENV OPENCLAW_GATEWAY_PORT=18789
ENV OPENCLAW_GATEWAY_BIND=0.0.0.0
ENV OPENCLAW_GATEWAY_MODE=cloud

EXPOSE 18789

ENTRYPOINT ["/entrypoint.sh"]
