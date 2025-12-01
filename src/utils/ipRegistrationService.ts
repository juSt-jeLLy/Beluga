import { IpMetadata, PILFlavor } from '@story-protocol/core-sdk';
import { parseEther, Address } from 'viem';
import { useWalletClient, useAccount } from 'wagmi';
import { SensorData } from '@/services/gmailService';
import { createStoryClient, SPGNFTContractAddress } from './config';
import { 
  uploadJSONToIPFS, 
  uploadFileToIPFS, 
  getJSONHash, 
  getHashFromUrl,
  getStringHash 
} from './uploadToIpfs';
import { generateCharacterFileForSensorData } from './generateCharacterFile';

export interface IPRegistrationParams {
  sensorData: SensorData;
  location: string;
  creatorName: string;
  creatorAddress: Address;
  imageUrl?: string;
}

export interface IPRegistrationResult {
  success: boolean;
  ipId?: string;
  txHash?: string;
  licenseTermsIds?: bigint[];
  ownerAddress?: string;
  characterFileUrl?: string;
  ipMetadataUri?: string;
  nftMetadataUri?: string;
  error?: string;
}

export async function registerSensorDataAsIP(
  params: IPRegistrationParams,
  walletClient: any
): Promise<IPRegistrationResult> {
  try {
    const { sensorData, location, creatorName, creatorAddress, imageUrl } = params;
    
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
    
    // 2. Prepare image (use default sensor icon if no image provided)
    const finalImageUrl = imageUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${sensorData.type}`;
    const imageHash = await getHashFromUrl(finalImageUrl);
    
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
    
    const ipMetadataUri = `https://ipfs.io/ipfs/${ipIpfsHash}`;
    const nftMetadataUri = `https://ipfs.io/ipfs/${nftIpfsHash}`;
    
    // 6. Register IP Asset with PIL terms
    const response = await client.ipAsset.registerIpAsset({
      nft: { 
        type: 'mint', 
        spgNftContract: SPGNFTContractAddress 
      },
      licenseTermsData: [
        {
          terms: PILFlavor.commercialRemix({
            commercialRevShare: 10, // 10% revenue share
            defaultMintingFee: parseEther('0.01'), // 0.01 IP tokens
            currency: '0x1514000000000000000000000000000000000000', // WIP token on Aeneid
          }),
        },
      ],
      ipMetadata: {
        ipMetadataURI: ipMetadataUri,
        ipMetadataHash: ipHash,
        nftMetadataURI: nftMetadataUri,
        nftMetadataHash: nftHash,
      },
    });
    
    return {
      success: true,
      ipId: response.ipId,
      txHash: response.txHash,
      licenseTermsIds: response.licenseTermsIds,
      ownerAddress: creatorAddress,
      characterFileUrl: characterFileUrl,
      ipMetadataUri: ipMetadataUri,
      nftMetadataUri: nftMetadataUri,
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
export function useIPRegistration() {
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  
  const registerIP = async (
    sensorData: SensorData,
    location: string,
    creatorName: string,
    imageUrl?: string
  ): Promise<IPRegistrationResult> => {
    if (!walletClient || !address) {
      return {
        success: false,
        error: 'Wallet not connected',
      };
    }
    
    return registerSensorDataAsIP(
      {
        sensorData,
        location,
        creatorName,
        creatorAddress: address,
        imageUrl,
      },
      walletClient
    );
  };
  
  return { registerIP, isConnected: !!walletClient && !!address };
}