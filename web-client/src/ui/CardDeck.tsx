import React, { useState, useEffect } from 'react';
import { EventBus, EVENTS } from '../game/EventBus';

interface CardItem {
    id: string;      // This is the asset name (e.g. 'Giant')
    name: string;
    cost: number;
    icon: string;
    deckIndex?: number;
}

interface CardDeckProps {
    cards: CardItem[];
}

export const CardDeck: React.FC<CardDeckProps> = ({ cards }) => {
    // deck handles the pool of cards (e.g. 8 cards)
    const [deck] = useState<CardItem[]>(() => {
        const shuffled = [...cards].sort(() => 0.5 - Math.random());

        // Ensure the initial 4 cards in the hand are unique types if possible
        const initialHand: CardItem[] = [];
        const remainingDeck: CardItem[] = [];
        const seenTypes = new Set<string>();

        for (const card of shuffled) {
            if (initialHand.length < 4 && !seenTypes.has(card.id)) {
                initialHand.push(card);
                seenTypes.add(card.id);
            } else {
                remainingDeck.push(card);
            }
        }

        // Fill up to 4 if we couldn't find enough unique types
        while (initialHand.length < 4 && remainingDeck.length > 0) {
            initialHand.push(remainingDeck.shift()!);
        }

        return [...initialHand, ...remainingDeck];
    });

    // Track next card position in deck pool (always the card after the initial hand)
    const [nextCardIndex, setNextCardIndex] = useState(4);

    // visible card slots (indices 0-3 from pool)
    const [cardSlots, setCardSlots] = useState<CardItem[]>(() => {
        return deck.slice(0, 4);
    });

    // Selected slot ID (e.g. 'Giant:0')
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

    // Listen for card played event to replace that specific card
    useEffect(() => {
        const handleCardPlayed = (slotId: string) => {
            // Find which slot has the played card by name:deckIndex or id:deckIndex
            const slotIndex = cardSlots.findIndex(card => `${card.id}:${card.deckIndex}` === slotId);

            if (slotIndex !== -1) {
                const newSlots = [...cardSlots];

                // Safety check for nextCardIndex
                const safeInx = nextCardIndex % deck.length;
                newSlots[slotIndex] = deck[safeInx];
                setCardSlots(newSlots);

                // Advance the cycle
                const newNextIndex = (safeInx + 1) % deck.length;
                setNextCardIndex(newNextIndex);

                setSelectedSlotId(null);
            }
        };

        EventBus.on(EVENTS.CARD_PLAYED, handleCardPlayed);
        return () => {
            EventBus.off(EVENTS.CARD_PLAYED, handleCardPlayed);
        };
    }, [cardSlots, nextCardIndex, deck]);

    const handleCardClick = (card: CardItem) => {
        const slotId = `${card.id}:${card.deckIndex}`;
        const newSelected = slotId === selectedSlotId ? null : slotId;
        setSelectedSlotId(newSelected);
        EventBus.emit(EVENTS.CARD_SELECTED, newSelected);
    };

    return (
        <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '10px',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: '10px 20px',
            borderRadius: '15px',
            zIndex: 10,
            pointerEvents: 'auto'
        }}>
            {cardSlots.map((card, index) => (
                <div
                    key={`slot-${index}`}
                    onClick={() => handleCardClick(card)}
                    style={{
                        width: '60px',
                        height: '80px',
                        backgroundImage: `url(${card.icon})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        border: selectedSlotId === `${card.id}:${card.deckIndex}` ? '3px solid yellow' : '1px solid #000',
                        borderRadius: '5px',
                        backgroundColor: '#fff',
                        position: 'relative',
                        cursor: 'pointer',
                        transform: selectedSlotId === `${card.id}:${card.deckIndex}` ? 'translateY(-10px)' : 'none',
                        transition: 'transform 0.2s',
                        boxShadow: selectedSlotId === `${card.id}:${card.deckIndex}` ? '0 4px 8px rgba(255,255,0,0.5)' : 'none'
                    }}
                >
                    {/* Elixir cost badge */}
                    <div style={{
                        position: 'absolute',
                        top: '-5px',
                        left: '-5px',
                        backgroundColor: '#ff00ff',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        border: '1px solid black'
                    }}>
                        {card.cost}
                    </div>
                </div>
            ))}

            {/* Next card preview */}
            <div style={{
                width: '40px',
                height: '60px',
                backgroundImage: deck[nextCardIndex % deck.length] ? `url(${deck[nextCardIndex % deck.length].icon})` : 'none',
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
                <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#333',
                    color: '#fff',
                    padding: '1px 4px',
                    borderRadius: '3px',
                    fontSize: '8px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap'
                }}>
                    Next
                </div>

                <div style={{
                    position: 'absolute',
                    bottom: '-5px',
                    right: '-5px',
                    backgroundColor: '#ff00ff',
                    color: 'white',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    border: '1px solid black'
                }}>
                    {deck[nextCardIndex % deck.length]?.cost || 0}
                </div>
            </div>
        </div>
    );
};
