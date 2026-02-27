const ROULETTE_RED = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

export function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function next() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

export function mulberry32(a) {
  return function rand() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seedText) {
  const seedFn = xmur3(seedText);
  return mulberry32(seedFn());
}

export function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

export function buildDeck() {
  const suits = ["♠", "♥", "♦", "♣"];
  const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  const deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

export function drawCards(rng, deck, count) {
  const cards = [];
  for (let i = 0; i < count; i += 1) {
    const idx = Math.floor(rng() * deck.length);
    cards.push(deck.splice(idx, 1)[0]);
  }
  return cards;
}

export function cardToString(card) {
  return `${card.rank}${card.suit}`;
}

export function handRankName(rank) {
  const map = {
    10: "Royal Flush",
    9: "Straight Flush",
    8: "Four of a Kind",
    7: "Full House",
    6: "Flush",
    5: "Straight",
    4: "Three of a Kind",
    3: "Two Pair",
    2: "Jacks or Better",
    1: "Low Pair",
    0: "High Card",
  };
  return map[rank] || "Unknown";
}

export function evaluatePokerHand(cards) {
  const rankOrder = {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14,
  };
  const values = cards.map((c) => rankOrder[c.rank]).sort((a, b) => a - b);
  const suits = cards.map((c) => c.suit);
  const flush = suits.every((s) => s === suits[0]);

  let straight = false;
  if (new Set(values).size === 5) {
    straight = values[4] - values[0] === 4;
    if (!straight && values.join(",") === "2,3,4,5,14") straight = true;
  }

  const counts = {};
  for (const card of cards) counts[card.rank] = (counts[card.rank] || 0) + 1;
  const grouped = Object.values(counts).sort((a, b) => b - a);
  const pairRanks = Object.entries(counts)
    .filter(([, c]) => c === 2)
    .map(([r]) => r);

  if (straight && flush && values.includes(14) && values.includes(10)) return 10;
  if (straight && flush) return 9;
  if (grouped[0] === 4) return 8;
  if (grouped[0] === 3 && grouped[1] === 2) return 7;
  if (flush) return 6;
  if (straight) return 5;
  if (grouped[0] === 3) return 4;
  if (grouped[0] === 2 && grouped[1] === 2) return 3;
  if (grouped[0] === 2) {
    const highPair = pairRanks.some((r) => ["J", "Q", "K", "A"].includes(r));
    return highPair ? 2 : 1;
  }
  return 0;
}

export function pokerPayoutMultiplier(rankValue) {
  if (rankValue === 10) return 250;
  if (rankValue === 9) return 50;
  if (rankValue === 8) return 25;
  if (rankValue === 7) return 9;
  if (rankValue === 6) return 6;
  if (rankValue === 5) return 4;
  if (rankValue === 4) return 3;
  if (rankValue === 3) return 2;
  if (rankValue === 2) return 1;
  return 0;
}

export function playPokerRound(rng, bet) {
  const deck = buildDeck();
  const hand = drawCards(rng, deck, 5);
  const rankValue = evaluatePokerHand(hand);
  const payout = bet * pokerPayoutMultiplier(rankValue);
  return {
    win: payout > 0,
    payout,
    detail: {
      hand: hand.map(cardToString),
      rank: handRankName(rankValue),
    },
  };
}

function blackjackCardValue(rank) {
  if (rank === "A") return 11;
  if (["K", "Q", "J"].includes(rank)) return 10;
  return Number(rank);
}

function handTotal(cards) {
  let total = cards.reduce((sum, c) => sum + blackjackCardValue(c.rank), 0);
  let aces = cards.filter((c) => c.rank === "A").length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

export function playBlackjackRound(rng, bet) {
  const deck = buildDeck();
  const player = drawCards(rng, deck, 2);
  const dealer = drawCards(rng, deck, 2);
  while (handTotal(player) < 17) player.push(drawCards(rng, deck, 1)[0]);
  while (handTotal(dealer) < 17) dealer.push(drawCards(rng, deck, 1)[0]);

  const playerTotal = handTotal(player);
  const dealerTotal = handTotal(dealer);
  let payout = 0;
  let verdict = "Push";
  if (playerTotal > 21) {
    verdict = "Player bust";
  } else if (dealerTotal > 21 || playerTotal > dealerTotal) {
    payout = bet * 2;
    verdict = "Player win";
  } else if (playerTotal < dealerTotal) {
    verdict = "Dealer win";
  } else {
    payout = bet;
  }

  return {
    win: payout > bet,
    payout,
    detail: {
      player: player.map(cardToString),
      dealer: dealer.map(cardToString),
      playerTotal,
      dealerTotal,
      verdict,
    },
  };
}

export function playRouletteRound(rng, bet, type = "red", number = 17) {
  const landing = randomInt(rng, 0, 36);
  let won = false;
  let payout = 0;
  if (type === "straight") {
    won = landing === number;
    payout = won ? bet * 36 : 0;
  } else if (type === "red") {
    won = ROULETTE_RED.has(landing);
    payout = won ? bet * 2 : 0;
  } else if (type === "black") {
    won = landing !== 0 && !ROULETTE_RED.has(landing);
    payout = won ? bet * 2 : 0;
  } else if (type === "even") {
    won = landing !== 0 && landing % 2 === 0;
    payout = won ? bet * 2 : 0;
  } else {
    won = landing % 2 === 1;
    payout = won ? bet * 2 : 0;
  }
  return { win: won, payout, detail: { type, number, landing } };
}

function weightedPick(rng, weightedItems) {
  const total = weightedItems.reduce((sum, item) => sum + item.weight, 0);
  let roll = rng() * total;
  for (const item of weightedItems) {
    roll -= item.weight;
    if (roll <= 0) return item.value;
  }
  return weightedItems[weightedItems.length - 1].value;
}

export function playSlotsRound(rng, bet) {
  const reelSymbols = [
    { value: "7", weight: 4 },
    { value: "★", weight: 6 },
    { value: "💎", weight: 10 },
    { value: "🔔", weight: 14 },
    { value: "🍒", weight: 18 },
  ];
  const spin = [
    weightedPick(rng, reelSymbols),
    weightedPick(rng, reelSymbols),
    weightedPick(rng, reelSymbols),
  ];

  let multiplier = 0;
  if (spin[0] === spin[1] && spin[1] === spin[2]) {
    multiplier = spin[0] === "7" ? 20 : spin[0] === "★" ? 12 : spin[0] === "💎" ? 8 : 6;
  } else if (spin.filter((s) => s === "🍒").length >= 2) {
    multiplier = 3;
  } else if (new Set(spin).size === 2) {
    multiplier = 2;
  }

  return {
    win: multiplier > 0,
    payout: bet * multiplier,
    detail: { spin, multiplier },
  };
}

export async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function fairReceipt({ serverSeed, clientSeed, nonce, game, bet, options = {} }) {
  const digest = await sha256Hex(`${serverSeed}:${clientSeed}:${nonce}:${game}:${bet}:${JSON.stringify(options)}`);
  return {
    digest,
    serverSeedHash: await sha256Hex(serverSeed),
    clientSeed,
    nonce,
  };
}

export function randomSeed() {
  const alphabet = "abcdef0123456789";
  let out = "";
  for (let i = 0; i < 32; i += 1) out += pick(Math.random, alphabet.split(""));
  return out;
}
