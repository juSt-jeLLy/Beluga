// src/utils/licenseMintingService.ts
import { Address } from 'viem';
import { useWalletClient, useAccount } from 'wagmi';
import { createStoryClient } from './config';

export interface LicenseMintParams {
  ipId: Address;
  licenseTermsId: number;
  amount: number;
  receiver?: Address;
}

export interface LicenseMintResult {
  success: boolean;
  txHash?: string;
  licenseTokenIds?: bigint[];
  error?: string;
}

export async function mintLicenseTokens(
  params: LicenseMintParams,
  walletClient: any,
  connectedAddress: Address
): Promise<LicenseMintResult> {
  try {
    const { ipId, licenseTermsId, amount, receiver } = params;
    
    // Create Story client with wallet
    const client = createStoryClient(walletClient);
    
    // Mint License Tokens - use receiver if provided, otherwise use connected wallet
    const response = await client.license.mintLicenseTokens({
      licenseTermsId: licenseTermsId,
      licensorIpId: ipId,
      receiver: receiver || connectedAddress,
      amount: amount,
    });
    
    return {
      success: true,
      txHash: response.txHash,
      licenseTokenIds: response.licenseTokenIds,
    };
    
  } catch (error: any) {
    console.error('License Minting Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to mint license',
    };
  }
}

// Hook to use in React components
export function useLicenseMinting() {
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  
  const mintLicense = async (
    ipId: Address,
    licenseTermsId: number,
    amount: number,
    receiver?: Address
  ): Promise<LicenseMintResult> => {
    if (!walletClient || !address) {
      return {
        success: false,
        error: 'Wallet not connected',
      };
    }
    
    try {
      const result = await mintLicenseTokens(
        {
          ipId,
          licenseTermsId,
          amount,
          receiver,
        },
        walletClient,
        address
      );
      
      return result;
      
    } catch (error: any) {
      console.error('License minting process error:', error);
      return {
        success: false,
        error: error.message || 'License minting failed',
      };
    }
  };
  
  return { mintLicense, isConnected: !!walletClient && !!address };
}