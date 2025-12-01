import { aeneid, StoryClient, StoryConfig } from '@story-protocol/core-sdk';
import { http, Address, custom } from 'viem';
import { createWalletClient } from 'viem';

// Aeneid Testnet Configuration
export const STORY_NETWORK = 'aeneid';

export const networkInfo = {
  rpcProviderUrl: 'https://aeneid.storyrpc.io',
  blockExplorer: 'https://aeneid.storyscan.io',
  protocolExplorer: 'https://aeneid.explorer.story.foundation',
  defaultSPGNFTContractAddress: '0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc' as Address,
  chain: aeneid,
};

// SPG NFT Contract Address - you can use the default or create your own
export const SPGNFTContractAddress: Address = 
  (import.meta.env.VITE_SPG_NFT_CONTRACT_ADDRESS as Address) || 
  networkInfo.defaultSPGNFTContractAddress;

// Create Story Client with injected wallet (from wagmi)
export const createStoryClient = (walletClient: any): StoryClient => {
  if (!walletClient) {
    throw new Error('Wallet client is required');
  }

  if (!window.ethereum) {
    throw new Error('No injected wallet provider found. Please install MetaMask or another Web3 wallet.');
  }

  // Create a proper wallet client with custom transport
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

// Pinata Configuration
export const PINATA_JWT = import.meta.env.VITE_PINATA_JWT ;
export const PINATA_API_URL = 'https://api.pinata.cloud/pinning';
