import React, { useState } from 'react';

interface BidSubmitProps {
  isOpen: boolean;
  isConnected: boolean;
  isSubmitting: boolean;
  proofStep: string;
  onSubmitBid: (amount: number) => Promise<boolean>;
}

export const BidSubmit: React.FC<BidSubmitProps> = ({
  isOpen,
  isConnected,
  isSubmitting,
  proofStep,
  onSubmitBid,
}) => {
  const [bidAmount, setBidAmount] = useState<string>('');
  const [localFeedback, setLocalFeedback] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(bidAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setLocalFeedback('Please specify a positive bid amount.');
      return;
    }

    setLocalFeedback(null);
    const success = await onSubmitBid(parsed);
    if (success) {
      setBidAmount('');
      setLocalFeedback('🎉 Bid successfully sealed & proved to Midnight Preprod!');
      setTimeout(() => setLocalFeedback(null), 5000);
    }
  };

  const getStepText = (step: string) => {
    switch (step) {
      case 'generating_witness':
        return 'Deriving private witness & commitment locally...';
      case 'proving':
        return 'Generating ZK-SNARK zero-knowledge proof in browser...';
      case 'submitting':
        return 'Broadcasting proof to Midnight Preprod sequencer...';
      case 'confirmed':
        return 'Proof verified on-chain! Bid sealed.';
      default:
        return 'Processing circuit call...';
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon">
          🤫
        </div>
        <div>
          <h3 className="card-title">Place Sealed Bid</h3>
          <p className="card-subtitle">
            Amounts are evaluated inside ZK circuits. No third-party or observer sees your offer.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="input-group">
          <label className="input-label" htmlFor="bid-amount-input">
            Bid Offer Amount (tDUST)
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="bid-amount-input"
              type="number"
              step="any"
              min="1"
              placeholder="e.g. 250"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              disabled={!isOpen || !isConnected || isSubmitting}
              className="input input-mono"
              required
            />
            <span
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-accent-light)',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              tDUST
            </span>
          </div>
        </div>

        {/* Selective disclosure privacy banner */}
        <div
          style={{
            padding: '0.875rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border-secondary)',
            fontSize: '0.8125rem',
            lineHeight: 1.5,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ color: '#818cf8', fontWeight: 600 }}>🛡️ Privacy Guarantees:</span>
          </div>
          <ul style={{ paddingLeft: '1.2rem', color: 'var(--color-text-secondary)' }}>
            <li><strong>Amount:</strong> Stays in local witness memory (never leaves browser).</li>
            <li><strong>Identity:</strong> Concealed via ephemeral nullifier hash.</li>
            <li><strong>Proof:</strong> Verifies bid validity without leaking the exact value.</li>
          </ul>
        </div>

        {isSubmitting && (
          <div
            style={{
              padding: '0.75rem',
              background: 'var(--color-accent-glow)',
              border: '1px solid var(--color-border-accent)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.875rem',
            }}
          >
            <span className="spinner" />
            <span>{getStepText(proofStep)}</span>
          </div>
        )}

        {localFeedback && (
          <div
            style={{
              padding: '0.75rem',
              background: localFeedback.startsWith('🎉') ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
              border: `1px solid ${localFeedback.startsWith('🎉') ? 'var(--color-success)' : 'var(--color-error)'}`,
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              color: localFeedback.startsWith('🎉') ? 'var(--color-success)' : 'var(--color-error)',
            }}
          >
            {localFeedback}
          </div>
        )}

        <button
          type="submit"
          id="btn-submit-sealed-bid"
          disabled={!isOpen || !isConnected || isSubmitting || !bidAmount}
          className="btn btn-primary btn-lg"
          style={{ width: '100%' }}
        >
          {isSubmitting ? (
            'Computing ZK Proof...'
          ) : !isConnected ? (
            'Connect Lace Wallet to Bid'
          ) : !isOpen ? (
            'Auction is Closed'
          ) : (
            'Submit Private Sealed Bid'
          )}
        </button>
      </form>
    </div>
  );
};
