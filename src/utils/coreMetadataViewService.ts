// src/services/metadataFetchService.ts
import { Address, createPublicClient, http } from 'viem';
import { aeneid } from '@story-protocol/core-sdk';

// CoreMetadataViewModule contract address
const CORE_METADATA_VIEW_MODULE_ADDRESS: Address = '0xB3F88038A983CeA5753E11D144228Ebb5eACdE20';

// CoreMetadataViewModule ABI
const CORE_METADATA_VIEW_MODULE_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'ipId', type: 'address' }],
    name: 'getCoreMetadata',
    outputs: [
      {
        components: [
          { internalType: 'string', name: 'nftTokenURI', type: 'string' },
          { internalType: 'bytes32', name: 'nftMetadataHash', type: 'bytes32' },
          { internalType: 'string', name: 'metadataURI', type: 'string' },
          { internalType: 'bytes32', name: 'metadataHash', type: 'bytes32' },
          { internalType: 'uint256', name: 'registrationDate', type: 'uint256' },
          { internalType: 'address', name: 'owner', type: 'address' },
        ],
        internalType: 'struct ICoreMetadataViewModule.CoreMetadata',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'ipId', type: 'address' }],
    name: 'getMetadataURI',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'ipId', type: 'address' }],
    name: 'getMetadataHash',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'ipId', type: 'address' }],
    name: 'getRegistrationDate',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'ipId', type: 'address' }],
    name: 'getNftTokenURI',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'ipId', type: 'address' }],
    name: 'getNftMetadataHash',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'ipId', type: 'address' }],
    name: 'getOwner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'ipId', type: 'address' }],
    name: 'getJsonString',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'ipAccount', type: 'address' }],
    name: 'isSupported',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Type definitions
export interface CoreMetadata {
  nftTokenURI: string;
  nftMetadataHash: `0x${string}`;
  metadataURI: string;
  metadataHash: `0x${string}`;
  registrationDate: bigint;
  owner: Address;
}

