/**
 * Witness Provider for Sealed-Bid Auction on Midnight Network
 *
 * Witnesses are functions that provide private inputs to Compact circuits.
 * They run LOCALLY on the user's device and NEVER leave the browser.
 *
 * - bidderSecret: Returns the bidder's 32-byte secret key
 * - bidAmount: Returns the bid amount from local state
 *
 * These values are used inside the ZK circuit to compute commitments
 * and nullifiers, but are NEVER included in the on-chain transaction.
 */

export interface AuctionLocalState {
  /** The bidder's secret key — stored only in local browser storage */
  secret: Uint8Array;
  /** The bid amount — kept entirely private */
  amount: number;
}

/**
 * Create a witness provider bound to the user's local state.
 *
 * @param localState - The local private state containing the bidder's secret and bid amount
 * @returns Witness functions that the Compact runtime calls during proof generation
 */
export function createWitnessProvider(localState: AuctionLocalState) {
  return {
    /**
     * bidderSecret witness — called by the placeBid circuit
     *
     * Returns the bidder's 32-byte secret key from local state.
     * This value NEVER appears on-chain or in any ZK proof output.
     * The circuit only uses it to compute hashes internally.
     */
    bidderSecret: (): Uint8Array => {
      if (!localState.secret || localState.secret.length !== 32) {
        throw new Error(
          'Bidder secret not found in local state. ' +
          'Please ensure you have a valid identity before bidding.'
        );
      }
      return localState.secret;
    },

    /**
     * bidAmount witness — called by the placeBid circuit
     *
     * Returns the bid amount as a BigInt-compatible value.
     * This value is compared against highestBid inside the ZK circuit
     * but is NEVER disclosed to any external party.
     */
    bidAmount: (): bigint => {
      if (localState.amount <= 0) {
        throw new Error('Bid amount must be greater than zero.');
      }
      return BigInt(localState.amount);
    },
  };
}

/**
 * Generate a random 32-byte secret for a new bidder.
 * This secret should be stored securely in local browser storage.
 * It is used to derive:
 *   - A commitment (public hash identifying the bidder pseudonymously)
 *   - A nullifier (prevents double-bidding, unlinkable to identity)
 */
export function generateBidderSecret(): Uint8Array {
  const secret = new Uint8Array(32);
  crypto.getRandomValues(secret);
  return secret;
}

/**
 * Derive a commitment from a bidder's secret.
 * The commitment is what gets stored on-chain (as winnerCommitment
 * if this bidder wins). The secret stays private.
 *
 * NOTE: In the actual Compact contract, this is done by persistentHash.
 * This TypeScript version uses SHA-256 for local preview/testing only.
 */
export async function deriveBidCommitment(secret: Uint8Array): Promise<Uint8Array> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', secret as unknown as BufferSource);
  return new Uint8Array(hashBuffer);
}

/**
 * Derive a bid hash from the secret and amount.
 * This creates a unique identifier for the bid itself.
 * Used locally to verify bid integrity.
 */
export async function deriveBidHash(
  secret: Uint8Array,
  amount: number,
): Promise<Uint8Array> {
  // Combine secret + amount bytes for a unique bid identifier
  const amountBytes = new Uint8Array(8);
  const view = new DataView(amountBytes.buffer);
  view.setBigUint64(0, BigInt(amount), false);

  const combined = new Uint8Array(secret.length + amountBytes.length);
  combined.set(secret);
  combined.set(amountBytes, secret.length);

  const hashBuffer = await crypto.subtle.digest('SHA-256', combined as unknown as BufferSource);
  return new Uint8Array(hashBuffer);
}

/**
 * Derive a nullifier from a bidder's secret.
 * The nullifier prevents double-bidding without revealing identity.
 *
 * NOTE: In the contract, transientHash is used to ensure unlinkability.
 * This TypeScript version uses a prefixed SHA-256 for testing.
 */
export async function deriveNullifier(secret: Uint8Array): Promise<Uint8Array> {
  const prefix = new TextEncoder().encode('nullifier:');
  const prefixed = new Uint8Array(prefix.length + secret.length);
  prefixed.set(prefix);
  prefixed.set(secret, prefix.length);
  const hashBuffer = await crypto.subtle.digest('SHA-256', prefixed as unknown as BufferSource);
  return new Uint8Array(hashBuffer);
}

/**
 * Convert a Uint8Array to a hex string.
 */
export function bytesToHex(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert a hex string to Uint8Array.
 */
export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  return new Uint8Array(clean.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
}
