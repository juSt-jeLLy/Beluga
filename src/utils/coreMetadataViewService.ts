// src/services/coreMetadataViewService.ts
import { createPublicClient, http, Address, PublicClient } from 'viem';
import { aeneid } from '@story-protocol/core-sdk';

// CoreMetadataViewModule contract address on Aeneid
const CORE_METADATA_VIEW_MODULE_ADDRESS = '0xB3F88038A983CeA5753E11D144228Ebb5eACdE20' as Address;

// CoreMetadataViewModule ABI (based on the contract code provided)
const CORE_METADATA_VIEW_MODULE_ABI = [
  {
    inputs: [{ name: 'ipId', type: 'address' }],
    name: 'getCoreMetadata',
    outputs: [
      {
        components: [
          { name: 'nftTokenURI', type: 'string' },
          { name: 'nftMetadataHash', type: 'bytes32' },
          { name: 'metadataURI', type: 'string' },
          { name: 'metadataHash', type: 'bytes32' },
          { name: 'registrationDate', type: 'uint256' },
          { name: 'owner', type: 'address' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'ipId', type: 'address' }],
    name: 'getMetadataURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'ipId', type: 'address' }],
    name: 'getMetadataHash',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'ipId', type: 'address' }],
    name: 'getRegistrationDate',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'ipId', type: 'address' }],
    name: 'getNftTokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'ipId', type: 'address' }],
    name: 'getNftMetadataHash',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'ipId', type: 'address' }],
    name: 'getOwner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'ipId', type: 'address' }],
    name: 'getJsonString',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'ipAccount', type: 'address' }],
    name: 'isSupported',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
];

// Type definitions
export interface CoreMetadata {
  nftTokenURI: string;
  nftMetadataHash: `0x${string}`;
  metadataURI: string;
  metadataHash: `0x${string}`;
  registrationDate: bigint;
  owner: Address;
}

export interface IPMetadataContent {
  title?: string;
  description?: string;
  ipType?: string;
  creators?: Array<{
    name: string;
    address: string;
    contributionPercent: number;
  }>;
  image?: string;
  imageHash?: string;
  mediaUrl?: string;
  mediaHash?: string;
  mediaType?: string;
  createdAt?: string;
  aiMetadata?: {
    characterFileUrl?: string;
    characterFileHash?: string;
  };
  [key: string]: any;
}

export interface NFTMetadataContent {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  [key: string]: any;
}

export interface EnrichedIPData {
  ipId: Address;
  coreMetadata: CoreMetadata;
  ipMetadataContent?: IPMetadataContent;
  nftMetadataContent?: NFTMetadataContent;
  jsonString?: string;
  isSupported: boolean;
  error?: string;
}

export class CoreMetadataViewService {
  private client: PublicClient;
  private contractAddress: Address;

  constructor(rpcUrl?: string) {
    this.client = createPublicClient({
      chain: aeneid,
      transport: http(rpcUrl || 'https://aeneid.storyrpc.io'),
    });
    this.contractAddress = CORE_METADATA_VIEW_MODULE_ADDRESS;
  }

