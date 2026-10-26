export type GameMode = '1v1' | '2v2';

/**
 * Team of a player role. Team 0 is the host's (player1's) team. In 1v1 player2 is the
 * other team; in 2v2 player1+player2 are team 0 and player3+player4 are team 1.
 *
 * Inside a client, entities are owned by 'player' (my team) or 'opponent' (the other team),
 * and each client draws its own team at the bottom: team 1 sees the host's coordinates
 * rotated 180°, while teammates share the same view.
 */
export const teamOf = (role: string | undefined, mode: GameMode): 0 | 1 => {
    if (mode === '2v2') return role === 'player3' || role === 'player4' ? 1 : 0;
    return role === 'player2' ? 1 : 0;
};
