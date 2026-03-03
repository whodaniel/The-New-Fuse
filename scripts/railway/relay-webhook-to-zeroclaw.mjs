#!/usr/bin/env node
import http from "node:http";
import { URL } from "node:url";

const port = Number(process.env.PORT || 8788);
const primaryBase = process.env.ZEROCLAW_PRIMARY_URL || "";
const secondaryBase = process.env.ZEROCLAW_SECONDARY_URL || "";
const sharedSecret = process.env.TNF_WEBHOOK_SECRET || "";

if (!primaryBase || !secondaryBase) {
  console.error("Missing ZEROCLAW_PRIMARY_URL or ZEROCLAW_SECONDARY_URL");
  process.exit(2);
}

function normalizeBase(base) {
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

async function callApiChat(base, payload) {
  const url = new URL("/api/chat", normalizeBase(base)).toString();
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // keep raw text for diagnostics
  }
  return { ok: res.ok, status: res.status, text, json };
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const body = Buffer.concat(chunks).toString("utf8");
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/webhook") {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "not_found" }));
    return;
  }

  if (sharedSecret) {
    const got = req.headers["x-tnf-webhook-secret"];
    if (got !== sharedSecret) {
      res.writeHead(401, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "unauthorized" }));
      return;
    }
  }

  let payload;
  try {
    payload = await readJson(req);
  } catch {
    res.writeHead(400, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "invalid_json" }));
    return;
  }

  if (!payload.message || typeof payload.message !== "string") {
    res.writeHead(400, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "message_required" }));
    return;
  }

  const primary = await callApiChat(primaryBase, payload);
  if (primary.ok) {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        routed_to: "primary",
        status: primary.status,
        response: primary.json || primary.text,
      }),
    );
    return;
  }

  const secondary = await callApiChat(secondaryBase, payload);
  if (secondary.ok) {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        routed_to: "secondary",
        primary_error: { status: primary.status, body: primary.text.slice(0, 800) },
        status: secondary.status,
        response: secondary.json || secondary.text,
      }),
    );
    return;
  }

  res.writeHead(502, { "content-type": "application/json" });
  res.end(
    JSON.stringify({
      error: "all_backends_failed",
      primary: { status: primary.status, body: primary.text.slice(0, 800) },
      secondary: { status: secondary.status, body: secondary.text.slice(0, 800) },
    }),
  );
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Webhook relay listening on :${port}`);
  console.log(`Primary:   ${primaryBase}`);
  console.log(`Secondary: ${secondaryBase}`);
});
