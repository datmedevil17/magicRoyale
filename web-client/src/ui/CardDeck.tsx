import React, { useState, useEffect } from 'react';
import { EventBus, EVENTS } from '../game/EventBus';

interface CardItem {
    id: string;
    name: string;
    cost: number;
    icon: string;
}

// Full 8-card deck (like Clash Royale)
const FULL_DECK: CardItem[] = [
    { id: 'Archers', name: 'Archers', cost: 3, icon: 'assets/ArchersCard.png' },
    { id: 'Giant', name: 'Giant', cost: 5, icon: 'assets/GiantCard.png' },
    { id: 'MiniPEKKA', name: 'Mini P.E.K.K.A', cost: 4, icon: 'assets/MiniPEKKACard.png' },
    { id: 'Valkyrie', name: 'Valkyrie', cost: 4, icon: 'assets/ValkyrieCard.png' },
    { id: 'Wizard', name: 'Wizard', cost: 5, icon: 'assets/WizardCard.png' },
    { id: 'BabyDragon', name: 'Baby Dragon', cost: 4, icon: 'assets/BabyDragonCard.png' },
    { id: 'Barbarians', name: 'Barbarians', cost: 5, icon: 'assets/BarbariansCard.png' },
    { id: 'Archers', name: 'Archers', cost: 3, icon: 'assets/ArchersCard.png' } // Duplicate for 8 cards
];

export const CardDeck: React.FC = () => {
    // Shuffle deck once on mount
    const [deck] = useState<CardItem[]>(() => {
        return [...FULL_DECK].sort(() => 0.5 - Math.random());
    });
    
    // Track next card position in deck (0-7, cycles back to 0)
    const [nextCardIndex, setNextCardIndex] = useState(4); // Start at position 4 (after initial 4 cards)
    
    // 4 visible card slots (indices 0-3 from deck initially)
    const [cardSlots, setCardSlots] = useState<CardItem[]>(() => {
        return [deck[0], deck[1], deck[2], deck[3]];
    });
    
    // Selected card
    const [selectedCard, setSelectedCard] = useState<string | null>(null);

    // Listen for card played event to replace that specific card
    useEffect(() => {
        const handleCardPlayed = (cardId: string) => {
            // Find which slot has the played card
            const slotIndex = cardSlots.findIndex(card => card.id === cardId);
            
            if (slotIndex !== -1) {
                // Replace only that slot with next card from deck
                const newSlots = [...cardSlots];
                newSlots[slotIndex] = deck[nextCardIndex];
                setCardSlots(newSlots);
                
                // Move to next card in deck (cycle)
                const newNextIndex = (nextCardIndex + 1) % deck.length;
                setNextCardIndex(newNextIndex);
                
                // Clear selection
                setSelectedCard(null);
                
                console.log(`Card ${cardId} played from slot ${slotIndex}, replaced with ${deck[nextCardIndex].id}. Next card index: ${newNextIndex}`);
            }
        };

        EventBus.on(EVENTS.CARD_PLAYED, handleCardPlayed);
        
        return () => {
            EventBus.off(EVENTS.CARD_PLAYED, handleCardPlayed);
        };
    }, [cardSlots, nextCardIndex, deck]);

    const handleCardClick = (cardId: string) => {
        const newSelected = cardId === selectedCard ? null : cardId;
        setSelectedCard(newSelected);
        EventBus.emit(EVENTS.CARD_SELECTED, newSelected);
        console.log(`Selected card: ${cardId}`);
    };

    return (
        <div style={{
            position: 'absolute',
            bottom: '10px', // Moved down to avoid hiding crown counter
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '10px',
            pointerEvents: 'auto' // Enable clicks
        }}>
            {cardSlots.map((card, index) => (
                <div
                    key={`slot-${index}`}
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
                        transition: 'transform 0.2s',
                        boxShadow: selectedCard === card.id ? '0 4px 8px rgba(255,255,0,0.5)' : 'none'
                    }}
                >
                    {/* Elixir cost badge */}
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
            
            {/* Next card preview (to the right of the deck) */}
            <div style={{
                width: '40px',
                height: '60px',
                backgroundImage: `url(${deck[nextCardIndex].icon})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                border: '1px solid #555',
                borderRadius: '4px',
                backgroundColor: 'rgba(255,255,255,0.5)',
                position: 'relative',
                alignSelf: 'center',
                marginLeft: '5px',
                opacity: 0.7
            }}>
                {/* Next indicator */}
                <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#00ff00',
                    color: '#000',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    border: '1px solid black'
                }}>
                    ↻
                </div>
            </div>
        </div>
    );
};
