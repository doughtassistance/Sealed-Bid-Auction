import React from 'react';
import type { DeployedAuctionState } from '../midnightProvider';

interface StatsDisplayProps {
  state: DeployedAuctionState;
  contractAddress: string;
}

export const StatsDisplay: React.FC<StatsDisplayProps> = ({ state, contractAddress }) => {
  return (
    <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
      {/* Metric 1: Status */}
      <div className="card stat-card">
        <div className="card-header">
          <div className="card-icon">
            {state.auctionOpen ? '🟢' : '🔒'}
          </div>
          <div>
            <div className="card-subtitle">Auction Status</div>
            <div className="card-title" style={{ fontSize: '1.25rem' }}>
              {state.auctionOpen ? 'Active & Sealed' : 'Concluded'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
          <span className={`badge ${state.auctionOpen ? 'badge-success' : 'badge-warning'}`}>
            {state.auctionOpen ? 'Accepting Zero-Knowledge Bids' : 'Bids Locked'}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
            Preprod Verified
          </span>
        </div>
      </div>

      {/* Metric 2: Bids Count */}
      <div className="card stat-card">
        <div className="card-header">
          <div className="card-icon secondary">
            📊
          </div>
          <div>
            <div className="card-subtitle">Total Verified Bids</div>
            <div className="card-title" style={{ fontSize: '1.75rem', fontFamily: 'var(--font-mono)' }}>
              {state.bidCount}
            </div>
          </div>
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          Public counter updated via on-chain state transition
        </div>
      </div>

      {/* Metric 3: Highest Bid (Selective Disclosure) */}
      <div className="card stat-card">
        <div className="card-header">
          <div className="card-icon">
            🏆
          </div>
          <div>
            <div className="card-subtitle">Winning Bid Amount</div>
            <div className="card-title" style={{ fontSize: '1.75rem', fontFamily: 'var(--font-mono)' }}>
              {state.auctionOpen ? (
                <span style={{ color: 'var(--color-accent-light)', letterSpacing: '2px' }}>
                  ••••••
                </span>
              ) : (
                `${state.highestBid} tDUST`
              )}
            </div>
          </div>
        </div>
        <div>
          {state.auctionOpen ? (
            <span className="badge badge-indigo" title="Deliberate privacy preservation">
              🛡️ Concealed Until Reveal
            </span>
          ) : (
            <span className="badge badge-success">
              ✅ Selectively Disclosed on Reveal
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
