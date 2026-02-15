import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { contractConfig } from '../config/contracts';

// Simple hook to read from contracts
export const useMerkabaContract = () => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [contracts, setContracts] = useState<any>({});
  const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(browserProvider);

        const signer = await browserProvider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);

        // Initialize Contracts if we have addresses
        if (contractConfig.address.token) {
          const token = new ethers.Contract(
            contractConfig.address.token,
            contractConfig.abi.ERC20,
            signer
          );
          const merkaba = new ethers.Contract(
            contractConfig.address.merkaba,
            contractConfig.abi.MerkabaCore,
            signer
          );
          const genesis = new ethers.Contract(
            contractConfig.address.genesis,
            contractConfig.abi.GenesisNode,
            signer
          );
          const engine = new ethers.Contract(
            contractConfig.address.engine,
            contractConfig.abi.AuctionEngine,
            signer
          );

          setContracts({ token, merkaba, genesis, engine });
        }
      }
    };
    init();
  }, []);

  const connect = async () => {
    if (!provider) return;
    try {
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      setAccount(await signer.getAddress());
    } catch (error) {
      console.error('Connection failed', error);
    }
  };

  return { provider, contracts, account, connect };
};
