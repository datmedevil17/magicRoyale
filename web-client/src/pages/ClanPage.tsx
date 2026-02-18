import React, { useState, useEffect } from 'react';
import { BottomNav } from '../ui/BottomNav';
import { MobileLayout } from '../ui/MobileLayout';
import { useGameProgram } from '../hooks/use-game-program';
import { ClanBrowser } from '../components/clan/ClanBrowser';
import { CreateClanForm } from '../components/clan/CreateClanForm';

// --- MOCK DATA FOR DASHBOARD (Until fully integrated) ---
const MOCK_CHAT = [
    { sender: 'KingArthur', role: 'Leader', message: 'Welcome to the clan! War starts in 2h.', time: '10:00' },
    { sender: 'Lancelot', role: 'Elder', message: 'Ready for war?', time: '10:05' },
    { sender: 'Merlin', role: 'Member', message: 'I need a zap, anyone?', time: '10:10' },
    { sender: 'System', role: 'Admin', message: 'Lancelot donated 50 cards.', time: '10:15', isSystem: true },
];

export const ClanPage: React.FC = () => {
    const { fetchUserClan, leaveClan } = useGameProgram();
    
    // State
    const [view, setView] = useState<'loading' | 'browser' | 'create' | 'dashboard'>('loading');
    const [userClanData, setUserClanData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'chat' | 'war' | 'members'>('chat');
    const [chatInput, setChatInput] = useState('');
    
    useEffect(() => {
        checkUserStatus();
    }, [fetchUserClan]);

    const checkUserStatus = async () => {
        setView('loading');
        const clanData = await fetchUserClan();
        if (clanData) {
            setUserClanData(clanData);
            setView('dashboard');
        } else {
            setUserClanData(null);
            setView('browser');
        }
    };

    const handleCreateClick = () => setView('create');
    const handleBackToBrowser = () => setView('browser');
    const handleSuccess = () => checkUserStatus(); // Refresh to go to dashboard
    
    const handleLeaveClan = async () => {
        if (!confirm("Are you sure you want to leave the clan?")) return;
        await leaveClan();
        await checkUserStatus();
    };

    // --- Render Methods ---


    const renderChat = () => (
        <div className="flex flex-col h-full relative">
            <div className="flex-1 flex flex-col gap-3 p-4 overflow-y-auto pb-[140px]">
                {/* Clan Chest Progress */}
                <div className="bg-[#4a6cd6]/20 border border-[#4a6cd6] p-4 rounded-xl text-center mb-2 shadow-inner">
                    <div className="text-xs text-blue-200 uppercase tracking-widest mb-1">Clan Chest</div>
                    <div className="h-4 w-full bg-gray-900 rounded-full border border-gray-600 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-400 w-[60%] shadow-[0_0_10px_#4a6cd6]"></div>
                        <span className="absolute inset-0 flex justify-center items-center text-[0.6rem] text-white font-bold drop-shadow-md">Tier 4/10</span>
                    </div>
                </div>

                {/* Chat Messages */}
                {MOCK_CHAT.map((msg, idx) => (
                    msg.isSystem ? (
                        <div key={idx} className="text-center text-[0.6rem] text-gray-400 italic my-1">{msg.message}</div>
                    ) : (
                        <div key={idx} className={`flex flex-col ${msg.sender === 'Me' ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-baseline gap-1 mb-0.5">
                                <span className={`text-xs font-bold ${msg.role === 'Leader' ? 'text-yellow-400' : 'text-blue-300'}`}>{msg.sender}</span>
                                <span className="text-[0.6rem] text-gray-500">{msg.time}</span>
                            </div>
                            <div className="bg-[#333] border border-black/30 px-3 py-2 rounded-xl rounded-tl-none shadow-sm text-sm text-white max-w-[85%]">
                                {msg.message}
                            </div>
                        </div>
                    )
                ))}
            </div>

            {/* Sticky Interaction Area */}
            <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2 z-10">
                <button className="bg-[#fbce47] text-black border-2 border-black border-b-[6px] active:border-b-2 active:translate-y-1 rounded-xl py-3 font-bold text-sm shadow-lg flex justify-center items-center gap-2 hover:brightness-110 transition-all">
                    <span>Request Cards</span>
                    <div className="bg-black/20 rounded px-1.5 text-xs">7h</div>
                </button>

                <div className="flex gap-2 bg-[#1a1a1b] p-2 rounded-xl border border-white/10 shadow-xl">
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-[#2a2a2a] rounded-lg px-3 text-sm text-white focus:outline-none border border-transparent focus:border-[#4a6cd6]"
                    />
                    <button className="bg-[#4a6cd6] text-white px-4 rounded-lg font-bold text-xs shadow-md active:scale-95">Send</button>
                </div>
            </div>
        </div>
    );

    const renderMembers = () => (
        <div className="p-4 flex flex-col gap-2 h-full overflow-y-auto pb-[20px]">
             {/* Actual members list would be fetched here. Using placeholder for structure. */}
            <div className="bg-[#2a2a2a] p-2 rounded-lg border border-black/20 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="text-sm font-bold w-6 text-center text-gray-400">1</div>
                    <div>
                        <div className="text-sm font-bold text-[#ffcf4b]">You</div>
                        <div className="text-[0.6rem] text-gray-400 uppercase">Member</div>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1">
                        <img src="/assets/trophy.png" className="w-4 h-4 object-contain brightness-125" onError={(e) => e.currentTarget.style.display = 'none'} />
                        <span className="text-white text-sm font-bold">---</span>
                    </div>
                    <div className="text-[0.6rem] text-[#59ffac]">Donations: 0</div>
                </div>
            </div>
        </div>
    );

    // --- Main Render Switch ---

    return (
        <MobileLayout bgClass="bg-[#222]" className="text-white">
            <div className="absolute inset-0 bg-[url('/assets/hex_bg.png')] opacity-10 pointer-events-none"></div>

            <div className="relative z-10 flex-1 w-full flex flex-col overflow-hidden pb-[70px]">
                
                {view === 'loading' && (
                    <div className="flex justify-center items-center h-full">
                         <div className="w-10 h-10 border-4 border-[#fbce47] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {view === 'browser' && (
                    <ClanBrowser onCreateClick={handleCreateClick} onJoinSuccess={handleSuccess} />
                )}

                {view === 'create' && (
                    <CreateClanForm onBack={handleBackToBrowser} onSuccess={handleSuccess} />
                )}

                {view === 'dashboard' && userClanData && (
                    <>
                         {/* Dashboard Header */}
                        <div className="bg-gradient-to-b from-[#1a3a6e] to-[#122544] p-4 border-b-4 border-black/30 shadow-lg relative">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-800 rounded-xl border-2 border-[#fbce47] shadow-[0_0_15px_rgba(40,100,255,0.5)] flex justify-center items-center">
                                        <img src="/assets/clan_badge.png" className="w-10 h-10 object-contain drop-shadow-md" onError={(e) => e.currentTarget.style.display = 'none'} />
                                    </div>
                                    <div>
                                        <h1 className="text-xl text-white text-shadow-lg leading-tight">{userClanData.clanAccount.name}</h1>
                                        <span className="text-[0.6rem] bg-black/40 px-1.5 rounded text-gray-300">#{userClanData.clanKey.toString().slice(0, 6)}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-lg border border-white/5">
                                        <img src="/assets/trophy.png" className="w-4 h-4 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                                        <span className="text-[#fbce47] text-sm">{userClanData.clanAccount.minTrophies}</span>
                                    </div>
                                    <button onClick={handleLeaveClan} className="text-[0.6rem] text-red-400 border border-red-900/50 bg-red-900/20 px-2 py-0.5 rounded hover:bg-red-900/40">
                                        Leave
                                    </button>
                                </div>
                            </div>
        
                            {/* Stats Row */}
                            <div className="flex justify-between mt-4 bg-black/20 p-2 rounded-lg text-center">
                                <div className="flex-1 border-r border-white/10">
                                    <div className="text-xs text-green-400">---</div>
                                    <div className="text-[0.5rem] text-gray-400 uppercase">Donations/Wk</div>
                                </div>
                                <div className="flex-1 border-r border-white/10">
                                    <div className="text-xs text-white">{userClanData.clanAccount.memberCount}/50</div>
                                    <div className="text-[0.5rem] text-gray-400 uppercase">Members</div>
                                </div>
                                <div className="flex-1">
                                    <div className="text-xs text-white">Global</div>
                                    <div className="text-[0.5rem] text-gray-400 uppercase">Location</div>
                                </div>
                            </div>
                        </div>
        
                        {/* Tabs */}
                        <div className="flex bg-[#463318] p-1 gap-1 shadow-inner">
                            <button
                                className={`flex-1 py-2 text-xs border-b-4 active:border-b-0 active:translate-y-1 transition-all rounded-t-lg ${activeTab === 'chat' ? 'bg-[#fbce47] border-[#cc9000] text-black shadow-[inset_0_2px_0_rgba(255,255,255,0.4)]' : 'bg-[#2a1d0d] border-[#1a1208] text-gray-400'}`}
                                onClick={() => setActiveTab('chat')}
                            >
                                Chat
                            </button>
                            <button
                                className={`flex-1 py-2 text-xs border-b-4 active:border-b-0 active:translate-y-1 transition-all rounded-t-lg ${activeTab === 'war' ? 'bg-[#fbce47] border-[#cc9000] text-black shadow-[inset_0_2px_0_rgba(255,255,255,0.4)]' : 'bg-[#2a1d0d] border-[#1a1208] text-gray-400'}`}
                                onClick={() => setActiveTab('war')}
                            >
                                War
                            </button>
                            <button
                                className={`flex-1 py-2 text-xs border-b-4 active:border-b-0 active:translate-y-1 transition-all rounded-t-lg ${activeTab === 'members' ? 'bg-[#fbce47] border-[#cc9000] text-black shadow-[inset_0_2px_0_rgba(255,255,255,0.4)]' : 'bg-[#2a1d0d] border-[#1a1208] text-gray-400'}`}
                                onClick={() => setActiveTab('members')}
                            >
                                Members
                            </button>
                        </div>
        
                        {/* Content */}
                        <div className="flex-1 bg-[#1a1a1b] overflow-hidden relative">
                            {activeTab === 'chat' && renderChat()}
        
                            {activeTab === 'members' && renderMembers()}
        
                            {activeTab === 'war' && (
                                <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-70">
                                    <img src="/assets/swords_icon.png" className="w-24 h-24 mb-4 grayscale" onError={(e) => e.currentTarget.style.display = 'none'} />
                                    <h2 className="text-xl text-gray-400 mb-2">River Race</h2>
                                    <p className="text-sm text-gray-600">The battle begins soon!</p>
                                </div>
                            )}
                        </div>
                    </>
                )}

            </div>

            <BottomNav />
        </MobileLayout>
    );
};
