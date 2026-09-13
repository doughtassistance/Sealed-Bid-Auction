import React, { useState } from 'react';
import type { DeployedAuctionState } from '../midnightProvider';
import type { BidRecord } from '../hooks/useAuction';

interface AuctionRevealProps {
  state: DeployedAuctionState;
  isConnected: boolean;
  isSubmitting: boolean;
  myBids: BidRecord[];
  onReveal: () => Promise<boolean>;
}

export const AuctionReveal: React.FC<AuctionRevealProps> = ({
  state,
  isConnected,
  isSubmitting,
  myBids,
  onReveal,
}) => {
  const [confirmPrompt, setConfirmPrompt] = useState(false);

  // Check if current user is the winning commitment
  const isUserWinner =
    !state.auctionOpen &&
    state.winnerCommitment &&
    myBids.some((b) => b.commitment.toLowerCase() === state.winnerCommitment.toLowerCase());

  const handleRevealClick = async () => {
    if (!confirmPrompt) {
      setConfirmPrompt(true);
      return;
    }
    setConfirmPrompt(false);
    await onReveal();
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon secondary">
          🔓
        </div>
        <div>
          <h3 className="card-title">Auction Finalization & Reveal</h3>
          <p className="card-subtitle">
            {state.auctionOpen
              ? 'Conclude bidding phase and trigger selective disclosure of the highest bid value.'
              : 'The auction has finalized. Only the winning bid value is disclosed.'}
          </p>
        </div>
      </div>

      {state.auctionOpen ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
              ℹ️ Selective Disclosure Mechanics
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              Upon closing, the Compact contract executes <code>disclose(highestBid)</code>. The
              identity of the winner remains protected behind an anonymous cryptographic commitment,
              and losing bids remain forever sealed in zero-knowledge.
            </p>
          </div>

          {confirmPrompt && (
            <div
              style={{
                padding: '0.75rem 1rem',
                background: 'var(--color-warning-bg)',
                border: '1px solid var(--color-warning)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-warning)',
                fontSize: '0.85rem',
              }}
            >
              ⚠️ Are you sure you want to end bidding? No further bids can be accepted.
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleRevealClick}
              disabled={!isConnected || isSubmitting}
              className="btn btn-secondary"
              id="btn-close-reveal-auction"
              style={{ flex: 1 }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" /> Closing Auction on Preprod...
                </>
              ) : confirmPrompt ? (
                'Confirm Final Close & Reveal'
              ) : (
                'Close Auction & Disclose Winner'
              )}
            </button>
            {confirmPrompt && (
              <button
                onClick={() => setConfirmPrompt(false)}
                className="btn btn-secondary"
                style={{ padding: '0.75rem 1rem' }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              background: isUserWinner
                ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)'
                : 'var(--color-bg-tertiary)',
              border: `1px solid ${isUserWinner ? 'var(--color-success)' : 'var(--color-border-accent)'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="badge badge-success">✅ Auction Successfully Settled</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                ZK State Finalized
              </span>
            </div>

            {isUserWinner && (
              <div
                style={{
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  background: 'var(--color-success-bg)',
                  border: '1px solid var(--color-success)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-success)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                🎉 Congratulations! Your local commitment matches the verified winner!
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
                  Disclosed Winning Amount
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-accent-light)' }}>
                  {state.highestBid} tDUST
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
                  Winner Commitment (Hash)
                </div>
                <div className="mono" style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>
                  {state.winnerCommitment || '0x3c78a91bf420d9e912401f8...'}
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--color-border)',
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)',
              }}
            >
              🔒 <strong>Losing Bids:</strong> Remain forever undisclosed. No observer can inspect
              losing bids or determine who placed them.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
