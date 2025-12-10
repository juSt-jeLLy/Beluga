// derivativeRegistrationService.ts
import { IpMetadata } from '@story-protocol/core-sdk';
import { Address, parseEther } from 'viem';
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
  royaltyRecipient?: Address;
  royaltyPercentage?: number;
  maxMintingFee?: number;
}

export interface DerivativeRegistrationResult {
  success: boolean;
  ipId?: string;
  txHash?: string;
  storyExplorerUrl?: string;
  parentIpId?: string;
  error?: string;
  metadataUrl?: string;
  nftTokenId?: string;
  nftContractAddress?: string;
  characterFileUrl?: string;
  characterFileHash?: string;
  imageUrl?: string;
  imageHash?: string;
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
      maxMintingFee,
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
        {
          trait_type: 'Derivative Type',
          value: 'Derivative IP Asset',
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
    
    // 7. Convert maxMintingFee to Wei if provided, otherwise set to 0 (no limit)
    const finalMaxMintingFee = maxMintingFee !== undefined 
      ? parseEther(String(maxMintingFee))
      : 0n;
    
    // 8. Register Derivative IP Asset
    const response = await client.ipAsset.registerDerivativeIpAsset({
      nft: { 
        type: 'mint', 
        spgNftContract: SPGNFTContractAddress 
      },
      derivData: {
        parentIpIds: [parentIpId],
        licenseTermsIds: [parentLicenseTermsId],
        maxMintingFee: finalMaxMintingFee,
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
    
    // 9. Generate Story Explorer URL
    const storyExplorerUrl = `${networkInfo.protocolExplorer}/ipa/${response.ipId}`;
    
    return {
      success: true,
      ipId: response.ipId,
      txHash: response.txHash,
      storyExplorerUrl: storyExplorerUrl,
      parentIpId: parentIpId,
      metadataUrl: `https://ipfs.io/ipfs/${ipIpfsHash}`,
      nftTokenId: response.tokenId?.toString(),
      nftContractAddress: SPGNFTContractAddress,
      characterFileUrl: characterFileUrl,
      characterFileHash: characterFileHashHex,
      imageUrl: finalImageUrl,
      imageHash: sensorData.imageHash,
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
    maxMintingFee?: number,
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
          royaltyRecipient: royaltyRecipient || address,
          royaltyPercentage,
          maxMintingFee,
        },
        walletClient
      );
      
      // 2. Save to database if successful
      if (registrationResult.success && sensorDataId && supabaseService) {
        try {

          // Second, save to derivative_ip_assets table
          const derivativeDataResult = await supabaseService.saveDerivativeIPRegistration({
            sensor_data_id: sensorDataId,
            derivative_ip_id: registrationResult.ipId!,
            parent_ip_id: parentIpId,
            license_terms_id: parentLicenseTermsId.toString(),
            creator_name: creatorName,
            creator_address: address,
            royalty_recipient: royaltyRecipient || address,
            royalty_percentage: royaltyPercentage,
            max_minting_fee: maxMintingFee || 0,
            max_revenue_share: 100, // As set in registration
            max_rts: 100_000_000, // As set in registration
            transaction_hash: registrationResult.txHash!,
            story_explorer_url: registrationResult.storyExplorerUrl,
            metadata_url: registrationResult.metadataUrl,
            character_file_url: registrationResult.characterFileUrl,
            character_file_hash: registrationResult.characterFileHash,
            nft_token_id: registrationResult.nftTokenId,
            nft_contract_address: registrationResult.nftContractAddress,
            nft_metadata_url: registrationResult.metadataUrl, // Using same as IP metadata
            image_url: registrationResult.imageUrl,
            image_hash: registrationResult.imageHash,
          });
          
          if (!derivativeDataResult.success) {
            console.error('Failed to save derivative IP data to database:', derivativeDataResult.error);
            // Note: We don't fail the whole operation if DB save fails
            // The blockchain registration was successful
          } else {
            console.log('✅ Derivative IP registration data saved to database successfully');
            console.log('Database Record ID:', derivativeDataResult.data?.id);
          }
          
        } catch (dbError: any) {
          console.error('Database save error:', dbError);
          // Don't fail the operation - blockchain registration succeeded
        }
      } else if (registrationResult.success && !sensorDataId) {
        console.warn('⚠️ Derivative IP registered on blockchain but no sensor_data_id provided for database save');
      } else if (registrationResult.success && !supabaseService) {
        console.warn('⚠️ Derivative IP registered on blockchain but no supabaseService provided for database save');
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