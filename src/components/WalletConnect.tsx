import React from 'react';

interface WalletConnectProps {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  network: string | null;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({
  isConnected,
  isConnecting,
  address,
  network,
  error,
  onConnect,
  onDisconnect,
}) => {
  const formatAddress = (addr: string) => {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="wallet-connect">
      {error && (
        <div className="badge badge-error" style={{ marginRight: '0.5rem' }}>
          ⚠️ {error}
        </div>
      )}

      {isConnected && address ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="badge badge-success">
            <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
            {network || 'Preprod'}
          </span>
          <div
            className="mono"
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-card)',
            }}
            title={address}
          >
            {formatAddress(address)}
          </div>
          <button
            onClick={onDisconnect}
            className="btn btn-secondary btn-sm"
            title="Disconnect Lace Wallet"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={onConnect}
          disabled={isConnecting}
          className="btn btn-primary"
          id="btn-connect-wallet"
        >
          {isConnecting ? (
            <>
              <span className="spinner" />
              Connecting to Lace...
            </>
          ) : (
            <>
              <span style={{ fontSize: '1.1rem' }}>⚡</span> Connect Lace Wallet
            </>
          )}
        </button>
      )}
    </div>
  );
};