export interface IPMetadataDetails {
  title?: string;
  description?: string;
  createdAt?: string;
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
  aiMetadata?: {
    characterFileUrl?: string;
    characterFileHash?: string;
  };
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface EnrichedIPMetadata extends CoreMetadata {
  ipMetadataDetails?: IPMetadataDetails;
  nftMetadataDetails?: any;
  jsonString?: string;
  isSupported: boolean;
}

// Create public client
const publicClient = createPublicClient({
  chain: aeneid,
  transport: http('https://aeneid.storyrpc.io'),
});

/**
 * Fetch complete core metadata for an IP Asset
 */
export async function getCoreMetadata(ipId: Address): Promise<CoreMetadata> {
  try {
    const metadata = (await publicClient.readContract({
      address: CORE_METADATA_VIEW_MODULE_ADDRESS,
      abi: CORE_METADATA_VIEW_MODULE_ABI,
      functionName: 'getCoreMetadata',
      args: [ipId],
    } as any)) as any;

    return {
      nftTokenURI: metadata[0],
      nftMetadataHash: metadata[1],
      metadataURI: metadata[2],
      metadataHash: metadata[3],
      registrationDate: metadata[4],
      owner: metadata[5],
    };
  } catch (error: any) {
    console.error('Error fetching core metadata:', error);
    throw new Error(`Failed to fetch core metadata: ${error.message}`);
  }
}

/**
 * Fetch only the metadata URI
 */
export async function getMetadataURI(ipId: Address): Promise<string> {
  try {
    const uri = (await publicClient.readContract({
      address: CORE_METADATA_VIEW_MODULE_ADDRESS,
      abi: CORE_METADATA_VIEW_MODULE_ABI,
      functionName: 'getMetadataURI',
      args: [ipId],
    } as any)) as string;
    return uri;
  } catch (error: any) {
    console.error('Error fetching metadata URI:', error);
    throw new Error(`Failed to fetch metadata URI: ${error.message}`);
  }
}

/**
 * Fetch only the metadata hash
 */
export async function getMetadataHash(ipId: Address): Promise<`0x${string}`> {
  try {
    const hash = (await publicClient.readContract({
      address: CORE_METADATA_VIEW_MODULE_ADDRESS,
      abi: CORE_METADATA_VIEW_MODULE_ABI,
      functionName: 'getMetadataHash',
      args: [ipId],
    } as any)) as `0x${string}`;
    return hash;
  } catch (error: any) {
    console.error('Error fetching metadata hash:', error);
    throw new Error(`Failed to fetch metadata hash: ${error.message}`);
  }
}

/**
 * Fetch the registration date
 */
export async function getRegistrationDate(ipId: Address): Promise<Date> {
  try {
    const timestamp = (await publicClient.readContract({
      address: CORE_METADATA_VIEW_MODULE_ADDRESS,
      abi: CORE_METADATA_VIEW_MODULE_ABI,
      functionName: 'getRegistrationDate',
      args: [ipId],
    } as any)) as bigint;
    return new Date(Number(timestamp) * 1000);
  } catch (error: any) {
    console.error('Error fetching registration date:', error);
    throw new Error(`Failed to fetch registration date: ${error.message}`);
  }
}

/**
 * Fetch the NFT token URI
 */
export async function getNftTokenURI(ipId: Address): Promise<string> {
  try {
    const uri = (await publicClient.readContract({
      address: CORE_METADATA_VIEW_MODULE_ADDRESS,
      abi: CORE_METADATA_VIEW_MODULE_ABI,
      functionName: 'getNftTokenURI',
      args: [ipId],
    } as any)) as string;
    return uri;
  } catch (error: any) {
    console.error('Error fetching NFT token URI:', error);
    throw new Error(`Failed to fetch NFT token URI: ${error.message}`);
  }
}

/**
 * Fetch the NFT metadata hash
 */
export async function getNftMetadataHash(ipId: Address): Promise<`0x${string}`> {
  try {
    const hash = (await publicClient.readContract({
      address: CORE_METADATA_VIEW_MODULE_ADDRESS,
      abi: CORE_METADATA_VIEW_MODULE_ABI,
      functionName: 'getNftMetadataHash',
      args: [ipId],
    } as any)) as `0x${string}`;
    return hash;
  } catch (error: any) {
    console.error('Error fetching NFT metadata hash:', error);
    throw new Error(`Failed to fetch NFT metadata hash: ${error.message}`);
  }
}

/**
 * Fetch the owner address
 */
export async function getOwner(ipId: Address): Promise<Address> {
  try {
    const owner = (await publicClient.readContract({
      address: CORE_METADATA_VIEW_MODULE_ADDRESS,
      abi: CORE_METADATA_VIEW_MODULE_ABI,
      functionName: 'getOwner',
      args: [ipId],
    } as any)) as Address;
    return owner;
  } catch (error: any) {
    console.error('Error fetching owner:', error);
    throw new Error(`Failed to fetch owner: ${error.message}`);
  }
}

/**
 * Fetch the JSON string representation
 */
export async function getJsonString(ipId: Address): Promise<string> {
  try {
    const jsonString = (await publicClient.readContract({
      address: CORE_METADATA_VIEW_MODULE_ADDRESS,
      abi: CORE_METADATA_VIEW_MODULE_ABI,
      functionName: 'getJsonString',
      args: [ipId],
    } as any)) as string;
    return jsonString;
  } catch (error: any) {
    console.error('Error fetching JSON string:', error);
    throw new Error(`Failed to fetch JSON string: ${error.message}`);
  }
}

/**
 * Check if the IP account is supported
 */
export async function isSupported(ipId: Address): Promise<boolean> {
  try {
    const supported = (await publicClient.readContract({
      address: CORE_METADATA_VIEW_MODULE_ADDRESS,
      abi: CORE_METADATA_VIEW_MODULE_ABI,
      functionName: 'isSupported',
      args: [ipId],
    } as any)) as boolean;
    return supported;
  } catch (error: any) {
    console.error('Error checking if supported:', error);
    throw new Error(`Failed to check if supported: ${error.message}`);
  }
}

/**
 * Fetch metadata content from IPFS URL
 */
async function fetchMetadataFromIPFS(uri: string): Promise<any> {
  try {
    // Handle IPFS URLs
    let fetchUrl = uri;
    if (uri.startsWith('ipfs://')) {
      fetchUrl = uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }

    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error fetching metadata from IPFS:', error);
    return null;
  }
}

/**
 * Fetch enriched metadata with full details from IPFS
 */
export async function getEnrichedMetadata(ipId: Address): Promise<EnrichedIPMetadata> {
  try {
    // Fetch core metadata from contract
    const coreMetadata = await getCoreMetadata(ipId);
    const supported = await isSupported(ipId);
    const jsonString = await getJsonString(ipId);

    // Fetch detailed metadata from IPFS
    let ipMetadataDetails: IPMetadataDetails | undefined;
    let nftMetadataDetails: any;

    if (coreMetadata.metadataURI) {
      ipMetadataDetails = await fetchMetadataFromIPFS(coreMetadata.metadataURI);
    }

    if (coreMetadata.nftTokenURI) {
      nftMetadataDetails = await fetchMetadataFromIPFS(coreMetadata.nftTokenURI);
    }

    return {
      ...coreMetadata,
      ipMetadataDetails,
      nftMetadataDetails,
      jsonString,
      isSupported: supported,
    };
  } catch (error: any) {
    console.error('Error fetching enriched metadata:', error);
    throw new Error(`Failed to fetch enriched metadata: ${error.message}`);
  }
}

/**
 * Batch fetch metadata for multiple IP assets
 */
export async function batchGetCoreMetadata(ipIds: Address[]): Promise<Map<Address, CoreMetadata>> {
  const results = new Map<Address, CoreMetadata>();

  await Promise.all(
    ipIds.map(async (ipId) => {
      try {
        const metadata = await getCoreMetadata(ipId);
        results.set(ipId, metadata);
      } catch (error) {
        console.error(`Failed to fetch metadata for ${ipId}:`, error);
      }
    })
  );

  return results;
}

/**
 * Batch fetch enriched metadata for multiple IP assets
 */
export async function batchGetEnrichedMetadata(
  ipIds: Address[]
): Promise<Map<Address, EnrichedIPMetadata>> {
  const results = new Map<Address, EnrichedIPMetadata>();

  await Promise.all(
    ipIds.map(async (ipId) => {
      try {
        const metadata = await getEnrichedMetadata(ipId);
        results.set(ipId, metadata);
      } catch (error) {
        console.error(`Failed to fetch enriched metadata for ${ipId}:`, error);
      }
    })
  );

  return results;
}

// Export a default service object with all functions
export const MetadataFetchService = {
  getCoreMetadata,
  getMetadataURI,
  getMetadataHash,
  getRegistrationDate,
  getNftTokenURI,
  getNftMetadataHash,
  getOwner,
  getJsonString,
  isSupported,
  getEnrichedMetadata,
  batchGetCoreMetadata,
  batchGetEnrichedMetadata,
};