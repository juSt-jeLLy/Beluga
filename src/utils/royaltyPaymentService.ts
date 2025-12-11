
import { Address } from 'viem';
import { useWalletClient, useAccount } from 'wagmi';
import { WIP_TOKEN_ADDRESS } from '@story-protocol/core-sdk';
import { createStoryClient } from './config';
import { parseEther } from 'viem';
import { useState, useEffect } from 'react';

export interface PayRoyaltyParams {
  receiverIpId: Address;    // Parent IP ID (who receives the royalty)
  payerIpId: Address;       // Derivative IP ID (who pays the royalty)
  amount: string;           // Amount in WIP (as string, will be converted to wei)
}

export interface PayRoyaltyResult {
  success: boolean;
  txHash?: string;
  error?: string;
}


export async function payRoyaltyToParent(
  params: PayRoyaltyParams,
  walletClient: any
): Promise<PayRoyaltyResult> {
  try {
    const { receiverIpId, payerIpId, amount } = params;
    
    // Validate amount
    if (!amount || parseFloat(amount) <= 0) {
      return {
        success: false,
        error: 'Amount must be greater than 0',
      };
    }

    // Create Story client with wallet
    const client = createStoryClient(walletClient);
    
    // Convert amount to wei
    const amountInWei = parseEther(amount);
    
    // Pay royalty on behalf of the derivative IP
    const result = await client.royalty.payRoyaltyOnBehalf({
      receiverIpId: receiverIpId,
      payerIpId: payerIpId,
      token: WIP_TOKEN_ADDRESS,
      amount: amountInWei,
    });
    
    return {
      success: true,
      txHash: result.txHash,
    };
    
  } catch (error: any) {
    console.error('Pay Royalty Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to pay royalty',
    };
  }
}

/**
 * Hook to pay royalties in React components
 */
export function useRoyaltyPayment() {
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const [paying, setPaying] = useState(false);

  const payRoyalty = async (
    receiverIpId: Address,
    payerIpId: Address,
    amount: string
  ): Promise<PayRoyaltyResult> => {
    if (!walletClient || !address) {
      return {
        success: false,
        error: 'Wallet not connected',
      };
    }

 
    setPaying(true);

    try {
      const result = await payRoyaltyToParent(
        {
          receiverIpId,
          payerIpId,
          amount,
        },
        walletClient
      );

      return result;
    } catch (error: any) {
      console.error('Pay royalty process error:', error);
      return {
        success: false,
        error: error.message || 'Royalty payment failed',
      };
    } finally {
      setPaying(false);
    }
  };

  return {
    payRoyalty,
    paying,
    isConnected: !!walletClient && !!address,
  };
}


export function useDerivativeOwnership(derivativeIpId?: Address) {
  const { address } = useAccount();
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (!derivativeIpId || !address) {
      setIsOwner(false);
      return;
    }

    const checkOwnership = async () => {
      setLoading(true);
      try {

        setIsOwner(true);
      } catch (error) {
        console.error('Error checking ownership:', error);
        setIsOwner(false);
      } finally {
        setLoading(false);
      }
    };

    checkOwnership();
  }, [derivativeIpId, address]);

  return {
    isOwner,
    loading,
  };
}