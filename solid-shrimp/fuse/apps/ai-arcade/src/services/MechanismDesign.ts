export interface MechanismInputs {
  startPrice: number;
  reserveTarget: number;
  numRungs: number;
  biddersPerRung: number;
  feePerBid: number;
  priceDropPerRung: number;
  sidepotShare: number; // 0..1
  immediatePotShare: number; // 0..1 of sidepot for fast draws
}

export interface MechanismOutputs {
  finalPrice: number;
  totalFees: number;
  sellerProceeds: number;
  sidepotFunding: number;
  immediatePotFunding: number;
  longPotFunding: number;
  sellerSolvent: boolean;
  bidderImmediateEv: number;
}

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function evaluateMechanism(input: MechanismInputs): MechanismOutputs {
  const sidepotShare = clamp01(input.sidepotShare);
  const immediatePotShare = clamp01(input.immediatePotShare);

  const totalDrop = input.numRungs * input.priceDropPerRung;
  const finalPrice = Math.max(0, input.startPrice - totalDrop);
  const totalBids = input.numRungs * input.biddersPerRung;
  const totalFees = totalBids * input.feePerBid;

  const sidepotFunding = totalFees * sidepotShare;
  const immediatePotFunding = sidepotFunding * immediatePotShare;
  const longPotFunding = sidepotFunding - immediatePotFunding;

  const sellerProceeds = finalPrice + totalFees * (1 - sidepotShare);
  const sellerSolvent = sellerProceeds >= input.reserveTarget;

  // One fast draw per rung, one winner among rung bidders.
  const immediatePotPerRung = input.numRungs > 0 ? immediatePotFunding / input.numRungs : 0;
  const winProb = input.biddersPerRung > 0 ? 1 / input.biddersPerRung : 0;
  const bidderImmediateEv = winProb * immediatePotPerRung - input.feePerBid;

  return {
    finalPrice,
    totalFees,
    sellerProceeds,
    sidepotFunding,
    immediatePotFunding,
    longPotFunding,
    sellerSolvent,
    bidderImmediateEv,
  };
}

export interface CompatibilityRow {
  feature: string;
  verdict: 'Native' | 'Wrapper Layer' | 'Separate Protocol';
  note: string;
}

export const poolTogetherCompatibility: CompatibilityRow[] = [
  {
    feature: 'Primary descending-price item auction',
    verdict: 'Separate Protocol',
    note: 'V5 auctions are for liquidation/draw ops, not item sales.',
  },
  {
    feature: 'Fee-funded sidepots',
    verdict: 'Wrapper Layer',
    note: 'Implement in app/game contracts, optionally contribute reserve to V5.',
  },
  {
    feature: 'Adaptive tiered prize distribution',
    verdict: 'Native',
    note: 'V5 supports adaptive tiers and canary behavior.',
  },
  {
    feature: 'Persistent carry-forward tickets across unrelated draws',
    verdict: 'Separate Protocol',
    note: 'Not core V5 behavior; requires external ticket accounting.',
  },
  {
    feature: 'Custom on-win routing (NFTs, rewards, compounding)',
    verdict: 'Wrapper Layer',
    note: 'Use prize hooks and custom vault paths with gas constraints.',
  },
  {
    feature: 'Weighted-loss odds mechanics',
    verdict: 'Separate Protocol',
    note: 'Conflicts with TWAB winner logic in native V5.',
  },
];
