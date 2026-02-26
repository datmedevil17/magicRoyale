import React from 'react';
import { CARD_DATA } from '../game/config/CardConfig';

export interface GameTransaction {
    id: string; // signature or temp ID
    cardId: string;
    ownerId: 'player' | 'opponent';
    status: 'pending' | 'success' | 'fail';
    timestamp: number;
}

interface TransactionDrawerProps {
    transactions: GameTransaction[];
    isOpen: boolean;
    onToggle: () => void;
}

export const TransactionDrawer: React.FC<TransactionDrawerProps> = ({ transactions, isOpen, onToggle }) => {
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: isOpen ? '280px' : '0px',
            height: '100%',
            backgroundColor: 'rgba(20, 20, 20, 0.95)',
            borderLeft: isOpen ? '2px solid #444' : 'none',
            transition: 'width 0.3s ease-in-out',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            color: '#fff',
            boxShadow: isOpen ? '-5px 0 15px rgba(0,0,0,0.5)' : 'none',
            pointerEvents: 'auto'
        }}>
            {/* Header */}
            <div style={{
                padding: '15px',
                borderBottom: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                minWidth: '280px'
            }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#fbce47' }}>Activity Log</h3>
                <button
                    onClick={onToggle}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#888',
                        fontSize: '24px',
                        cursor: 'pointer',
                        padding: '0 5px'
                    }}
                >
                    ×
                </button>
            </div>

            {/* List */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '10px',
                minWidth: '280px'
            }}>
                {transactions.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>No transactions yet</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '8px' }}>
                        {transactions.map(tx => {
                            // Find card data for icon
                            const cardId = Object.keys(CARD_DATA).find(id => CARD_DATA[Number(id)].id === tx.cardId);
                            const icon = cardId ? CARD_DATA[Number(cardId)].icon : '';

                            const isPlayer = tx.ownerId === 'player';
                            const borderColor = isPlayer ? '#3b82f6' : '#ef4444'; // Blue vs Red
                            const bgColor = isPlayer ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)';

                            return (
                                <div
                                    key={tx.id}
                                    style={{
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: `1.5px solid ${borderColor}`,
                                        backgroundColor: bgColor,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontSize: '13px',
                                        position: 'relative',
                                        animation: 'slideIn 0.3s ease-out'
                                    }}
                                >
                                    {/* Icon */}
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        backgroundImage: `url(${icon})`,
                                        backgroundSize: 'contain',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'center',
                                        borderRadius: '4px',
                                        backgroundColor: 'rgba(0,0,0,0.3)'
                                    }} />

                                    {/* Details */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold' }}>{tx.cardId} deployed</div>
                                        <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>
                                            {tx.id.substring(0, 10)}...
                                        </div>
                                    </div>

                                    {/* Status Indicator */}
                                    <div style={{
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        backgroundColor: tx.status === 'success' ? '#10b981' : tx.status === 'fail' ? '#ef4444' : '#f59e0b'
                                    }}>
                                        {tx.status}
                                    </div>

                                    {/* Explorer Link (if success/fail) */}
                                    {tx.id.length > 20 && (
                                        <a
                                            href={`https://explorer.solana.com/tx/${tx.id}?cluster=custom&customUrl=https://devnet.magicblock.app`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                opacity: 0,
                                                cursor: 'pointer'
                                            }}
                                            title="View on Explorer"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(20px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};
