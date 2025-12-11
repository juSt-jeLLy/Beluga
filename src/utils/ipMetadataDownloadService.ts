// src/utils/ipMetadataDownloadService.ts
import { Address } from 'viem';
import { useState } from 'react';
import { getEnrichedMetadata, type EnrichedIPMetadata, getMetadataURI } from './coreMetadataViewService';
import axios from 'axios';

export interface CompleteIPData {
  ipAssetId: Address;
  title: string;
  description: string;
  
  registrationDate: string;
  registeredTimestamp: string;
  owner: Address;
  
  location?: string;
  sensorType?: string;
  sensorHealth?: string;
  dataTimestamp?: string;
  
  creators: Array<{
    name: string;
    address: string;
    contributionPercent: number;
  }>;
  
  // Direct fields from metadataURI JSON
  image?: string;
  imageHash?: string;
  mediaUrl?: string;
  mediaHash?: string;
  mediaType?: string;
  
  metadataURI?: string;
  nftTokenURI?: string;
  
  metadataHash?: string;
  nftMetadataHash?: string;
  
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
  
  characterFile?: {
    url: string;
    hash: string;
    raw: string;
    parsed: any;
  };
  
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
  
  rawCoreMetadata?: EnrichedIPMetadata;
  
  datasetContext?: {
    sensorDataId?: number;
    rawSensorData?: string;
    source?: string;
  };
}

async function fetchFromIPFS(url: string): Promise<{ raw: string; parsed: any }> {
  try {
    const fetchUrl = url.startsWith('ipfs://') 
      ? url.replace('ipfs://', 'https://ipfs.io/ipfs/')
      : url;
    
    const response = await axios.get(fetchUrl, {
      timeout: 30000,
      headers: {
        'Accept': 'application/json, text/plain, */*'
      }
    });
    
    const raw = typeof response.data === 'string' 
      ? response.data 
      : JSON.stringify(response.data, null, 2);
    
    return {
      raw,
      parsed: response.data
    };
  } catch (error: any) {
    return {
      raw: `Failed to fetch content: ${error.message}`,
      parsed: null
    };
  }
}

export async function fetchCompleteIPMetadata(
  ipAssetId: Address,
  licenseData?: any,
  datasetContext?: any
): Promise<CompleteIPData> {
  try {
    let metadataURI: string | null = null;
    let owner: Address = '0x0000000000000000000000000000000000000000' as Address;
    let registrationDate: bigint = 0n;
    let metadataHash: string = '';
    
    try {
      metadataURI = await getMetadataURI(ipAssetId);
      
      const coreMetadata = await getEnrichedMetadata(ipAssetId);
      owner = coreMetadata.owner || '0x0000000000000000000000000000000000000000' as Address;
      registrationDate = coreMetadata.registrationDate || 0n;
      metadataHash = coreMetadata.metadataHash || '';
    } catch (error: any) {
      metadataURI = null;
    }
    
    let ipMetadataFromURI: any = null;
    if (metadataURI) {
      const ipMetadataResult = await fetchFromIPFS(metadataURI);
      if (ipMetadataResult.parsed) {
        ipMetadataFromURI = ipMetadataResult.parsed;
      }
    } else {
      ipMetadataFromURI = {};
    }
    
    const ipMetadataDetails = ipMetadataFromURI || {};
    
    let characterFile: { url: string; hash: string; raw: string; parsed: any } | undefined;
    const characterFileUrl = ipMetadataDetails.aiMetadata?.characterFileUrl;
    const characterFileHash = ipMetadataDetails.aiMetadata?.characterFileHash;
    
    if (characterFileUrl) {
      try {
        const characterContent = await fetchFromIPFS(characterFileUrl);
        characterFile = {
          url: characterFileUrl,
          hash: characterFileHash || '',
          raw: characterContent.raw,
          parsed: characterContent.parsed
        };
      } catch (error: any) {
        // Silently fail, characterFile will remain undefined
      }
    }
    
    const registrationDateObj = registrationDate 
      ? new Date(Number(registrationDate) * 1000)
      : new Date();
    
    const creators = ipMetadataDetails.creators || [];
    
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
      
      image: ipMetadataDetails.image,
      imageHash: ipMetadataDetails.imageHash,
      mediaUrl: ipMetadataDetails.mediaUrl,
      mediaHash: ipMetadataDetails.mediaHash,
      mediaType: ipMetadataDetails.mediaType,
      
      metadataURI: metadataURI || undefined,
      metadataHash: metadataHash || undefined,
      
      ipMetadata,
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
      
      datasetContext: datasetContext ? {
        sensorDataId: datasetContext.id,
        rawSensorData: datasetContext.data,
        source: datasetContext.source,
      } : undefined,
    };
    
    return completeData;
    
  } catch (error: any) {
    throw new Error(`Failed to fetch complete IP metadata: ${error.message}`);
  }
}

