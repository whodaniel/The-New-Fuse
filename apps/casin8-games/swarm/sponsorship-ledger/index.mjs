import { assertBigInt, assertBps, assertString, prorate } from '../../shared/contracts.mjs';

const DEFAULTS = Object.freeze({
  platformMarkupFeeBps: 250, // 2.5% on markup revenue
  platformSettlementFeeBps: 50, // 0.5% on positive net result
});

function clone(value) {
  return JSON.parse(JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? `${v}n` : v)), (_, v) => {
    if (typeof v === 'string' && /^-?\d+n$/.test(v)) return BigInt(v.slice(0, -1));
    return v;
  });
}

export function openPosition({
  positionId,
  agentId,
  stakeForSaleBps,
  markupBps,
  maxExposureUnits,
  defaults = DEFAULTS,
}) {
  assertString(positionId, 'positionId');
  assertString(agentId, 'agentId');
  assertBps(stakeForSaleBps, 'stakeForSaleBps');
  assertIntegerBpsAtLeast(markupBps, 'markupBps', 1);
  assertBigInt(maxExposureUnits, 'maxExposureUnits', 0n);

  return {
    positionId,
    agentId,
    status: 'open',
    stakeForSaleBps,
    markupBps,
    maxExposureUnits,
    fundedPrincipalUnits: 0n,
    totalBuyCostUnits: 0n,
    totalMarkupRevenueUnits: 0n,
    defaults: {
      platformMarkupFeeBps: defaults.platformMarkupFeeBps,
      platformSettlementFeeBps: defaults.platformSettlementFeeBps,
    },
    sponsors: {},
    settlements: [],
  };
}

function assertIntegerBpsAtLeast(value, field, min) {
  if (!Number.isInteger(value) || value < min || value > 50000) {
    throw new Error(`Invalid ${field}`);
  }
}

function toBigInt(value, field) {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number' && Number.isInteger(value)) return BigInt(value);
  throw new Error(`Invalid ${field}: expected bigint`);
}

export function fundPosition(position, { sponsorId, principalUnits }) {
  assertString(sponsorId, 'sponsorId');
  const principal = toBigInt(principalUnits, 'principalUnits');
  assertBigInt(principal, 'principalUnits', 1n);

  if (position.status !== 'open') {
    throw new Error('Position is not open for funding');
  }

  const nextFunded = position.fundedPrincipalUnits + principal;
  if (position.maxExposureUnits > 0n && nextFunded > position.maxExposureUnits) {
    throw new Error('Funding exceeds max exposure');
  }

  const buyCost = (principal * BigInt(position.markupBps)) / 10000n;
  const markupRevenue = buyCost - principal;

  const sponsor = position.sponsors[sponsorId] || {
    sponsorId,
    principalUnits: 0n,
    buyCostUnits: 0n,
    markupPaidUnits: 0n,
    claimsUnits: 0n,
    claimedTotalUnits: 0n,
  };

  sponsor.principalUnits += principal;
  sponsor.buyCostUnits += buyCost;
  sponsor.markupPaidUnits += markupRevenue;

  position.sponsors[sponsorId] = sponsor;
  position.fundedPrincipalUnits = nextFunded;
  position.totalBuyCostUnits += buyCost;
  position.totalMarkupRevenueUnits += markupRevenue;

  return {
    sponsorId,
    principalUnits: principal,
    buyCostUnits: buyCost,
    markupPaidUnits: markupRevenue,
    fundedPrincipalUnits: position.fundedPrincipalUnits,
  };
}

export function closeFunding(position) {
  if (position.status !== 'open') {
    throw new Error('Position already closed');
  }
  position.status = 'funded';

  const platformMarkupFeeUnits =
    (position.totalMarkupRevenueUnits * BigInt(position.defaults.platformMarkupFeeBps)) / 10000n;
  const agentMarkupRevenueUnits = position.totalMarkupRevenueUnits - platformMarkupFeeUnits;

  return {
    positionId: position.positionId,
    status: position.status,
    fundedPrincipalUnits: position.fundedPrincipalUnits,
    totalMarkupRevenueUnits: position.totalMarkupRevenueUnits,
    platformMarkupFeeUnits,
    agentMarkupRevenueUnits,
  };
}

