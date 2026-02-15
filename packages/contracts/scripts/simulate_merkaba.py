import random
# import matplotlib.pyplot as plt # Commented out as we might run this in env without display

# --- CONFIGURATION: THE "UNKNOWNS" ---
# These are the variables we are testing.
INITIAL_USERS = 1000
DAILY_CHURN_RATE = 0.01  # 1% of users get bored and leave per day
VIRAL_GROWTH_RATE = 0.015 # 1.5% new users join (Net Growth = +0.5%)
YIELD_APY = 0.05        # 5% Risk-Free Rate (Aave/Compound)

# --- THE MERKABA GEOMETRY ---
# The Ideal Ratio: 1 part Active Liquidity (Sun) to 1 part Backing (Earth)
TARGET_RATIO = 1.0
REBALANCE_STRENGTH = 0.05 # Move 5% of the excess daily (The "Valve" size)

class MerkabaEconomy:
    def __init__(self):
        self.sun_pool = 10000.0   # Active Prize Money (Hot)
        self.earth_pool = 10000.0 # Treasury Yield (Cold)
        self.users = INITIAL_USERS
        self.day = 0

        # Analytics
        self.history_sun = []
        self.history_earth = []
        self.history_users = []

    def daily_cycle(self):
        self.day += 1

        # 1. USER BEHAVIOR (The "Pulse")
        # Users enter/exit
        churn = int(self.users * DAILY_CHURN_RATE)
        growth = int(self.users * VIRAL_GROWTH_RATE)
        self.users = self.users - churn + growth

        # Bidding Volume (Average user spends $1/day)
        daily_volume = self.users * 1.0

        # 2. REVENUE SPLIT (The "Injection")
        # 50% to Seller, 40% to SUN (Prizes), 10% to EARTH (Savings)
        to_sun = daily_volume * 0.40
        to_earth = daily_volume * 0.10

        self.sun_pool += to_sun
        self.earth_pool += to_earth

        # 3. PAYOUTS (The "Drain")
        # The Sun Pool pays out winners.
        # Assumption: 90% of the Sun Pool is won daily (High Velocity)
        payouts = self.sun_pool * 0.90
        self.sun_pool -= payouts

        # 4. YIELD GENERATION (The "Gravity")
        # The Earth Pool earns interest (Daily rate of 5% APY)
        daily_yield = self.earth_pool * (YIELD_APY / 365)
        self.earth_pool += daily_yield

        # 5. THE GYROSCOPE (The Self-Correction)
        self.rebalance()

        # Record Stats
        self.history_sun.append(self.sun_pool)
        self.history_earth.append(self.earth_pool)
        self.history_users.append(self.users)

    def rebalance(self):
        """The Merkaba Logic: Keep Sun and Earth in equilibrium."""
        if self.earth_pool == 0: return

        current_ratio = self.sun_pool / self.earth_pool

        if current_ratio > TARGET_RATIO:
            # SUN IS TOO HOT (Too much cash in prizes, risky)
            # Action: Siphon excess to Earth (Save it)
            excess = self.sun_pool - self.earth_pool
            move_amount = excess * REBALANCE_STRENGTH
            self.sun_pool -= move_amount
            self.earth_pool += move_amount

        elif current_ratio < TARGET_RATIO:
            # EARTH IS TOO HEAVY (Treasury is huge, but prizes are boring)
            # Action: Pump Yield into Sun (Boost Prizes)
            shortage = self.earth_pool - self.sun_pool
            move_amount = shortage * REBALANCE_STRENGTH
            self.earth_pool -= move_amount
            self.sun_pool += move_amount

# --- RUN SIMULATION ---
sim = MerkabaEconomy()
DAYS = 1095 # 3 Years

for _ in range(DAYS):
    sim.daily_cycle()

# --- REPORT ---
print(f"--- SIMULATION RESULTS (Day {DAYS}) ---")
print(f"Final Users: {sim.users}")
print(f"Sun Pool (Daily Prizes): ${sim.sun_pool:,.2f}")
print(f"Earth Pool (Treasury):   ${sim.earth_pool:,.2f}")
print(f"Ratio: {sim.sun_pool / sim.earth_pool:.2f} (Target: 1.0)")