export function exportAsMarkdown(data: CompleteIPData): string {
  let md = `# ${data.title}\n\n`;
  
  md += `## Basic Information\n\n`;
  md += `- **IP Asset ID:** \`${data.ipAssetId}\`\n`;
  md += `- **Owner:** \`${data.owner}\`\n`;
  md += `- **Registration Date:** ${data.registrationDate}\n`;
  md += `- **Registration Timestamp:** ${data.registeredTimestamp}\n\n`;
  
  if (data.description) {
    md += `## Description\n\n`;
    md += `${data.description}\n\n`;
  }
  
  if (data.location || data.sensorType) {
    md += `## Location & Context\n\n`;
    if (data.location) md += `- **Location:** ${data.location}\n`;
    if (data.sensorType) md += `- **Sensor Type:** ${data.sensorType}\n`;
    if (data.sensorHealth) md += `- **Sensor Health:** ${data.sensorHealth}\n`;
    if (data.dataTimestamp) md += `- **Data Timestamp:** ${data.dataTimestamp}\n`;
    md += `\n`;
  }
  
  if (data.creators && data.creators.length > 0) {
    md += `## Creators\n\n`;
    data.creators.forEach((creator, idx) => {
      md += `${idx + 1}. **${creator.name}**\n`;
      md += `   - Address: \`${creator.address}\`\n`;
      md += `   - Contribution: ${creator.contributionPercent}%\n\n`;
    });
  }
  
  md += `## Media & Files\n\n`;
  
  if (data.image) {
    md += `### Image\n`;
    md += `- **URL:** ${data.image}\n`;
    if (data.imageHash) {
      const cleanHash = data.imageHash.startsWith('0x') ? data.imageHash : `0x${data.imageHash}`;
      md += `- **Content Hash:** \`${cleanHash}\`\n`;
    }
    md += `\n`;
  }
  
  if (data.mediaUrl) {
    md += `### Media File\n`;
    md += `- **URL:** ${data.mediaUrl}\n`;
    if (data.mediaHash) {
      const cleanHash = data.mediaHash.startsWith('0x') ? data.mediaHash : `0x${data.mediaHash}`;
      md += `- **Content Hash:** \`${cleanHash}\`\n`;
    }
    if (data.mediaType) md += `- **Type:** ${data.mediaType}\n`;
    md += `\n`;
  }
  
  if (data.characterFile) {
    md += `### AI Character File\n\n`;
    md += `- **URL:** ${data.characterFile.url}\n`;
    if (data.characterFile.hash) {
      const cleanHash = data.characterFile.hash.startsWith('0x') ? data.characterFile.hash : `0x${data.characterFile.hash}`;
      md += `- **Content Hash:** \`${cleanHash}\`\n`;
    }
    md += `\n#### Character File JSON\n\n`;
    md += `\`\`\`json\n${data.characterFile.raw}\n\`\`\`\n\n`;
  }
  
  if (data.ipMetadata) {
    md += `## IP Metadata\n\n`;
    if (data.metadataURI) md += `**Source URI:** ${data.metadataURI}\n`;
    if (data.metadataHash) md += `**Content Hash:** \`${data.metadataHash}\`\n`;
    md += `\n### Complete JSON\n\n`;
    md += `\`\`\`json\n${data.ipMetadata.raw}\n\`\`\`\n\n`;
  }
  
  if (data.datasetContext) {
    md += `## Dataset Context\n\n`;
    if (data.datasetContext.sensorDataId) md += `- **Sensor Data ID:** ${data.datasetContext.sensorDataId}\n`;
    if (data.datasetContext.source) md += `- **Source:** ${data.datasetContext.source}\n`;
    if (data.datasetContext.rawSensorData) {
      md += `\n### Raw Sensor Data\n\n`;
      md += `\`\`\`\n${data.datasetContext.rawSensorData}\n\`\`\`\n\n`;
    }
  }
  
  md += `## Story Protocol Links\n\n`;
  md += `- **IP Asset Explorer:** https://aeneid.explorer.story.foundation/ipa/${data.ipAssetId}\n`;
  if (data.licenseInfo) {
    md += `- **License Terms Explorer:** https://aeneid.explorer.story.foundation/license-terms/${data.licenseInfo.licenseTermsId}\n`;
  }
  
  md += `---\n\n`;
  md += `*Generated on ${new Date().toLocaleString()}*\n\n`;
  md += `*IP Asset: ${data.ipAssetId}*\n`;
  
  return md;
}

