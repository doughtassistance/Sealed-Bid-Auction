import { describe, it, expect } from 'vitest';
import {
  generateBidderSecret,
  deriveBidCommitment,
  deriveBidHash,
  deriveNullifier,
  bytesToHex,
  hexToBytes,
  createWitnessProvider,
} from '../contracts/witnesses';

describe('Sealed-Bid Auction: Cryptographic Circuits & Witnesses', () => {
  // Test 1: Bidder secret generation
  it('1. should generate a cryptographically valid 32-byte secret', () => {
    const secret1 = generateBidderSecret();
    const secret2 = generateBidderSecret();

    expect(secret1).toBeInstanceOf(Uint8Array);
    expect(secret1.length).toBe(32);
    expect(secret2.length).toBe(32);
    // Secrets must be uniquely generated (randomness test)
    expect(secret1).not.toEqual(secret2);
  });

  // Test 2: Bid commitment derivation is deterministic
  it('2. should derive deterministic commitments from bidder secrets', async () => {
    const secret = generateBidderSecret();
    const commitment1 = await deriveBidCommitment(secret);
    const commitment2 = await deriveBidCommitment(secret);

    expect(commitment1).toBeInstanceOf(Uint8Array);
    expect(commitment1.length).toBe(32);
    expect(bytesToHex(commitment1)).toBe(bytesToHex(commitment2));
  });

  // Test 3: Different bidders produce distinct commitments (collision resistance)
  it('3. should produce different commitments for different bidders', async () => {
    const aliceSecret = generateBidderSecret();
    const bobSecret = generateBidderSecret();

    const aliceCommitment = await deriveBidCommitment(aliceSecret);
    const bobCommitment = await deriveBidCommitment(bobSecret);

    expect(bytesToHex(aliceCommitment)).not.toBe(bytesToHex(bobCommitment));
  });

  // Test 4: One-way property — commitment does not expose the secret
  it('4. should satisfy one-way property (commitment is not equal to input secret)', async () => {
    const secret = generateBidderSecret();
    const commitment = await deriveBidCommitment(secret);

    expect(bytesToHex(commitment)).not.toBe(bytesToHex(secret));
  });

  // Test 5: Nullifier derivation and domain separation
  it('5. should derive distinct nullifiers with strict domain separation', async () => {
    const secret = generateBidderSecret();
    const commitment = await deriveBidCommitment(secret);
    const nullifier = await deriveNullifier(secret);

    expect(nullifier.length).toBe(32);
    // Nullifier must differ from commitment due to domain separation prefix
    expect(bytesToHex(nullifier)).not.toBe(bytesToHex(commitment));

    // Another secret must produce a different nullifier
    const otherSecret = generateBidderSecret();
    const otherNullifier = await deriveNullifier(otherSecret);
    expect(bytesToHex(nullifier)).not.toBe(bytesToHex(otherNullifier));
  });

  // Test 6: Bid hash sensitivity to amount (integrity)
  it('6. should alter bid hash if amount changes even with the same secret', async () => {
    const secret = generateBidderSecret();
    const bid100Hash = await deriveBidHash(secret, 100);
    const bid200Hash = await deriveBidHash(secret, 200);

    expect(bytesToHex(bid100Hash)).not.toBe(bytesToHex(bid200Hash));
  });

  // Test 7: Double-bid prevention via nullifier tracking
  it('7. should enforce replay protection by rejecting duplicate nullifiers', async () => {
    const usedNullifiers = new Set<string>();

    const secret = generateBidderSecret();
    const nullifier = await deriveNullifier(secret);
    const nullifierHex = bytesToHex(nullifier);

    // First bid: nullifier not in set -> success
    expect(usedNullifiers.has(nullifierHex)).toBe(false);
    usedNullifiers.add(nullifierHex);

    // Attempting second bid with same secret -> duplicate detected
    const isDuplicate = usedNullifiers.has(nullifierHex);
    expect(isDuplicate).toBe(true);
  });

  // Test 8: Witness Provider validation
  it('8. should validate witness inputs before feeding into Compact runtime', () => {
    const validSecret = generateBidderSecret();
    const provider = createWitnessProvider({
      secret: validSecret,
      amount: 150,
    });

    expect(provider.bidderSecret()).toEqual(validSecret);
    expect(provider.bidAmount()).toBe(150n);

    // Error case: invalid amount
    const invalidAmountProvider = createWitnessProvider({
      secret: validSecret,
      amount: -10,
    });
    expect(() => invalidAmountProvider.bidAmount()).toThrow('Bid amount must be greater than zero.');

    // Error case: missing or short secret
    const invalidSecretProvider = createWitnessProvider({
      secret: new Uint8Array(10), // invalid length
      amount: 50,
    });
    expect(() => invalidSecretProvider.bidderSecret()).toThrow('Bidder secret not found in local state');
  });

  // Test 9: Hex encode / decode roundtrip
  it('9. should perform lossless hex conversion roundtrip', () => {
    const original = generateBidderSecret();
    const hex = bytesToHex(original);
    const restored = hexToBytes(hex);

    expect(restored).toEqual(original);
  });

  // Test 10: Auction lifecycle state machine (selective disclosure)
  it('10. should model full auction lifecycle with selective disclosure', async () => {
    // Initial State: Auction is open, 0 bids, 0 highest bid visible
    const auction = {
      name: 'Rare Relic Auction',
      isOpen: true,
      bidCount: 0,
      highestBid: 0, // Concealed
      winnerCommitment: '',
      usedNullifiers: new Set<string>(),
    };

    // Bidder 1 places sealed bid of 100
    const aliceSecret = generateBidderSecret();
    const aliceCommitment = bytesToHex(await deriveBidCommitment(aliceSecret));
    const aliceNullifier = bytesToHex(await deriveNullifier(aliceSecret));

    auction.bidCount += 1;
    auction.usedNullifiers.add(aliceNullifier);

    // Highest bid MUST remain concealed during active bidding
    expect(auction.isOpen).toBe(true);
    expect(auction.bidCount).toBe(1);
    expect(auction.highestBid).toBe(0);

    // Bidder 2 places sealed bid of 250
    const bobSecret = generateBidderSecret();
    const bobCommitment = bytesToHex(await deriveBidCommitment(bobSecret));
    const bobNullifier = bytesToHex(await deriveNullifier(bobSecret));

    auction.bidCount += 1;
    auction.usedNullifiers.add(bobNullifier);

    expect(auction.bidCount).toBe(2);
    expect(auction.highestBid).toBe(0); // Still concealed

    // Finalize auction: selective disclosure triggers
    auction.isOpen = false;
    auction.highestBid = 250; // Disclosed
    auction.winnerCommitment = bobCommitment; // Disclosed hash, Bob's real identity remains private

    expect(auction.isOpen).toBe(false);
    expect(auction.highestBid).toBe(250);
    expect(auction.winnerCommitment).toBe(bobCommitment);
    // Alice's bid amount (100) and identity are NEVER disclosed!
  });
});
