import React, { useState } from 'react';

interface AuctionCreateProps {
  currentAuctionName: string;
  isConnected: boolean;
  onCreateAuction: (name: string) => void;
}

export const AuctionCreate: React.FC<AuctionCreateProps> = ({
  currentAuctionName,
  isConnected,
  onCreateAuction,
}) => {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [auctionTitle, setAuctionTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auctionTitle.trim()) return;
    onCreateAuction(auctionTitle.trim());
    setAuctionTitle('');
    setIsOpenModal(false);
  };

  return (
    <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Current Auction
        </div>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--color-text-primary)' }}>
          {currentAuctionName}
        </h2>
      </div>

      <div>
        <button
          onClick={() => setIsOpenModal(true)}
          className="btn btn-secondary btn-sm"
          id="btn-new-auction"
        >
          ➕ Launch New Auction
        </button>
      </div>

      {isOpenModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(6, 7, 13, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '1rem',
          }}
        >
          <div className="card" style={{ maxWidth: '480px', width: '100%' }}>
            <div className="card-header">
              <div className="card-icon">
                🏷️
              </div>
              <div>
                <h3 className="card-title">Initialize Auction</h3>
                <p className="card-subtitle">Set up a new privacy-preserving sealed-bid auction</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label" htmlFor="new-auction-title">
                  Auction Item / Title
                </label>
                <input
                  id="new-auction-title"
                  type="text"
                  placeholder="e.g. Rare Cyber Relic #007"
                  value={auctionTitle}
                  onChange={(e) => setAuctionTitle(e.target.value)}
                  className="input"
                  required
                  autoFocus
                />
              </div>

              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                Deploying a new auction resets the on-chain bid counter and initializes public parameters.
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={!auctionTitle.trim()}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Create Auction
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpenModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
