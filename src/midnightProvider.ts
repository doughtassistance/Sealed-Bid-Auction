/**
 * Midnight Network Provider — Centralized SDK Integration
 *
 * This module wires the Midnight.js SDK for on-chain contract interaction
 * on Midnight Preprod. It uses:
 *
 * - @midnight-ntwrk/midnight-js-network-provider  — network transport layer
 * - @midnight-ntwrk/midnight-js-contracts          — contract call interface
 * - @midnight-ntwrk/compact-runtime                — compiled circuit runtime
 * - @midnight-ntwrk/dapp-connector-api             — Lace wallet DApp connector
 *
 * All proof generation runs locally in the browser via the proof server.
 * Private witness data (bidderSecret, bidAmount) NEVER leaves the client.
 */

import { NETWORK_CONFIG } from './config';
import {
  createNetworkProvider,
  type NetworkProvider,
  type NetworkProviderConfig,
} from '@midnight-ntwrk/midnight-js-network-provider';
import type { ConnectedAPI, WalletConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { MidnightProviders, WalletProvider } from '@midnight-ntwrk/midnight-js-types';
import type { ContractAddress } from '@midnight-ntwrk/compact-runtime';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MidnightProviderConfig extends NetworkProviderConfig {
  networkId: string;
  indexerUrl: string;
  nodeUrl: string;
  proofServerUrl: string;
  contractAddress: string;
}

export interface CircuitCallResult {
  success: boolean;
  txHash: string | null;
  nullifier: string | null;
  error: string | null;
}

export interface DeployedAuctionState {
  auctionName: string;
  auctionOpen: boolean;
  bidCount: number;
  highestBid: number;
  winnerCommitment: string;
  revealCount: number;
}

// ---------------------------------------------------------------------------
// Provider Factory
// ---------------------------------------------------------------------------

/**
 * Build the provider configuration from environment / defaults.
 */
export function createProviderConfig(): MidnightProviderConfig {
  return {
    networkId: NETWORK_CONFIG.networkId,
    indexerUrl: NETWORK_CONFIG.indexerUrl,
    nodeUrl: NETWORK_CONFIG.nodeUrl,
    proofServerUrl: NETWORK_CONFIG.proofServerUrl,
    contractAddress: NETWORK_CONFIG.contractAddress,
  };
}

/**
 * Instantiate the Midnight.js network provider client for Preprod.
 */
export function getNetworkProvider(config: MidnightProviderConfig): NetworkProvider {
  return createNetworkProvider({
    networkId: config.networkId,
    indexerUrl: config.indexerUrl,
    nodeUrl: config.nodeUrl,
  });
}

// ---------------------------------------------------------------------------
// Contract State Query
// ---------------------------------------------------------------------------

/**
 * Fetch the current on-chain contract state from the Midnight Preprod indexer.
 *
 * Queries the indexer GraphQL endpoint for the deployed contract's public
 * ledger state (auctionName, auctionOpen, bidCount, highestBid, etc.)
 * using the Midnight.js NetworkProvider.
 */
export async function fetchContractState(
  config: MidnightProviderConfig,
): Promise<DeployedAuctionState> {
  const query = `{
    contract(address: "${config.contractAddress}") {
      state {
        auctionName
        auctionOpen
        bidCount
        highestBid
        winnerCommitment
        revealCount
      }
    }
  }`;

  const networkProvider = getNetworkProvider(config);
  const json = await networkProvider.query(query);
  const state = json?.data?.contract?.state;

  if (!state) {
    throw new Error(
      'Contract state not found on indexer. Is the contract deployed to Preprod?',
    );
  }

  return {
    auctionName: state.auctionName ?? '',
    auctionOpen: state.auctionOpen ?? false,
    bidCount: Number(state.bidCount ?? 0),
    highestBid: Number(state.highestBid ?? 0),
    winnerCommitment: state.winnerCommitment ?? '',
    revealCount: Number(state.revealCount ?? 0),
  };
}

// ---------------------------------------------------------------------------
// Circuit Call: placeBid
// ---------------------------------------------------------------------------

/**
 * Submit a `placeBid(commitment)` circuit call to the Midnight Preprod
 * sequencer via the Lace wallet DApp connector.
 *
 * Flow:
 * 1. Build the circuit transaction payload with commitment and private witnesses.
 * 2. The proof server generates the ZK-SNARK locally using bidderSecret
 *    and bidAmount as private witnesses — they NEVER leave the browser.
 * 3. The proof + commitment + nullifier are packaged into a transaction.
 * 4. Lace wallet signs and broadcasts the transaction to Preprod.
 * 5. The sequencer verifies the proof on-chain and updates auction state.
 *
 * PRIVACY: The bid amount and bidder identity NEVER leave the browser.
 * The on-chain verifier learns only that "a valid bid was placed" and
 * whether it exceeded the current highest bid.
 *
 * @param walletApi       - The connected Lace wallet API handle
 * @param config          - Midnight provider configuration
 * @param commitment      - The 32-byte hash of the bidder's secret
 * @param bidderSecret    - The bidder's 32-byte secret (stays local)
 * @param bidAmount       - The bid amount (stays local)
 */
export async function callPlaceBid(
  walletApi: any,
  config: MidnightProviderConfig,
  commitment: Uint8Array,
  bidderSecret: Uint8Array,
  bidAmount: number,
): Promise<CircuitCallResult> {
  try {
    // Build the circuit call transaction targeting the deployed contract.
    // The bidderSecret and bidAmount are passed as private witness inputs —
    // they are used by the local proof server to generate the ZK proof
    // but are NEVER included in the transaction payload that goes on-chain.
    const txPayload = {
      contractAddress: config.contractAddress,
      circuit: 'placeBid',
      arguments: [commitment],
      witnesses: {
        bidderSecret: () => bidderSecret,
        bidAmount: () => BigInt(bidAmount),
      },
      proofServerUrl: config.proofServerUrl,
    };

    // Submit the proof-bearing transaction through Lace.
    // The proof server generates the ZK-SNARK locally, then Lace signs
    // and broadcasts the transaction to the Midnight Preprod sequencer.
    const txResult = await walletApi.submitTransaction(txPayload);

    // Extract the nullifier from the on-chain transaction result.
    const nullifierHex = txResult?.nullifier
      ? '0x' + Array.from(new Uint8Array(txResult.nullifier))
          .map((b: number) => b.toString(16).padStart(2, '0'))
          .join('')
      : txResult?.transactionHash ?? null;

    return {
      success: true,
      txHash: txResult?.transactionHash ?? null,
      nullifier: nullifierHex,
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      txHash: null,
      nullifier: null,
      error: message,
    };
  }
}

// ---------------------------------------------------------------------------
// Circuit Call: closeAuction
// ---------------------------------------------------------------------------

/**
 * Submit a `closeAuction()` circuit call to close the auction.
 *
 * After this call, no more bids can be placed. The highest bid
 * and winner commitment are finalized on-chain.
 *
 * @param walletApi - The connected Lace wallet API handle
 * @param config    - Midnight provider configuration
 */
export async function callCloseAuction(
  walletApi: any,
  config: MidnightProviderConfig,
): Promise<CircuitCallResult> {
  try {
    const txPayload = {
      contractAddress: config.contractAddress,
      circuit: 'closeAuction',
      arguments: [],
      proofServerUrl: config.proofServerUrl,
    };

    const txResult = await walletApi.submitTransaction(txPayload);

    return {
      success: true,
      txHash: txResult?.transactionHash ?? null,
      nullifier: null,
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      txHash: null,
      nullifier: null,
      error: message,
    };
  }
}
