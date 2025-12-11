
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
import { SupabaseService } from '@/services/supabaseService';
import { 
  generateResearchPaper, 
  exportPaperAsJSON,
  type IPMetadataFromCore 
} from './paperGenerationService';
import { 
  generateEnhancedDerivativeMetadata,
  validateDerivativeMetadataParams,
  createMetadataSummary,
  type DerivativeMetadataParams 
} from './derivativeMetadataService';

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
  sensorDataRecord?: any; // Full sensor data record from database
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
  paperFileUrl?: string; // Changed from characterFileUrl
  paperFileHash?: string; // Changed from characterFileHash
  imageUrl?: string;
  imageHash?: string;
}

/**
 * Register sensor data as a derivative IP Asset with research paper
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
      sensorDataRecord,
    } = params;
    
    // Create Story client with wallet
    const client = createStoryClient(walletClient);
    
    // 1. Generate research paper instead of character file
    console.log('Generating research paper for derivative IP...');
    
    // Create metadata structure for paper generation
    const ipMetadataForPaper: IPMetadataFromCore = {
      ipId: parentIpId, // Parent IP ID for reference
      title: sensorData.title,
      description: `${location} - ${sensorData.type} sensor data`,
      creators: [
        {
          name: creatorName,
          address: creatorAddress,
          contributionPercent: 100,
        },
      ],
      createdAt: new Date(sensorData.timestamp).getTime().toString(),
      image: sensorData.imageHash ? `https://ipfs.io/ipfs/${sensorData.imageHash}` : undefined,
      imageHash: sensorData.imageHash,
    };
    
    // Use sensorDataRecord if provided, otherwise create from sensorData
    const recordForPaper = sensorDataRecord || {
      id: 0,
      type: sensorData.type,
      title: sensorData.title,
      data: sensorData.data,
      location: location,
      timestamp: sensorData.timestamp,
      sensor_health: sensorData.sensorHealth,
      source: 'gmail' as const,
      creator_address: creatorAddress,
      image_hash: sensorData.imageHash,
    };
    
    // Generate the research paper
    const researchPaper = await generateResearchPaper(recordForPaper, ipMetadataForPaper);
    const paperJSON = exportPaperAsJSON(researchPaper);
    
    console.log('Research paper generated successfully');
    
    // Upload research paper to IPFS
    const paperFileHash = await uploadFileToIPFS(
      paperJSON, 
      `${sensorData.type}-${location}-derivative-paper.json`
    );
    const paperFileUrl = `https://ipfs.io/ipfs/${paperFileHash}`;
    
    console.log('Research paper uploaded to IPFS:', paperFileUrl);
    
    // Get hash of paper file
    const paperFileHashHex = await getStringHash(paperJSON);
    
    // 2. Generate derivative metadata using the new service
    console.log('Generating derivative metadata...');
    
    const metadataParams: DerivativeMetadataParams = {
      originalTitle: sensorData.title,
      sensorType: sensorData.type,
      location: location,
      timestamp: sensorData.timestamp,
      sensorHealth: sensorData.sensorHealth,
      parentIpId: parentIpId,
      rawData: sensorData.data,
      creatorName: creatorName,
      creatorAddress: creatorAddress,
      parentCreatorAddress: sensorDataRecord?.creator_address as Address | undefined,
      imageHash: sensorData.imageHash,
      dataSource: sensorDataRecord?.source,
      registrationDate: new Date().toISOString(),
    };
    
    // Validate metadata parameters
    const validation = validateDerivativeMetadataParams(metadataParams);
    if (!validation.valid) {
      console.error('Metadata validation failed:', validation.errors);
      throw new Error(`Invalid metadata parameters: ${validation.errors.join(', ')}`);
    }
    
    // Generate enhanced metadata
    const { ipMetadata: derivativeIPMeta, nftMetadata: derivativeNFTMeta, displaySensorType } = 
      generateEnhancedDerivativeMetadata(metadataParams);
    
    console.log('Derivative metadata generated:');
    console.log('Title:', derivativeIPMeta.title);
    console.log('Description preview:', derivativeIPMeta.description.substring(0, 200) + '...');
    console.log('Description length:', derivativeIPMeta.description.length, 'characters');
    console.log('NFT attributes count:', derivativeNFTMeta.attributes.length);
    console.log(createMetadataSummary(derivativeIPMeta, derivativeNFTMeta));
    
    // 3. Use image hash from sensor data
    const finalImageUrl = `https://ipfs.io/ipfs/${sensorData.imageHash}`;
    const imageHash = sensorData.imageHash.startsWith('0x') 
      ? sensorData.imageHash as `0x${string}`
      : `0x${sensorData.imageHash}` as `0x${string}`;    
    
    // 4. Create IP Metadata with research paper as AI metadata and derivative-specific content
    console.log('Creating IP Metadata with enhanced derivative information...');
    
    const ipMetadata: IpMetadata = client.ipAsset.generateIpMetadata({
      title: derivativeIPMeta.title,
      description: derivativeIPMeta.description,
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
        characterFileUrl: paperFileUrl, // Store paper URL in characterFileUrl field
        characterFileHash: paperFileHashHex,
      },
    });
    
    console.log('IP Metadata created with title:', derivativeIPMeta.title);
    console.log('Description length:', derivativeIPMeta.description.length, 'characters');
    console.log('IP Metadata description preview:', ipMetadata.description?.substring(0, 200) + '...');
    console.log('Metadata object keys:', Object.keys(ipMetadata));
    
    // Verify the metadata contains all our enhanced information
    if (ipMetadata.description && ipMetadata.description.includes('## Derivative Agricultural Data Analysis')) {
      console.log('✅ Enhanced description successfully included in IP Metadata');
    } else {
      console.warn('⚠️ Enhanced description may have been modified by Story Protocol SDK');
      console.log('Actual description:', ipMetadata.description);
    }
    
    // 5. Create NFT Metadata using derivative metadata service
    const nftMetadata = {
      name: derivativeNFTMeta.name,
      description: derivativeNFTMeta.description,
      image: finalImageUrl,
      attributes: derivativeNFTMeta.attributes,
    };
    
    console.log('NFT Metadata created with', nftMetadata.attributes.length, 'attributes');
    
    // 6. Upload metadata to IPFS
    console.log('Uploading metadata to IPFS...');
    const ipIpfsHash = await uploadJSONToIPFS(ipMetadata);
    const ipHash = await getJSONHash(ipMetadata);
    const nftIpfsHash = await uploadJSONToIPFS(nftMetadata);
    const nftHash = await getJSONHash(nftMetadata);
    
    console.log('Metadata uploaded to IPFS:', {
      ipMetadata: `https://ipfs.io/ipfs/${ipIpfsHash}`,
      nftMetadata: `https://ipfs.io/ipfs/${nftIpfsHash}`
    });
    
    // 7. Prepare royalty shares if specified
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
    
    console.log('Registering derivative IP on blockchain...');
    
    // 9. Register Derivative IP Asset
    const response = await client.ipAsset.registerDerivativeIpAsset({
      nft: { 
        type: 'mint', 
        spgNftContract: SPGNFTContractAddress 
      },
      derivData: {
        parentIpIds: [parentIpId],
        licenseTermsIds: [parentLicenseTermsId],
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
    
    console.log('Derivative IP registered successfully:', response.ipId);
    
    // 10. Generate Story Explorer URL
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
      paperFileUrl: paperFileUrl, // Changed from characterFileUrl
      paperFileHash: paperFileHashHex, // Changed from characterFileHash
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
   * Register new derivative IP from sensor data with research paper
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
      // Fetch full sensor data record from database if ID is provided
      let sensorDataRecord = null;
      if (sensorDataId && supabaseService) {
        console.log('Fetching sensor data record for ID:', sensorDataId);
        
        // Fetch all sensor data and find the matching record
        const result = await supabaseService.fetchSensorData({
          has_ip_registration: true
        });
        
        if (result.success && result.data) {
          sensorDataRecord = result.data.find(record => record.id === sensorDataId);
          
          if (sensorDataRecord) {
            console.log('Found sensor data record:', {
              id: sensorDataRecord.id,
              title: sensorDataRecord.title,
              type: sensorDataRecord.type,
              location: sensorDataRecord.location,
              ip_asset_id: sensorDataRecord.ip_asset_id
            });
          } else {
            console.warn('Sensor data record not found for ID:', sensorDataId);
          }
        } else {
          console.warn('Failed to fetch sensor data:', result.error);
        }
      } else {
        console.log('No sensor data ID or supabase service available');
      }
      
      // 1. Register derivative IP on Story Protocol with research paper
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
          sensorDataRecord, // Pass the full record for paper generation
        },
        walletClient
      );
      
      // 2. Save to database if successful
      if (registrationResult.success && sensorDataId && supabaseService) {
        try {
          // Save to derivative_ip_assets table
          const derivativeDataResult = await supabaseService.saveDerivativeIPRegistration({
            sensor_data_id: sensorDataId,
            derivative_ip_id: registrationResult.ipId!,
            parent_ip_id: parentIpId,
            license_terms_id: parentLicenseTermsId.toString(),
            creator_name: creatorName,
            creator_address: address,
            royalty_recipient: royaltyRecipient || address,
            royalty_percentage: royaltyPercentage,
            transaction_hash: registrationResult.txHash!,
            story_explorer_url: registrationResult.storyExplorerUrl,
            metadata_url: registrationResult.metadataUrl,
            character_file_url: registrationResult.paperFileUrl, // Store paper URL
            character_file_hash: registrationResult.paperFileHash, // Store paper hash
            nft_token_id: registrationResult.nftTokenId,
            nft_contract_address: registrationResult.nftContractAddress,
            nft_metadata_url: registrationResult.metadataUrl,
            image_url: registrationResult.imageUrl,
            image_hash: registrationResult.imageHash,
          });
          
          if (!derivativeDataResult.success) {
            console.error('Failed to save derivative IP data to database:', derivativeDataResult.error);
          } else {
            console.log('✅ Derivative IP with research paper saved to database successfully');
            console.log('Database Record ID:', derivativeDataResult.data?.id);
          }
          
        } catch (dbError: any) {
          console.error('Database save error:', dbError);
        }
      } else if (registrationResult.success && !sensorDataId) {
        console.warn('⚠️ Derivative IP registered but no sensor_data_id provided for database save');
      } else if (registrationResult.success && !supabaseService) {
        console.warn('⚠️ Derivative IP registered but no supabaseService provided for database save');
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
