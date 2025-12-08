import { aeneid, StoryClient, StoryConfig } from '@story-protocol/core-sdk';
import { http, Address, custom } from 'viem';
import { createWalletClient } from 'viem';
import { privateKeyToAccount, Account } from 'viem/accounts';

// Aeneid Testnet Configuration
export const STORY_NETWORK = 'aeneid';

export const networkInfo = {
  rpcProviderUrl: 'https://aeneid.storyrpc.io',
  chain: aeneid,
};

// SPG NFT Contract Address
export const SPGNFTContractAddress: Address = 
  (import.meta.env.VITE_SPG_NFT_CONTRACT_ADDRESS as Address);

// Create Story Client with injected wallet (from wagmi) - for frontend/user interactions
export const createStoryClient = (walletClient: any): StoryClient => {
  if (!walletClient) {
    throw new Error('Wallet client is required');
  }

  if (!window.ethereum) {
    throw new Error('No injected wallet provider found. Please install MetaMask or another Web3 wallet.');
  }

  const viemWalletClient = createWalletClient({
    account: walletClient.account,
    chain: aeneid,
    transport: custom(window.ethereum),
  });

  const config: StoryConfig = {
    account: viemWalletClient.account,
    transport: http(networkInfo.rpcProviderUrl),
    chainId: 'aeneid',
    wallet: viemWalletClient,
  };
  
  return StoryClient.newClient(config);
};

// Create Story Client with private key - for backend/automated operations
export const createBackendStoryClient = (): StoryClient => {
  const privateKey = import.meta.env.VITE_WALLET_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('Private key not found in environment variables');
  }

  const account: Account = privateKeyToAccount(
    privateKey.startsWith('0x') ? privateKey as Address : `0x${privateKey}` as Address
  );

  const config: StoryConfig = {
    account: account,
    transport: http(networkInfo.rpcProviderUrl),
    chainId: 'aeneid',
  };
  
  return StoryClient.newClient(config);
};

// Or create a singleton instance if you want to use it directly
let backendClientInstance: StoryClient | null = null;

export const getBackendStoryClient = (): StoryClient => {
  if (!backendClientInstance) {
    backendClientInstance = createBackendStoryClient();
  }
  return backendClientInstance;
};

// Pinata Configuration
export const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
export const PINATA_API_URL = 'https://api.pinata.cloud/pinning';