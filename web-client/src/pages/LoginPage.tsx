import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../ui/MobileLayout';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useGameProgram } from '../hooks/use-game-program';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { publicKey, connected } = useWallet();
    const { fetchPlayerProfile, initializePlayer, playerProfilePda } = useGameProgram();

    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');
    const [needsInitialization, setNeedsInitialization] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        const checkExistingProfile = async () => {
            if (connected && publicKey && playerProfilePda) {
                setIsChecking(true);
                try {
                    const profile = await fetchPlayerProfile(playerProfilePda);
                    if (profile) {
                        // Profile exists, store username and go to menu
                        localStorage.setItem('username', (profile as any).username || 'Player');
                        navigate('/menu');
                    } else {
                        // Profile doesn't exist, need initialization
                        setNeedsInitialization(true);
                    }
                } catch (error) {
                    console.error("Error checking profile:", error);
                    setNeedsInitialization(true);
                } finally {
                    setIsChecking(false);
                }
            }
        };

        checkExistingProfile();
    }, [connected, publicKey, playerProfilePda, fetchPlayerProfile, navigate]);

    const handleInitializeProfile = async () => {
        if (!username.trim()) {
            setMessage('Please enter a username');
            return;
        }

        setMessage('Initializing profile...');
        try {
            await initializePlayer(username);
            localStorage.setItem('username', username);
            setMessage('Profile initialized!');
            setTimeout(() => navigate('/menu'), 1000);
        } catch (error: any) {
            console.error(error);
            setMessage(error.message || 'Failed to initialize profile');
        }
    };

    return (
        <MobileLayout bgClass="bg-gradient-to-b from-[#334d85] to-[#12192b]">
            <div className="w-full h-full flex flex-col justify-center items-center p-8 text-white">
                <div className="relative w-full flex flex-col items-center bg-[#223355]/90 rounded-3xl shadow-2xl border-4 border-[#4a6cd6] p-8">

                    {/* Logo Area */}
                    <div className="mb-8 w-48">
                        <img src="/assets/clash_royale_logo.png" alt="Logo" className="w-full drop-shadow-lg" />
                    </div>

                    {!connected ? (
                        <div className="flex flex-col items-center gap-6">
                            <h2 className="text-xl font-bold text-shadow-md text-[#fbce47]">Connect Wallet to Play</h2>
                            <div className="wallet-button-container">
                                <WalletMultiButton />
                            </div>
                        </div>
                    ) : isChecking ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-[#fbce47] border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[#fbce47]">Checking profile...</span>
                        </div>
                    ) : needsInitialization ? (
                        <div className="flex flex-col items-center w-full gap-4">
                            <h2 className="text-xl font-bold text-shadow-md text-[#fbce47] mb-2">Create Your Profile</h2>

                            <div className="relative w-64 h-16 flex justify-center items-center">
                                <img src="/assets/text_field2.png" alt="Input Background" className="absolute w-full h-full" />
                                <input
                                    type="text"
                                    placeholder="Enter Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="relative z-10 w-[80%] h-full bg-transparent border-none text-center text-black placeholder-gray-600 focus:outline-none text-lg font-bold"
                                />
                            </div>

                            <div className="mt-4 relative w-48 h-20 flex justify-center items-center cursor-pointer transition-transform active:scale-95 text-shadow-md hover:brightness-110" onClick={handleInitializeProfile}>
                                <img src="/assets/button_blue.png" alt="Button Background" className="absolute w-full h-full" />
                                <span className="relative z-10 text-white text-xl drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                                    Initialize
                                </span>
                            </div>

                            <div className="mt-4 h-6 text-[#ffcccc] text-sm text-center drop-shadow-md">
                                {message}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-[#fbce47] border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[#fbce47]">Redirecting...</span>
                        </div>
                    )}

                </div>
            </div>

            <style>{`
                .wallet-button-container .wallet-adapter-button {
                    background-color: #4a6cd6;
                    border: 2px solid #6ba1ff;
                    border-radius: 12px;
                    font-family: inherit;
                    height: 50px;
                    transition: all 0.2s;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                }
                .wallet-button-container .wallet-adapter-button:not([disabled]):hover {
                    background-color: #5b7de6;
                    transform: translateY(-2px);
                }
            `}</style>
        </MobileLayout>
    );
};
