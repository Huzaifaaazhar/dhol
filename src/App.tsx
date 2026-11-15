import { useEffect } from 'react';
import { useGame } from './game/store';
import { installInput } from './game/input';
import { installController } from './game/controller';
import { Stage } from './render/Stage';
import { DialogueBox } from './ui/DialogueBox';
import { Hints, ObjectiveSign, Roster, SceneCard, Toasts } from './ui/Hud';
import { Boot, Fader, IntroOverlay, PartEnd, PauseMenu, TitleScreen } from './ui/Screens';

export default function App() {
  const mode = useGame((s) => s.mode);
  const dialogue = useGame((s) => s.dialogue);

  useEffect(() => {
    installInput();
    return installController();
  }, []);

  return (
    <div className={`app mode-${mode} ${dialogue ? 'has-dialogue' : ''}`}>
      <Stage />
      <div className="grain" aria-hidden />
      <div className="vignette" aria-hidden />
      {mode === 'boot' && <Boot />}
      {mode === 'intro' && <IntroOverlay />}
      {mode === 'title' && <TitleScreen />}
      {mode === 'play' && (
        <div className="hud">
          <ObjectiveSign />
          <Roster />
          <Hints />
          <SceneCard />
          <DialogueBox />
          <PauseMenu />
          <PartEnd />
          <button className="menu-btn" onClick={() => useGame.setState({ paused: true })} aria-label="Open menu">
            <kbd>Esc</kbd> Menu
          </button>
        </div>
      )}
      <Toasts />
      <Fader />
    </div>
  );
}