export function exportAsText(data: CompleteIPData): string {
  let txt = `IP ASSET METADATA\n`;
  txt += `${'='.repeat(80)}\n\n`;
  
  txt += `BASIC INFORMATION\n`;
  txt += `${'-'.repeat(80)}\n`;
  txt += `Title:              ${data.title}\n`;
  txt += `IP Asset ID:        ${data.ipAssetId}\n`;
  txt += `Owner:              ${data.owner === '0x0000000000000000000000000000000000000000' ? 'Not Available' : data.owner}\n`;
  txt += `Registration Date:  ${data.registrationDate}\n`;
  txt += `Timestamp:          ${data.registeredTimestamp}\n\n`;
  
  if (data.description) {
    txt += `DESCRIPTION\n`;
    txt += `${'-'.repeat(80)}\n`;
    txt += `${data.description}\n\n`;
  }
  
  if (data.location || data.sensorType) {
    txt += `LOCATION & CONTEXT\n`;
    txt += `${'-'.repeat(80)}\n`;
    if (data.location) txt += `Location:       ${data.location}\n`;
    if (data.sensorType) txt += `Sensor Type:    ${data.sensorType}\n`;
    if (data.sensorHealth) txt += `Sensor Health:  ${data.sensorHealth}\n`;
    if (data.dataTimestamp) txt += `Data Timestamp: ${data.dataTimestamp}\n`;
    txt += `\n`;
  }
  
  if (data.creators && data.creators.length > 0) {
    txt += `CREATORS\n`;
    txt += `${'-'.repeat(80)}\n`;
    data.creators.forEach((creator, idx) => {
      txt += `${idx + 1}. ${creator.name} (${creator.contributionPercent}%)\n`;
      txt += `   Address: ${creator.address}\n\n`;
    });
  }
  
  txt += `MEDIA & FILES\n`;
  txt += `${'-'.repeat(80)}\n`;
  if (data.image) {
    txt += `Image URL:          ${data.image}\n`;
    if (data.imageHash) {
      const cleanHash = data.imageHash.startsWith('0x') ? data.imageHash : `0x${data.imageHash}`;
      txt += `Image Hash:         ${cleanHash}\n`;
    }
    txt += `\n`;
  }
  
  if (data.mediaUrl) {
    txt += `Media URL:          ${data.mediaUrl}\n`;
    if (data.mediaHash) {
      const cleanHash = data.mediaHash.startsWith('0x') ? data.mediaHash : `0x${data.mediaHash}`;
      txt += `Media Hash:         ${cleanHash}\n`;
    }
    if (data.mediaType) txt += `Media Type:         ${data.mediaType}\n`;
    txt += `\n`;
  }
  
  if (data.characterFile) {
    txt += `AI CHARACTER FILE\n`;
    txt += `${'-'.repeat(80)}\n`;
    txt += `Content:\n${data.characterFile.raw}\n\n`;
  }
  
  if (data.ipMetadata) {
    txt += `IP METADATA\n`;
    txt += `${'-'.repeat(80)}\n`;
    txt += `${data.ipMetadata.raw}\n\n`;
  }
  
  if (data.datasetContext?.rawSensorData) {
    txt += `RAW SENSOR DATA\n`;
    txt += `${'-'.repeat(80)}\n`;
    txt += `${data.datasetContext.rawSensorData}\n\n`;
  }
  
  txt += `${'='.repeat(80)}\n`;
  txt += `Generated on ${new Date().toLocaleString()}\n`;
  
  return txt;
}

export function downloadIPData(
  data: CompleteIPData,
  format: 'markdown' | 'text' = 'markdown'
): void {
  let content: string;
  let filename: string;
  let mimeType: string;
  
  const sanitizedTitle = data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const timestamp = new Date().toISOString().split('T')[0];
  
  switch (format) {
    case 'text':
      content = exportAsText(data);
      filename = `${sanitizedTitle}_${timestamp}.txt`;
      mimeType = 'text/plain';
      break;
    case 'markdown':
    default:
      content = exportAsMarkdown(data);
      filename = `${sanitizedTitle}_${timestamp}.md`;
      mimeType = 'text/markdown';
      break;
  }
  
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

export function useIPMetadataDownload() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const downloadMetadata = async (
    ipAssetId: Address,
    format: 'markdown' | 'text' = 'markdown',
    licenseData?: any,
    datasetContext?: any
  ): Promise<boolean> => {
    setDownloading(true);
    setError(null);
    
    try {
      const completeData = await fetchCompleteIPMetadata(ipAssetId, licenseData, datasetContext);
      downloadIPData(completeData, format);
      setDownloading(false);
      return true;
    } catch (err: any) {
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