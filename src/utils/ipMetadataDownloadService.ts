// src/utils/ipMetadataDownloadService.ts
import { Address } from 'viem';
import { useState } from 'react';
import { getEnrichedMetadata, type EnrichedIPMetadata, getMetadataURI } from './coreMetadataViewService';
import axios from 'axios';

export interface CompleteIPData {
  // Basic Information
  ipAssetId: Address;
  title: string;
  description: string;
  
  // Registration Details
  registrationDate: string;
  registeredTimestamp: string;
  owner: Address;
  
  // Location & Context
  location?: string;
  sensorType?: string;
  sensorHealth?: string;
  dataTimestamp?: string;
  
  // Creators
  creators: Array<{
    name: string;
    address: string;
    contributionPercent: number;
  }>;
  
  // Media & Files (directly from metadataURI JSON)
  image?: string;
  imageHash?: string;
  mediaUrl?: string;
  mediaHash?: string;
  mediaType?: string;
  
  // Metadata URLs
  metadataURI?: string;
  nftTokenURI?: string;
  
  // Metadata Hashes
  metadataHash?: string;
  nftMetadataHash?: string;
  
  // IP Metadata Details (complete from metadataURI)
  ipMetadata?: {
    raw: string;
    parsed: any;
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
  };
  
  // NFT Metadata Details (from nftTokenURI)
  nftMetadata?: {
    raw: string;
    parsed: any;
  };
  
  // AI Character File (complete JSON from aiMetadata.characterFileUrl)
  characterFile?: {
    url: string;
    hash: string;
    raw: string;
    parsed: any;
  };
  
  // License Information (from profile context)
  licenseInfo?: {
    licenseTermsId: string;
    amount: number;
    mintingFeePaid?: number;
    unitMintingFee?: number;
    revenueSharePercentage?: number;
    licenseTokenIds?: string[];
    mintedAt?: string;
    receiverAddress?: string;
    minterAddress?: string;
  };
  
  // Raw Core Metadata
  rawCoreMetadata?: EnrichedIPMetadata;
  
  // Additional Context
  datasetContext?: {
    sensorDataId?: number;
    rawSensorData?: string;
    source?: string;
  };
}

/**
 * Fetch content from IPFS URL
 */
