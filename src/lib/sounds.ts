const APPLAUSE_FILES = [
  '/sounds/applause1.mp3',
  '/sounds/applause2.mp3',
  '/sounds/applause3.mp3',
  '/sounds/applause4.mp3',
  '/sounds/applause5.mp3',
];

export function playApplause(): void {
  const file = APPLAUSE_FILES[Math.floor(Math.random() * APPLAUSE_FILES.length)];
  const audio = new Audio(file);
  audio.play().catch(() => {
    // Browser blocked autoplay — silently ignore
  });
}
