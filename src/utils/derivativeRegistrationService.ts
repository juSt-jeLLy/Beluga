// derivativeRegistrationService.ts
import { IpMetadata, PILFlavor } from '@story-protocol/core-sdk';
import { parseEther, Address, Hex } from 'viem';
import { useWalletClient, useAccount } from 'wagmi';
import { SensorData } from '@/services/gmailService';
import { createStoryClient, SPGNFTContractAddress, networkInfo } from './config';
import { 
  uploadJSONToIPFS, 
  uploadFileToIPFS, 
  getJSONHash, 
  getHashFromUrl,
  getStringHash 
} from './uploadToIpfs';
import { generateCharacterFileForSensorData } from './generateCharacterFile';
import { SupabaseService } from '@/services/supabaseService';

export interface DerivativeRegistrationParams {
  sensorData: SensorData;
  location: string;
  creatorName: string;
  creatorAddress: Address;
  parentIpId: Address;
  parentLicenseTermsId: bigint | number;
  imageUrl?: string;
  maxMintingFee?: number; // in IP tokens
  maxRevenueShare?: number; // percentage 0-100
  royaltyShares?: Array<{
    recipient: Address;
    percentage: number;
  }>;
}

export interface LinkDerivativeParams {
  childIpId: Address;
  parentIpIds: Address[];
  licenseTermsIds: Array<bigint | number>;
  maxMintingFee?: number;
  maxRevenueShare?: number;
  maxRts?: number;
}

export interface DerivativeRegistrationResult {
  success: boolean;
  ipId?: string;
  txHash?: string;
  storyExplorerUrl?: string;
  parentIpId?: string;
  error?: string;
  metadataUrl?: string;
  licenseTokenIds?: bigint[];
}

export interface LinkDerivativeResult {
  success: boolean;
  txHash?: string;
  storyExplorerUrl?: string;
  error?: string;
}

/**
 * Register sensor data as a derivative IP Asset
 * This mints a new NFT and registers it as derivative of a parent IP
 */