export function settleEvent(position, { eventId, buyInUnits, prizeUnits, rakeUnits = 0n }) {
  assertString(eventId, 'eventId');
  const buyIn = toBigInt(buyInUnits, 'buyInUnits');
  const prize = toBigInt(prizeUnits, 'prizeUnits');
  const rake = toBigInt(rakeUnits, 'rakeUnits');

  assertBigInt(buyIn, 'buyInUnits', 0n);
  assertBigInt(prize, 'prizeUnits', 0n);
  assertBigInt(rake, 'rakeUnits', 0n);

  if (position.fundedPrincipalUnits <= 0n) {
    throw new Error('No funded principal');
  }

  const netResult = prize - buyIn - rake;
  const positiveNet = netResult > 0n ? netResult : 0n;
  const platformSettlementFeeUnits =
    (positiveNet * BigInt(position.defaults.platformSettlementFeeBps)) / 10000n;
  const netAfterPlatformFee = netResult - platformSettlementFeeUnits;

  const backerNet = (netAfterPlatformFee * BigInt(position.stakeForSaleBps)) / 10000n;
  const agentNet = netAfterPlatformFee - backerNet;

  const backerBuyInShare = (buyIn * BigInt(position.stakeForSaleBps)) / 10000n;

  const sponsorPayouts = [];
  for (const sponsor of Object.values(position.sponsors)) {
    const exposureShare = prorate(backerBuyInShare, sponsor.principalUnits, position.fundedPrincipalUnits);
    const pnlShare = prorate(backerNet, sponsor.principalUnits, position.fundedPrincipalUnits);
    const payout = exposureShare + pnlShare;
    sponsor.claimsUnits += payout;

    sponsorPayouts.push({
      sponsorId: sponsor.sponsorId,
      exposureShareUnits: exposureShare,
      pnlShareUnits: pnlShare,
      payoutUnits: payout,
    });
  }

  const settlement = {
    eventId,
    buyInUnits: buyIn,
    prizeUnits: prize,
    rakeUnits: rake,
    netResultUnits: netResult,
    platformSettlementFeeUnits,
    backerNetUnits: backerNet,
    agentNetUnits: agentNet,
    totalSponsorPayoutUnits: sponsorPayouts.reduce((acc, row) => acc + row.payoutUnits, 0n),
    sponsorPayouts,
  };

  position.settlements.push(clone(settlement));
  return settlement;
}

export function claimSponsor(position, { sponsorId, amountUnits = null }) {
  assertString(sponsorId, 'sponsorId');
  const sponsor = position.sponsors[sponsorId];
  if (!sponsor) {
    throw new Error('Unknown sponsorId');
  }

  const available = sponsor.claimsUnits;
  if (available <= 0n) {
    throw new Error('No claimable units');
  }

  const requested = amountUnits == null ? available : toBigInt(amountUnits, 'amountUnits');
  if (requested <= 0n) {
    throw new Error('amountUnits must be > 0');
  }
  if (requested > available) {
    throw new Error('Claim exceeds available units');
  }

  sponsor.claimsUnits -= requested;
  sponsor.claimedTotalUnits += requested;

  return {
    sponsorId,
    claimedUnits: requested,
    remainingClaimUnits: sponsor.claimsUnits,
  };
}

export function getPositionView(position) {
  return {
    positionId: position.positionId,
    agentId: position.agentId,
    status: position.status,
    stakeForSaleBps: position.stakeForSaleBps,
    markupBps: position.markupBps,
    fundedPrincipalUnits: position.fundedPrincipalUnits,
    totalBuyCostUnits: position.totalBuyCostUnits,
    totalMarkupRevenueUnits: position.totalMarkupRevenueUnits,
    sponsorCount: Object.keys(position.sponsors).length,
    settlements: position.settlements.length,
  };
}
