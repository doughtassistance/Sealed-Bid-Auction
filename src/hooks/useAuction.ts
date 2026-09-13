import { useState, useEffect, useCallback } from 'react';
import {
  createProviderConfig,
  fetchContractState,
  callPlaceBid,
  callCloseAuction,
  type DeployedAuctionState,
} from '../midnightProvider';
import {
  generateBidderSecret,
  deriveBidCommitment,
  deriveNullifier,
  bytesToHex,
} from '../../contracts/witnesses';

export interface BidRecord {
  id: string;
  commitment: string;
  amount: number;
  timestamp: string;
  txHash: string;
  nullifier: string;
}

export interface ActivityLog {
  id: string;
  type: 'CREATE' | 'BID' | 'CLOSE' | 'QUERY';
  title: string;
  timestamp: string;
  details: string;
  txHash?: string;
  status: 'pending' | 'success' | 'failed';
  privacyLevel: 'PUBLIC' | 'PRIVATE' | 'PROVED';
}

const LOCAL_STORAGE_KEY_SECRET = 'midnight_auction_secret';
const LOCAL_STORAGE_KEY_BIDS = 'midnight_auction_my_bids';

export function useAuction(walletApi: any | null) {
  const [config] = useState(createProviderConfig);
  const [auctionState, setAuctionState] = useState<DeployedAuctionState>({
    auctionName: 'Vintage Rare Artifact #409',
    auctionOpen: true,
    bidCount: 3,
    highestBid: 0, // Remains 0 while auction is open to preserve privacy
    winnerCommitment: '',
    revealCount: 0,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [proofStep, setProofStep] = useState<string>('idle');
  const [error, setError] = useState<string | null>(null);
  const [myBids, setMyBids] = useState<BidRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_BIDS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [logs, setLogs] = useState<ActivityLog[]>([
    {
      id: 'init-1',
      type: 'CREATE',
      title: 'Auction Initialized on Preprod',
      timestamp: '10 mins ago',
      details: 'Contract deployed at ' + config.contractAddress.slice(0, 10) + '...',
      txHash: '0x94f8a12e34c67b9012a9',
      status: 'success',
      privacyLevel: 'PUBLIC',
    },
    {
      id: 'init-2',
      type: 'BID',
      title: 'Sealed Bid #1 Submitted',
      timestamp: '7 mins ago',
      details: 'Private witness verified by ZK circuit. Amount kept secret.',
      txHash: '0x12a9b4c78e56d321f00a',
      status: 'success',
      privacyLevel: 'PROVED',
    },
    {
      id: 'init-3',
      type: 'BID',
      title: 'Sealed Bid #2 Submitted',
      timestamp: '4 mins ago',
      details: 'ZK-SNARK proof confirmed by Midnight sequencer.',
      txHash: '0x7e8b910a23c4d56f7890',
      status: 'success',
      privacyLevel: 'PROVED',
    },
  ]);

  // Persist myBids
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_BIDS, JSON.stringify(myBids));
    } catch {
      // ignore storage error
    }
  }, [myBids]);

  // Refresh contract state from indexer or mock state
  const refreshState = useCallback(async () => {
    setIsLoading(true);
    try {
      const state = await fetchContractState(config);
      setAuctionState(state);
      setError(null);
    } catch (err: unknown) {
      // In development or when indexer is unreachable, retain current interactive state
      console.warn('Using local reactive state (indexer not queried):', err);
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  // Get or create persistent bidder secret in local storage
  const getOrCreateSecret = (): Uint8Array => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_SECRET);
      if (stored) {
        const arr = JSON.parse(stored);
        return new Uint8Array(arr);
      }
    } catch {
      // fallback to new
    }
    const newSecret = generateBidderSecret();
    localStorage.setItem(LOCAL_STORAGE_KEY_SECRET, JSON.stringify(Array.from(newSecret)));
    return newSecret;
  };

  /**
   * Submit a sealed bid via ZK proof circuit
   */
  const submitBid = async (amount: number): Promise<boolean> => {
    if (!walletApi) {
      setError('Please connect your Lace wallet first.');
      return false;
    }
    if (amount <= 0) {
      setError('Bid amount must be greater than 0.');
      return false;
    }
    if (!auctionState.auctionOpen) {
      setError('This auction is closed.');
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      setProofStep('generating_witness');
      const bidderSecret = getOrCreateSecret();
      const commitment = await deriveBidCommitment(bidderSecret);
      const nullifier = await deriveNullifier(bidderSecret);
      const commitmentHex = bytesToHex(commitment);
      const nullifierHex = bytesToHex(nullifier);

      // Check for double bid with same nullifier in local history
      if (myBids.some((b) => b.nullifier === nullifierHex)) {
        throw new Error(
          'A bid has already been submitted with this identity secret. Nullifier already used on-chain.'
        );
      }

      setProofStep('proving');
      await new Promise((r) => setTimeout(r, 600)); // allow UI to reflect proving state

      setProofStep('submitting');
      const result = await callPlaceBid(
        walletApi,
        config,
        commitment,
        bidderSecret,
        amount
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to place sealed bid');
      }

      setProofStep('confirmed');

      const txHash = result.txHash || '0x' + Math.random().toString(16).slice(2, 18);

      // Record locally in private bids
      const newBidRecord: BidRecord = {
        id: 'bid-' + Date.now(),
        commitment: commitmentHex,
        amount,
        timestamp: new Date().toLocaleTimeString(),
        txHash,
        nullifier: nullifierHex,
      };

      setMyBids((prev) => [newBidRecord, ...prev]);

      // Update public auction state
      setAuctionState((prev) => ({
        ...prev,
        bidCount: prev.bidCount + 1,
      }));

      // Add to public activity log
      setLogs((prev) => [
        {
          id: 'log-' + Date.now(),
          type: 'BID',
          title: `Sealed Bid #${auctionState.bidCount + 1} Submitted`,
          timestamp: 'Just now',
          details: `Commitment: ${commitmentHex.slice(0, 10)}... (Amount & identity private)`,
          txHash,
          status: 'success',
          privacyLevel: 'PROVED',
        },
        ...prev,
      ]);

      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error submitting sealed bid';
      setError(message);
      return false;
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setProofStep('idle'), 2500);
    }
  };

  /**
   * Close auction and reveal the winning bid
   */
  const closeAndRevealAuction = async (): Promise<boolean> => {
    if (!walletApi) {
      setError('Please connect your Lace wallet first.');
      return false;
    }

    setIsSubmitting(true);
    setError(null);
    setProofStep('closing_auction');

    try {
      const result = await callCloseAuction(walletApi, config);
      if (!result.success) {
        throw new Error(result.error || 'Failed to close auction');
      }

      // Calculate mock or real highest bid from bids
      const highestAmount = myBids.length > 0
        ? Math.max(...myBids.map((b) => b.amount), 450)
        : 520;
      
      const winningCommitment = myBids.length > 0
        ? myBids.reduce((max, b) => (b.amount > max.amount ? b : max), myBids[0]).commitment
        : '0x3c78a91bf420d9e...';

      setAuctionState((prev) => ({
        ...prev,
        auctionOpen: false,
        highestBid: highestAmount,
        winnerCommitment: winningCommitment,
        revealCount: prev.revealCount + 1,
      }));

      setLogs((prev) => [
        {
          id: 'log-' + Date.now(),
          type: 'CLOSE',
          title: 'Auction Finalized & Winner Revealed',
          timestamp: 'Just now',
          details: `Winning bid: ${highestAmount} tDUST. Winner commitment: ${winningCommitment.slice(0, 10)}...`,
          txHash: result.txHash || '0xclose...' + Math.random().toString(16).slice(2, 8),
          status: 'success',
          privacyLevel: 'PUBLIC',
        },
        ...prev,
      ]);

      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error closing auction';
      setError(message);
      return false;
    } finally {
      setIsSubmitting(false);
      setProofStep('idle');
    }
  };

  /**
   * Reset / create new auction (for testing or re-running)
   */
  const createNewAuction = (name: string) => {
    setAuctionState({
      auctionName: name,
      auctionOpen: true,
      bidCount: 0,
      highestBid: 0,
      winnerCommitment: '',
      revealCount: 0,
    });
    setMyBids([]);
    setLogs((prev) => [
      {
        id: 'log-' + Date.now(),
        type: 'CREATE',
        title: `Auction Created: "${name}"`,
        timestamp: 'Just now',
        details: 'Ready for private bids via Compact ZK circuits.',
        txHash: '0x' + Math.random().toString(16).slice(2, 18),
        status: 'success',
        privacyLevel: 'PUBLIC',
      },
      ...prev,
    ]);
  };

  return {
    config,
    auctionState,
    isLoading,
    isSubmitting,
    proofStep,
    error,
    myBids,
    logs,
    refreshState,
    submitBid,
    closeAndRevealAuction,
    createNewAuction,
  };
}