export async function registerSensorDataAsDerivativeIP(
  params: DerivativeRegistrationParams,
  walletClient: any
): Promise<DerivativeRegistrationResult> {
  try {
    const { 
      sensorData, 
      location, 
      creatorName, 
      creatorAddress, 
      parentIpId,
      parentLicenseTermsId,
      imageUrl,
      maxMintingFee,
      maxRevenueShare,
      royaltyShares
    } = params;
    
    // Create Story client with wallet
    const client = createStoryClient(walletClient);
    
    // 1. Generate character file for AI metadata
    const characterFile = generateCharacterFileForSensorData(sensorData, location);
    const characterFileContent = JSON.stringify(characterFile, null, 2);
    
    // Upload character file to IPFS
    const characterFileHash = await uploadFileToIPFS(
      characterFileContent, 
      `${sensorData.type}-${location}-derivative-character.json`
    );
    const characterFileUrl = `https://ipfs.io/ipfs/${characterFileHash}`;
    
    // Get hash of character file
    const characterFileHashHex = await getStringHash(characterFileContent);
    
    // 2. Use image hash from sensor data
    const finalImageUrl = `https://ipfs.io/ipfs/${sensorData.imageHash}`;
    const imageHash = sensorData.imageHash.startsWith('0x') 
      ? sensorData.imageHash as `0x${string}`
      : `0x${sensorData.imageHash}` as `0x${string}`;    
    
    // 3. Create IP Metadata with AI metadata (derivative-specific)
    const ipMetadata: IpMetadata = client.ipAsset.generateIpMetadata({
      title: `${sensorData.title} (Derivative)`,
      description: `Derivative analysis of ${location} - ${sensorData.type} sensor data: ${sensorData.data}. Built upon parent IP: ${parentIpId}`,
      createdAt: new Date(sensorData.timestamp).getTime().toString(),
      creators: [
        {
          name: creatorName,
          address: creatorAddress,
          contributionPercent: 100,
        },
      ],
      image: finalImageUrl,
      imageHash: imageHash,
      mediaUrl: finalImageUrl,
      mediaHash: imageHash,
      mediaType: 'image/svg+xml',
      // Add AI metadata
      aiMetadata: {
        characterFileUrl: characterFileUrl,
        characterFileHash: characterFileHashHex,
      },
      // Add derivative context
      attributes: [
        {
          key: 'derivativeOf',
          value: parentIpId,
        },
        {
          key: 'sensorType',
          value: sensorData.type,
        },
        {
          key: 'location',
          value: location,
        }
      ]
    });
    
    // 4. Create NFT Metadata (derivative-specific)
    const nftMetadata = {
      name: `${sensorData.title} - Derivative Analysis`,
      description: `Derivative Agricultural IoT Sensor Data - ${sensorData.type} from ${location}. This derivative IP Asset builds upon and extends the analysis of parent IP: ${parentIpId}. It represents enhanced processing and interpretation of the original sensor data.`,
      image: finalImageUrl,
      attributes: [
        {
          trait_type: 'Asset Type',
          value: 'Derivative IP',
        },
        {
          trait_type: 'Parent IP',
          value: parentIpId,
        },
        {
          trait_type: 'Sensor Type',
          value: sensorData.type,
        },
        {
          trait_type: 'Location',
          value: location,
        },
        {
          trait_type: 'Sensor Health',
          value: sensorData.sensorHealth,
        },
        {
          trait_type: 'Timestamp',
          value: sensorData.timestamp,
        },
        {
          trait_type: 'Data Source',
          value: 'Agricultural IoT Network - Derivative',
        },
      ],
    };
    
    // 5. Upload metadata to IPFS
    const ipIpfsHash = await uploadJSONToIPFS(ipMetadata);
    const ipHash = await getJSONHash(ipMetadata);
    const nftIpfsHash = await uploadJSONToIPFS(nftMetadata);
    const nftHash = await getJSONHash(nftMetadata);
    
    // 6. Register Derivative IP Asset
    const response = await client.ipAsset.registerDerivativeIpAsset({
      nft: { 
        type: 'mint', 
        spgNftContract: SPGNFTContractAddress 
      },
      derivData: {
        parentIpIds: [parentIpId],
        licenseTermsIds: [parentLicenseTermsId],
        maxMintingFee: maxMintingFee ? parseEther(String(maxMintingFee)) : 0n,
        maxRevenueShare: maxRevenueShare ?? 100, // Default to 100%
        maxRts: 100_000_000, // Max royalty tokens
      },
      royaltyShares: royaltyShares,
      ipMetadata: {
        ipMetadataURI: `https://ipfs.io/ipfs/${ipIpfsHash}`,
        ipMetadataHash: ipHash,
        nftMetadataURI: `https://ipfs.io/ipfs/${nftIpfsHash}`,
        nftMetadataHash: nftHash,
      },
    });
    
    // 7. Generate Story Explorer URL
    const storyExplorerUrl = `${networkInfo.protocolExplorer}/ipa/${response.ipId}`;
    
    return {
      success: true,
      ipId: response.ipId,
      txHash: response.txHash,
      storyExplorerUrl: storyExplorerUrl,
      parentIpId: parentIpId,
      metadataUrl: `https://ipfs.io/ipfs/${ipIpfsHash}`,
    };
    
  } catch (error: any) {
    console.error('Derivative IP Registration Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to register derivative IP',
    };
  }
}

/**
 * Register sensor data as derivative using existing license tokens
 * This is useful when you already have license tokens from a parent IP
 */
