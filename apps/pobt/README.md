# POBT

POBT is a Path of Building for Path of Exile 1 and 2, translated into Simplified Chinese, Traditional Chinese and Korean.

POBT has had two interfaces:

- **Classic (0.1–0.4)**: Path of Building's own screens, written in Lua. POBT ran that Lua code with its own program in place of Path of Building's graphics runtime and translated every string on the way to the screen. The layout and controls were Path of Building's (last screenshot).
- **New (0.5 and later)**: the build editor is redrawn entirely in Native Shell: passive tree, skills, items, calculations, configuration and notes, with real text, inputs, menus and scrolling. Path of Building's Lua still runs with no window in the background and does every calculation, so the numbers stay exact and follow each Path of Building update. The classic window remains under Tools → Classic Path of Building (legacy).

Builds are read from and saved to Path of Building's own builds folder. POBT also imports characters and can have Claude Code or Codex review a build.
