import { BoardScene } from './xr/scenes/BoardScene';
import { PaletteScene } from './xr/scenes/PaletteScene';
import { LayersScene } from './xr/scenes/LayersScene';
import { ControlsScene } from './xr/scenes/ControlsScene';
import { HelpScene } from './xr/scenes/HelpScene';
import { ExportScene } from './xr/scenes/ExportScene';
import { ImportScene } from './xr/scenes/ImportScene';
import { WelcomeScene } from './xr/scenes/WelcomeScene';
import { ClearScene } from './xr/scenes/ClearScene';
import { GridAlignScene } from './xr/scenes/GridAlignScene';
import { FirefighterHubScene } from './xr/scenes/FirefighterHubScene';
import { KeyScene } from './xr/scenes/KeyScene';


const _sceneParam = new URLSearchParams(window.location.search).get('scene');
if (_sceneParam === 'key') {
  window.xrCurrentSceneDefaults = async (config) => ({
    ...config,
    defaultSize: { width: 200, height: 130 },
  });
}

function App() {
  const scene = _sceneParam;

  if (scene === 'palette') {
    return <PaletteScene />;
  }

  if (scene === 'layers') {
    return <LayersScene />;
  }

  if (scene === 'controls') {
    return <ControlsScene />;
  }

  if (scene === 'help') {
    return <HelpScene />;
  }

  if (scene === 'export') {
    return <ExportScene />;
  }

  if (scene === 'import') {
    return <ImportScene />;
  }

  if (scene === 'welcome') {
    return <WelcomeScene />;
  }

  if (scene === 'clear') {
    return <ClearScene />;
  }

  if (scene === 'grid-align') {
    return <GridAlignScene />;
  }

  if (scene === 'firefighter-hub') {
    return <FirefighterHubScene />;
  }

  if (scene === 'key') {
    return <KeyScene />;
  }

  if (scene === 'board') {
    return <BoardScene />;
  }

  // Default to welcome scene on start
  return <WelcomeScene />;
}

export default App;