  /**
   * Get all core metadata for an IP Asset
   */
  async getCoreMetadata(ipId: Address): Promise<CoreMetadata> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: CORE_METADATA_VIEW_MODULE_ABI,
        functionName: 'getCoreMetadata',
        args: [ipId],
      } as any);

      return {
        nftTokenURI: result.nftTokenURI,
        nftMetadataHash: result.nftMetadataHash,
        metadataURI: result.metadataURI,
        metadataHash: result.metadataHash,
        registrationDate: result.registrationDate,
        owner: result.owner,
      };
    } catch (error: any) {
      console.error('Error fetching core metadata:', error);
      throw new Error(`Failed to fetch core metadata: ${error.message}`);
    }
  }

  /**
   * Get metadata URI for an IP Asset
   */
  async getMetadataURI(ipId: Address): Promise<string> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: CORE_METADATA_VIEW_MODULE_ABI,
        functionName: 'getMetadataURI',
        args: [ipId],
      } as any);

      return result;
    } catch (error: any) {
      console.error('Error fetching metadata URI:', error);
      throw new Error(`Failed to fetch metadata URI: ${error.message}`);
    }
  }

  /**
   * Get metadata hash for an IP Asset
   */
  async getMetadataHash(ipId: Address): Promise<`0x${string}`> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: CORE_METADATA_VIEW_MODULE_ABI,
        functionName: 'getMetadataHash',
        args: [ipId],
      } as any);

      return result;
    } catch (error: any) {
      console.error('Error fetching metadata hash:', error);
      throw new Error(`Failed to fetch metadata hash: ${error.message}`);
    }
  }

  /**
   * Get registration date for an IP Asset
   */
  async getRegistrationDate(ipId: Address): Promise<bigint> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: CORE_METADATA_VIEW_MODULE_ABI,
        functionName: 'getRegistrationDate',
        args: [ipId],
      } as any);

      return result;
    } catch (error: any) {
      console.error('Error fetching registration date:', error);
      throw new Error(`Failed to fetch registration date: ${error.message}`);
    }
  }

  /**
   * Get NFT token URI for an IP Asset
   */
  async getNftTokenURI(ipId: Address): Promise<string> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: CORE_METADATA_VIEW_MODULE_ABI,
        functionName: 'getNftTokenURI',
        args: [ipId],
      } as any);

      return result;
    } catch (error: any) {
      console.error('Error fetching NFT token URI:', error);
      throw new Error(`Failed to fetch NFT token URI: ${error.message}`);
    }
  }

  /**
   * Get NFT metadata hash for an IP Asset
   */
  async getNftMetadataHash(ipId: Address): Promise<`0x${string}`> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: CORE_METADATA_VIEW_MODULE_ABI,
        functionName: 'getNftMetadataHash',
        args: [ipId],
      } as any);

      return result;
    } catch (error: any) {
      console.error('Error fetching NFT metadata hash:', error);
      throw new Error(`Failed to fetch NFT metadata hash: ${error.message}`);
    }
  }

  /**
   * Get owner address for an IP Asset
   */
  async getOwner(ipId: Address): Promise<Address> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: CORE_METADATA_VIEW_MODULE_ABI,
        functionName: 'getOwner',
        args: [ipId],
      } as any);

      return result;
    } catch (error: any) {
      console.error('Error fetching owner:', error);
      throw new Error(`Failed to fetch owner: ${error.message}`);
    }
  }

  /**
   * Get JSON string representation of all metadata
   */
  async getJsonString(ipId: Address): Promise<string> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: CORE_METADATA_VIEW_MODULE_ABI,
        functionName: 'getJsonString',
        args: [ipId],
      } as any);

      return result;
    } catch (error: any) {
      console.error('Error fetching JSON string:', error);
      throw new Error(`Failed to fetch JSON string: ${error.message}`);
    }
  }

  /**
   * Check if IP Account is supported
   */
  async isSupported(ipAccount: Address): Promise<boolean> {
    try {
      const result = await this.client.readContract({
        address: this.contractAddress,
        abi: CORE_METADATA_VIEW_MODULE_ABI,
        functionName: 'isSupported',
        args: [ipAccount],
      } as any);

      return result;
    } catch (error: any) {
      console.error('Error checking support:', error);
      throw new Error(`Failed to check support: ${error.message}`);
    }
  }

  /**
   * Fetch and parse IP metadata content from IPFS
   */
  async fetchIPMetadataContent(metadataURI: string): Promise<IPMetadataContent | null> {
    try {
      // Handle IPFS URIs
      let fetchUrl = metadataURI;
      if (metadataURI.startsWith('ipfs://')) {
        fetchUrl = metadataURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
      } else if (metadataURI.includes('/ipfs/')) {
        // Already a gateway URL
        fetchUrl = metadataURI;
      }

      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const content = await response.json();
      return content;
    } catch (error: any) {
      console.error('Error fetching IP metadata content:', error);
      return null;
    }
  }

  /**
   * Fetch and parse NFT metadata content from IPFS
   */
  async fetchNFTMetadataContent(nftTokenURI: string): Promise<NFTMetadataContent | null> {
    try {
      // Handle IPFS URIs
      let fetchUrl = nftTokenURI;
      if (nftTokenURI.startsWith('ipfs://')) {
        fetchUrl = nftTokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
      } else if (nftTokenURI.includes('/ipfs/')) {
        fetchUrl = nftTokenURI;
      }

      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const content = await response.json();
      return content;
    } catch (error: any) {
      console.error('Error fetching NFT metadata content:', error);
      return null;
    }
  }

  /**
   * Get all enriched data for an IP Asset (including parsed metadata content)
   */
  async getEnrichedIPData(ipId: Address): Promise<EnrichedIPData> {
    try {
      // Check if supported first
      const isSupported = await this.isSupported(ipId);
      if (!isSupported) {
        return {
          ipId,
          coreMetadata: {
            nftTokenURI: '',
            nftMetadataHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
            metadataURI: '',
            metadataHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
            registrationDate: BigInt(0),
            owner: '0x0000000000000000000000000000000000000000',
          },
          isSupported: false,
          error: 'IP Account not supported',
        };
      }

      // Fetch core metadata
      const coreMetadata = await this.getCoreMetadata(ipId);

      // Fetch JSON string representation
      let jsonString: string | undefined;
      try {
        jsonString = await this.getJsonString(ipId);
      } catch (error) {
        console.warn('Could not fetch JSON string:', error);
      }

      // Fetch and parse IP metadata content
      let ipMetadataContent: IPMetadataContent | undefined;
      if (coreMetadata.metadataURI) {
        ipMetadataContent = (await this.fetchIPMetadataContent(coreMetadata.metadataURI)) || undefined;
      }

      // Fetch and parse NFT metadata content
      let nftMetadataContent: NFTMetadataContent | undefined;
      if (coreMetadata.nftTokenURI) {
        nftMetadataContent = (await this.fetchNFTMetadataContent(coreMetadata.nftTokenURI)) || undefined;
      }

      return {
        ipId,
        coreMetadata,
        ipMetadataContent,
        nftMetadataContent,
        jsonString,
        isSupported: true,
      };
    } catch (error: any) {
      console.error('Error fetching enriched IP data:', error);
      return {
        ipId,
        coreMetadata: {
          nftTokenURI: '',
          nftMetadataHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
          metadataURI: '',
          metadataHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
          registrationDate: BigInt(0),
          owner: '0x0000000000000000000000000000000000000000',
        },
        isSupported: false,
        error: error.message || 'Failed to fetch enriched data',
      };
    }
  }

  /**
   * Batch fetch core metadata for multiple IP Assets
   */
  async batchGetCoreMetadata(ipIds: Address[]): Promise<Map<Address, CoreMetadata>> {
    const results = new Map<Address, CoreMetadata>();

    await Promise.all(
      ipIds.map(async (ipId) => {
        try {
          const metadata = await this.getCoreMetadata(ipId);
          results.set(ipId, metadata);
        } catch (error) {
          console.error(`Error fetching metadata for ${ipId}:`, error);
        }
      })
    );

    return results;
  }

  /**
   * Batch fetch enriched data for multiple IP Assets
   */
  async batchGetEnrichedIPData(ipIds: Address[]): Promise<Map<Address, EnrichedIPData>> {
    const results = new Map<Address, EnrichedIPData>();

    await Promise.all(
      ipIds.map(async (ipId) => {
        try {
          const enrichedData = await this.getEnrichedIPData(ipId);
          results.set(ipId, enrichedData);
        } catch (error) {
          console.error(`Error fetching enriched data for ${ipId}:`, error);
        }
      })
    );

    return results;
  }

  /**
   * Format registration date to human-readable string
   */
  formatRegistrationDate(timestamp: bigint): string {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
  }

  /**
   * Extract IPFS hash from URI
   */
  extractIPFSHash(uri: string): string | null {
    if (uri.startsWith('ipfs://')) {
      return uri.replace('ipfs://', '');
    } else if (uri.includes('/ipfs/')) {
      const match = uri.match(/\/ipfs\/([a-zA-Z0-9]+)/);
      return match ? match[1] : null;
    }
    return null;
  }

  /**
   * Convert IPFS URI to gateway URL
   */
  ipfsToGatewayURL(uri: string, gateway: string = 'https://ipfs.io/ipfs/'): string {
    if (uri.startsWith('ipfs://')) {
      return uri.replace('ipfs://', gateway);
    } else if (uri.includes('/ipfs/')) {
      return uri;
    }
    return uri;
  }
}

// Factory function to create service instance
export const createCoreMetadataViewService = (rpcUrl?: string): CoreMetadataViewService => {
  return new CoreMetadataViewService(rpcUrl);
};

// React hook for using the service
import { useState, useEffect } from 'react';

export function useCoreMetadata(ipId?: Address) {
  const [service] = useState(() => createCoreMetadataViewService());
  const [data, setData] = useState<EnrichedIPData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ipId) {
      setData(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const enrichedData = await service.getEnrichedIPData(ipId);
        setData(enrichedData);

        if (enrichedData.error) {
          setError(enrichedData.error);
        }
      } catch (err: any) {
        console.error('Error fetching metadata:', err);
        setError(err.message || 'Failed to fetch metadata');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ipId, service]);

  const refetch = async () => {
    if (!ipId) return;

    setLoading(true);
    setError(null);

    try {
      const enrichedData = await service.getEnrichedIPData(ipId);
      setData(enrichedData);

      if (enrichedData.error) {
        setError(enrichedData.error);
      }
    } catch (err: any) {
      console.error('Error refetching metadata:', err);
      setError(err.message || 'Failed to refetch metadata');
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    refetch,
    service,
  };
}