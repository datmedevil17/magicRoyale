import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SplashScreen } from './ui/SplashScreen';
import { WaitingScreen } from './ui/WaitingScreen';
import { GameWrapper } from './GameWrapper';
import { TestGifComponent } from './ui/TestGifComponent';
import { LoginPage } from './pages/LoginPage';
import { MainMenuPage } from './pages/MainMenuPage';
import { BattleDeckPage } from './pages/BattleDeckPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/menu" element={<MainMenuPage />} />
        <Route path="/deck" element={<BattleDeckPage />} />
        <Route path="/waiting" element={<WaitingScreen />} />
        <Route path="/game" element={<GameWrapper />} />
        <Route path="/test" element={<TestGifComponent />} />
      </Routes>
    </Router>
  );
}

export default App;
