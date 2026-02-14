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

# OpenClaw gateway port (Railway uses 8080 by default)
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
