# Spatial Canvas

**A demonstration of WebSpatial's power: Building multipanel spatial applications for Apple Vision Pro**

Spatial Canvas is a fully-featured moodboard application that showcases what's possible when you bring traditional web development to spatial computing. Built entirely with web technologies (React, TypeScript) and the WebSpatial SDK, it demonstrates how developers can create sophisticated spatial experiences without leaving the familiar web stack.

![WebSpatial Multipanel Architecture](https://img.shields.io/badge/WebSpatial-Multipanel_App-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)

## Project Deep Dive

For detailed documentation, design rationale, and development insights, see our **[Notion Deep Dive](https://smiling-cap-7e6.notion.site/Spatial-Canvas-Reimagining-Creative-Workspaces-in-Mixed-Reality-2dfdf2206e4580a69984fbb1e86d2570)**.

## What This Demonstrates

### 🎯 Core WebSpatial Capabilities

This project showcases the full spectrum of WebSpatial features:

**1. True 3D Depth Manipulation**
- Items exist at precise depth coordinates (0pt, 24pt, 48pt, 80pt)
- Smooth depth animations using `--xr-back` CSS property
- Programmatic depth control via JavaScript

**2. Multipanel Spatial Architecture**
- **Main Board Scene**: Primary workspace with full item manipulation
- **Layers Panel**: Floating navigator showing all items with visibility/lock controls
- **Properties Panel**: Real-time item property editing
- **Color Palette Panel**: Static color swatches (extraction helper exists but not yet wired to UI)
- **Controls Panel**: Depth slider and minimap for spatial navigation

Each panel is an independent window that can be positioned freely in 3D space, demonstrating WebSpatial's multi-scene architecture.

**3. Cross-Scene Communication**
- BroadcastChannel API for real-time synchronization between panels
- Bidirectional data flow: panels can read from and write to the main board
- State persistence across scene lifecycle

**4. Spatial Materials & Surfaces**
- `translucent` window backgrounds (system blur)
- `thin` material for content cards (optimal legibility)
- `thick` material for toolbar (prominence and depth)
- Glassmorphism effects that respond to environment

**5. Spatial Interactions**
- Native Vision Pro gestures (pinch, drag, tap)
- Hover states with `cursor: pointer`
- Multi-select with Cmd/Ctrl modifier
- Keyboard shortcuts (`[`, `]` for depth control)

### 💡 Innovative Features

**Presentation Mode**
- Random grouping of all items (2-4 per group)
- Automatic cycling through groups every 3 seconds
- Depth animation: active items lift +20pt, then settle back
- Opacity transitions for focus management
- Perfect for spatial storytelling and demos

**Smart Depth Management**
- Depth snapping to defined layers
- Same-plane z-index ordering for fine control
- Keyboard shortcuts for quick depth changes
- Visual depth slider with real-time preview

**Persistence & Portability**
- localStorage auto-save with migration system
- JSON import/export for sharing boards
- Version-controlled data schema
- Graceful handling of legacy data

**Content Types**
- **Images**: Drag-and-drop, paste from clipboard, or file upload
- **Color Swatches**: Custom color picker
- **Text Chips**: Inline editing with visual preview
- All types support rotation, scaling, depth, and opacity

## Multi-Scene Architecture Deep Dive

WebSpatial allows web apps to spawn multiple independent windows, each with its own scene. This project demonstrates a sophisticated implementation:

```
┌─────────────────────────────────────────────────┐
│  BoardScene (Main - 1200×900)                   │
│  ┌───────────────────────────────────────────┐  │
│  │  Board Canvas (enable-xr-monitor)         │  │
│  │  ├─ Item 1 (--xr-back: 0pt)              │  │
│  │  ├─ Item 2 (--xr-back: 24pt)             │  │
│  │  └─ Item 3 (--xr-back: 48pt)             │  │
│  └───────────────────────────────────────────┘  │
│  [Toolbar - thick material]                     │
└─────────────────────────────────────────────────┘
         ↕ BroadcastChannel 'moodboard'
┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐
│ LayersScene      │  │ PaletteScene     │  │ ControlsScene   │
│ (240×620)        │  │ (260×520)        │  │ (320×640)       │
│                  │  │                  │  │                 │
│ • Visibility     │  │ • Color Extract  │  │ • Depth Slider  │
│ • Lock/Unlock    │  │ • Apply to Sel.  │  │ • Minimap       │
│ • Duplicate      │  │ • Swatch Grid    │  │ • Properties    │
│ • Delete         │  │                  │  │                 │
└──────────────────┘  └──────────────────┘  └─────────────────┘
```

Each scene:
- Initializes with `initScene(name, config)` in the main scene
- Opens via `window.open(url + '?scene=name', ...)`
- Communicates via BroadcastChannel
- Has independent lifecycle and state
- Can request current state from main scene
- Can dispatch actions back to main scene

## Tech Stack

- **React 18** with modern hooks and concurrent features
- **TypeScript 5.9** with strict mode for type safety
- **Vite 7** for lightning-fast HMR and optimized builds
- **WebSpatial SDK 1.0.4** (`@webspatial/react-sdk`, `@webspatial/core-sdk`)
- **WebSpatial Builder** for visionOS packaging
- CSS Custom Properties for dynamic spatial manipulation

## Getting Started

### Prerequisites

- Node.js 18+
- For visionOS: macOS with Xcode 16+ and visionOS 2.0 Simulator or physical device

### Installation

```bash
cd webspatial-moodboard
npm install
```

### Development

#### Desktop/Web Mode (2D fallback)

```bash
npm run dev
```

Open http://localhost:5173 in your browser. The app runs in 2D mode but maintains full functionality.

#### visionOS Spatial Mode

In one terminal, start the spatial dev server:

```bash
XR_ENV=avp npm run dev -- --host
```

In another terminal, package and run:

```bash
npx webspatial-builder run --base=http://localhost:5175/webspatial/avp --bundle-id=com.hoku.spatialcanvas --manifest=public/manifest.webmanifest
```

For physical Vision Pro, replace `localhost:5175` with your Mac's local IP address.

### Building for Production

```bash
# Web build
npm run build

# visionOS build
XR_ENV=avp npm run build
```

## Project Structure

```
webspatial-moodboard/
├── src/
│   ├── xr/
│   │   ├── scenes/
│   │   │   ├── BoardScene.tsx          # Main board (Start Scene)
│   │   │   ├── LayersScene.tsx         # Navigator panel
│   │   │   ├── PaletteScene.tsx        # Color management
│   │   │   ├── ControlsScene.tsx       # Depth/minimap
│   │   │   └── HelpScene.tsx           # Documentation
│   │   ├── components/
│   │   │   ├── Board.tsx               # Main canvas with drag & drop
│   │   │   ├── Item.tsx                # Spatial item with depth animation
│   │   │   ├── Toolbar.tsx             # Fixed spatial toolbar
│   │   │   ├── LayersPanel.tsx         # Item navigator
│   │   │   ├── PropertiesPanel.tsx     # Property editor
│   │   │   ├── ContextMenu.tsx         # Right-click menu
│   │   │   ├── CommandPalette.tsx      # Cmd+K quick actions
│   │   │   ├── DepthSlider.tsx         # Z-axis control
│   │   │   └── Minimap.tsx             # Spatial overview
│   │   ├── logic/
│   │   │   ├── items.ts                # State machine with reducers
│   │   │   ├── history.ts              # Undo/redo system
│   │   │   ├── storage.ts              # Persistence with migration
│   │   │   ├── channel.ts              # BroadcastChannel helpers
│   │   │   └── color.ts                # Color extraction helper (not yet wired to UI)
│   │   └── styles/
│   │       └── xr.css                  # Spatial CSS tokens
│   ├── App.tsx                         # Scene router
│   └── main.tsx                        # Entry point
├── public/
│   └── manifest.webmanifest            # Scene configuration
└── vite.config.ts                      # WebSpatial Vite plugin
```

## Usage Guide

### Adding Content

- **Text**: Click "+ Text" in toolbar, edit inline
- **Color Swatch**: Click "+ Color", choose from picker
- **Images**:
  - Drag & drop files onto board
  - Paste from clipboard (Cmd+V)
  - Upload via toolbar button

### Manipulating Items

- **Select**: Click item (Cmd+Click for multi-select)
- **Move**: Drag anywhere on selected item
- **Rotate**: Click rotate handle (90° increments)
- **Scale**: Drag scale handle up/down
- **Change Depth**:
  - Press `[` to move back, `]` to move forward
  - Use depth slider in Controls panel
- **Delete**: Select and press Backspace/Delete, or use delete button
- **Duplicate**: Right-click → Duplicate (or Cmd+D)
- **Edit Text**: Double-click text item or use edit button

### Organization Tools

- **Align Grid**: Automatically arrange all items in a 6-column grid
- **Bring to Front**: Increases z-index for same-plane ordering
- **Send to Back**: Decreases z-index
- **Lock/Unlock**: Prevent accidental modifications (via Layers panel)
- **Show/Hide**: Toggle visibility (via Layers panel)

### Panels

- **Layers Panel**: Navigator showing all items, searchable and filterable
- **Properties Panel**: Edit selected item's properties (depth, rotation, scale, opacity)
- **Palette Panel**: Static color swatches for quick color selection
- **Controls Panel**: Combined depth slider + minimap + properties
- **Help Panel**: Keyboard shortcuts and documentation

### Presentation Mode

1. Click "Present" (▶) in toolbar
2. All items are randomly shuffled into groups of 2-4
3. App cycles through groups every 3 seconds
4. Active group items lift forward (+20pt) with smooth animation
5. Inactive items dim to 40% opacity
6. Click "Stop" (■) to exit

Perfect for spatial storytelling, design reviews, and demos.

### Persistence

- **Auto-save**: Board saves to localStorage every 250ms (debounced)
- **Export**: Downloads JSON file with timestamp (e.g., `moodboard-2025-01-16-14-30-00.jpg`)
- **Import**: Load JSON file to restore board
- **Demo Board**: Loads automatically on first run

## WebSpatial Feature Reference

| Feature | CSS/API | Purpose | Implementation in Project |
|---------|---------|---------|---------------------------|
| **Depth** | `--xr-back` | Z-axis positioning | Dynamic depth on all items (0-80pt) |
| **Z-Index** | `--xr-z-index` | Same-plane ordering | Bring to front/send to back |
| **Materials** | `--xr-background-material` | Surface treatments | Window: translucent, Items: thin, Toolbar: thick |
| **Spatialization** | `enable-xr` | Mark element for spatial | All items, toolbar, panels |
| **Layout Sync** | `enable-xr-monitor` | Track child positions | Board container monitors item layout |
| **Scenes** | `initScene()` | Multi-window setup | 5 scenes with custom sizes |
| **Messaging** | `BroadcastChannel` | Cross-scene comms | Real-time sync between all panels |

## Keyboard Shortcuts

### Item Manipulation
- **`[`** — Move selected item(s) backward in depth
- **`]`** — Move selected item(s) forward in depth
- **Delete/Backspace** — Remove selected item(s)
- **Cmd/Ctrl + A** — Select all items
- **Cmd/Ctrl + D** — Duplicate selected item

### Application
- **Cmd/Ctrl + K** — Open command palette
- **Cmd/Ctrl + Z** — Undo
- **Cmd/Ctrl + Shift + Z** — Redo
- **Cmd/Ctrl + V** — Paste image from clipboard

## Technical Highlights

### Spatial Depth Animation

WebSpatial doesn't support CSS animations on spatial properties, so we use JavaScript:

```typescript
// Presentation mode: lift items when they become active
dispatch({ type: 'SET_DEPTH', id: item.id, z: originalZ + 20 });

// Return to original after 200ms
setTimeout(() => {
  dispatch({ type: 'SET_DEPTH', id: item.id, z: originalZ });
}, 200);
```

### Data Migration System

Gracefully handles schema changes:

```typescript
// Migrate old items to include new properties
return state.items.map(item => ({
  ...item,
  visible: item.visible !== undefined ? item.visible : true,
  locked: item.locked !== undefined ? item.locked : false,
  opacity: item.opacity !== undefined ? item.opacity : 1,
}));
```

### Cross-Scene Communication Pattern

```typescript
// Requesting scene (LayersScene)
channel.postMessage({ type: 'requestState' });

// Main scene (BoardScene) responds
if (message.type === 'requestState') {
  channel.postMessage({
    type: 'itemsUpdate',
    items: state.items
  });
}

// Requesting scene receives update
if (message.type === 'itemsUpdate') {
  setItems(message.items);
}
```

### Undo/Redo System

History wrapper around reducer:

```typescript
const [historyState, dispatch] = useReducer(
  withHistory(boardReducer),
  createInitialHistoryState(initialBoardState)
);

// Access current state
const state = historyState.present;

// Undo/redo
dispatch({ type: 'UNDO' });
dispatch({ type: 'REDO' });
```

## Known Limitations (WebSpatial Platform)

1. **CSS animations on spatial properties**: Must use JavaScript for animating `--xr-back`
2. **Window placement**: OS controls final positioning, app can only suggest
3. **Volume scenes**: Not yet supported (only Window Scenes available)
4. **Material options**: Limited to SDK presets (transparent, translucent, thin, thick, regular)

## Performance Considerations

- Uses `enable-xr-monitor` sparingly (only on board container)
- RequestAnimationFrame for smooth drag interactions
- Debounced auto-save (250ms)
- Debounced BroadcastChannel messages (150-200ms)
- Optimized re-renders with proper React memo and callbacks

## What We Learned

Building this project taught us:

1. **WebSpatial makes spatial computing accessible**: No Swift, no RealityKit, just web tech
2. **Multi-scene architecture is powerful**: Independent panels feel native to visionOS
3. **BroadcastChannel is perfect for spatial apps**: Clean communication between scenes
4. **Spatial depth is a first-class design dimension**: Items at different depths feel fundamentally different
5. **Materials matter**: The right material choice makes UI feel at home in visionOS
6. **Web paradigms translate well**: React patterns, state management, and CSS work beautifully in spatial

## Future Enhancements

- [ ] Collaborative mode with WebRTC
- [ ] 3D model support (GLB/USDZ)
- [ ] Hand tracking for direct manipulation
- [ ] Spatial audio zones
- [ ] Cloud storage and sharing
- [ ] Template library
- [ ] Advanced color palette extraction
- [ ] Layer grouping and nesting
- [ ] Animation timeline
- [ ] Export to USDZ for native apps

## Resources

- [WebSpatial Documentation](https://webspatial.dev/docs)
- [Spatialize HTML Elements](https://webspatial.dev/docs/development-guide/using-the-webspatial-api/spatialize-html-elements)
- [Managing Multiple Scenes](https://webspatial.dev/docs/development-guide/using-the-webspatial-api/manage-multiple-scenes)

## License

MIT

---

## Development Notes

This project was developed with assistance from AI tools to accelerate implementation and explore WebSpatial's capabilities efficiently.
