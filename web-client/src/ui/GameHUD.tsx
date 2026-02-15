import React from 'react';
import './GameHUD.css';

interface GameHUDProps {
    playerName: string;
    opponentName: string;
    playerLevel: number;
    opponentLevel: number;
    playerCrowns: number;
    opponentCrowns: number;
    timeLeft: string;
}

export const GameHUD: React.FC<GameHUDProps> = ({
    playerName,
    opponentName,
    playerLevel,
    opponentLevel,
    playerCrowns,
    opponentCrowns,
    timeLeft
}) => {
    return (
        <div className="game-hud">
            {/* Top Section - Opponent Info & Time */}
            <div className="hud-top">
                <div className="player-info opponent">
                    <div className="level-badge">
                        <img src="/assets/level_place.png" alt="Level" />
                        <span>{opponentLevel}</span>
                    </div>
                    <span className="player-name">{opponentName}</span>
                </div>

                <div className="timer-container">
                    <img src="/assets/time_place.png" alt="Time" />
                    <span>{timeLeft}</span>
                </div>

                <div className="crowns-display opponent-crowns">
                    <img src="/assets/score_place1.png" alt="Score" className="score-bg" />
                    {/* Dynamic crowns based on score */}
                    <div className="crown-icons">
                        {[...Array(3)].map((_, i) => (
                            <img
                                key={i}
                                src={i < opponentCrowns ? "/assets/crown_small_red.png" : "/assets/crown_place_red.png"}
                                className="crown-icon"
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Section - Player Info */}
            <div className="hud-bottom">
                <div className="crowns-display player-crowns">
                    <img src="/assets/score_place2.png" alt="Score" className="score-bg" />
                    <div className="crown-icons">
                        {[...Array(3)].map((_, i) => (
                            <img
                                key={i}
                                src={i < playerCrowns ? "/assets/crown_small_blue.png" : "/assets/crown_place_blue.png"}
                                className="crown-icon"
                            />
                        ))}
                    </div>
                </div>

                <div className="player-info player">
                    <div className="level-badge">
                        <img src="/assets/level_place.png" alt="Level" />
                        <span>{playerLevel}</span>
                    </div>
                    <span className="player-name">{playerName}</span>
                </div>
            </div>
        </div>
    );
};
