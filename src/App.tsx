import React from 'react';
import { useWallet } from './hooks/useWallet';
import { useAuction } from './hooks/useAuction';
import { WalletConnect } from './components/WalletConnect';
import { AuctionCreate } from './components/AuctionCreate';
import { StatsDisplay } from './components/StatsDisplay';
import { BidSubmit } from './components/BidSubmit';
import { AuctionReveal } from './components/AuctionReveal';
import { BidLog } from './components/BidLog';
import { PrivacyModel } from './components/PrivacyModel';

export const App: React.FC = () => {
  const {
    isConnected,
    isConnecting,
    address,
    network,
    error: walletError,
    walletApi,
    connect,
    disconnect,
  } = useWallet();

  const {
    config,
    auctionState,
    isSubmitting,
    proofStep,
    error: auctionError,
    myBids,
    logs,
    submitBid,
    closeAndRevealAuction,
    createNewAuction,
  } = useAuction(walletApi);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-icon">
            ⚖️
          </div>
          <div>
            <div className="app-logo-text">SealedBid</div>
            <div className="app-logo-subtitle">
              Midnight Privacy-Preserving Auction dApp
            </div>
          </div>
        </div>

        <WalletConnect
          isConnected={isConnected}
          isConnecting={isConnecting}
          address={address}
          network={network}
          error={walletError}
          onConnect={connect}
          onDisconnect={disconnect}
        />
      </header>

      {/* Contract & Network Info Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          marginBottom: '2rem',
          fontSize: '0.8125rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ color: 'var(--color-text-tertiary)' }}>Network:</span>
          <span className="badge badge-indigo">Midnight Preprod</span>
          <span style={{ color: 'var(--color-text-tertiary)' }}>Contract:</span>
          <span className="mono" style={{ color: 'var(--color-accent-light)' }}>
            {config.contractAddress}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-success">
            ● ZK-SNARK Prover Active
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main>
        {/* Auction Title & Header Control */}
        <AuctionCreate
          currentAuctionName={auctionState.auctionName}
          isConnected={isConnected}
          onCreateAuction={createNewAuction}
        />

        {/* Global Error Banner */}
        {auctionError && (
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-error-bg)',
              border: '1px solid var(--color-error)',
              color: 'var(--color-error)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <span>⚠️</span>
            <span>{auctionError}</span>
          </div>
        )}

        {/* Live Statistics Cards */}
        <StatsDisplay
          state={auctionState}
          contractAddress={config.contractAddress}
        />

        {/* Dual Interaction Grid: Place Bid & Reveal */}
        <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
          <BidSubmit
            isOpen={auctionState.auctionOpen}
            isConnected={isConnected}
            isSubmitting={isSubmitting}
            proofStep={proofStep}
            onSubmitBid={submitBid}
          />

          <AuctionReveal
            state={auctionState}
            isConnected={isConnected}
            isSubmitting={isSubmitting}
            myBids={myBids}
            onReveal={closeAndRevealAuction}
          />
        </div>

        {/* Audit & Activity Log */}
        <BidLog
          logs={logs}
          myBids={myBids}
        />

        {/* Privacy Model & Architecture */}
        <PrivacyModel />
      </main>

      {/* Footer */}
      <footer
        style={{
          marginTop: '4rem',
          padding: '2rem 0',
          borderTop: '1px solid var(--color-border)',
          textAlign: 'center',
          color: 'var(--color-text-tertiary)',
          fontSize: '0.8125rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div>
          Built for the <strong>Midnight Builder Challenge</strong> • Level 1, 2 & 3 Submission
        </div>
        <div>
          Powered by <strong>Compact Language</strong> & <strong>Zero-Knowledge Circuits</strong> on Midnight Network
        </div>
      </footer>
    </div>
  );
};

export default App;
