// src/utils/revenueClaimingService.ts
import { Address } from 'viem';
import { useWalletClient, useAccount } from 'wagmi';
import { WIP_TOKEN_ADDRESS } from '@story-protocol/core-sdk';
import { createStoryClient } from './config';
import { useState, useEffect } from 'react';

export interface ClaimableRevenueParams {
  ipId: Address;
  claimer: Address;
}

export interface ClaimableRevenueResult {
  success: boolean;
  amount?: string;
  error?: string;
}

export interface ClaimRevenueParams {
  ipId: Address;
  claimer: Address;
}

export interface ClaimRevenueResult {
  success: boolean;
  txHashes?: string[];
  claimedTokens?: string[];
  error?: string;
}

/**
 * Fetch claimable revenue for an IP asset
 */
export async function getClaimableRevenue(
  params: ClaimableRevenueParams,
  walletClient: any
): Promise<ClaimableRevenueResult> {
  try {
    const { ipId, claimer } = params;
    
    // Create Story client with wallet
    const client = createStoryClient(walletClient);
    
    // Get claimable revenue
    const claimableRevenue = await client.royalty.claimableRevenue({
      ipId: ipId,
      claimer: claimer,
      token: WIP_TOKEN_ADDRESS,
    });
    
    return {
      success: true,
      amount: claimableRevenue.toString(),
    };
    
  } catch (error: any) {
    console.error('Get Claimable Revenue Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch claimable revenue',
    };
  }
}

/**
 * Claim all revenue for an IP asset
 * NOTE: For claimAllRevenue, use the IP ID as both ancestorIpId and claimer
 */
export async function claimRevenue(
  params: ClaimRevenueParams,
  walletClient: any
): Promise<ClaimRevenueResult> {
  try {
    const { ipId, claimer } = params;
    
    // Create Story client with wallet
    const client = createStoryClient(walletClient);
    
    // Claim all revenue - use IP ID as both ancestorIpId and claimer
    const claim = await client.royalty.claimAllRevenue({
      ancestorIpId: ipId,
      claimer: ipId, // Use IP ID as claimer, not the wallet address
      currencyTokens: [WIP_TOKEN_ADDRESS],
      childIpIds: [],
      royaltyPolicies: [],
    });
    
    return {
      success: true,
      txHashes: claim.txHashes || [],
      claimedTokens: claim.claimedTokens?.map(token => token.toString()) || [],
    };
    
  } catch (error: any) {
    console.error('Claim Revenue Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to claim revenue',
    };
  }
}

/**
 * Hook to fetch claimable revenue for an IP
 * NOTE: For claimableRevenue, both ipId and claimer should be the IP ID itself
 */
export function useClaimableRevenue(ipId?: Address) {
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const [claimableAmount, setClaimableAmount] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClaimableRevenue = async () => {
    if (!walletClient || !address || !ipId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // For claimableRevenue, use the IP ID as both ipId and claimer
      const result = await getClaimableRevenue(
        { ipId, claimer: ipId },
        walletClient
      );

      if (result.success && result.amount) {
        setClaimableAmount(result.amount);
      } else {
        setError(result.error || 'Failed to fetch claimable revenue');
        setClaimableAmount('0');
      }
    } catch (err: any) {
      console.error('Fetch claimable revenue error:', err);
      setError(err.message || 'Failed to fetch claimable revenue');
      setClaimableAmount('0');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaimableRevenue();
  }, [ipId, address, walletClient]);

  return {
    claimableAmount,
    loading,
    error,
    refetch: fetchClaimableRevenue,
  };
}

/**
 * Hook to claim revenue in React components
 */
export function useRevenueClaiming() {
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const [claiming, setClaiming] = useState(false);

  const claimRevenueForIP = async (ipId: Address): Promise<ClaimRevenueResult> => {
    if (!walletClient || !address) {
      return {
        success: false,
        error: 'Wallet not connected',
      };
    }

    setClaiming(true);

    try {
      const result = await claimRevenue(
        { ipId, claimer: address },
        walletClient
      );

      return result;
    } catch (error: any) {
      console.error('Claim revenue process error:', error);
      return {
        success: false,
        error: error.message || 'Revenue claim failed',
      };
    } finally {
      setClaiming(false);
    }
  };

  return {
    claimRevenue: claimRevenueForIP,
    claiming,
    isConnected: !!walletClient && !!address,
  };
}