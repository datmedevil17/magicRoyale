import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';

// Pages are code-split so the login screen doesn't wait for Phaser and every other page.
// Each lazy() maps a named export to the default export React.lazy expects.
const WaitingScreen = lazy(() => import('./ui/WaitingScreen').then(m => ({ default: m.WaitingScreen })));
const GameWrapper = lazy(() => import('./GameWrapper').then(m => ({ default: m.GameWrapper })));
const GameWrapper2v2 = lazy(() => import('./GameWrapper2v2').then(m => ({ default: m.GameWrapper2v2 })));
const TestProgramPage = lazy(() => import('./pages/TestProgramPage').then(m => ({ default: m.TestProgramPage })));
const MainMenuPage = lazy(() => import('./pages/MainMenuPage').then(m => ({ default: m.MainMenuPage })));
const BattleDeckPage = lazy(() => import('./pages/BattleDeckPage').then(m => ({ default: m.BattleDeckPage })));
const MapTestPage = lazy(() => import('./pages/MapTestPage').then(m => ({ default: m.MapTestPage })));
const MapTestPage1 = lazy(() => import('./pages/MapTestPage1').then(m => ({ default: m.MapTestPage1 })));
const MapTestPage2 = lazy(() => import('./pages/MapTestPage2').then(m => ({ default: m.MapTestPage2 })));
const MapTestPage3 = lazy(() => import('./pages/MapTestPage3').then(m => ({ default: m.MapTestPage3 })));
const Map2v2TestPage = lazy(() => import('./pages/Map2v2TestPage').then(m => ({ default: m.Map2v2TestPage })));
const TroopTestPage = lazy(() => import('./pages/TroopTestPage').then(m => ({ default: m.TroopTestPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const HistoryPage = lazy(() => import('./pages/HistoryPage').then(m => ({ default: m.HistoryPage })));
const MarketplacePage = lazy(() => import('./pages/MarketplacePage').then(m => ({ default: m.MarketplacePage })));
const ClanPage = lazy(() => import('./pages/ClanPage').then(m => ({ default: m.ClanPage })));
const TournamentPage = lazy(() => import('./pages/TournamentPage').then(m => ({ default: m.TournamentPage })));
const TestArena = lazy(() => import('./pages/TestArena').then(m => ({ default: m.TestArena })));
const TestArena2v2 = lazy(() => import('./pages/TestArena2v2').then(m => ({ default: m.TestArena2v2 })));
const MapSelectionPage = lazy(() => import('./pages/MapSelectionPage').then(m => ({ default: m.MapSelectionPage })));
const TesarPage = lazy(() => import('./pages/TesarPage').then(m => ({ default: m.TesarPage })));

const PageFallback = () => (
  <div className="w-screen h-screen bg-[#12192b] flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-[#fbce47] border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<PageFallback />}>
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
          <Route path="/game2v2" element={<GameWrapper2v2 />} />
          <Route path="/test" element={<TestProgramPage />} />
          <Route path="/map-test" element={<MapTestPage />} />
          <Route path="/testmap1" element={<MapTestPage1 />} />
          <Route path="/map2" element={<MapTestPage2 />} />
          <Route path="/map3" element={<MapTestPage3 />} />
          <Route path="/map2v2test" element={<Map2v2TestPage />} />
          <Route path="/troop-test" element={<TroopTestPage />} />
          <Route path="/test-arena-2v2" element={<TestArena2v2 />} />
          <Route path="/maps" element={<MapSelectionPage />} />
          <Route path="/tesar" element={<TesarPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
