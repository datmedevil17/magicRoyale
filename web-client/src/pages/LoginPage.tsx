import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../ui/MobileLayout';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleMainButton = async () => {
        setMessage('Processing...');
        try {
            const endpoint = isRegistering ? 'http://localhost:3000/register' : 'http://localhost:3000/login';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                if (isRegistering) {
                    setMessage('Registration successful! Please login.');
                    setIsRegistering(false);
                } else {
                    localStorage.setItem('token', data.token || '');
                    // API returns user object or username depending on route
                    const user = data.user || data;
                    localStorage.setItem('username', user.username || username);
                    navigate('/menu');
                }
            } else {
                setMessage(data.error || 'An error occurred');
            }
        } catch (error) {
            console.error(error);
            setMessage('Network error. Is the server running?');
        }
    };

    const toggleMode = () => {
        setIsRegistering(!isRegistering);
        setMessage('');
        setUsername('');
        setPassword('');
    };

    const handleExit = () => {
        setMessage('Cannot exit in web browser.');
    };

    return (
        <MobileLayout bgClass="bg-gradient-to-b from-[#334d85] to-[#12192b]">
            <div className="w-full h-full flex flex-col justify-center items-center p-8  text-white">
                <div className="relative w-full flex flex-col items-center bg-[#223355]/90 rounded-3xl shadow-2xl border-4 border-[#4a6cd6] p-8">

                    {/* Logo Area */}
                    <div className="mb-8 w-48">
                        <img src="/assets/clash_royale_logo.png" alt="Logo" className="w-full drop-shadow-lg" />
                    </div>

                    {/* Input Fields */}
                    <div className="flex flex-col gap-4 w-full items-center">
                        <div className="relative w-64 h-16 flex justify-center items-center">
                            <img src="/assets/text_field2.png" alt="Input Background" className="absolute w-full h-full" />
                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="relative z-10 w-[80%] h-full bg-transparent border-none text-center text-black placeholder-gray-600 focus:outline-none text-lg"
                            />
                        </div>

                        <div className="relative w-64 h-16 flex justify-center items-center">
                            <img src="/assets/text_field2.png" alt="Input Background" className="absolute w-full h-full" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="relative z-10 w-[80%] h-full bg-transparent border-none text-center text-black placeholder-gray-600 focus:outline-none text-lg"
                            />
                        </div>
                    </div>

                    {/* Main Action Button */}
                    <div className="mt-8 relative w-40 h-20 flex justify-center items-center cursor-pointer transition-transform active:scale-95 text-shadow-md hover:brightness-110" onClick={handleMainButton}>
                        <img src="/assets/button_blue.png" alt="Button Background" className="absolute w-full h-full" />
                        <span className="relative z-10 text-white text-xl drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                            {isRegistering ? 'Register' : 'Login'}
                        </span>
                    </div>

                    {/* Status Message */}
                    <div className="mt-4 h-6 text-[#ffcccc] text-sm text-center drop-shadow-md">
                        {message}
                    </div>

                    {/* Secondary Actions */}
                    <div className="mt-8 flex gap-4">
                        <div className="relative w-36 h-16 flex justify-center items-center cursor-pointer transition-transform active:scale-95 hover:brightness-110" onClick={toggleMode}>
                            <img src="/assets/button_yellow.png" alt="Yellow Button" className="absolute w-full h-full" />
                            <span className="relative z-10 text-white text-lg drop-shadow-[1px_1px_0_rgba(0,0,0,0.5)]">
                                {isRegistering ? 'Login' : 'Register'}
                            </span>
                        </div>
                        <div className="relative w-36 h-16 flex justify-center items-center cursor-pointer transition-transform active:scale-95 hover:brightness-110" onClick={handleExit}>
                            <img src="/assets/button_red.png" alt="Red Button" className="absolute w-full h-full" />
                            <span className="relative z-10 text-white text-lg drop-shadow-[1px_1px_0_rgba(0,0,0,0.5)]">Exit</span>
                        </div>
                    </div>
                </div>
            </div>
        </MobileLayout>
    );
};
