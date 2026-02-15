import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleMainButton = () => {
        if (isRegistering) {
            // Register logic here (mocked for now)
            setMessage('Registration not implemented yet.');
        } else {
            // Login logic here
            if (username) {
                localStorage.setItem('username', username);
                navigate('/menu');
            } else {
                setMessage('Please enter a username.');
            }
        }
    };

    const toggleMode = () => {
        setIsRegistering(!isRegistering);
        setMessage('');
    };

    const handleExit = () => {
        setMessage('Cannot exit in web browser.');
    };

    return (
        <div className="w-screen h-screen bg-[#222] flex justify-center items-center font-[Supercell-Magic] text-white overflow-hidden">
            <div className="relative h-full max-h-[946px] w-auto aspect-[528/946] bg-[#333] overflow-hidden flex flex-col items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="absolute top-0 left-0 w-full h-full z-0">
                    <img src="/assets/login_register_page_background.png" alt="Background" className="w-full h-full object-fill" />
                </div>

                <div className="relative w-full h-full flex flex-col items-center justify-center z-10">
                    {/* Input Fields */}
                    <div className="relative w-[272px] h-[71px] mb-5 flex justify-center items-center">
                        <img src="/assets/text_field2.png" alt="Input Background" className="absolute w-full h-full z-0" />
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="relative z-10 w-[80%] h-[60%] bg-transparent border-none font-inherit text-[1.2rem] text-black outline-none text-center placeholder-[#555]/70"
                        />
                    </div>

                    <div className="relative w-[272px] h-[71px] mb-5 flex justify-center items-center">
                        <img src="/assets/text_field2.png" alt="Input Background" className="absolute w-full h-full z-0" />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="relative z-10 w-[80%] h-[60%] bg-transparent border-none font-inherit text-[1.2rem] text-black outline-none text-center placeholder-[#555]/70"
                        />
                    </div>

                    {/* Main Button (Login/Register) */}
                    <div
                        className="relative w-[154px] h-[88px] mt-5 cursor-pointer flex justify-center items-center transition-transform active:scale-95"
                        onClick={handleMainButton}
                    >
                        <img src="/assets/button_blue.png" alt="Button Background" className="absolute w-full h-full z-0" />
                        <span className="relative z-10 text-white text-[1.2rem] font-bold [text-shadow:2px_2px_0_#043e8a]">
                            {isRegistering ? 'Register' : 'Login'}
                        </span>
                    </div>

                    {/* Message Area */}
                    <div className="mt-5 h-[30px] text-[#ffcccc] text-center [text-shadow:1px_1px_0_#000]">
                        {message}
                    </div>

                    {/* Bottom Buttons */}
                    <div className="mt-10 w-full flex justify-center gap-5">
                        <div
                            className="relative w-[154px] h-[88px] cursor-pointer flex justify-center items-center transition-transform active:scale-95"
                            onClick={toggleMode}
                        >
                            <img src="/assets/button_yellow.png" alt="Yellow Button" className="absolute w-full h-full z-0" />
                            <span className="relative z-10 text-white text-[1.2rem] font-bold [text-shadow:2px_2px_0_#572700]">
                                {isRegistering ? 'Login' : 'Register'}
                            </span>
                        </div>
                        <div
                            className="relative w-[154px] h-[88px] cursor-pointer flex justify-center items-center transition-transform active:scale-95"
                            onClick={handleExit}
                        >
                            <img src="/assets/button_red.png" alt="Red Button" className="absolute w-full h-full z-0" />
                            <span className="relative z-10 text-white text-[1.2rem] font-bold [text-shadow:2px_2px_0_#570500]">
                                Exit
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
