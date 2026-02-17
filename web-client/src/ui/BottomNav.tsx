import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const BottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="relative z-20 w-full h-[70px] bg-[#222] border-t-2 border-[#444] flex justify-center shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
            <div className="w-full max-w-md flex justify-around items-center h-full">
                {/* Shop */}
                <div
                    className={`flex flex-col items-center justify-center w-[20%] h-full cursor-pointer transition-all ${isActive('/market') ? 'bg-[#333] border-t-2 border-[#fbce47]' : 'opacity-50 hover:opacity-100'}`}
                    onClick={() => navigate('/market')}
                >
                    <img
                        src="/assets/shop_icon.png"
                        className={`h-[30px] object-contain mb-1 ${isActive('/market') ? '' : 'grayscale'}`}
                        onError={(e) => e.currentTarget.src = 'https://placehold.co/60x60/orange/white?text=Shop'}
                    />
                    <span className={`text-[0.6rem] ${isActive('/market') ? 'text-[#fbce47]' : 'text-white'}`}>Shop</span>
                </div>

                {/* Cards */}
                <div
                    className={`flex flex-col items-center justify-center w-[20%] h-full cursor-pointer transition-all ${isActive('/deck') ? 'bg-[#333] border-t-2 border-[#fbce47]' : 'opacity-50 hover:opacity-100'}`}
                    onClick={() => navigate('/deck')}
                >
                    <img
                        src="/assets/cards_icon.png"
                        className={`h-[30px] object-contain mb-1 ${isActive('/deck') ? '' : 'grayscale'}`}
                        onError={(e) => e.currentTarget.src = 'https://placehold.co/60x60/blue/white?text=Cards'}
                    />
                    <span className={`text-[0.6rem] ${isActive('/deck') ? 'text-[#fbce47]' : 'text-white'}`}>Cards</span>
                </div>

                {/* Battle (Home) */}
                <div
                    className={`flex flex-col items-center justify-center w-[20%] h-full cursor-pointer transition-all ${isActive('/menu') ? 'bg-[#333] border-t-2 border-[#fbce47]' : 'opacity-50 hover:opacity-100'}`}
                    onClick={() => navigate('/menu')}
                >
                    <img
                        src="/assets/battle_icon.png"
                        className={`h-[30px] object-contain mb-1 ${isActive('/menu') ? '' : 'grayscale'}`}
                        onError={(e) => e.currentTarget.src = 'https://placehold.co/60x60/red/white?text=Battle'}
                    />
                    <span className={`text-[0.6rem] ${isActive('/menu') ? 'text-[#fbce47]' : 'text-white'}`}>Battle</span>
                </div>

                {/* Social (Clan) */}
                <div
                    className={`flex flex-col items-center justify-center w-[20%] h-full cursor-pointer transition-all ${isActive('/clan') ? 'bg-[#333] border-t-2 border-[#fbce47]' : 'opacity-50 hover:opacity-100'}`}
                    onClick={() => navigate('/clan')}
                >
                    <img
                        src="/assets/social_icon.png"
                        className={`h-[30px] object-contain mb-1 ${isActive('/clan') ? '' : 'grayscale'}`}
                        onError={(e) => e.currentTarget.src = 'https://placehold.co/60x60/green/white?text=Clan'}
                    />
                    <span className={`text-[0.6rem] ${isActive('/clan') ? 'text-[#fbce47]' : 'text-white'}`}>Social</span>
                </div>

                {/* Events (Tournament) */}
                <div
                    className={`flex flex-col items-center justify-center w-[20%] h-full cursor-pointer transition-all ${isActive('/tournament') ? 'bg-[#333] border-t-2 border-[#fbce47]' : 'opacity-50 hover:opacity-100'}`}
                    onClick={() => navigate('/tournament')}
                >
                    <img
                        src="/assets/events_icon.png"
                        className={`h-[30px] object-contain mb-1 ${isActive('/tournament') ? '' : 'grayscale'}`}
                        onError={(e) => e.currentTarget.src = 'https://placehold.co/60x60/purple/white?text=Events'}
                    />
                    <span className={`text-[0.6rem] ${isActive('/tournament') ? 'text-[#fbce47]' : 'text-white'}`}>Events</span>
                </div>
            </div>
        </div>
    );
};
