import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css'; // We'll create this CSS file

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
                // In a real app, validate credentials.
                // For now, just store username and navigate.
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
        // In a browser, we can't really "exit", maybe redirect to a goodbye page or just do nothing.
        setMessage('Cannot exit in web browser.');
    };

    return (
        <div className="login-page">
            <div className="background-image">
                <img src="/assets/login_register_page_background.png" alt="Background" />
            </div>

            <div className="content-container">
                {/* Input Fields */}
                <div className="input-field username-field">
                    <img src="/assets/text_field2.png" alt="Input Background" />
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>

                <div className="input-field password-field">
                    <img src="/assets/text_field2.png" alt="Input Background" />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                {/* Main Button (Login/Register) */}
                <div className="main-button" onClick={handleMainButton}>
                    <img src="/assets/button_blue.png" alt="Button Background" />
                    <span>{isRegistering ? 'Register' : 'Login'}</span>
                </div>

                {/* Message Area */}
                <div className="message-area">{message}</div>

                {/* Bottom Buttons */}
                <div className="bottom-buttons">
                    <div className="bottom-button change-mode-button" onClick={toggleMode}>
                        <img src="/assets/button_yellow.png" alt="Yellow Button" />
                        <span>{isRegistering ? 'Login' : 'Register'}</span>
                    </div>
                    <div className="bottom-button exit-button" onClick={handleExit}>
                        <img src="/assets/button_red.png" alt="Red Button" />
                        <span>Exit</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