async function fetchFromIPFS(url: string): Promise<{ raw: string; parsed: any }> {
  try {
    // Convert ipfs:// to https://ipfs.io/ipfs/
    const fetchUrl = url.startsWith('ipfs://') 
      ? url.replace('ipfs://', 'https://ipfs.io/ipfs/')
      : url;
    
    console.log('Fetching from IPFS:', fetchUrl);
    
    const response = await axios.get(fetchUrl, {
      timeout: 30000, // 30 second timeout
      headers: {
        'Accept': 'application/json, text/plain, */*'
      }
    });
    
    console.log('IPFS fetch successful, response type:', typeof response.data);
    
    const raw = typeof response.data === 'string' 
      ? response.data 
      : JSON.stringify(response.data, null, 2);
    
    return {
      raw,
      parsed: response.data
    };
  } catch (error: any) {
    console.error('Error fetching from IPFS:', {
      url,
      error: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    
    return {
      raw: `Failed to fetch content: ${error.message}`,
      parsed: null
    };
  }
}

/**
 * Extract IPFS hash from URL
 */
function extractIPFSHash(url: string): string {
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', '');
  }
  if (url.includes('ipfs.io/ipfs/')) {
    return url.split('ipfs.io/ipfs/')[1].split('?')[0];
  }
  if (url.includes('/ipfs/')) {
    return url.split('/ipfs/')[1].split('?')[0];
  }
  return url;
}

/**
 * Fetch complete IP metadata including all IPFS files
 */
export async function fetchCompleteIPMetadata(
  ipAssetId: Address,
  licenseData?: any,
  datasetContext?: any
): Promise<CompleteIPData> {
  try {
    console.log('=== Starting Complete Metadata Fetch ===');
    console.log('IP Asset ID:', ipAssetId);
    console.log('Has license data:', !!licenseData);
    console.log('Has dataset context:', !!datasetContext);
    
    // 1. Get metadata URI from CoreMetadataViewModule
    console.log('Step 1: Fetching metadata URI from CoreMetadataViewModule...');
    
    let metadataURI: string | null = null;
    let nftTokenURI: string | null = null;
    let owner: Address = '0x0000000000000000000000000000000000000000' as Address;
    let registrationDate: bigint = 0n;
    let metadataHash: string = '';
    let nftMetadataHash: string = '';
    
    try {
      // Fetch metadata URI directly
      metadataURI = await getMetadataURI(ipAssetId);
      console.log('Metadata URI:', metadataURI);
      
      // Also fetch other core metadata
      const coreMetadata = await getEnrichedMetadata(ipAssetId);
      nftTokenURI = coreMetadata.nftTokenURI;
      owner = coreMetadata.owner || '0x0000000000000000000000000000000000000000' as Address;
      registrationDate = coreMetadata.registrationDate || 0n;
      metadataHash = coreMetadata.metadataHash || '';
      nftMetadataHash = coreMetadata.nftMetadataHash || '';
      
      console.log('Additional metadata fetched:', {
        hasNftTokenURI: !!nftTokenURI,
        nftTokenURI,
        owner,
        registrationDate: registrationDate?.toString(),
        metadataHash,
        nftMetadataHash
      });
    } catch (error: any) {
      console.error('Failed to fetch metadata from CoreMetadataViewModule:', error);
      metadataURI = null;
    }
    
    // 2. Fetch IP metadata from metadataURI (main source)
    let ipMetadataFromURI: any = null;
    if (metadataURI) {
      console.log('Step 2: Fetching IP metadata from URI:', metadataURI);
      const ipMetadataResult = await fetchFromIPFS(metadataURI);
      if (ipMetadataResult.parsed) {
        ipMetadataFromURI = ipMetadataResult.parsed;
        console.log('IP metadata fetched from URI:', {
          title: ipMetadataFromURI.title,
          description: ipMetadataFromURI.description?.substring(0, 100),
          hasCreators: !!ipMetadataFromURI.creators,
          image: ipMetadataFromURI.image,
          imageHash: ipMetadataFromURI.imageHash,
          mediaUrl: ipMetadataFromURI.mediaUrl,
          mediaHash: ipMetadataFromURI.mediaHash,
          mediaType: ipMetadataFromURI.mediaType,
          hasAiMetadata: !!ipMetadataFromURI.aiMetadata,
          characterFileUrl: ipMetadataFromURI.aiMetadata?.characterFileUrl,
          allKeys: Object.keys(ipMetadataFromURI)
        });
      }
    } else {
      console.warn('No metadata URI found for IP asset');
      ipMetadataFromURI = {};
    }
    
    // 3. Fetch NFT metadata from nftTokenURI
    let nftMetadataFromURI: any = null;
    if (nftTokenURI) {
      console.log('Step 3: Fetching NFT metadata from URI:', nftTokenURI);
      const nftMetadataResult = await fetchFromIPFS(nftTokenURI);
      if (nftMetadataResult.parsed) {
        nftMetadataFromURI = nftMetadataResult.parsed;
        console.log('NFT metadata fetched from URI:', Object.keys(nftMetadataFromURI));
      }
    }
    
    // Use fetched metadata from metadataURI as primary source
    const ipMetadataDetails = ipMetadataFromURI || {};
    
    // 4. Fetch Character File from aiMetadata if we have the URL
    let characterFile: { url: string; hash: string; raw: string; parsed: any } | undefined;
    const characterFileUrl = ipMetadataDetails.aiMetadata?.characterFileUrl;
    const characterFileHash = ipMetadataDetails.aiMetadata?.characterFileHash;
    
    if (characterFileUrl) {
      console.log('Step 4: Fetching character file from IPFS...');
      console.log('URL:', characterFileUrl);
      console.log('Hash:', characterFileHash);
      
      try {
        const characterContent = await fetchFromIPFS(characterFileUrl);
        characterFile = {
          url: characterFileUrl,
          hash: characterFileHash || '',
          raw: characterContent.raw,
          parsed: characterContent.parsed
        };
        
        console.log('Character file successfully fetched:', {
          hasContent: !!characterFile.raw,
          contentLength: characterFile.raw?.length,
          hasParsed: !!characterFile.parsed,
          parsedKeys: characterFile.parsed ? Object.keys(characterFile.parsed) : []
        });
      } catch (error: any) {
        console.error('Failed to fetch character file:', error);
      }
    } else {
      console.warn('No character file URL found in IP metadata');
    }
    
    // 5. Extract registration date
    const registrationDateObj = registrationDate 
      ? new Date(Number(registrationDate) * 1000)
      : new Date();
    
    // 6. Extract creators from ipMetadataDetails
    const creators = ipMetadataDetails.creators || [];
    
    // 7. Prepare IP metadata as raw JSON string
    const ipMetadata = ipMetadataDetails && Object.keys(ipMetadataDetails).length > 0 ? {
      raw: JSON.stringify(ipMetadataDetails, null, 2),
      parsed: ipMetadataDetails,
      title: ipMetadataDetails.title,
      description: ipMetadataDetails.description,
      createdAt: ipMetadataDetails.createdAt,
      creators: ipMetadataDetails.creators,
      image: ipMetadataDetails.image,
      imageHash: ipMetadataDetails.imageHash,
      mediaUrl: ipMetadataDetails.mediaUrl,
      mediaHash: ipMetadataDetails.mediaHash,
      mediaType: ipMetadataDetails.mediaType,
      aiMetadata: ipMetadataDetails.aiMetadata
    } : undefined;
    
    // 8. Prepare NFT metadata as raw JSON string
    const nftMetadata = nftMetadataFromURI && Object.keys(nftMetadataFromURI).length > 0 ? {
      raw: JSON.stringify(nftMetadataFromURI, null, 2),
      parsed: nftMetadataFromURI
    } : undefined;
    
    // 9. Build complete IP data
    const completeData: CompleteIPData = {
      ipAssetId,
      title: ipMetadataDetails.title || 
             datasetContext?.title || 
             'Untitled IP Asset',
      description: ipMetadataDetails.description || '',
      
      registrationDate: registrationDateObj.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      }),
      registeredTimestamp: registrationDateObj.toISOString(),
      owner: owner,
      
      location: datasetContext?.location,
      sensorType: datasetContext?.type,
      sensorHealth: datasetContext?.sensor_health,
      dataTimestamp: datasetContext?.timestamp,
      
      creators: creators,
      
      // Directly use fields from metadataURI JSON
      image: ipMetadataDetails.image,
      imageHash: ipMetadataDetails.imageHash,
      mediaUrl: ipMetadataDetails.mediaUrl,
      mediaHash: ipMetadataDetails.mediaHash,
      mediaType: ipMetadataDetails.mediaType,
      
      metadataURI: metadataURI || undefined,
      nftTokenURI: nftTokenURI || undefined,
      metadataHash: metadataHash || undefined,
      nftMetadataHash: nftMetadataHash || undefined,
      
      ipMetadata,
      nftMetadata,
      characterFile,
      
      licenseInfo: licenseData ? {
        licenseTermsId: licenseData.license_terms_id,
        amount: licenseData.amount,
        mintingFeePaid: licenseData.minting_fee_paid,
        unitMintingFee: licenseData.unit_minting_fee,
        revenueSharePercentage: licenseData.revenue_share_percentage,
        licenseTokenIds: licenseData.license_token_ids,
        mintedAt: licenseData.minted_at,
        receiverAddress: licenseData.receiver_address,
        minterAddress: licenseData.minter_address,
      } : undefined,
      
      rawCoreMetadata: {
        nftTokenURI: nftTokenURI || '',
        nftMetadataHash: nftMetadataHash as `0x${string}` || '0x',
        metadataURI: metadataURI || '',
        metadataHash: metadataHash as `0x${string}` || '0x',
        registrationDate: registrationDate,
        owner: owner,
        isSupported: true,
        ipMetadataDetails: ipMetadataDetails
      },
      
      datasetContext: datasetContext ? {
        sensorDataId: datasetContext.id,
        rawSensorData: datasetContext.data,
        source: datasetContext.source,
      } : undefined,
    };
    
    console.log('=== Complete IP Data Assembly Summary ===');
    console.log('Title:', completeData.title);
    console.log('Description length:', completeData.description?.length || 0);
    console.log('Image (from metadataURI):', completeData.image);
    console.log('Image Hash (from metadataURI):', completeData.imageHash);
    console.log('Media URL (from metadataURI):', completeData.mediaUrl);
    console.log('Media Hash (from metadataURI):', completeData.mediaHash);
    console.log('Media Type (from metadataURI):', completeData.mediaType);
    console.log('Has IP Metadata:', !!completeData.ipMetadata);
    console.log('Has NFT Metadata:', !!completeData.nftMetadata);
    console.log('Has Character File:', !!completeData.characterFile);
    console.log('Character file content length:', completeData.characterFile?.raw?.length || 0);
    console.log('Creators count:', completeData.creators.length);
    console.log('Has License Info:', !!completeData.licenseInfo);
    console.log('Has Dataset Context:', !!completeData.datasetContext);
    console.log('Metadata URI:', completeData.metadataURI);
    console.log('NFT Token URI:', completeData.nftTokenURI);
    console.log('=== End Summary ===');
    
    return completeData;
    
  } catch (error: any) {
    console.error('Error fetching complete IP metadata:', error);
    throw new Error(`Failed to fetch complete IP metadata: ${error.message}`);
  }
}

