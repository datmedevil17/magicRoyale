import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MainMenuPage.css';

export const MainMenuPage: React.FC = () => {
    const navigate = useNavigate();
    const username = localStorage.getItem('username') || 'Guest';

    return (
        <div className="main-menu-page">
            <div className="background-image">
                <img src="/assets/main_menu_background.png" alt="Background" />
            </div>

            {/* Top Bar / Stats */}
            <div className="top-bar">
                <div className="stat user-level">
                    <span className="level-text">1</span>
                </div>
                <div className="stat user-name">
                    <span>{username}</span>
                </div>
                <div className="stat user-trophies">
                    <span>2000</span>
                </div>
            </div>

            {/* Logo */}
            <div className="game-logo">
                <img src="/assets/clash_royale_logo.png" alt="Clash Royale" />
            </div>

            <div className="arena-logo">
                <img src="/assets/arena_logo.png" alt="Arena" />
            </div>

            {/* Main Action Buttons */}
            <div className="battle-buttons">
                <div className="battle-btn battle-1v1" onClick={() => navigate('/game')}>
                    <img src="/assets/button_yellow.png" alt="Battle" />
                    <span className="btn-text">Battle</span>
                </div>
                <div className="battle-btn battle-2v2">
                    <img src="/assets/button_blue.png" alt="2v2" />
                    <span className="btn-text" style={{ color: 'white', textShadow: '2px 2px 0 #004ba3' }}>2v2</span>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="bottom-nav">
                <div className="nav-item" onClick={() => navigate('/deck')}>
                    <img src="/assets/not_selected_option_background.png" className="nav-bg" />
                    <img src="/assets/cards_icon.png" className="nav-icon" />
                    <span className="nav-text">Cards</span>
                </div>
                <div className="nav-item" onClick={() => alert("Profile coming soon!")}>
                    <img src="/assets/not_selected_option_background.png" className="nav-bg" />
                    {/* Placeholder generic icon if profile not found or reuse existing */}
                    <img src="/assets/profile_icon.png" className="nav-icon" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <span className="nav-text">Profile</span>
                </div>
                <div className="nav-item active">
                    <img src="/assets/selected_option_background.png" className="nav-bg" />
                    <img src="/assets/battle_icon.png" className="nav-icon" />
                    <span className="nav-text">Battle</span>
                </div>
                <div className="nav-item" onClick={() => alert("Camp coming soon!")}>
                    <img src="/assets/not_selected_option_background.png" className="nav-bg" />
                    <img src="/assets/training_camp_icon.png" className="nav-icon" />
                    <span className="nav-text">Camp</span>
                </div>
                <div className="nav-item" onClick={() => alert("History coming soon!")}>
                    <img src="/assets/not_selected_option_background.png" className="nav-bg" />
                    <img src="/assets/history_icon.png" className="nav-icon" />
                    <span className="nav-text">History</span>
                </div>
            </div>
        </div>
    );
};
