import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell.tsx';
import { AuthGuard } from './components/auth/AuthGuard.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { ProfileSetupPage } from './pages/ProfileSetupPage.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { GameSetupPage } from './pages/GameSetupPage.tsx';
import { GamePlayPage } from './pages/GamePlayPage.tsx';
import { GameSummaryPage } from './pages/GameSummaryPage.tsx';
import { HistoryPage } from './pages/HistoryPage.tsx';
import { GameDetailPage } from './pages/GameDetailPage.tsx';
import { StatsPage } from './pages/StatsPage.tsx';
import { PlayersPage } from './pages/PlayersPage.tsx';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AuthGuard />}>
          <Route path="/profile-setup" element={<ProfileSetupPage />} />
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/game/setup" element={<GameSetupPage />} />
            <Route path="/game/:id" element={<GamePlayPage />} />
            <Route path="/game/:id/summary" element={<GameSummaryPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/history/:id" element={<GameDetailPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/players" element={<PlayersPage />} />
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  );
}
