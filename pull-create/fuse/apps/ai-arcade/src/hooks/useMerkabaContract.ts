import { ethers } from 'ethers';
import { useCallback, useEffect, useRef, useState } from 'react';
import { contractConfig } from '../config/contracts';

// ---------- Types ----------
export interface MerkabaOnChainState {
  // Merkaba Core
  sunBalance: bigint;
  earthBalance: bigint;
  targetRatio: bigint;
  rebalanceStrength: bigint;

  // Auction Engine
  auctionCount: number;

  // Sidepot Manager
  potCount: number;

  // Token
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;

  // User-specific (only when connected)
  userTokenBalance: bigint;
  userVolume: bigint;
}

export interface MerkabaContractHook {
  provider: ethers.BrowserProvider | ethers.JsonRpcProvider | null;
  contracts: {
    token?: ethers.Contract;
    merkaba?: ethers.Contract;
    genesis?: ethers.Contract;
    engine?: ethers.Contract;
    sidepotManager?: ethers.Contract;
    prizeHookRouter?: ethers.Contract;
  };
  account: string | null;
  chainState: MerkabaOnChainState | null;
  isLoading: boolean;
  isLive: boolean; // true when reading from on-chain, false when simulated
  error: string | null;
  connect: () => Promise<void>;
  refreshState: () => Promise<void>;
}

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';
const isValidAddress = (addr: string) => addr && addr !== ZERO_ADDR;

// Helper to format bigint token amounts to numbers for display
export function formatTokenAmount(amount: bigint, decimals: number = 18): number {
  return Number(ethers.formatUnits(amount, decimals));
}

