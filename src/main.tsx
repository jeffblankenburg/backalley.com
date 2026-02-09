import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../tailwind.css';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { useThemeStore } from './store/themeStore.ts';

function ThemeSync() {
  const dark = useThemeStore((s) => s.dark);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);
  return null;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeSync />
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
