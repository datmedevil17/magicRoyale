import { toast } from 'react-hot-toast';
import type { MatchPhase } from '../game/logic/GameManager';

/** HUD timer text, e.g. "1:42", or "OT 0:37" during overtime. */
export const formatMatchTime = (remainingMs: number, phase: MatchPhase) => {
    const totalSeconds = Math.ceil(Math.max(0, remainingMs) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${phase === 'overtime' ? 'OT ' : ''}${minutes}:${seconds}`;
};

/** Announce double elixir / overtime once, when the phase changes. */
export const announcePhase = (phase: MatchPhase, previous: MatchPhase) => {
    if (phase === previous) return;
    if (phase === 'double') {
        toast('Double Elixir!', { icon: '⚡', id: 'phase', duration: 3000 });
    } else if (phase === 'overtime') {
        toast('Overtime! Next tower destroyed wins', { icon: '⏱️', id: 'phase', duration: 4000 });
    }
};
