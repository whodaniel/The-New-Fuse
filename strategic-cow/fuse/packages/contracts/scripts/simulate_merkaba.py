import random

# --- CONFIGURATION ---
INITIAL_USERS = 1000
DAILY_CHURN_RATE = 0.01   # 1% leave
VIRAL_GROWTH_RATE = 0.015 # 1.5% enter (Net: +0.5%/day)
YIELD_APY = 0.05          # 5% APY from Aave/Compound

# Merkaba Geometry
TARGET_RATIO = 1.0
REBALANCE_STRENGTH = 0.05 # Move 5% of excess per pulse

# Revenue Splits (Matching AuctionEngine.sol)
BID_FEE = 1.00
TO_TREASURY_PCT = 0.40  # 40% -> Merkaba (then 80% Sun / 20% Earth per MerkabaCore)
TO_GENESIS_PCT = 0.10   # 10% -> Genesis Nodes
TO_HOUSE_PCT = 0.50     # 50% -> Revenue/Burn

# MerkabaCore.sol internal split
INJECT_TO_SUN_PCT = 0.80  # 80% of injection goes to Sun
INJECT_TO_EARTH_PCT = 0.20 # 20% of injection goes to Earth

# Prize payout velocity
DAILY_PAYOUT_RATE = 0.70  # 70% of Sun paid as prizes (reduced from 90%)


class MerkabaEconomy:
    def __init__(self):
        self.sun_pool = 10000.0
        self.earth_pool = 10000.0
        self.users = INITIAL_USERS
        self.day = 0
        self.total_volume = 0.0
        self.total_payouts = 0.0
        self.total_yield = 0.0
        self.genesis_earned = 0.0
        self.rebalance_events = 0

        self.history_sun = []
        self.history_earth = []
        self.history_users = []
        self.history_ratio = []

    def daily_cycle(self):
        self.day += 1

        # 1. User dynamics
        churn = int(self.users * DAILY_CHURN_RATE)
        growth = int(self.users * VIRAL_GROWTH_RATE)
        self.users = max(10, self.users - churn + growth)

        # 2. Bidding
        avg_bids_per_user = max(0.5, 1.0 + random.gauss(0, 0.3))
        daily_bids = int(self.users * avg_bids_per_user)
        daily_volume = daily_bids * BID_FEE
        self.total_volume += daily_volume

        # 3. Revenue split (per AuctionEngine.sol)
        to_treasury = daily_volume * TO_TREASURY_PCT
        to_genesis = daily_volume * TO_GENESIS_PCT
        self.genesis_earned += to_genesis

        # MerkabaCore split
        to_sun = to_treasury * INJECT_TO_SUN_PCT
        to_earth = to_treasury * INJECT_TO_EARTH_PCT

        self.sun_pool += to_sun
        self.earth_pool += to_earth

        # 4. Prize payouts
        payouts = self.sun_pool * DAILY_PAYOUT_RATE
        self.sun_pool -= payouts
        self.total_payouts += payouts

        # 5. Earth yield
        daily_yield = self.earth_pool * (YIELD_APY / 365)
        self.earth_pool += daily_yield
        self.total_yield += daily_yield

        # 6. Gyroscope rebalance
        self._rebalance()

        # Record
        ratio = self.sun_pool / self.earth_pool if self.earth_pool > 0 else 0
        self.history_sun.append(self.sun_pool)
        self.history_earth.append(self.earth_pool)
        self.history_users.append(self.users)
        self.history_ratio.append(ratio)

    def _rebalance(self):
        if self.earth_pool == 0:
            return
        current_ratio = self.sun_pool / self.earth_pool

        if current_ratio > TARGET_RATIO * 1.05:
            excess = self.sun_pool - self.earth_pool
            move = excess * REBALANCE_STRENGTH
            self.sun_pool -= move
            self.earth_pool += move
            self.rebalance_events += 1
        elif current_ratio < TARGET_RATIO * 0.95:
            shortage = self.earth_pool - self.sun_pool
            move = shortage * REBALANCE_STRENGTH
            self.earth_pool -= move
            self.sun_pool += move
            self.rebalance_events += 1


# --- RUN ---
sim = MerkabaEconomy()
DAYS = 1095  # 3 years

for _ in range(DAYS):
    sim.daily_cycle()

# --- REPORT ---
print("=" * 60)
print("  MERKABA PROTOCOL SIMULATION — 3 Year Projection")
print("  (Matching AuctionEngine.sol + MerkabaCore.sol Splits)")
print("=" * 60)
print()
print(f"  Final Users:          {sim.users:,}")
print(f"  Sun Pool (Prizes):    ${sim.sun_pool:,.2f}")
print(f"  Earth Pool (Treasury):${sim.earth_pool:,.2f}")
print(f"  Total System TVL:     ${sim.sun_pool + sim.earth_pool:,.2f}")
print()

ratio = sim.sun_pool / sim.earth_pool if sim.earth_pool > 0 else 0
print(f"  Sun/Earth Ratio:      {ratio:.4f} (Target: 1.00)")
status = "✅ STABLE" if 0.8 <= ratio <= 1.2 else "⚠️  DRIFTED"
print(f"  Gyroscope Status:     {status}")
print(f"  Rebalance Events:     {sim.rebalance_events:,}")
print()
print(f"  Total Volume:         ${sim.total_volume:,.2f}")
print(f"  Total Payouts:        ${sim.total_payouts:,.2f}")
print(f"  Total Yield Earned:   ${sim.total_yield:,.2f}")
print(f"  Genesis Node Earned:  ${sim.genesis_earned:,.2f}")
print()

# Solvency check
if sim.sun_pool > 0 and sim.earth_pool > 0.5 * sim.sun_pool:
    print("  🟢 SOLVENCY CHECK: PASS — Always-backed prizes")
else:
    print("  🔴 SOLVENCY CHECK: FAIL — Adjust parameters")

# Sample milestones
for milestone_day in [30, 90, 365, 730, 1095]:
    idx = min(milestone_day - 1, len(sim.history_sun) - 1)
    print(f"  Day {milestone_day:4d}: Sun=${sim.history_sun[idx]:>12,.2f}  Earth=${sim.history_earth[idx]:>12,.2f}  Users={sim.history_users[idx]:>8,}  Ratio={sim.history_ratio[idx]:.3f}")
print()
print("=" * 60)