// ---------- Hook ----------
export const useMerkabaContract = (): MerkabaContractHook => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | ethers.JsonRpcProvider | null>(
    null
  );
  const [contracts, setContracts] = useState<MerkabaContractHook['contracts']>({});
  const [account, setAccount] = useState<string | null>(null);
  const [chainState, setChainState] = useState<MerkabaOnChainState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Initialize provider + contracts ---
  useEffect(() => {
    const init = async () => {
      try {
        // Determine provider: prefer MetaMask, fall back to read-only JSON-RPC
        let ethProvider: ethers.BrowserProvider | ethers.JsonRpcProvider;
        let signer: ethers.Signer | null = null;

        if (window.ethereum) {
          ethProvider = new ethers.BrowserProvider(window.ethereum);
          // Don't auto-request accounts; wait for explicit connect()
          try {
            const accounts = await ethProvider.listAccounts();
            if (accounts.length > 0) {
              signer = accounts[0];
              setAccount(await signer.getAddress());
            }
          } catch {
            // No accounts yet — read-only mode
          }
        } else if (contractConfig.rpcUrl) {
          // Read-only provider against configured RPC
          ethProvider = new ethers.JsonRpcProvider(contractConfig.rpcUrl);
        } else {
          setIsLoading(false);
          return;
        }

        setProvider(ethProvider);

        // Only initialize contracts if we have valid addresses
        const addr = contractConfig.address;
        const runner = signer || ethProvider;

        const contractSet: MerkabaContractHook['contracts'] = {};

        if (isValidAddress(addr.token)) {
          contractSet.token = new ethers.Contract(addr.token, contractConfig.abi.ERC20, runner);
        }
        if (isValidAddress(addr.merkaba)) {
          contractSet.merkaba = new ethers.Contract(
            addr.merkaba,
            contractConfig.abi.MerkabaCore,
            runner
          );
        }
        if (isValidAddress(addr.genesis)) {
          contractSet.genesis = new ethers.Contract(
            addr.genesis,
            contractConfig.abi.GenesisNode,
            runner
          );
        }
        if (isValidAddress(addr.engine)) {
          contractSet.engine = new ethers.Contract(
            addr.engine,
            contractConfig.abi.AuctionEngine,
            runner
          );
        }
        if (isValidAddress(addr.sidepotManager)) {
          contractSet.sidepotManager = new ethers.Contract(
            addr.sidepotManager,
            contractConfig.abi.SidepotManager,
            runner
          );
        }
        if (isValidAddress(addr.prizeHookRouter)) {
          contractSet.prizeHookRouter = new ethers.Contract(
            addr.prizeHookRouter,
            contractConfig.abi.PTPrizeHookRouter,
            runner
          );
        }

        setContracts(contractSet);

        // If we have at least the merkaba contract, we're live
        if (contractSet.merkaba) {
          setIsLive(true);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[useMerkabaContract] Init error:', msg);
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // --- Read on-chain state ---
  const refreshState = useCallback(async () => {
    if (!contracts.merkaba) return;

    try {
      const results: Partial<MerkabaOnChainState> = {};

      // Parallel reads for speed
      const promises: Promise<void>[] = [];

      // Merkaba Core reads
      if (contracts.merkaba) {
        promises.push(
          (async () => {
            try {
              const [sun, earth, ratio, strength] = await Promise.all([
                contracts.merkaba!.sunBalance(),
                contracts.merkaba!.earthBalance(),
                contracts.merkaba!.targetRatio(),
                contracts.merkaba!.rebalanceStrength(),
              ]);
              results.sunBalance = sun;
              results.earthBalance = earth;
              results.targetRatio = ratio;
              results.rebalanceStrength = strength;
            } catch (e) {
              console.warn('[Merkaba] Core read failed:', e);
              // Fall back to zero
              results.sunBalance = 0n;
              results.earthBalance = 0n;
              results.targetRatio = 0n;
              results.rebalanceStrength = 0n;
            }
          })()
        );
      }

      // Auction Engine reads
      if (contracts.engine) {
        promises.push(
          (async () => {
            try {
              results.auctionCount = Number(await contracts.engine!.auctionCount());
            } catch {
              results.auctionCount = 0;
            }
          })()
        );
      }

      // Sidepot Manager reads
      if (contracts.sidepotManager) {
        promises.push(
          (async () => {
            try {
              results.potCount = Number(await contracts.sidepotManager!.potCount());
            } catch {
              results.potCount = 0;
            }
          })()
        );
      }

      // Token reads
      if (contracts.token) {
        promises.push(
          (async () => {
            try {
              const [name, symbol, decimals] = await Promise.all([
                contracts.token!.name(),
                contracts.token!.symbol(),
                contracts.token!.decimals(),
              ]);
              results.tokenName = name;
              results.tokenSymbol = symbol;
              results.tokenDecimals = Number(decimals);
            } catch {
              results.tokenName = 'Unknown';
              results.tokenSymbol = '???';
              results.tokenDecimals = 18;
            }
          })()
        );
      }

      // User-specific reads
      if (account && contracts.token) {
        promises.push(
          (async () => {
            try {
              results.userTokenBalance = await contracts.token!.balanceOf(account);
            } catch {
              results.userTokenBalance = 0n;
            }
          })()
        );
      }

      if (account && contracts.engine) {
        promises.push(
          (async () => {
            try {
              results.userVolume = await contracts.engine!.userVolume(account);
            } catch {
              results.userVolume = 0n;
            }
          })()
        );
      }

      await Promise.all(promises);

      setChainState({
        sunBalance: results.sunBalance ?? 0n,
        earthBalance: results.earthBalance ?? 0n,
        targetRatio: results.targetRatio ?? 0n,
        rebalanceStrength: results.rebalanceStrength ?? 0n,
        auctionCount: results.auctionCount ?? 0,
        potCount: results.potCount ?? 0,
        tokenName: results.tokenName ?? 'Unknown',
        tokenSymbol: results.tokenSymbol ?? '???',
        tokenDecimals: results.tokenDecimals ?? 18,
        userTokenBalance: results.userTokenBalance ?? 0n,
        userVolume: results.userVolume ?? 0n,
      });

      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[useMerkabaContract] Refresh error:', msg);
      setError(msg);
    }
  }, [contracts, account]);

  // --- Poll on-chain state every 10s ---
  useEffect(() => {
    if (!isLive) return;

    // Initial load
    refreshState();

    // Periodic polling
    pollRef.current = setInterval(refreshState, 10_000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isLive, refreshState]);

  // --- Connect wallet ---
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('No wallet detected. Install MetaMask or another Web3 wallet.');
      return;
    }

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      await browserProvider.send('eth_requestAccounts', []);
      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      setProvider(browserProvider);

      // Re-initialize contracts with signer for write capabilities
      const addr = contractConfig.address;
      const contractSet: MerkabaContractHook['contracts'] = {};

      if (isValidAddress(addr.token)) {
        contractSet.token = new ethers.Contract(addr.token, contractConfig.abi.ERC20, signer);
      }
      if (isValidAddress(addr.merkaba)) {
        contractSet.merkaba = new ethers.Contract(
          addr.merkaba,
          contractConfig.abi.MerkabaCore,
          signer
        );
      }
      if (isValidAddress(addr.genesis)) {
        contractSet.genesis = new ethers.Contract(
          addr.genesis,
          contractConfig.abi.GenesisNode,
          signer
        );
      }
      if (isValidAddress(addr.engine)) {
        contractSet.engine = new ethers.Contract(
          addr.engine,
          contractConfig.abi.AuctionEngine,
          signer
        );
      }
      if (isValidAddress(addr.sidepotManager)) {
        contractSet.sidepotManager = new ethers.Contract(
          addr.sidepotManager,
          contractConfig.abi.SidepotManager,
          signer
        );
      }
      if (isValidAddress(addr.prizeHookRouter)) {
        contractSet.prizeHookRouter = new ethers.Contract(
          addr.prizeHookRouter,
          contractConfig.abi.PTPrizeHookRouter,
          signer
        );
      }

      setContracts(contractSet);

      if (contractSet.merkaba) {
        setIsLive(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[useMerkabaContract] Connect error:', msg);
      setError(msg);
    }
  }, []);

  return {
    provider,
    contracts,
    account,
    chainState,
    isLoading,
    isLive,
    error,
    connect,
    refreshState,
  };
};
