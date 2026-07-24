#!/usr/bin/env node
/**
 * Compatibility shim — formerly a thin Redis pub/sub client with NO message
 * auth and NO authority gate. Callers (director-loop, swarm-context-bridge,
 * sentinel) used `publisher.publish` to put unsigned envelopes on the bus.
 *
 * This module now delegates to the full RedisAgentClient in
 * scripts/tnf-agent-cli.cjs so inbound traffic hits authenticateEnvelope +
 * gateAndDispatch, and outbound A2A-shaped publishes are signed.
 *
 * API preserved: initialize / cleanup / publisher / subscriber / onMessage(channel, handler)
 */

'use strict';

const path = require('node:path');
const messageAuth = require('./tnf-message-auth.cjs');

// Lazy-load the full client so requiring this file from tooling that only
// needs the export shape does not force Redis connection setup.
function loadFullClient() {
  // eslint-disable-next-line import/no-dynamic-require
  return require(path.join(__dirname, '..', 'tnf-agent-cli.cjs'));
}

function looksLikeA2AEnvelope(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (messageAuth.isSignedEnvelope(obj)) return false; // already signed
  return Boolean(obj.type || obj.payload || obj.from || obj.to);
}

class RedisAgentClient {
  constructor() {
    const { RedisAgentClient: FullClient } = loadFullClient();
    this._full = new FullClient();
    this._channelHandlers = new Map();
    this._publishWrapped = false;
    this._catchAllBound = false;
  }

  get publisher() {
    return this._full.publisher;
  }

  get subscriber() {
    return this._full.subscriber;
  }

  get agentInfo() {
    return this._full.agentInfo;
  }

  async initialize() {
    await this._full.initialize();

    // Bus identity required for Ed25519 / shared-secret signing.
    if (!this._full.agentInfo) {
      const name = process.env.AGENT_NAME || process.env.TNF_AGENT_NAME || 'tnf-thin-client';
      const role = process.env.AGENT_ROLE || 'worker';
      const platform = process.env.AGENT_PLATFORM || 'tnf';
      await this._full.register(name, role, platform);
    }

    this._wrapPublisherForSigning();
  }

  _wrapPublisherForSigning() {
    if (this._publishWrapped || !this._full.publisher) return;
    this._publishWrapped = true;
    const pub = this._full.publisher;
    const originalPublish = pub.publish.bind(pub);
    const full = this._full;

    pub.publish = async function signedPublish(channel, message) {
      let payload = message;
      try {
        const obj = typeof message === 'string' ? JSON.parse(message) : message;
        if (looksLikeA2AEnvelope(obj) && full.agentInfo) {
          const type = obj.type || 'event';
          const signed = full.signMessage(obj, type, channel);
          payload = JSON.stringify(signed);
        } else if (typeof message !== 'string') {
          payload = JSON.stringify(message);
        }
      } catch {
        // Non-JSON / non-envelope traffic — publish as-is (or stringify).
        if (typeof message !== 'string') {
          try {
            payload = JSON.stringify(message);
          } catch {
            payload = message;
          }
        }
      }
      return originalPublish(channel, payload);
    };
  }

  async cleanup() {
    if (typeof this._full.cleanup === 'function') {
      await this._full.cleanup();
      return;
    }
    if (this._full.publisher) await this._full.publisher.quit();
    if (this._full.subscriber) await this._full.subscriber.quit();
  }

  /**
   * Channel-scoped subscription. Messages pass through the full client's
   * handleIncomingMessage (auth + optional authority gate) before the
   * caller's handler sees a normalized message — unless the caller only
   * wanted raw channel delivery of non-handler traffic.
   *
   * For backward compatibility: if the full client has no type handlers for
   * the message, we still invoke the channel handler with the verified/
   * normalized message when auth did not reject.
   */
  onMessage(channel, handler) {
    if (!this._channelHandlers.has(channel)) {
      this._channelHandlers.set(channel, []);
      const run = async () => {
        if (!this._full.subscriber) await this.initialize();
        await this._full.subscriber.subscribe(channel);
      };
      void run();
    }

    if (!this._catchAllBound) {
      this._catchAllBound = true;
      // Full client onMessage is type-scoped; '*' receives every authenticated
      // message. We re-fanout by Redis channel for the legacy thin-client API.
      this._full.onMessage('*', (message, msgChannel) => {
        const handlers = this._channelHandlers.get(msgChannel) || [];
        for (const h of handlers) {
          try {
            h(message);
          } catch (err) {
            console.error(`[redis-agent-client shim] channel handler error: ${err.message}`);
          }
        }
      });
    }

    this._channelHandlers.get(channel).push(handler);
  }
}

module.exports = { RedisAgentClient };