export async function registerDerivativeWithLicenseTokens(
  params: {
    sensorData: SensorData;
    location: string;
    creatorName: string;
    creatorAddress: Address;
    licenseTokenIds: Array<bigint | number>;
    maxRts?: number;
    royaltyShares?: Array<{
      recipient: Address;
      percentage: number;
    }>;
  },
  walletClient: any
): Promise<DerivativeRegistrationResult> {
  try {
    const { 
      sensorData, 
      location, 
      creatorName, 
      creatorAddress, 
      licenseTokenIds,
      maxRts,
      royaltyShares
    } = params;
    
    // Create Story client with wallet
    const client = createStoryClient(walletClient);
    
    // 1. Generate character file for AI metadata
    const characterFile = generateCharacterFileForSensorData(sensorData, location);
    const characterFileContent = JSON.stringify(characterFile, null, 2);
    
    // Upload character file to IPFS
    const characterFileHash = await uploadFileToIPFS(
      characterFileContent, 
      `${sensorData.type}-${location}-derivative-character.json`
    );
    const characterFileUrl = `https://ipfs.io/ipfs/${characterFileHash}`;
    
    // Get hash of character file
    const characterFileHashHex = await getStringHash(characterFileContent);
    
    // 2. Use image hash from sensor data
    const finalImageUrl = `https://ipfs.io/ipfs/${sensorData.imageHash}`;
    const imageHash = sensorData.imageHash.startsWith('0x') 
      ? sensorData.imageHash as `0x${string}`
      : `0x${sensorData.imageHash}` as `0x${string}`;    
    
    // 3. Create IP Metadata with AI metadata
    const ipMetadata: IpMetadata = client.ipAsset.generateIpMetadata({
      title: `${sensorData.title} (Derivative via License Token)`,
      description: `Derivative analysis of ${location} - ${sensorData.type} sensor data: ${sensorData.data}. Registered using license tokens: ${licenseTokenIds.join(', ')}`,
      createdAt: new Date(sensorData.timestamp).getTime().toString(),
      creators: [
        {
          name: creatorName,
          address: creatorAddress,
          contributionPercent: 100,
        },
      ],
      image: finalImageUrl,
      imageHash: imageHash,
      mediaUrl: finalImageUrl,
      mediaHash: imageHash,
      mediaType: 'image/svg+xml',
      aiMetadata: {
        characterFileUrl: characterFileUrl,
        characterFileHash: characterFileHashHex,
      },
    });
    
    // 4. Create NFT Metadata
    const nftMetadata = {
      name: `${sensorData.title} - Licensed Derivative`,
      description: `Licensed Derivative Agricultural IoT Sensor Data - ${sensorData.type} from ${location}. Registered using license token(s).`,
      image: finalImageUrl,
      attributes: [
        {
          trait_type: 'Asset Type',
          value: 'Licensed Derivative IP',
        },
        {
          trait_type: 'License Tokens Used',
          value: licenseTokenIds.length,
        },
        {
          trait_type: 'Sensor Type',
          value: sensorData.type,
        },
        {
          trait_type: 'Location',
          value: location,
        },
      ],
    };
    
    // 5. Upload metadata to IPFS
    const ipIpfsHash = await uploadJSONToIPFS(ipMetadata);
    const ipHash = await getJSONHash(ipMetadata);
    const nftIpfsHash = await uploadJSONToIPFS(nftMetadata);
    const nftHash = await getJSONHash(nftMetadata);
    
    // 6. Register Derivative IP Asset with license tokens
    const response = await client.ipAsset.registerDerivativeIpAsset({
      nft: { 
        type: 'mint', 
        spgNftContract: SPGNFTContractAddress 
      },
      licenseTokenIds: licenseTokenIds.map(id => BigInt(id)),
      maxRts: maxRts ?? 100_000_000,
      royaltyShares: royaltyShares,
      ipMetadata: {
        ipMetadataURI: `https://ipfs.io/ipfs/${ipIpfsHash}`,
        ipMetadataHash: ipHash,
        nftMetadataURI: `https://ipfs.io/ipfs/${nftIpfsHash}`,
        nftMetadataHash: nftHash,
      },
    });
    
    // 7. Generate Story Explorer URL
    const storyExplorerUrl = `${networkInfo.protocolExplorer}/ipa/${response.ipId}`;
    
    return {
      success: true,
      ipId: response.ipId,
      txHash: response.txHash,
      storyExplorerUrl: storyExplorerUrl,
      metadataUrl: `https://ipfs.io/ipfs/${ipIpfsHash}`,
      licenseTokenIds: licenseTokenIds.map(id => BigInt(id)),
    };
    
  } catch (error: any) {
    console.error('Derivative IP Registration Error (with license tokens):', error);
    return {
      success: false,
      error: error.message || 'Failed to register derivative IP with license tokens',
    };
  }
}