/**
 * Export complete IP data as JSON
 */
export function exportAsJSON(data: CompleteIPData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Export complete IP data as formatted Markdown
 */
export function exportAsMarkdown(data: CompleteIPData): string {
  let md = `# ${data.title}\n\n`;
  
  // Basic Information
  md += `## Basic Information\n\n`;
  md += `- **IP Asset ID:** \`${data.ipAssetId}\`\n`;
  md += `- **Owner:** \`${data.owner}\`\n`;
  md += `- **Registration Date:** ${data.registrationDate}\n`;
  md += `- **Registration Timestamp:** ${data.registeredTimestamp}\n\n`;
  
  // Description
  if (data.description) {
    md += `## Description\n\n`;
    md += `${data.description}\n\n`;
  }
  
  // Location & Context
  if (data.location || data.sensorType) {
    md += `## Location & Context\n\n`;
    if (data.location) md += `- **Location:** ${data.location}\n`;
    if (data.sensorType) md += `- **Sensor Type:** ${data.sensorType}\n`;
    if (data.sensorHealth) md += `- **Sensor Health:** ${data.sensorHealth}\n`;
    if (data.dataTimestamp) md += `- **Data Timestamp:** ${data.dataTimestamp}\n`;
    md += `\n`;
  }
  
  // Creators
  if (data.creators && data.creators.length > 0) {
    md += `## Creators\n\n`;
    data.creators.forEach((creator, idx) => {
      md += `${idx + 1}. **${creator.name}**\n`;
      md += `   - Address: \`${creator.address}\`\n`;
      md += `   - Contribution: ${creator.contributionPercent}%\n\n`;
    });
  }
  
  // Media & Files - ENHANCED SECTION with direct metadataURI fields
  md += `## Media & Files (from metadataURI)\n\n`;
  
  if (data.image) {
    md += `### Image\n`;
    md += `- **URL:** ${data.image}\n`;
    if (data.imageHash) md += `- **Image Hash:** \`${data.imageHash}\`\n`;
    if (data.image && data.image.startsWith('ipfs://')) {
      const ipfsHash = data.image.replace('ipfs://', '');
      md += `- **IPFS Hash:** \`${ipfsHash}\`\n`;
      md += `- **IPFS Gateway URL:** https://ipfs.io/ipfs/${ipfsHash}\n`;
    }
    md += `\n`;
  }
  
  if (data.mediaUrl) {
    md += `### Media File\n`;
    md += `- **URL:** ${data.mediaUrl}\n`;
    if (data.mediaHash) md += `- **Media Hash:** \`${data.mediaHash}\`\n`;
    if (data.mediaType) md += `- **Media Type:** ${data.mediaType}\n`;
    if (data.mediaUrl && data.mediaUrl.startsWith('ipfs://')) {
      const ipfsHash = data.mediaUrl.replace('ipfs://', '');
      md += `- **IPFS Hash:** \`${ipfsHash}\`\n`;
      md += `- **IPFS Gateway URL:** https://ipfs.io/ipfs/${ipfsHash}\n`;
    }
    md += `\n`;
  }
  
  // AI Character File - PROMINENT SECTION with full JSON
  if (data.characterFile) {
    md += `### AI Character File (Complete)\n\n`;
    md += `This character file enables AI-powered interpretation and natural language interaction with the sensor data.\n\n`;
    md += `- **URL:** ${data.characterFile.url}\n`;
    if (data.characterFile.hash) md += `- **Content Hash:** \`${data.characterFile.hash}\`\n`;
    if (data.characterFile.url.startsWith('ipfs://')) {
      const ipfsHash = data.characterFile.url.replace('ipfs://', '');
      md += `- **IPFS Hash:** \`${ipfsHash}\`\n`;
      md += `- **IPFS Gateway URL:** https://ipfs.io/ipfs/${ipfsHash}\n`;
    }
    md += `\n#### Complete Character File JSON\n\n`;
    md += `\`\`\`json\n${data.characterFile.raw}\n\`\`\`\n\n`;
  }
  
  // IP Metadata Details (Full JSON from metadataURI)
  if (data.ipMetadata) {
    md += `## IP Metadata (Complete JSON from metadataURI)\n\n`;
    md += `This is the complete metadata stored on IPFS for the IP Asset. It contains all the core information about the intellectual property, including title, description, creators, media references, and AI metadata links.\n\n`;
    md += `**Source URI:** ${data.metadataURI}\n`;
    if (data.metadataHash) md += `**Content Hash:** \`${data.metadataHash}\`\n`;
    md += `\n### Complete IP Metadata JSON\n\n`;
    md += `\`\`\`json\n${data.ipMetadata.raw}\n\`\`\`\n\n`;
    
    // Add parsed details in a readable format
    if (data.ipMetadata.parsed) {
      md += `### Key Metadata Fields\n\n`;
      const parsed = data.ipMetadata.parsed;
      if (parsed.title) md += `- **Title:** ${parsed.title}\n`;
      if (parsed.description) md += `- **Description:** ${parsed.description}\n`;
      if (parsed.createdAt) {
        const createdAtDate = new Date(parseInt(parsed.createdAt));
        md += `- **Created At:** ${createdAtDate.toLocaleString()}\n`;
      }
      if (parsed.creators && parsed.creators.length > 0) {
        md += `- **Creators:**\n`;
        parsed.creators.forEach((c: any) => {
          md += `  - ${c.name} (${c.address}) - ${c.contributionPercent}%\n`;
        });
      }
      if (parsed.image) md += `- **Image URL:** ${parsed.image}\n`;
      if (parsed.imageHash) md += `- **Image Hash:** \`${parsed.imageHash}\`\n`;
      if (parsed.mediaUrl) md += `- **Media URL:** ${parsed.mediaUrl}\n`;
      if (parsed.mediaHash) md += `- **Media Hash:** \`${parsed.mediaHash}\`\n`;
      if (parsed.mediaType) md += `- **Media Type:** ${parsed.mediaType}\n`;
      if (parsed.aiMetadata) {
        md += `- **AI Metadata:**\n`;
        if (parsed.aiMetadata.characterFileUrl) md += `  - Character File URL: ${parsed.aiMetadata.characterFileUrl}\n`;
        if (parsed.aiMetadata.characterFileHash) md += `  - Character File Hash: \`${parsed.aiMetadata.characterFileHash}\`\n`;
      }
      md += `\n`;
    }
  }
  
  // NFT Metadata Details (Full JSON from IPFS)
  if (data.nftMetadata) {
    md += `## NFT Metadata (Complete JSON from IPFS)\n\n`;
    md += `This is the NFT (Non-Fungible Token) metadata that represents ownership of this IP Asset. It includes visual attributes and traits that describe the asset.\n\n`;
    md += `**Source URI:** ${data.nftTokenURI}\n`;
    if (data.nftMetadataHash) md += `**Content Hash:** \`${data.nftMetadataHash}\`\n`;
    md += `\n### Complete NFT Metadata JSON\n\n`;
    md += `\`\`\`json\n${data.nftMetadata.raw}\n\`\`\`\n\n`;
    
    // Add parsed details in a readable format
    if (data.nftMetadata.parsed) {
      md += `### Key NFT Fields\n\n`;
      const parsed = data.nftMetadata.parsed;
      if (parsed.name) md += `- **Name:** ${parsed.name}\n`;
      if (parsed.description) md += `- **Description:** ${parsed.description}\n`;
      if (parsed.image) md += `- **Image:** ${parsed.image}\n`;
      if (parsed.attributes && parsed.attributes.length > 0) {
        md += `- **Attributes:**\n`;
        parsed.attributes.forEach((attr: any) => {
          md += `  - ${attr.trait_type}: ${attr.value}\n`;
        });
      }
      md += `\n`;
    }
  }
  
  // Dataset Context
  if (data.datasetContext) {
    md += `## Dataset Context\n\n`;
    if (data.datasetContext.sensorDataId) md += `- **Sensor Data ID:** ${data.datasetContext.sensorDataId}\n`;
    if (data.datasetContext.source) md += `- **Source:** ${data.datasetContext.source}\n`;
    if (data.datasetContext.rawSensorData) {
      md += `\n### Raw Sensor Data\n\n`;
      md += `\`\`\`\n${data.datasetContext.rawSensorData}\n\`\`\`\n\n`;
    }
  }
  
  // Story Protocol Links
  md += `## Story Protocol Links\n\n`;
  md += `- **IP Asset Explorer:** https://aeneid.explorer.story.foundation/ipa/${data.ipAssetId}\n`;
  if (data.licenseInfo) {
    md += `- **License Terms Explorer:** https://aeneid.explorer.story.foundation/license-terms/${data.licenseInfo.licenseTermsId}\n`;
  }
  md += `\n`;
  
  // Footer
  md += `---\n\n`;
  md += `*Generated on ${new Date().toLocaleString()}*\n\n`;
  md += `*IP Asset: ${data.ipAssetId}*\n\n`;
  md += `*All IPFS content can be accessed via https://ipfs.io/ipfs/{hash}*\n`;
  
  return md;
}

/**
 * Export complete IP data as plain text
 */
export function exportAsText(data: CompleteIPData): string {
  let txt = `IP ASSET COMPLETE METADATA\n`;
  txt += `${'='.repeat(80)}\n\n`;
  
  // Basic Information
  txt += `BASIC INFORMATION\n`;
  txt += `${'-'.repeat(80)}\n`;
  txt += `Title:              ${data.title}\n`;
  txt += `IP Asset ID:        ${data.ipAssetId}\n`;
  txt += `Owner:              ${data.owner}\n`;
  txt += `Registration Date:  ${data.registrationDate}\n`;
  txt += `Timestamp:          ${data.registeredTimestamp}\n\n`;
  
  // Description
  if (data.description) {
    txt += `DESCRIPTION\n`;
    txt += `${'-'.repeat(80)}\n`;
    txt += `${data.description}\n\n`;
  }
  
  // Location & Context
  if (data.location || data.sensorType) {
    txt += `LOCATION & CONTEXT\n`;
    txt += `${'-'.repeat(80)}\n`;
    if (data.location) txt += `Location:       ${data.location}\n`;
    if (data.sensorType) txt += `Sensor Type:    ${data.sensorType}\n`;
    if (data.sensorHealth) txt += `Sensor Health:  ${data.sensorHealth}\n`;
    if (data.dataTimestamp) txt += `Data Timestamp: ${data.dataTimestamp}\n`;
    txt += `\n`;
  }
  
  // Creators
  if (data.creators && data.creators.length > 0) {
    txt += `CREATORS\n`;
    txt += `${'-'.repeat(80)}\n`;
    data.creators.forEach((creator, idx) => {
      txt += `${idx + 1}. ${creator.name} (${creator.contributionPercent}%)\n`;
      txt += `   Address: ${creator.address}\n\n`;
    });
  }
  
  // Media & Files from metadataURI
  txt += `MEDIA & FILES (from metadataURI)\n`;
  txt += `${'-'.repeat(80)}\n`;
  if (data.image) {
    txt += `Image URL:          ${data.image}\n`;
    if (data.imageHash) txt += `Image Hash:         ${data.imageHash}\n\n`;
  }
  if (data.mediaUrl) {
    txt += `Media URL:          ${data.mediaUrl}\n`;
    if (data.mediaHash) txt += `Media Hash:         ${data.mediaHash}\n`;
    if (data.mediaType) txt += `Media Type:         ${data.mediaType}\n\n`;
  }
  
  // Metadata URIs
  txt += `METADATA URIS\n`;
  txt += `${'-'.repeat(80)}\n`;
  if (data.metadataURI) txt += `IP Metadata URI:     ${data.metadataURI}\n`;
  if (data.nftTokenURI) txt += `NFT Token URI:       ${data.nftTokenURI}\n`;
  if (data.metadataHash) txt += `Metadata Hash:       ${data.metadataHash}\n`;
  if (data.nftMetadataHash) txt += `NFT Metadata Hash:   ${data.nftMetadataHash}\n`;
  txt += `\n`;
  
  // IP Metadata
  if (data.ipMetadata) {
    txt += `IP METADATA (from metadataURI)\n`;
    txt += `${'-'.repeat(80)}\n`;
    txt += `${data.ipMetadata.raw}\n\n`;
  }
  
  // NFT Metadata
  if (data.nftMetadata) {
    txt += `NFT METADATA (from IPFS)\n`;
    txt += `${'-'.repeat(80)}\n`;
    txt += `${data.nftMetadata.raw}\n\n`;
  }
  
  // Character File
  if (data.characterFile) {
    txt += `AI CHARACTER FILE (Complete JSON)\n`;
    txt += `${'-'.repeat(80)}\n`;
    txt += `URL:  ${data.characterFile.url}\n`;
    if (data.characterFile.hash) txt += `Hash: ${data.characterFile.hash}\n\n`;
    txt += `Content:\n${data.characterFile.raw}\n\n`;
  }
  
  // License Information
  if (data.licenseInfo) {
    txt += `LICENSE INFORMATION\n`;
    txt += `${'-'.repeat(80)}\n`;
    txt += `License Terms ID:    ${data.licenseInfo.licenseTermsId}\n`;
    txt += `Amount:              ${data.licenseInfo.amount}\n`;
    if (data.licenseInfo.mintingFeePaid) txt += `Minting Fee Paid:    ${data.licenseInfo.mintingFeePaid} WIP\n`;
    if (data.licenseInfo.revenueSharePercentage) txt += `Revenue Share:       ${data.licenseInfo.revenueSharePercentage}%\n`;
    if (data.licenseInfo.mintedAt) txt += `Minted At:           ${data.licenseInfo.mintedAt}\n`;
    txt += `\n`;
  }
  
  // Dataset Context
  if (data.datasetContext?.rawSensorData) {
    txt += `RAW SENSOR DATA\n`;
    txt += `${'-'.repeat(80)}\n`;
    txt += `${data.datasetContext.rawSensorData}\n\n`;
  }
  
  txt += `${'='.repeat(80)}\n`;
  txt += `Generated on ${new Date().toLocaleString()}\n`;
  
  return txt;
}

/**
 * Download complete IP data as file
 */
export function downloadIPData(
  data: CompleteIPData,
  format: 'json' | 'markdown' | 'text' = 'json'
): void {
  let content: string;
  let filename: string;
  let mimeType: string;
  
  const sanitizedTitle = data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const timestamp = new Date().toISOString().split('T')[0];
  
  switch (format) {
    case 'markdown':
      content = exportAsMarkdown(data);
      filename = `${sanitizedTitle}_${timestamp}.md`;
      mimeType = 'text/markdown';
      break;
    case 'text':
      content = exportAsText(data);
      filename = `${sanitizedTitle}_${timestamp}.txt`;
      mimeType = 'text/plain';
      break;
    case 'json':
    default:
      content = exportAsJSON(data);
      filename = `${sanitizedTitle}_${timestamp}.json`;
      mimeType = 'application/json';
      break;
  }
  
  // Create blob and download
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// React hook for downloading IP metadata
export function useIPMetadataDownload() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const downloadMetadata = async (
    ipAssetId: Address,
    format: 'json' | 'markdown' | 'text' = 'json',
    licenseData?: any,
    datasetContext?: any
  ): Promise<boolean> => {
    setDownloading(true);
    setError(null);
    
    try {
      console.log('Starting metadata download for:', ipAssetId);
      
      // Fetch complete metadata
      const completeData = await fetchCompleteIPMetadata(ipAssetId, licenseData, datasetContext);
      
      // Download the file
      downloadIPData(completeData, format);
      
      console.log('Download completed successfully');
      setDownloading(false);
      return true;
      
    } catch (err: any) {
      console.error('Download error:', err);
      setError(err.message || 'Failed to download metadata');
      setDownloading(false);
      return false;
    }
  };
  
  return {
    downloadMetadata,
    downloading,
    error,
  };
}

// Export service object
export const IPMetadataDownloadService = {
  fetchCompleteIPMetadata,
  exportAsJSON,
  exportAsMarkdown,
  exportAsText,
  downloadIPData,
};