import { aeneid, StoryClient, StoryConfig } from '@story-protocol/core-sdk';
import { http, Address } from 'viem';

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

// Create Story Client with wallet connection
export const createStoryClient = (walletClient: any): StoryClient => {
  const config: StoryConfig = {
    account: walletClient.account,
    transport: http(networkInfo.rpcProviderUrl),
    chainId: STORY_NETWORK,
  };
  
  return StoryClient.newClient(config);
};

// Pinata Configuration
export const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || '';
export const PINATA_API_URL = 'https://api.pinata.cloud/pinning';