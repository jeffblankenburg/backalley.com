import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav.tsx';
import { useThemeStore } from '../../store/themeStore.ts';
import { useAuthContext } from '../../context/AuthContext.tsx';

export function AppShell() {
  const dark = useThemeStore((s) => s.dark);
  const toggle = useThemeStore((s) => s.toggle);
  const { user, signOut } = useAuthContext();

  const displayName = user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? '';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 pb-20">
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-lg font-bold tracking-tight">Back Alley</h1>
        <div className="flex items-center gap-2">
          {displayName && (
            <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:inline">
              {displayName}
            </span>
          )}
          <button
            onClick={signOut}
            className="px-2.5 py-1.5 text-xs rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Sign Out
          </button>
          <button
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
          >
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
