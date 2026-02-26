import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WaitingScreen } from './ui/WaitingScreen';
import { GameWrapper } from './GameWrapper';
import { TestGifComponent } from './ui/TestGifComponent';
import { LoginPage } from './pages/LoginPage';
import { MainMenuPage } from './pages/MainMenuPage';
import { BattleDeckPage } from './pages/BattleDeckPage';
import { MapTestPage } from './pages/MapTestPage';
import { MapTestPage1 } from './pages/MapTestPage1';
import { Map2v2TestPage } from './pages/Map2v2TestPage';
import { TroopTestPage } from './pages/TroopTestPage';
import { ProfilePage } from './pages/ProfilePage';
import { HistoryPage } from './pages/HistoryPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { ClanPage } from './pages/ClanPage';
import { TournamentPage } from './pages/TournamentPage';
import { TestArena } from './pages/TestArena';
import { TestArena2v2 } from './pages/TestArena2v2';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/menu" element={<MainMenuPage />} />
        <Route path="/deck" element={<BattleDeckPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/market" element={<MarketplacePage />} />
        <Route path="/clan" element={<ClanPage />} />
        <Route path="/tournament" element={<TournamentPage />} />
        <Route path="/test-arena" element={<TestArena />} />
        <Route path="/waiting" element={<WaitingScreen />} />
        <Route path="/game" element={<GameWrapper />} />
        <Route path="/test" element={<TestGifComponent />} />
        <Route path="/map-test" element={<MapTestPage />} />
        <Route path="/testmap1" element={<MapTestPage1 />} />
        <Route path="/map2v2test" element={<Map2v2TestPage />} />
        <Route path="/troop-test" element={<TroopTestPage />} />
        <Route path="/test-arena-2v2" element={<TestArena2v2 />} />
      </Routes>
    </Router>
  );
}

export default App;
