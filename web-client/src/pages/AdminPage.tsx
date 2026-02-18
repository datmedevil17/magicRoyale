import React, { useState, useEffect } from 'react';
import { useGameProgram } from '../hooks/use-game-program';
import { CARD_ID_TO_NAME, CARD_NAME_TO_ID } from '../game/config/CardConfig';

export const AdminPage: React.FC = () => {
    const { fetchMarketListings, addMarketListing } = useGameProgram();
    const [listings, setListings] = useState<{ cardId: number, price: number }[]>([]);
    const [selectedCard, setSelectedCard] = useState<string>('Archer');
    const [price, setPrice] = useState<number>(100);
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        loadListings();
    }, [fetchMarketListings]);

    const loadListings = async () => {
        const data = await fetchMarketListings();
        setListings(data);
    };

    const handleAddListing = async () => {
        const cardId = CARD_NAME_TO_ID[selectedCard];
        if (!cardId) {
            setMessage('Invalid card selected');
            return;
        }

        const success = await addMarketListing(cardId, price);
        if (success) {
            setMessage(`Successfully listed ${selectedCard} for ${price} Tokens`);
            loadListings();
        } else {
            setMessage('Failed to add listing');
        }
    };

    return (
        <div className="min-h-screen bg-[#1a1a1a] text-white p-8 font-sans">
            <h1 className="text-3xl font-bold mb-8 text-[#fbce47]">Admin Dashboard</h1>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Add Listing Form */}
                <div className="bg-[#2a2a2a] p-6 rounded-lg border border-[#fbce47]/30">
                    <h2 className="text-xl font-bold mb-4">Add / Update Market Listing</h2>
                    
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Select Card</label>
                            <select 
                                className="w-full bg-[#1a1a1a] border border-gray-600 rounded p-2 text-white"
                                value={selectedCard}
                                onChange={(e) => setSelectedCard(e.target.value)}
                            >
                                {Object.keys(CARD_NAME_TO_ID).map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Price (Tokens)</label>
                            <input 
                                type="number" 
                                className="w-full bg-[#1a1a1a] border border-gray-600 rounded p-2 text-white"
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value))}
                            />
                        </div>

                        <button 
                            className="bg-[#fbce47] hover:bg-[#ffda6b] text-black font-bold py-2 rounded mt-2 transition-colors"
                            onClick={handleAddListing}
                        >
                            Update Listing
                        </button>

                        {message && (
                            <div className={`p-2 rounded text-center text-sm ${message.includes('Success') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {message}
                            </div>
                        )}
                    </div>
                </div>

                {/* Current Listings */}
                <div className="bg-[#2a2a2a] p-6 rounded-lg border border-[#fbce47]/30">
                    <h2 className="text-xl font-bold mb-4">Current Market Listings</h2>
                    
                    {listings.length === 0 ? (
                        <p className="text-gray-500 italic">No active listings.</p>
                    ) : (
                        <div className="space-y-2">
                            {listings.map((item) => (
                                <div key={item.cardId} className="flex justify-between items-center bg-[#1a1a1a] p-3 rounded border border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-xs text-gray-500">
                                            {item.cardId}
                                        </div>
                                        <span className="font-bold">{CARD_ID_TO_NAME[item.cardId] || `Unknown (${item.cardId})`}</span>
                                    </div>
                                    <span className="text-[#fbce47] font-mono">{item.price} T</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="mt-8 text-center text-sm text-gray-500">
                <p>Note: These prices are visual only. On-chain transaction cost is fixed.</p>
            </div>
        </div>
    );
};
