# Disktree

Disktree is a native disk-space explorer for macOS and Linux, built with Native Shell. It shows where the space on a disk goes as a nested treemap, with a black interface, subtle dimensional surfaces and vivid category colors.

## See the whole disk at once

Disktree scans as soon as it opens and remembers the last directory. Tiles are colored by what they hold: code, Git data, caches, builds, toolchains, media and more. Large scan indexes stay in Rust, and the interface reads bounded pages of each directory, so very large trees stay responsive.

## Move through it naturally

Pinch on a MacBook trackpad, drag with the mouse or use the keyboard to zoom. Click a tile to select it and click a selected folder again to enter it. Breadcrumbs go back with one click, and long paths collapse their middle folders into a menu. Transitions between levels run natively.

## Clean up with confidence

Point at a tile and press Space to mark it for removal; amber fills and check badges show what is marked. Before anything moves to the system Trash, Disktree lists the full paths for review, and permanent deletion or emptying the Trash asks for a separate confirmation.

[GitHub repository](https://github.com/huacnlee/disktree)
