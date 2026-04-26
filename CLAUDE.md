# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Vite dev server with HMR
npm run build    # Production build to dist/
npm run lint     # ESLint
npm run preview  # Preview production build locally
```

No test suite exists in this project.

## Architecture Overview

**carousel-craft** is a React + Fabric.js app for creating multi-slide Instagram carousel posts. Users upload images, arrange them on a shared canvas, then export each slide as a JPEG.

### Two modes

- **Edit mode** — sidebar + canvas panel; the default view
- **Preview mode** — full-screen carousel navigator with prev/next/dots

`App.jsx` reads `mode` from the store and renders the appropriate layout.

### State: Zustand store (`src/store/canvasStore.js`)

All persistent state lives here. Key fields:

| Field | Description |
|---|---|
| `slideCount` | Number of slides (1–20) |
| `slideWidth` / `slideHeight` | Dimensions of one slide in pixels |
| `canvasWidth` / `canvasHeight` | `slideWidth * slideCount` × `slideHeight` |
| `images[]` | Array of image objects (see below) |
| `selectedImageId` | UUID of currently selected image |
| `mode` | `'edit'` or `'preview'` |

**Image object shape:**
```js
{ id, url, name, left, top, scaleX, scaleY, angle, scaledWidth }
```
- `left` is the image's absolute X position on the combined canvas (all slides side-by-side)
- `scaledWidth` is the rendered width after scale; used for flow-layout tiling

**Persistence:** Zustand + idb-keyval (IndexedDB), persisting `slideWidth`, `slideHeight`, `slideCount`, and `images`. Uses IndexedDB instead of localStorage to avoid quota errors with large DataURLs.

### Canvas (`src/components/Canvas/CanvasEditor.jsx`)

Uses **Fabric.js 6.x**. The canvas spans the entire carousel (`slideCount * slideWidth` wide). Key behaviors:

- A template layer renders dashed slide separators and "SLIDE N" labels (sent to back; unselectable)
- `object:modified` → updates Zustand store with new `left`, `top`, `scaleX`, `scaleY`, `angle`
- Store changes sync back to Fabric objects via a `useEffect` that diffs the images array
- Canvas is rendered at full pixel size but CSS-scaled down (~0.4×) via a CSS variable (`--canvas-scale`) so it fits the viewport

**Resize handle:** A blue draggable handle at the bottom-right updates canvas dimensions in real time (via CSS vars and Fabric canvas resize), then commits final dimensions to the store on mouse-up and scales all persisted image positions proportionally.

### Image upload flow (`src/components/Upload/ImageUploader.jsx`)

1. File selected → compressed via `browser-image-compression` (max 1 MB, 2160 px, 80% quality)
2. Converted to DataURL (`imageUtils.js`)
3. Added to store — `left` is auto-set to tile after the last image's right edge (flow layout using `scaledWidth`)

### Export (`src/components/Export/ExportButton.jsx`)

Creates a temporary off-screen `<canvas>` at full resolution, draws all images at their stored positions/scales, then slices it into `slideCount` individual canvases. Each slice is exported as JPEG and bundled into a ZIP (`slide-01.jpg` … `slide-N.jpg`) via jszip + file-saver.

**Preview** (`src/components/Preview/CarouselPreview.jsx`) uses the same slicing logic to generate preview images.

### Utilities (`src/utils/imageUtils.js`)

- `compressImage(file)` — wraps browser-image-compression
- `fileToDataURL(file)` — FileReader → Promise<DataURL>
- `formatFileSize(bytes)` — human-readable string

## Key dependencies

| Package | Role |
|---|---|
| `fabric` 6.x | Canvas manipulation |
| `zustand` 5.x | State management |
| `idb-keyval` | IndexedDB adapter for Zustand persistence |
| `browser-image-compression` | Client-side image compression |
| `jszip` + `file-saver` | ZIP export |
| `tailwindcss` | Styling |
