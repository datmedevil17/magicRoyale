import React, { useState } from 'react';
import { EventBus, EVENTS } from '../game/EventBus';

interface CardItem {
    id: string;
    name: string;
    cost: number;
    icon: string;
}

// Mock initial deck
const INITIAL_DECK: CardItem[] = [
    { id: 'Archers', name: 'Archers', cost: 3, icon: 'assets/ArchersCard.png' },
    { id: 'Giant', name: 'Giant', cost: 5, icon: 'assets/GiantCard.png' },
    { id: 'MiniPEKKA', name: 'Mini P.E.K.K.A', cost: 4, icon: 'assets/MiniPEKKACard.png' },
    { id: 'Valkyrie', name: 'Valkyrie', cost: 4, icon: 'assets/ValkyrieCard.png' },
    { id: 'Wizard', name: 'Wizard', cost: 5, icon: 'assets/WizardCard.png' },
    { id: 'BabyDragon', name: 'Baby Dragon', cost: 4, icon: 'assets/BabyDragonCard.png' }
];

const getRandomDeck = () => {
    const shuffled = [...INITIAL_DECK].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
};

export const CardDeck: React.FC = () => {
    // Initialize with a random set of 4 cards
    const [currentDeck, setCurrentDeck] = useState<CardItem[]>(getRandomDeck());
    const [selectedCard, setSelectedCard] = useState<string | null>(null);

    const handleCardClick = (cardId: string) => {
        const newSelected = cardId === selectedCard ? null : cardId;
        setSelectedCard(newSelected);
        EventBus.emit(EVENTS.CARD_SELECTED, newSelected);
        console.log(`Selected card: ${cardId}`);
    };

    return (
        <div style={{
            position: 'absolute',
            bottom: '60px', // Above elixir bar
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '10px',
            pointerEvents: 'auto' // Enable clicks
        }}>
            {currentDeck.map(card => (
                <div
                    key={card.id}
                    onClick={() => handleCardClick(card.id)}
                    style={{
                        width: '60px',
                        height: '80px',
                        backgroundImage: `url(${card.icon})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        border: selectedCard === card.id ? '3px solid yellow' : '1px solid #000',
                        borderRadius: '5px',
                        backgroundColor: '#fff',
                        position: 'relative',
                        cursor: 'pointer',
                        transform: selectedCard === card.id ? 'translateY(-10px)' : 'none',
                        transition: 'transform 0.2s'
                    }}
                >
                    <div style={{
                        position: 'absolute',
                        bottom: '-5px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#d000ff',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        border: '1px solid black'
                    }}>
                        {card.cost}
                    </div>
                </div>
            ))}
        </div>
    );
};
