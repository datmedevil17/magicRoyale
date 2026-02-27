import React from 'react';
import './GameHUD2.css';

interface GameHUD2Props {
    playerName: string;
    opponentName: string;
    playerLevel: number;
    opponentLevel: number;
    playerCrowns: number;
    opponentCrowns: number;
    timeLeft: string;
    playerTowersDestroyed?: number;
    opponentTowersDestroyed?: number;
    playerKingImage?: string;
    playerQueenImage?: string;
    opponentKingImage?: string;
    opponentQueenImage?: string;
}

export const GameHUD2: React.FC<GameHUD2Props> = ({
    playerName,
    opponentName,
    playerLevel,
    opponentLevel,
    playerCrowns,
    opponentCrowns,
    timeLeft,
    playerTowersDestroyed = 0,
    opponentTowersDestroyed = 0,
    playerKingImage = "/solanamap/tower_king_blue.png",
    playerQueenImage = "/solanamap/tower_archer_blue.png",
    opponentKingImage = "/solanamap/tower_king_red.png",
    opponentQueenImage = "/solanamap/tower_archer_red.png"
}) => {
    const opponentScoreCrowns = [opponentQueenImage, opponentKingImage, opponentQueenImage];
    const playerScoreCrowns = [playerQueenImage, playerKingImage, playerQueenImage];

    return (
        <div className="game-hud">
            {/* Top Section - Opponent Info & Time */}
            <div className="hud-top">
                <div className="player-info opponent">
                    <div className="level-badge">
                        <img src={opponentKingImage} alt="Level" />
                        <span>{opponentLevel}</span>
                    </div>
                    <span className="player-name">{opponentName}</span>
                </div>

                <div className="timer-container">
                    <img src="/assets/time_place.png" alt="Time" />
                    <span>{timeLeft}</span>
                </div>

                <div className="crowns-display opponent-crowns">
                    {/* Dynamic crowns based on score */}
                    <div className="crown-icons">
                        {opponentScoreCrowns.map((src, i) => (
                            <img
                                key={i}
                                src={src}
                                className="crown-icon"
                                style={{ filter: i < opponentCrowns ? 'none' : 'grayscale(100%) opacity(50%)' }}
                            />
                        ))}
                    </div>
                    <div className="tower-count">
                        Towers: {opponentTowersDestroyed}/3
                    </div>
                </div>
            </div>

            {/* Bottom Section - Player Info */}
            <div className="hud-bottom">
                <div className="player-info player">
                    <div className="level-badge">
                        <img src={playerKingImage} alt="Level" style={{ objectFit: 'contain', padding: '2px' }} />
                        <span>{playerLevel}</span>
                    </div>
                    <span className="player-name">{playerName}</span>
                </div>

                <div className="crowns-display player-crowns">
                    <div className="crown-icons">
                        {playerScoreCrowns.map((src, i) => (
                            <img
                                key={i}
                                src={src}
                                className="crown-icon"
                                style={{ filter: i < playerCrowns ? 'none' : 'grayscale(100%) opacity(50%)' }}
                            />
                        ))}
                    </div>
                    <div className="tower-count">
                        Towers: {playerTowersDestroyed}/3
                    </div>
                </div>
            </div>
        </div>
    );
};
