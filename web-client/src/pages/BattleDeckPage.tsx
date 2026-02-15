import React from 'react';
import { useNavigate } from 'react-router-dom';

// Mock Data
const BATTLE_DECK = [
    'ArchersCard', 'ArrowsCard', 'FireballCard', 'GiantCard',
    'MiniPEKKACard', 'BabyDragonCard', 'InfernoTowerCard', 'ValkyrieCard'
];

const COLLECTION = [
    'BarbariansCard', 'CannonCard', 'WizardCard', 'RageCard'
    // Add more if available
];

export const BattleDeckPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="w-screen h-screen bg-[#222] flex justify-center items-center font-[Supercell-Magic] text-white overflow-hidden">
            <div className="relative h-full max-h-[946px] w-auto aspect-[528/946] bg-[#333] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="absolute top-0 left-0 w-full h-[90.7%] z-0">
                    <img src="/assets/cards_menu_background.png" alt="Background" className="w-full h-full object-fill" />
                </div>

                {/* Scrollable Content */}
                <div className="relative w-full h-[90.7%] z-10">
                    {/* Battle Deck Section */}
                    {/* FXML Battle Deck: Y=128, Height=383. Image Height=858. 128/858 = ~14.91% */}
                    <div className="absolute top-[14.9%] left-[0.4%] w-[98.4%] h-[44.6%] flex flex-col items-center">
                        <h2 className="hidden">Battle Deck</h2>
                        <div className="grid grid-cols-4 grid-rows-2 gap-0 w-full h-full p-0 bg-transparent justify-items-center items-center">
                            {BATTLE_DECK.map((card, index) => (
                                <div key={index} className="relative w-full h-full flex justify-center items-center cursor-pointer transition-transform active:scale-95">
                                    <img src={`/assets/${card}.png`} alt={card} className="w-[88%] h-auto max-h-[88%] object-contain drop-shadow-[2px_2px_2px_rgba(0,0,0,0.5)]" />
                                    <div className="absolute top-[-2%] left-[-2%] w-[28%] aspect-square flex justify-center items-center">
                                        <img src="/assets/card_exir.png" className="absolute w-full h-full" />
                                        <span className="relative z-10 text-[0.8em] [text-shadow:1px_1px_0_#000]">3</span> {/* Mock cost */}
                                    </div>
                                    <div className="absolute bottom-[2%] w-full text-center text-[0.55em] text-[#98cdff] [text-shadow:1px_1px_0_#000] py-0.5 rounded">Level 1</div>
                                </div>
                            ))}
                        </div>
                        <div className="hidden bg-black/50 px-2.5 py-1 rounded-2xl mt-2.5 text-[0.9rem] [text-shadow:1px_1px_0_#000]">
                            <span>Average Elixir: 3.8</span>
                        </div>
                    </div>

                    {/* Collection Section */}
                    {/* FXML Collection: Y=694, Height=149. 694/858 = ~80.88% */}
                    <div className="absolute top-[80.9%] left-[0.4%] w-[98.4%] h-[17.3%] flex justify-center">
                        <h2 className="hidden">Collection</h2>
                        <div className="grid grid-cols-4 grid-rows-1 gap-0 w-full h-full p-0 bg-transparent justify-items-center items-center overflow-x-auto overflow-y-hidden">
                            {COLLECTION.map((card, index) => (
                                <div key={index} className="relative w-full h-full flex justify-center items-center cursor-pointer transition-transform active:scale-95">
                                    <img src={`/assets/${card}.png`} alt={card} className="w-[88%] h-auto max-h-[88%] object-contain drop-shadow-[2px_2px_2px_rgba(0,0,0,0.5)]" />
                                    <div className="absolute top-[-2%] left-[-2%] w-[28%] aspect-square flex justify-center items-center">
                                        <img src="/assets/card_exir.png" className="absolute w-full h-full" />
                                        <span className="relative z-10 text-[0.8em] [text-shadow:1px_1px_0_#000]">4</span>
                                    </div>
                                    <div className="absolute bottom-[2%] w-full text-center text-[0.55em] text-[#ffdd6e] [text-shadow:1px_1px_0_#000] py-0.5 rounded">Level 1</div>
                                </div>
                            ))}s
                        </div>
                    </div>
                </div>

                {/* Bottom Nav (Consistent) */}
                <div className="absolute bottom-0 left-0 w-full h-[9.3%] flex justify-center items-end pb-[2%] bg-transparent pointer-events-none">
                    <div className="relative w-[60px] h-[60px] mx-[5px] flex flex-col justify-center items-center cursor-pointer pointer-events-auto transition-transform -translate-y-[5px]">
                        <img src="/assets/selected_option_background.png" className="absolute w-full h-full z-0" />
                        <img src="/assets/cards_icon.png" className="relative w-[50%] h-[50%] object-contain z-10 mb-0.5" />
                        <span className="relative z-10 text-[0.55rem] text-white [text-shadow:1px_1px_0_#000]">Cards</span>
                    </div>
                    <div className="relative w-[60px] h-[60px] mx-[5px] flex flex-col justify-center items-center cursor-pointer pointer-events-auto transition-transform active:scale-95 active:-translate-y-[5px]" onClick={() => alert("Profile coming soon!")}>
                        <img src="/assets/not_selected_option_background.png" className="absolute w-full h-full z-0" />
                        <span className="relative z-10 text-[0.55rem] text-white [text-shadow:1px_1px_0_#000]">Profile</span>
                    </div>
                    <div className="relative w-[60px] h-[60px] mx-[5px] flex flex-col justify-center items-center cursor-pointer pointer-events-auto transition-transform active:scale-95 active:-translate-y-[5px]" onClick={() => navigate('/menu')}>
                        <img src="/assets/not_selected_option_background.png" className="absolute w-full h-full z-0" />
                        <img src="/assets/battle_icon.png" className="relative w-[50%] h-[50%] object-contain z-10 mb-0.5" />
                        <span className="relative z-10 text-[0.55rem] text-white [text-shadow:1px_1px_0_#000]">Battle</span>
                    </div>
                    <div className="relative w-[60px] h-[60px] mx-[5px] flex flex-col justify-center items-center cursor-pointer pointer-events-auto transition-transform active:scale-95 active:-translate-y-[5px]" onClick={() => alert("Camp coming soon!")}>
                        <img src="/assets/not_selected_option_background.png" className="absolute w-full h-full z-0" />
                        <img src="/assets/training_camp_icon.png" className="relative w-[50%] h-[50%] object-contain z-10 mb-0.5" />
                        <span className="relative z-10 text-[0.55rem] text-white [text-shadow:1px_1px_0_#000]">Camp</span>
                    </div>
                    <div className="relative w-[60px] h-[60px] mx-[5px] flex flex-col justify-center items-center cursor-pointer pointer-events-auto transition-transform active:scale-95 active:-translate-y-[5px]" onClick={() => alert("History coming soon!")}>
                        <img src="/assets/not_selected_option_background.png" className="absolute w-full h-full z-0" />
                        <img src="/assets/history_icon.png" className="relative w-[50%] h-[50%] object-contain z-10 mb-0.5" />
                        <span className="relative z-10 text-[0.55rem] text-white [text-shadow:1px_1px_0_#000]">History</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
