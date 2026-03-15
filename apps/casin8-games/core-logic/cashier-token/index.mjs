import { assertString } from '../../shared/contracts.mjs';

function toBigInt(value, field) {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number' && Number.isInteger(value)) return BigInt(value);
  if (typeof value === 'string' && /^-?\d+$/.test(value)) return BigInt(value);
  throw new Error(`Invalid ${field}: expected bigint-like integer`);
}

function cloneForJson(v) {
  return JSON.parse(JSON.stringify(v, (_, x) => (typeof x === 'bigint' ? x.toString() : x)));
}

export class CashierTokenLedger {
  constructor() {
    this.wallets = new Map();
    this.entries = [];
    this.idempotency = new Set();
  }

  ensureWallet(playerId) {
    assertString(playerId, 'playerId');
    if (!this.wallets.has(playerId)) {
      this.wallets.set(playerId, {
        availableUnits: 0n,
        reservedUnits: 0n,
        pendingWithdrawalUnits: 0n,
      });
    }
    return this.wallets.get(playerId);
  }

  applyDeposit({ playerId, amountUnits, idempotencyKey, source = 'fiat-bridge' }) {
    assertString(idempotencyKey, 'idempotencyKey');
    assertString(source, 'source');
    if (this.idempotency.has(idempotencyKey)) {
      return { accepted: false, duplicate: true };
    }

    const amount = toBigInt(amountUnits, 'amountUnits');
    if (amount <= 0n) throw new Error('amountUnits must be > 0');

    const wallet = this.ensureWallet(playerId);
    wallet.availableUnits += amount;

    this.idempotency.add(idempotencyKey);
    this.entries.push({
      type: 'deposit',
      playerId,
      amountUnits: amount,
      source,
      idempotencyKey,
      ts: new Date().toISOString(),
    });

    return { accepted: true, balance: cloneForJson(wallet) };
  }

  reserveBuyIn({ playerId, amountUnits, idempotencyKey, context = 'table-buyin' }) {
    assertString(idempotencyKey, 'idempotencyKey');
    assertString(context, 'context');
    if (this.idempotency.has(idempotencyKey)) {
      return { accepted: false, duplicate: true };
    }

    const amount = toBigInt(amountUnits, 'amountUnits');
    if (amount <= 0n) throw new Error('amountUnits must be > 0');

    const wallet = this.ensureWallet(playerId);
    if (wallet.availableUnits < amount) {
      return { accepted: false, duplicate: false, code: 'INSUFFICIENT_AVAILABLE' };
    }

    wallet.availableUnits -= amount;
    wallet.reservedUnits += amount;

    this.idempotency.add(idempotencyKey);
    this.entries.push({
      type: 'reserve',
      playerId,
      amountUnits: amount,
      context,
      idempotencyKey,
      ts: new Date().toISOString(),
    });

    return { accepted: true, balance: cloneForJson(wallet) };
  }

  settleResult({
    playerId,
    reservedUsedUnits,
    payoutUnits,
    idempotencyKey,
    context = 'hand-settlement',
  }) {
    assertString(idempotencyKey, 'idempotencyKey');
    assertString(context, 'context');
    if (this.idempotency.has(idempotencyKey)) {
      return { accepted: false, duplicate: true };
    }

    const reservedUsed = toBigInt(reservedUsedUnits, 'reservedUsedUnits');
    const payout = toBigInt(payoutUnits, 'payoutUnits');
    if (reservedUsed < 0n || payout < 0n) throw new Error('Units must be non-negative');

    const wallet = this.ensureWallet(playerId);
    if (wallet.reservedUnits < reservedUsed) {
      throw new Error('Reserved underflow');
    }

    wallet.reservedUnits -= reservedUsed;
    wallet.availableUnits += payout;

    this.idempotency.add(idempotencyKey);
    this.entries.push({
      type: 'settle',
      playerId,
      reservedUsedUnits: reservedUsed,
      payoutUnits: payout,
      context,
      idempotencyKey,
      ts: new Date().toISOString(),
    });

    return { accepted: true, balance: cloneForJson(wallet) };
  }

  requestWithdrawal({ playerId, amountUnits, idempotencyKey }) {
    assertString(idempotencyKey, 'idempotencyKey');
    if (this.idempotency.has(idempotencyKey)) {
      return { accepted: false, duplicate: true };
    }

    const amount = toBigInt(amountUnits, 'amountUnits');
    if (amount <= 0n) throw new Error('amountUnits must be > 0');

    const wallet = this.ensureWallet(playerId);
    if (wallet.availableUnits < amount) {
      return { accepted: false, duplicate: false, code: 'INSUFFICIENT_AVAILABLE' };
    }

    wallet.availableUnits -= amount;
    wallet.pendingWithdrawalUnits += amount;

    this.idempotency.add(idempotencyKey);
    this.entries.push({
      type: 'withdraw-request',
      playerId,
      amountUnits: amount,
      idempotencyKey,
      ts: new Date().toISOString(),
    });

    return { accepted: true, balance: cloneForJson(wallet) };
  }

  finalizeWithdrawal({ playerId, amountUnits, idempotencyKey, status = 'confirmed' }) {
    assertString(idempotencyKey, 'idempotencyKey');
    assertString(status, 'status');
    if (this.idempotency.has(idempotencyKey)) {
      return { accepted: false, duplicate: true };
    }

    const amount = toBigInt(amountUnits, 'amountUnits');
    if (amount <= 0n) throw new Error('amountUnits must be > 0');

    const wallet = this.ensureWallet(playerId);
    if (wallet.pendingWithdrawalUnits < amount) {
      throw new Error('Pending withdrawal underflow');
    }

    wallet.pendingWithdrawalUnits -= amount;
    if (status !== 'confirmed') {
      wallet.availableUnits += amount;
    }

    this.idempotency.add(idempotencyKey);
    this.entries.push({
      type: 'withdraw-finalize',
      playerId,
      amountUnits: amount,
      status,
      idempotencyKey,
      ts: new Date().toISOString(),
    });

    return { accepted: true, balance: cloneForJson(wallet) };
  }

  walletView(playerId) {
    return cloneForJson(this.ensureWallet(playerId));
  }

  reconcile() {
    const byPlayer = {};
    for (const [playerId, wallet] of this.wallets.entries()) {
      byPlayer[playerId] = cloneForJson(wallet);
    }

    const totals = Object.values(byPlayer).reduce(
      (acc, w) => {
        acc.availableUnits += BigInt(w.availableUnits);
        acc.reservedUnits += BigInt(w.reservedUnits);
        acc.pendingWithdrawalUnits += BigInt(w.pendingWithdrawalUnits);
        return acc;
      },
      { availableUnits: 0n, reservedUnits: 0n, pendingWithdrawalUnits: 0n }
    );

    return {
      wallets: byPlayer,
      totals: cloneForJson(totals),
      entries: this.entries.length,
    };
  }
}
