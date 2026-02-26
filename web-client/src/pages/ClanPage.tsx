import React, { useState, useEffect, useRef } from 'react';
import { BottomNav } from '../ui/BottomNav';
import { MobileLayout } from '../ui/MobileLayout';
import { useGameProgram } from '../hooks/use-game-program';
import { ClanBrowser } from '../components/clan/ClanBrowser';
import { CreateClanForm } from '../components/clan/CreateClanForm';
import { useWallet } from '@solana/wallet-adapter-react';
import { io, Socket } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3000';

export const ClanPage: React.FC = () => {
    const { fetchUserClan, leaveClan, fetchClanMembers } = useGameProgram();
    const wallet = useWallet();

    // State
    const [view, setView] = useState<'loading' | 'browser' | 'create' | 'dashboard'>('loading');
    const [userClanData, setUserClanData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'chat' | 'war' | 'members'>('chat');

    // Chat state
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const socketRef = useRef<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Members state
    const [clanMembers, setClanMembers] = useState<any[]>([]);

    // Auto-scroll chat
    useEffect(() => {
        if (activeTab === 'chat' && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, activeTab]);

    useEffect(() => {
        checkUserStatus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Socket connection
    useEffect(() => {
        if (view === 'dashboard' && userClanData && wallet.publicKey) {
            const socket = io(SERVER_URL, {
                query: { walletPublicKey: wallet.publicKey.toBase58() }
            });
            socketRef.current = socket;

            socket.on('connect', () => {
                socket.emit('join-clan', { clanKey: userClanData.clanKey.toBase58() });
            });

            socket.on('clan-chat-history', (history: any[]) => {
                setChatMessages(history);
            });

            socket.on('clan-chat-message', (msg: any) => {
                setChatMessages(prev => [...prev, msg].slice(-50));
            });

            return () => {
                socket.emit('leave-clan', { clanKey: userClanData.clanKey.toBase58() });
                socket.disconnect();
            };
        }
    }, [view, userClanData, wallet.publicKey]);

    // Fetch clan members
    useEffect(() => {
        if (view === 'dashboard' && userClanData) {
            fetchClanMembers(userClanData.clanKey).then(members => {
                setClanMembers(members);
            });
        }
    }, [view, userClanData, fetchClanMembers]);

    const handleCreateClick = () => setView('create');
    const handleBackToBrowser = () => setView('browser');
    const handleSuccess = () => checkUserStatus();

    const handleLeaveClan = async () => {
        if (!confirm("Are you sure you want to leave the clan?")) return;
        await leaveClan();
        await checkUserStatus();
    };

    const sendChatMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!chatInput.trim() || !socketRef.current || !userClanData || !wallet.publicKey) return;

        const myName = localStorage.getItem('username') || wallet.publicKey.toBase58().slice(0, 6);

        socketRef.current.emit('clan-chat-message', {
            clanKey: userClanData.clanKey.toBase58(),
            message: chatInput,
            sender: myName,
            role: 'Member'
        });

        setChatInput('');
    };

    // --- Render Methods ---

    const renderChat = () => {
        const myName = localStorage.getItem('username') || wallet.publicKey?.toBase58().slice(0, 6) || '';

        return (
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
                    {chatMessages.length === 0 && (
                        <div className="text-center text-xs text-gray-500 mt-4">No messages yet. Say hello!</div>
                    )}
                    {chatMessages.map((msg, idx) => {
                        const isMe = msg.sender === myName;
                        return msg.isSystem ? (
                            <div key={idx} className="text-center text-[0.6rem] text-gray-400 italic my-1">{msg.message}</div>
                        ) : (
                            <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className="flex items-baseline gap-1 mb-0.5">
                                    <span className={`text-xs font-bold ${msg.role === 'Leader' ? 'text-yellow-400' : 'text-blue-300'}`}>{msg.sender}</span>
                                    <span className="text-[0.6rem] text-gray-500">{msg.time}</span>
                                </div>
                                <div className={`px-3 py-2 rounded-xl text-sm shadow-sm max-w-[85%] ${isMe
                                    ? 'bg-[#4a6cd6] text-white rounded-tr-none border border-blue-400'
                                    : 'bg-[#333] text-white rounded-tl-none border border-black/30'
                                    }`}>
                                    {msg.message}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Sticky Interaction Area */}
                <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2 z-10">
                    <button className="bg-[#fbce47] text-black border-2 border-black border-b-[6px] active:border-b-2 active:translate-y-1 rounded-xl py-3 font-bold text-sm shadow-lg flex justify-center items-center gap-2 hover:brightness-110 transition-all">
                        <span>Request Cards</span>
                        <div className="bg-black/20 rounded px-1.5 text-xs">7h</div>
                    </button>

                    <form onSubmit={sendChatMessage} className="flex gap-2 bg-[#1a1a1b] p-2 rounded-xl border border-white/10 shadow-xl">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-[#2a2a2a] rounded-lg px-3 text-sm text-white focus:outline-none border border-transparent focus:border-[#4a6cd6]"
                        />
                        <button type="submit" className="bg-[#4a6cd6] text-white px-4 rounded-lg font-bold text-xs shadow-md active:scale-95 disabled:opacity-50" disabled={!chatInput.trim()}>Send</button>
                    </form>
                </div>
            </div>
        );
    };

    const renderMembers = () => (
        <div className="p-4 flex flex-col gap-2 h-full overflow-y-auto pb-[20px]">
            {clanMembers.length === 0 ? (
                <div className="text-center text-xs justify-center items-center flex flex-col h-32 text-gray-500 mt-4">
                    <div className="w-8 h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin mb-2"></div>
                    Loading Members...
                </div>
            ) : (
                clanMembers.map((member, index) => {
                    const isMe = wallet.publicKey && member.account.player && member.account.player.toBase58() === wallet.publicKey.toBase58();
                    const name = isMe ? (localStorage.getItem('username') || 'You') : (member.profile?.username || (member.account.player ? member.account.player.toBase58().slice(0, 8) : 'Unknown'));

                    return (
                        <div key={index} className={`bg-[#2a2a2a] p-2 rounded-lg border ${isMe ? 'border-[#fbce47]/50 shadow-[0_0_10px_rgba(251,206,71,0.1)]' : 'border-black/20'} flex justify-between items-center shadow-sm transition-all hover:bg-[#333]`}>
                            <div className="flex items-center gap-3">
                                <div className="text-sm font-bold w-6 text-center text-gray-400">{index + 1}</div>
                                <div>
                                    <div className={`text-sm font-bold ${isMe ? 'text-[#ffcf4b]' : 'text-white'}`}>{name}</div>
                                    <div className="text-[0.6rem] text-gray-400 uppercase">Member</div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-1">
                                    <img src="/assets/trophy.png" className="w-4 h-4 object-contain brightness-125" onError={(e) => e.currentTarget.style.display = 'none'} />
                                    <span className="text-white text-sm font-bold">{member.profile?.trophies || 0}</span>
                                </div>
                                <div className="text-[0.6rem] text-[#59ffac]">Donations: {member.account.donationsGiven || member.account.donations_given || 0}</div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );

    const renderWar = () => (
        <div className="flex flex-col h-full bg-[#111] overflow-y-auto relative">
            <div className="w-full h-48 bg-gradient-to-b from-[#4a2e8c] to-[#1a1a1b] relative flex flex-col items-center justify-center border-b border-purple-900/50 shadow-[0_10px_30px_rgba(74,46,140,0.2)]">
                <div className="absolute inset-0 bg-[url('/assets/war_bg.png')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>

                <img src="/assets/swords_icon.png" className="w-20 h-20 mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] animate-pulse" onError={(e) => e.currentTarget.style.display = 'none'} />
                <h2 className="text-2xl font-black text-white uppercase tracking-widest text-shadow-lg" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8), 0 0 20px #9b51e0' }}>Clan War 2.0</h2>

                <div className="bg-black/50 backdrop-blur-md px-4 py-1 mt-2 rounded-full border border-purple-500/30 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80] animate-ping"></span>
                    <span className="text-xs font-bold text-gray-200">RIVER RACE ACTIVE</span>
                </div>
            </div>

            <div className="p-4 flex-1 flex flex-col gap-4">
                <div className="bg-[#2a2a2a] p-4 rounded-xl border border-white/5 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <h3 className="text-sm font-bold text-purple-300 mb-3 flex items-center gap-2">
                        <span className="text-lg">🛶</span> River Progress
                    </h3>

                    <div className="flex gap-2 items-center mb-1">
                        <img src="/assets/clan_badge.png" className="w-6 h-6 border rounded-sm border-purple-400 p-0.5" onError={(e) => e.currentTarget.style.display = 'none'} />
                        <div className="flex-1 h-3 bg-black rounded-full border border-gray-700 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-600 to-pink-500 w-[75%] rounded-full shadow-[0_0_10px_#9b51e0]"></div>
                        </div>
                        <img src="/assets/chest_icon.png" className="w-6 h-6 drop-shadow-md" onError={(e) => e.currentTarget.style.display = 'none'} />
                    </div>
                    <div className="text-right text-[0.6rem] text-gray-400 uppercase font-bold tracking-wider">37,500 / 50,000 Medals</div>

                    <div className="flex gap-2 items-center mt-3 opacity-50 grayscale">
                        <div className="w-6 h-6 bg-blue-600 rounded-sm"></div>
                        <div className="flex-1 h-3 bg-black rounded-full border border-gray-700 overflow-hidden">
                            <div className="h-full bg-blue-500 w-[40%] rounded-full"></div>
                        </div>
                        <div className="w-6 h-6 bg-gray-800 rounded-full"></div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2">
                    <button className="bg-gradient-to-br from-[#1e3a8a] to-[#1e1e2f] border border-blue-500/30 rounded-xl p-3 flex flex-col items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-transform active:scale-95 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="text-2xl drop-shadow-md">⚔️</span>
                        <span className="text-xs font-bold text-gray-200">Battle</span>
                    </button>
                    <button className="bg-gradient-to-br from-[#831843] to-[#2a1323] border border-pink-500/30 rounded-xl p-3 flex flex-col items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-transform active:scale-95 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="text-2xl drop-shadow-md">🚢</span>
                        <span className="text-xs font-bold text-gray-200">Boat Battles</span>
                    </button>
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
                        <div className="flex bg-[#463318] p-1 gap-1 shadow-inner z-20">
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
                        <div className="flex-1 bg-[#1a1a1b] overflow-hidden relative z-10">
                            {activeTab === 'chat' && renderChat()}
                            {activeTab === 'members' && renderMembers()}
                            {activeTab === 'war' && renderWar()}
                        </div>
                    </>
                )}
            </div>
            <BottomNav />
        </MobileLayout>
    );
};