/**
 * Link an existing IP Asset as a derivative to parent IP(s)
 * This is used when you already have an IP Asset registered and want to link it as derivative
 */
export async function linkExistingIPAsDerivative(
  params: LinkDerivativeParams,
  walletClient: any
): Promise<LinkDerivativeResult> {
  try {
    const { 
      childIpId, 
      parentIpIds, 
      licenseTermsIds,
      maxMintingFee,
      maxRevenueShare,
      maxRts
    } = params;
    
    // Create Story client with wallet
    const client = createStoryClient(walletClient);
    
    // Link derivative
    const response = await client.ipAsset.linkDerivative({
      childIpId: childIpId,
      parentIpIds: parentIpIds,
      licenseTermsIds: licenseTermsIds,
      maxMintingFee: maxMintingFee ? parseEther(String(maxMintingFee)) : 0n,
      maxRevenueShare: maxRevenueShare ?? 100,
      maxRts: maxRts ?? 100_000_000,
    });
    
    // Generate Story Explorer URL
    const storyExplorerUrl = `${networkInfo.protocolExplorer}/ipa/${childIpId}`;
    
    return {
      success: true,
      txHash: response.txHash,
      storyExplorerUrl: storyExplorerUrl,
    };
    
  } catch (error: any) {
    console.error('Link Derivative Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to link derivative',
    };
  }
}

/**
 * Link an existing IP Asset as derivative using license tokens
 */
export async function linkDerivativeWithLicenseTokens(
  params: {
    childIpId: Address;
    licenseTokenIds: Array<bigint | number>;
    maxRts?: number;
  },
  walletClient: any
): Promise<LinkDerivativeResult> {
  try {
    const { childIpId, licenseTokenIds, maxRts } = params;
    
    // Create Story client with wallet
    const client = createStoryClient(walletClient);
    
    // Link derivative with license tokens
    const response = await client.ipAsset.linkDerivative({
      childIpId: childIpId,
      licenseTokenIds: licenseTokenIds.map(id => BigInt(id)),
      maxRts: maxRts ?? 100_000_000,
    });
    
    // Generate Story Explorer URL
    const storyExplorerUrl = `${networkInfo.protocolExplorer}/ipa/${childIpId}`;
    
    return {
      success: true,
      txHash: response.txHash,
      storyExplorerUrl: storyExplorerUrl,
    };
    
  } catch (error: any) {
    console.error('Link Derivative with License Tokens Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to link derivative with license tokens',
    };
  }
}

