import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BattleDeckPage.css';

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
        <div className="battle-deck-page">
            <div className="background-image">
                <img src="/assets/cards_menu_background.png" alt="Background" />
            </div>

            {/* Back Button (reuse from main menu style or new) */}
            <div className="top-nav">
                <div className="nav-btn" onClick={() => navigate('/menu')}>
                    <span>Back</span>
                </div>
            </div>

            {/* Battle Deck Section */}
            <div className="deck-section battle-deck">
                <h2>Battle Deck</h2>
                <div className="card-grid">
                    {BATTLE_DECK.map((card, index) => (
                        <div key={index} className="card-item">
                            <img src={`/assets/${card}.png`} alt={card} />
                            <div className="elixir-cost">
                                <img src="/assets/card_exir.png" />
                                <span>3</span> {/* Mock cost */}
                            </div>
                            <div className="level-ind">Level 1</div>
                        </div>
                    ))}
                </div>
                <div className="avg-elixir">
                    <span>Average Elixir: 3.8</span>
                </div>
            </div>

            {/* Collection Section */}
            <div className="deck-section collection">
                <h2>Collection</h2>
                <div className="card-grid">
                    {COLLECTION.map((card, index) => (
                        <div key={index} className="card-item">
                            <img src={`/assets/${card}.png`} alt={card} />
                            <div className="elixir-cost">
                                <img src="/assets/card_exir.png" />
                                <span>4</span>
                            </div>
                            <div className="level-ind">Level 1</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Nav (Consistent) */}
            <div className="bottom-nav">
                <div className="nav-item active">
                    <img src="/assets/selected_option_background.png" className="nav-bg" />
                    <img src="/assets/cards_icon.png" className="nav-icon" />
                    <span className="nav-text">Cards</span>
                </div>
                <div className="nav-item">
                    <img src="/assets/not_selected_option_background.png" className="nav-bg" />
                    <span className="nav-text">Profile</span>
                </div>
                <div className="nav-item" onClick={() => navigate('/menu')}>
                    <img src="/assets/not_selected_option_background.png" className="nav-bg" />
                    <img src="/assets/battle_icon.png" className="nav-icon" />
                    <span className="nav-text">Battle</span>
                </div>
                {/* ... others ... */}
            </div>
        </div>
    );
};
