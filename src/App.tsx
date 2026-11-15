import { useEffect } from 'react';
import { useGame } from './game/store';
import { installInput } from './game/input';
import { installController } from './game/controller';
import { installSim } from './game/sim/sim';
import { Stage } from './render/Stage';
import { DialogueBox } from './ui/DialogueBox';
import { Hints, ObjectiveSign, Roster, SceneCard, Toasts } from './ui/Hud';
import { Boot, Fader, IntroOverlay, PartEnd, PauseMenu, TitleScreen } from './ui/Screens';
import { FailCard, LieBook, MissionTimer, QuestionCard, Situations } from './ui/Part2';
import { WorldOverlay } from './ui/WorldOverlay';
import { EndingCard } from './ui/Ending';

export default function App() {
  const mode = useGame((s) => s.mode);
  const dialogue = useGame((s) => s.dialogue);
  const ending = useGame((s) => s.endingShown);

  useEffect(() => {
    installInput();
    installSim();
    return installController();
  }, []);

  return (
    <div className={`app mode-${mode} ${dialogue ? 'has-dialogue' : ''} ${ending ? 'ending-open' : ''}`}>
      <Stage />
      <div className="grain" aria-hidden />
      <div className="vignette" aria-hidden />
      {mode === 'boot' && <Boot />}
      {mode === 'intro' && <IntroOverlay />}
      {mode === 'title' && <TitleScreen />}
      {mode === 'play' && (
        <div className="hud">
          <WorldOverlay />
          <ObjectiveSign />
          <Roster />
          <Hints />
          <SceneCard />
          <MissionTimer />
          <Situations />
          <QuestionCard />
          <DialogueBox />
          <LieBook />
          <FailCard />
          <EndingCard />
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