// React hook for derivative IP registration
export function useDerivativeIPRegistration(supabaseService?: SupabaseService) {
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  
  /**
   * Register new derivative IP from sensor data
   */
  const registerDerivativeIP = async (
    sensorData: SensorData,
    location: string,
    creatorName: string,
    parentIpId: Address,
    parentLicenseTermsId: bigint | number,
    imageUrl?: string,
    sensorDataId?: number,
    maxMintingFee?: number,
    maxRevenueShare?: number,
    royaltyShares?: Array<{ recipient: Address; percentage: number }>
  ): Promise<DerivativeRegistrationResult> => {
    if (!walletClient || !address) {
      return {
        success: false,
        error: 'Wallet not connected',
      };
    }
    
    try {
      // 1. Register derivative IP on Story Protocol
      const registrationResult = await registerSensorDataAsDerivativeIP(
        {
          sensorData,
          location,
          creatorName,
          creatorAddress: address,
          parentIpId,
          parentLicenseTermsId,
          imageUrl,
          maxMintingFee,
          maxRevenueShare,
          royaltyShares,
        },
        walletClient
      );
      
      // 2. Save to database if successful and we have sensorDataId
      if (registrationResult.success && sensorDataId && supabaseService) {
        try {
          // Save derivative registration data
          const saveResult = await supabaseService.saveIPRegistrationData(
            sensorDataId,
            {
              creator_address: address,
              ip_asset_id: registrationResult.ipId!,
              story_explorer_url: registrationResult.storyExplorerUrl!,
              transaction_hash: registrationResult.txHash,
              metadata_url: registrationResult.metadataUrl,
              revenue_share: maxRevenueShare,
              minting_fee: maxMintingFee,
            }
          );
          
          if (!saveResult.success) {
            console.warn('Derivative IP registration succeeded but failed to save to database:', saveResult.error);
          } else {
            console.log('Derivative IP registration data saved to database successfully');
          }
        } catch (dbError: any) {
          console.error('Database save error:', dbError);
        }
      }
      
      return registrationResult;
      
    } catch (error: any) {
      console.error('Derivative registration process error:', error);
      return {
        success: false,
        error: error.message || 'Derivative registration failed',
      };
    }
  };
  
  /**
   * Register derivative using existing license tokens
   */
  const registerDerivativeWithTokens = async (
    sensorData: SensorData,
    location: string,
    creatorName: string,
    licenseTokenIds: Array<bigint | number>,
    maxRts?: number,
    royaltyShares?: Array<{ recipient: Address; percentage: number }>,
    sensorDataId?: number
  ): Promise<DerivativeRegistrationResult> => {
    if (!walletClient || !address) {
      return {
        success: false,
        error: 'Wallet not connected',
      };
    }
    
    try {
      const registrationResult = await registerDerivativeWithLicenseTokens(
        {
          sensorData,
          location,
          creatorName,
          creatorAddress: address,
          licenseTokenIds,
          maxRts,
          royaltyShares,
        },
        walletClient
      );
      
      // Save to database if successful
      if (registrationResult.success && sensorDataId && supabaseService) {
        await supabaseService.saveIPRegistrationData(
          sensorDataId,
          {
            creator_address: address,
            ip_asset_id: registrationResult.ipId!,
            story_explorer_url: registrationResult.storyExplorerUrl!,
            transaction_hash: registrationResult.txHash,
            metadata_url: registrationResult.metadataUrl,
          }
        );
      }
      
      return registrationResult;
      
    } catch (error: any) {
      console.error('Derivative registration with tokens error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed',
      };
    }
  };
  
  /**
   * Link existing IP as derivative
   */
  const linkAsDerivative = async (
    childIpId: Address,
    parentIpIds: Address[],
    licenseTermsIds: Array<bigint | number>,
    maxMintingFee?: number,
    maxRevenueShare?: number,
    maxRts?: number
  ): Promise<LinkDerivativeResult> => {
    if (!walletClient || !address) {
      return {
        success: false,
        error: 'Wallet not connected',
      };
    }
    
    try {
      return await linkExistingIPAsDerivative(
        {
          childIpId,
          parentIpIds,
          licenseTermsIds,
          maxMintingFee,
          maxRevenueShare,
          maxRts,
        },
        walletClient
      );
    } catch (error: any) {
      console.error('Link derivative error:', error);
      return {
        success: false,
        error: error.message || 'Link failed',
      };
    }
  };
  
  /**
   * Link existing IP as derivative using license tokens
   */
  const linkWithLicenseTokens = async (
    childIpId: Address,
    licenseTokenIds: Array<bigint | number>,
    maxRts?: number
  ): Promise<LinkDerivativeResult> => {
    if (!walletClient || !address) {
      return {
        success: false,
        error: 'Wallet not connected',
      };
    }
    
    try {
      return await linkDerivativeWithLicenseTokens(
        {
          childIpId,
          licenseTokenIds,
          maxRts,
        },
        walletClient
      );
    } catch (error: any) {
      console.error('Link with license tokens error:', error);
      return {
        success: false,
        error: error.message || 'Link failed',
      };
    }
  };
  
  return { 
    registerDerivativeIP,
    registerDerivativeWithTokens,
    linkAsDerivative,
    linkWithLicenseTokens,
    isConnected: !!walletClient && !!address 
  };
}