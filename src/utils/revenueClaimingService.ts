
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

// New interface for claiming revenue from derivatives
export interface ClaimRevenueFromDerivativesParams {
  ancestorIpId: Address;
  claimer: Address;
  childIpIds: Address[];
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
 * Claim revenue from specific child IPs (derivatives)
 * This is for parent IPs to claim revenue from their derivatives
 */
export async function claimRevenueFromDerivatives(
  params: ClaimRevenueFromDerivativesParams,
  walletClient: any
): Promise<ClaimRevenueResult> {
  try {
    const { ancestorIpId, claimer, childIpIds } = params;
    
    // Create Story client with wallet
    const client = createStoryClient(walletClient);
    
    // Define the royalty policy address (you might need to fetch this from your database)
    const ROYALTY_POLICY_ADDRESS = "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E"; // Example from your code
    
    console.log('Claiming revenue from derivatives:', {
      ancestorIpId,
      claimer,
      childIpIds,
      childCount: childIpIds.length
    });
    
    // Claim revenue from specific child IPs
    const claim = await client.royalty.claimAllRevenue({
      ancestorIpId: ancestorIpId,
      claimer: claimer, // The parent IP address
      currencyTokens: [WIP_TOKEN_ADDRESS],
      childIpIds: childIpIds, // Array of derivative IP IDs
      royaltyPolicies: Array(childIpIds.length).fill(ROYALTY_POLICY_ADDRESS),
    });
    
    return {
      success: true,
      txHashes: claim.txHashes || [],
      claimedTokens: claim.claimedTokens?.map(token => token.toString()) || [],
    };
    
  } catch (error: any) {
    console.error('Claim Revenue from Derivatives Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to claim revenue from derivatives',
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

/**
 * Hook to claim revenue from derivatives
 */
export function useRevenueClaimingFromDerivatives() {
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const [claimingFromDerivatives, setClaimingFromDerivatives] = useState(false);

  const claimRevenueFromDerivativesForIP = async (
    ancestorIpId: Address,
    childIpIds: Address[]
  ): Promise<ClaimRevenueResult> => {
    if (!walletClient || !address) {
      return {
        success: false,
        error: 'Wallet not connected',
      };
    }

    setClaimingFromDerivatives(true);

    try {
      const result = await claimRevenueFromDerivatives(
        { 
          ancestorIpId, 
          claimer: ancestorIpId, // Use the IP ID as claimer
          childIpIds 
        },
        walletClient
      );

      return result;
    } catch (error: any) {
      console.error('Claim revenue from derivatives process error:', error);
      return {
        success: false,
        error: error.message || 'Revenue claim from derivatives failed',
      };
    } finally {
      setClaimingFromDerivatives(false);
    }
  };

  return {
    claimRevenueFromDerivatives: claimRevenueFromDerivativesForIP,
    claimingFromDerivatives,
    isConnected: !!walletClient && !!address,
  };
}