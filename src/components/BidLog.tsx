import React, { useState } from 'react';
import type { ActivityLog, BidRecord } from '../hooks/useAuction';

interface BidLogProps {
  logs: ActivityLog[];
  myBids: BidRecord[];
}

export const BidLog: React.FC<BidLogProps> = ({ logs, myBids }) => {
  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public');

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 className="card-title">Audit & Activity Log</h3>
          <p className="card-subtitle">
            Compare on-chain public proofs against client-side private witnesses.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-bg-tertiary)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
          <button
            onClick={() => setActiveTab('public')}
            className={`btn btn-sm ${activeTab === 'public' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none' }}
          >
            🌐 Public On-Chain View ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('private')}
            className={`btn btn-sm ${activeTab === 'private' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none' }}
          >
            🔐 My Private Bids ({myBids.length})
          </button>
        </div>
      </div>

      {activeTab === 'public' ? (
        <div>
          <div
            style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid var(--color-border-secondary)',
              fontSize: '0.8rem',
              color: 'var(--color-text-secondary)',
            }}
          >
            👁️ <strong>Observer Perspective:</strong> An observer monitoring Midnight Preprod sees proof
            verifications, nullifier updates, and state transitions, but <em>cannot</em> determine the bid amount
            or the identity of who submitted it.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {logs.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '0.875rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.title}</span>
                    <span
                      className={`badge ${
                        item.privacyLevel === 'PUBLIC'
                          ? 'badge-warning'
                          : item.privacyLevel === 'PROVED'
                          ? 'badge-indigo'
                          : 'badge-success'
                      }`}
                    >
                      {item.privacyLevel}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                    {item.details}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                    {item.timestamp}
                  </div>
                  {item.txHash && (
                    <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--color-accent-light)' }}>
                      {item.txHash.slice(0, 10)}...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div
            style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid var(--color-border-accent)',
              fontSize: '0.8rem',
              color: 'var(--color-text-secondary)',
            }}
          >
            🔒 <strong>Bidder Private Perspective:</strong> This local device holds your private witness
            values and bid amounts. This data is NEVER broadcast across the network.
          </div>

          {myBids.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-tertiary)' }}>
              No private bids placed on this device yet. Submit a sealed bid above!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {myBids.map((bid) => (
                <div
                  key={bid.id}
                  style={{
                    padding: '0.875rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-accent-light)', fontSize: '1rem' }}>
                        {bid.amount} tDUST
                      </span>
                      <span className="badge badge-success">Client-Side Witness</span>
                    </div>
                    <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                      Commitment: {bid.commitment.slice(0, 14)}...
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                      {bid.timestamp}
                    </div>
                    <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      Nullifier: {bid.nullifier.slice(0, 8)}...
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
