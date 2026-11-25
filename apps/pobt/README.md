# POBT

POBT is a Path of Building for Path of Exile 1 and 2, translated into Simplified Chinese, Traditional Chinese and Korean.

POBT has had two interfaces:

- **Classic (0.1–0.4)**: Path of Building's own screens, written in Lua. POBT ran that Lua code with its own program in place of Path of Building's graphics runtime and translated every string on the way to the screen. The layout and controls were Path of Building's (last screenshot).
- **New (0.5 and later)**: the build editor is redrawn entirely in Native Shell: passive tree, skills, items, calculations, configuration and notes, with real text, inputs, menus and scrolling. Path of Building's Lua still runs with no window in the background and does every calculation, so the numbers stay exact and follow each Path of Building update. The classic window remains under Tools → Classic Path of Building (legacy).

Builds are read from and saved to Path of Building's own builds folder. POBT also imports characters and can have Claude Code or Codex review a build.

## Why it is a hard app to build

Path of Building is a large, mature tool. Its calculations cover thousands of skills, items, passive nodes and modifiers, and how they combine into damage and defences, jewels and party buffs. POBT does not rewrite any of that: the work is putting a new interface on top of it.

That interface is one of the heaviest Native Shell apps so far:

- **A large interactive canvas.** The passive tree has thousands of nodes and connections. It pans and zooms, shows hover tooltips and recolours paths as nodes are allocated.
- **Many dense screens.** Skills, items, calculations and configuration are long lists and tables with inputs, dropdowns, menus and tooltips, and most of them change after every edit.
- **An external engine as the source of truth.** Every edit goes to Path of Building's Lua running in the background, and the results come back to the screens. The interface has to stay in step with Lua's state, update only what changed, and save build files Path of Building itself can open.
- **Text, input and translation.** Chinese and Korean text, input methods, selection and scrolling must work properly. These were weak points of the classic window, which drew text through Path of Building's own graphics runtime.

A related project, go-pob, takes the opposite route on both sides. It rewrites Path of Building's calculations in Go, and its interface is a web front end in Svelte and TypeScript, hosted at pob.gg. Its desktop app shows the same web page in the system WebView (WebView2 on Windows, WebKitGTK on Linux). POBT keeps Path of Building's Lua for the numbers and draws its interface with Native Shell instead of a web view.

The app is written in TSX for the interface, with a Rust module (`ext/pobt-native`) for the native side. It shows that Native Shell can carry a production desktop app of this size, not only small demos. Performance work continues, especially on the passive tree.

## Measurements

The performance section of the [POBT README](https://github.com/huacnlee/pobt) compares POBT 0.2.0 with Path of Building 2.68.1 on the same Windows PC, with the same build open on the passive tree. That release used the classic interface on POBT's own Rust graphics runtime, not the Native Shell screens:

| | POBT 0.2.0 | Path of Building 2.68.1 |
| --- | ---: | ---: |
| Start to the build on screen | 2.70 s | 3.38 s |
| CPU while idle | 8.0% of a core | 46.4% of a core |
| Peak private memory while loading | 1,007 MB | 1,507 MB |
| Working set | 725 MB | 517 MB |

The same comparison has not yet been published for the Native Shell interface.
