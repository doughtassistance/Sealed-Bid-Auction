import React from 'react';

export const PrivacyModel: React.FC = () => {
  return (
    <div className="card" style={{ marginTop: '2.5rem' }}>
      <div className="card-header">
        <div className="card-icon">
          🌓
        </div>
        <div>
          <h3 className="card-title">Midnight Selective Disclosure Architecture</h3>
          <p className="card-subtitle">
            How Zero-Knowledge Circuits separate public ledger state from private local witnesses.
          </p>
        </div>
      </div>

      <div className="grid grid-3" style={{ gap: '1.25rem' }}>
        {/* Column 1: Public State */}
        <div
          style={{
            background: 'var(--color-bg-tertiary)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span className="badge badge-warning">PUBLIC STATE</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Visible on Preprod</span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
            Stored globally in contract ledger state and queryable by any indexer:
          </p>
          <ul style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <li>🔹 <code>auctionName</code>: Human title of the item</li>
            <li>🔹 <code>auctionOpen</code>: Active or closed flag</li>
            <li>🔹 <code>bidCount</code>: Number of sealed bids placed</li>
            <li>🔹 <code>highestBid</code>: Disclosed ONLY when closed</li>
            <li>🔹 <code>winnerCommitment</code>: Hash of winner</li>
          </ul>
        </div>

        {/* Column 2: Private Witnesses */}
        <div
          style={{
            background: 'var(--color-bg-tertiary)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-accent)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span className="badge badge-success">PRIVATE WITNESSES</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Local Browser Only</span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
            Fed into client-side ZK-SNARK compiler, never sent over network:
          </p>
          <ul style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <li>🔒 <code>bidderSecret()</code>: 32-byte secret key</li>
            <li>🔒 <code>bidAmount()</code>: Numerical valuation</li>
            <li>🔒 <strong>Bidder Identity:</strong> Completely untracked</li>
            <li>🔒 <strong>Losing Bids:</strong> Forever unrevealed</li>
          </ul>
        </div>

        {/* Column 3: Proved Properties */}
        <div
          style={{
            background: 'var(--color-bg-tertiary)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span className="badge badge-indigo">PROVED IN ZK</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Cryptographically Verified</span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
            Mathematical properties verified by Midnight Preprod sequencer:
          </p>
          <ul style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <li>⚡ <em>"Bidder has knowledge of the secret key"</em></li>
            <li>⚡ <em>"Bid amount is valid and positive"</em></li>
            <li>⚡ <em>"Nullifier is unique (anti-double bidding)"</em></li>
            <li>⚡ <em>"Winner has highest valid offer without leak"</em></li>
          </ul>
        </div>
      </div>
    </div>
  );
};
