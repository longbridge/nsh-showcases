# Contribution guidelines

## Listing and Featured

Every merged app PR is listed in App Stories. Featured placement is not guaranteed. Maintainers select and periodically adjust Featured apps based on project history, implementation, completeness and quality, aiming to highlight complete, representative products as applications evolve.

Any app whose UI is built with Native Shell qualifies: a standalone NSH app, or a native app with NSH modules embedded in it (name the screens NSH renders in the PR).

## Files and naming

Use `apps/<app-id>/manifest.json` with a lowercase kebab-case ID, such as `nsh-gallery` or `longbridge-lite`. Only lowercase ASCII letters, digits, and single hyphens between words are allowed. The manifest `id` must match its folder exactly. The display `name` may retain brand capitalization.

Provide the required `author`, English-only `description`, and `website`/`source` fields. Descriptions are limited to 280 weighted characters, using the standard [Twitter counting rules](https://docs.x.com/fundamentals/counting-characters). List every platform the app ships on in `platforms`, using `iOS`, `Android`, `macOS`, `Windows`, `Linux` and `Web`. See [README.md](README.md) for all manifest fields. Maintainers manage Featured selection and order in the root `featured.json` array and confirm `publishedAt`; automation maintains Stars. Do not include `featured` in app manifests.

## Screenshots

- **Capture the complete screen or window.** Desktop apps: the whole window, with its title bar or custom controls, all four corners, all four edges, navigation and main content. Missing even one corner or edge is unacceptable; prefer window capture over a manually dragged region. Phone and tablet apps: the device's full screen, status bar included, at the device's resolution. Web apps: the page's full viewport, without the browser's own toolbars.
- **Keep the image clear.** Use the original resolution without stretching, upscaling or heavy compression. Text and interface details must be legible at full size. Use PNG only. Convert other image formats to PNG without resizing or cropping; renaming the extension is not sufficient.
- **Keep the presentation clean and tidy.** Arrange representative content. Remove unrelated windows, cluttered backgrounds, context menus, tooltips, notifications and overlays obscuring the app. If a dialog or sheet is the feature being shown, retain its full parent window or screen and explain the use case in the PR.
- **Show the real product.** Screenshots must match the current implementation. No decorative device frames, marketing overlays or collages.
- **Choose the cover carefully.** The first filename in `previews` is the cover; the website crops it to a 16:9 card from the top, so a desktop window or a landscape screen makes the best cover. Additional screenshots should show distinct features or platforms. The detail page displays every image uncropped.
- **Commit every preview.** `previews` may contain only filenames in the app folder, such as `preview0.png` or `preview1.png`. External URLs, absolute paths and parent-directory references are forbidden.

## Capture instructions

### macOS

1. Bring the app to the front and arrange its content.
2. Press **Shift + Command (⌘) + 4**, release, then press **Space**. The pointer becomes a camera.
3. Hover over the target window and confirm that the whole window is highlighted, then click. Option-click to omit the shadow while retaining the complete window.
4. Open the saved image (the desktop is the default location) and inspect the four corners, four edges and title bar at full size. Do not crop the window afterward.

Source: [Apple's screenshot guide](https://support.apple.com/en-us/102646).

### Windows

1. Bring the app to the front and arrange its content.
2. Press **Windows + Shift + S**, choose **Window mode** in the Snipping Tool bar, then click the app's window.
3. Save the capture as PNG and inspect the four corners, four edges and title bar at full size.

Source: [Microsoft's Snipping Tool guide](https://support.microsoft.com/en-us/windows/use-snipping-tool-to-capture-screenshots-00246869-1843-655f-f220-97299b865f6b).

### Linux

Use your desktop's window capture: GNOME's screenshot tool (**Print Screen**, then **Window**), KDE Spectacle's **Active Window** mode, or on Omarchy **Print Screen** and select the whole window. Inspect all four corners and edges of the saved PNG; if anything is clipped or obscured, rearrange the window and capture it again.

### iOS

On a device, press the side button and volume up together; the screenshot is saved to Photos at full resolution. In the simulator, choose **File › Save Screen** (Command + S), which saves the screen without the device frame.

### Android

On a device, press power and volume down together. On an emulator or a device connected over USB, Android Studio's Running Devices window has a **Take screenshot** button; leave its frame option off.

### Web

Use the browser's developer tools to capture the page's viewport at the size you want to show (in Chrome and Edge, the command menu's **Capture screenshot**; in Firefox, **Take a screenshot › Save visible**).

## Optional product README and detail page

Add `apps/<app-id>/README.md` to give the app a detail page in App Stories. It must be a product introduction only: purpose, features, workflows, and use cases. Maximum size is **10 KB (10,240 UTF-8 bytes)**.

Only link to the exact official `website` and GitHub `source` URLs from the manifest. Other destinations, installation/download URLs, installation instructions, Bash/shell scripts, commands and code blocks are forbidden. Violations must be resolved before merging.

Product images and videos are allowed through Markdown images or HTML `img`, `video` and `source` tags. Commit media directly in the app folder and reference local filenames only; remote media, `data:` URLs, absolute paths and `../` are forbidden. Supported images: PNG only; videos: MP4, WebM. Use `controls` on videos. Event handlers, scripts, styles and other raw HTML are forbidden.

CI checks file size, links (including references and encoded URLs), media paths, markup and common command patterns. Maintainers additionally review product accuracy, screenshot completeness, and whether the README is purely descriptive.

## Review and publication

Run `bun install --frozen-lockfile`, `bun test` and `bun run validate`, then open a PR. Maintainers may request better screenshots or content corrections. After merging, automation updates and commits GitHub Stars, then triggers the NSH repository's `website.yml` to load the latest catalog and publish nsh.dev. Stars are also refreshed weekly.
