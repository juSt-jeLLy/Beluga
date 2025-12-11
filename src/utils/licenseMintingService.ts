
import { Address } from 'viem';
import { useWalletClient, useAccount } from 'wagmi';
import { createStoryClient } from './config';
import { SupabaseService } from '@/services/supabaseService';

export interface LicenseMintParams {
  ipId: Address;
  licenseTermsId: number;
  amount: number;
  receiver?: Address;
  sensorDataId?: number;
  unitMintingFee?: number;
  revenueShare?: number;
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
  connectedAddress: Address,
  supabaseService?: SupabaseService
): Promise<LicenseMintResult> {
  try {
    const { ipId, licenseTermsId, amount, receiver, sensorDataId, unitMintingFee, revenueShare } = params;
    
    // Create Story client with wallet
    const client = createStoryClient(walletClient);
    
    // Mint License Tokens - use receiver if provided, otherwise use connected wallet
    const finalReceiver = receiver || connectedAddress;
    const response = await client.license.mintLicenseTokens({
      licenseTermsId: licenseTermsId,
      licensorIpId: ipId,
      receiver: finalReceiver,
      amount: amount,
    });
    
    // Save to database if supabaseService is provided and sensorDataId exists
    if (supabaseService && sensorDataId && response.txHash) {
      try {
        // Calculate total minting fee paid
        const totalFee = unitMintingFee ? unitMintingFee * amount : undefined;
        
        // Generate Story Explorer transaction URL
        const storyExplorerTxUrl = `https://aeneid.storyscan.io/tx/${response.txHash}`;
        
        // Convert license token IDs to string array for storage
        const licenseTokenIdsStr = response.licenseTokenIds?.map(id => id.toString()) || [];
        
        await supabaseService.saveLicenseMinting({
          sensor_data_id: sensorDataId,
          license_token_ids: licenseTokenIdsStr,
          amount: amount,
          ip_asset_id: ipId,
          license_terms_id: licenseTermsId.toString(),
          transaction_hash: response.txHash,
          story_explorer_tx_url: storyExplorerTxUrl,
          minter_address: connectedAddress,
          receiver_address: finalReceiver,
          minting_fee_paid: totalFee,
          unit_minting_fee: unitMintingFee,
          revenue_share_percentage: revenueShare,
        });
        
        console.log('License minting data saved to database');
      } catch (dbError: any) {
        console.error('Database save error (non-critical):', dbError);
        // Don't fail the whole operation if database save fails
      }
    }
    
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
export function useLicenseMinting(supabaseService?: SupabaseService) {
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  
  const mintLicense = async (
    ipId: Address,
    licenseTermsId: number,
    amount: number,
    receiver?: Address,
    sensorDataId?: number,
    unitMintingFee?: number,
    revenueShare?: number
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
          sensorDataId,
          unitMintingFee,
          revenueShare,
        },
        walletClient,
        address,
        supabaseService
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