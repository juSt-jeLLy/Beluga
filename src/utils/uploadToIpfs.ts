import axios from 'axios';
import { createHash } from 'crypto-browserify';
import { toHex, Hex } from 'viem';
import { PINATA_JWT, PINATA_API_URL } from './config';

// Upload JSON metadata to IPFS
export async function uploadJSONToIPFS(jsonMetadata: any): Promise<string> {
  const url = `${PINATA_API_URL}/pinJSONToIPFS`;
  
  try {
    const response = await axios.post(url, {
      pinataOptions: { cidVersion: 0 },
      pinataMetadata: { name: 'sensor-data-metadata.json' },
      pinataContent: jsonMetadata,
    }, {
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
        'Content-Type': 'application/json',
      },
    });
    
    return response.data.IpfsHash;
  } catch (error) {
    console.error('Error uploading JSON to IPFS:', error);
    throw new Error('Failed to upload JSON to IPFS');
  }
}

// Upload text/file to IPFS
export async function uploadFileToIPFS(content: string | Blob, filename: string): Promise<string> {
  const url = `${PINATA_API_URL}/pinFileToIPFS`;
  const formData = new FormData();
  
  if (typeof content === 'string') {
    const blob = new Blob([content], { type: 'text/plain' });
    formData.append('file', blob, filename);
  } else {
    formData.append('file', content, filename);
  }
  
  try {
    const response = await axios.post(url, formData, {
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
      },
    });
    
    return response.data.IpfsHash;
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    throw new Error('Failed to upload file to IPFS');
  }
}

// Get hash from file
export async function getFileHash(file: File): Promise<Hex> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  return toHex(new Uint8Array(hashBuffer), { size: 32 });
}

// Get hash from string content
export async function getStringHash(content: string): Promise<Hex> {
  const buffer = new TextEncoder().encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return toHex(new Uint8Array(hashBuffer), { size: 32 });
}

// Get hash from URL content
export async function getHashFromUrl(url: string): Promise<Hex> {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    const hash = createHash('sha256').update(buffer).digest('hex');
    return `0x${hash}` as Hex;
  } catch (error) {
    console.error('Error getting hash from URL:', error);
    throw new Error('Failed to get hash from URL');
  }
}

// Get hash from JSON object
export function getJSONHash(jsonObject: any): Hex {
  const jsonString = JSON.stringify(jsonObject);
  const hash = createHash('sha256').update(jsonString).digest('hex');
  return `0x${hash}` as Hex;
}