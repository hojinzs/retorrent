# Retorrent PWA Icon Prompts

To keep the repository binary-free we do not commit the generated PNG icons. Use the prompts below with your preferred image generator (e.g. DALL·E, Midjourney, or Stable Diffusion) to recreate the assets before cutting a release. After generating the base illustration, export or resize it to the expected filenames under `web/public/`.

## Brand Direction
- **Style:** clean, modern vector illustration with subtle gradients.
- **Motifs:** circular torrent swirl blended with a download arrow, dark-slate background (#111827) with soft slate/teal highlights (#0ea5e9, #38bdf8).
- **Mood:** technical yet friendly; avoid skeuomorphism, text, or photographic textures.

## Base Illustration Prompt
> *"Minimal flat icon of a circular torrent swirl forming a downward arrow, rendered on a dark slate (#111827) rounded square with soft teal (#0ea5e9/#38bdf8) glow accents, simple gradients, no text, centered composition, high contrast, PWA app icon."*

Generate a 1024×1024 square image with transparent corners when possible. This master artwork can be adapted into the required outputs.

## Export Checklist
1. Import the generated master icon into your editor (Figma, Sketch, Affinity, etc.).
2. Ensure the background remains dark slate (#111827) and corners are rounded to support maskable icons.
3. Export the following PNG files into `web/public/`:
   - `pwa-192x192.png` (192×192)
   - `pwa-512x512.png` (512×512)
   - `pwa-maskable-512x512.png` (512×512, 20% safe zone; keep key artwork inside center 80%)
4. Run `npm run build` to verify the manifest references resolve without 404s.

> **Tip:** Tools like [`pwa-asset-generator`](https://github.com/elegantapp/pwa-asset-generator) can automate the resizing once you have the master 1024×1024 PNG.

