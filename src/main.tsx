import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/yatra-one/400.css';
import '@fontsource/baloo-2/500.css';
import '@fontsource/baloo-2/600.css';
import '@fontsource/baloo-2/800.css';
import './styles/global.css';
import App from './App';
import { useGame } from './game/store';
import { runtime } from './game/runtime';

if (import.meta.env.DEV) Object.assign(window, { __dhol: { useGame, runtime } });

// Signboards and posters are painted onto canvases, so wait for the fonts first.
const fontsReady = Promise.race([
  Promise.all([
    document.fonts.load('40px "Yatra One"'),
    document.fonts.load('600 20px "Baloo 2"'),
    document.fonts.load('800 20px "Baloo 2"'),
  ]),
  new Promise((r) => setTimeout(r, 2500)),
]);

fontsReady.finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
