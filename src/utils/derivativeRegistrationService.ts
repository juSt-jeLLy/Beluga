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
  royaltyRecipient?: Address; // Optional, defaults to creator
  royaltyPercentage?: number; // 0-100
}

export interface DerivativeRegistrationResult {
  success: boolean;
  ipId?: string;
  txHash?: string;
  storyExplorerUrl?: string;
  parentIpId?: string;
  error?: string;
  metadataUrl?: string;
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
      royaltyRecipient,
      royaltyPercentage,
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
      title: sensorData.title,
      description: `${location} - ${sensorData.type} sensor data: ${sensorData.data}`,
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
    });
    
    // 4. Create NFT Metadata
    const nftMetadata = {
      name: sensorData.title,
      description: `Agricultural IoT Sensor Data - ${sensorData.type} from ${location}. This NFT represents ownership of the IP Asset for this sensor data.`,
      image: finalImageUrl,
      attributes: [
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
          value: 'Agricultural IoT Network',
        },
      ],
    };
    
    // 5. Upload metadata to IPFS
    const ipIpfsHash = await uploadJSONToIPFS(ipMetadata);
    const ipHash = await getJSONHash(ipMetadata);
    const nftIpfsHash = await uploadJSONToIPFS(nftMetadata);
    const nftHash = await getJSONHash(nftMetadata);
    
    // 6. Prepare royalty shares if specified
    const royaltyShares = (royaltyRecipient && royaltyPercentage) ? [
      {
        recipient: royaltyRecipient,
        percentage: royaltyPercentage,
      }
    ] : undefined;
    
    // 7. Register Derivative IP Asset
    const response = await client.ipAsset.registerDerivativeIpAsset({
      nft: { 
        type: 'mint', 
        spgNftContract: SPGNFTContractAddress 
      },
      derivData: {
        parentIpIds: [parentIpId],
        licenseTermsIds: [parentLicenseTermsId],
        maxMintingFee: 0n, // No limit
        maxRevenueShare: 100, // 100%
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
    
    // 8. Generate Story Explorer URL
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
    royaltyRecipient?: Address,
    royaltyPercentage?: number,
    sensorDataId?: number
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
          royaltyRecipient: royaltyRecipient || address, // Default to connected wallet
          royaltyPercentage,
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
  
  return { 
    registerDerivativeIP,
    isConnected: !!walletClient && !!address 
  };
}