FROM node:22-bookworm

RUN npm i -g openclaw@latest

ENV HOME=/root
RUN mkdir -p /root/.openclaw

COPY openclaw.json /root/.openclaw/openclaw.json

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["openclaw", "gateway", "run", "--port", "8080", "--bind", "0.0.0.0", "--allow-unconfigured"]
