
import { IpMetadata, PILFlavor } from '@story-protocol/core-sdk';
import { parseEther, Address } from 'viem';
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

export interface IPRegistrationParams {
  sensorData: SensorData;
  location: string;
  creatorName: string;
  creatorAddress: Address;
  imageUrl?: string;
  revenueShare?: number;
  mintingFee?: number;
}

export interface IPRegistrationResult {
  success: boolean;
  ipId?: string;
  txHash?: string;
  licenseTermsIds?: bigint[];
  storyExplorerUrl?: string;
  error?: string;
  metadataUrl?: string;
}

export async function registerSensorDataAsIP(
  params: IPRegistrationParams,
  walletClient: any
): Promise<IPRegistrationResult> {
  try {
    const { sensorData, location, creatorName, creatorAddress, imageUrl, revenueShare, mintingFee } = params;
    
    // Create Story client with wallet
    const client = createStoryClient(walletClient);
    
    // 1. Generate character file for AI metadata
    const characterFile = generateCharacterFileForSensorData(sensorData, location);
    const characterFileContent = JSON.stringify(characterFile, null, 2);
    
    // Upload character file to IPFS
    const characterFileHash = await uploadFileToIPFS(
      characterFileContent, 
      `${sensorData.type}-${location}-character.json`
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
    
    // 6. Register IP Asset with PIL terms using user-specified values
    const finalRevenueShare = revenueShare ?? 10; // Default to 10% if not provided
    const finalMintingFee = mintingFee ?? 0.01;   // Default to 0.01 if not provided
    
    const response = await client.ipAsset.registerIpAsset({
      nft: { 
        type: 'mint', 
        spgNftContract: SPGNFTContractAddress 
      },
      licenseTermsData: [
        {
          terms: PILFlavor.commercialRemix({
            commercialRevShare: finalRevenueShare, // Use user-specified revenue share
            defaultMintingFee: parseEther(String(finalMintingFee)), // Use user-specified minting fee
            currency: '0x1514000000000000000000000000000000000000', // WIP token on Aeneid
          }),
        },
      ],
      ipMetadata: {
        ipMetadataURI: `https://ipfs.io/ipfs/${ipIpfsHash}`,
        ipMetadataHash: ipHash,
        nftMetadataURI: `https://ipfs.io/ipfs/${nftIpfsHash}`,
        nftMetadataHash: nftHash,
      },
    });
    
    // 7. Generate Story Explorer URL AFTER successful registration
    const storyExplorerUrl = `${networkInfo.protocolExplorer}/ipa/${response.ipId}`;
    
    return {
      success: true,
      ipId: response.ipId,
      txHash: response.txHash,
      licenseTermsIds: response.licenseTermsIds,
      storyExplorerUrl: storyExplorerUrl,
      metadataUrl: `https://ipfs.io/ipfs/${ipIpfsHash}`,
    };
    
  } catch (error: any) {
    console.error('IP Registration Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to register IP',
    };
  }
}

// Hook to use in React components
export function useIPRegistration(supabaseService?: SupabaseService) {
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  
  const registerIP = async (
    sensorData: SensorData,
    location: string,
    creatorName: string,
    imageUrl?: string,
    sensorDataId?: number,
    revenueShare?: number,
    mintingFee?: number
  ): Promise<IPRegistrationResult> => {
    if (!walletClient || !address) {
      return {
        success: false,
        error: 'Wallet not connected',
      };
    }
    
    try {
      // 1. First, register IP on Story Protocol
      const registrationResult = await registerSensorDataAsIP(
        {
          sensorData,
          location,
          creatorName,
          creatorAddress: address,
          revenueShare,
          mintingFee,
        },
        walletClient
      );
      
      // 2. Only save to database if registration was successful AND we have sensorDataId
      if (registrationResult.success && sensorDataId && supabaseService) {
        try {
          // Convert licenseTermsIds from bigint[] to string[] for JSON storage
          const licenseTermsIds = registrationResult.licenseTermsIds?.map(id => id.toString());
          
          // Save IP registration data to database with revenue share and minting fee
          const saveResult = await supabaseService.saveIPRegistrationData(
            sensorDataId,
            {
              creator_address: address,
              ip_asset_id: registrationResult.ipId!,
              story_explorer_url: registrationResult.storyExplorerUrl!,
              transaction_hash: registrationResult.txHash,
              license_terms_ids: licenseTermsIds,
              metadata_url: registrationResult.metadataUrl,
              revenue_share: revenueShare ?? 10,      // Save user-specified revenue share
              minting_fee: mintingFee ?? 0.01,        // Save user-specified minting fee
            }
          );
          
          if (!saveResult.success) {
            console.warn('IP registration succeeded but failed to save to database:', saveResult.error);
            // You might want to queue this for retry or show a warning to user
          } else {
            console.log('IP registration data saved to database successfully');
          }
        } catch (dbError: any) {
          console.error('Database save error:', dbError);
          // Don't fail the whole registration if database save fails
          // The blockchain registration was successful
        }
      }
      
      return registrationResult;
      
    } catch (error: any) {
      console.error('Registration process error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed',
      };
    }
  };
  
  return { registerIP, isConnected: !!walletClient && !!address };
}