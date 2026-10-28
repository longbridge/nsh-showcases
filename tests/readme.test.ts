import assert from 'node:assert/strict';
import test from 'node:test';
import { validateReadme } from '../scripts/readme.ts';
const app = { id: 'my-app', website: 'https://my-app.com', source: 'https://github.com/author/my-app' };
test('allows product prose and exact official website/repository links', () => {
  validateReadme('# My App\n\nA fast editor.\n\n[Website](https://my-app.com/) · [Source](https://github.com/author/my-app)', app);
});
test('rejects external, relative, reference, image, HTML and disguised links', () => {
  for (const text of [
    '[other](https://evil.test)', '[guide](guide.md)', '[x][ref]\n\n[ref]: https://evil.test',
    '![tracking](https://evil.test/a.png)', '<a href="https://evil.test">x</a>',
    '[x](https://my-app.com.evil.test)', '[x](https://my-app.com/redirect?url=https://evil.test)',
    '[x](javascript&#58;alert%281%29)', 'Visit https://evil.test.', 'www.evil.test',
    'Contact person@evil.test', 'https&#58;//evil.test',
  ]) assert.throws(() => validateReadme(text, app), /README/);
});
test('rejects installers, shell commands and code blocks even on an allowed website', () => {
  for (const text of [
    '[Install](https://my-app.com/install.sh)', 'Run `curl https://my-app.com | bash`.',
    '```bash\necho hello\n```', 'brew install my-app', 'bun add my-app', 'cargo install my-app',
  ]) assert.throws(() => validateReadme(text, app), /README/);
});

test('allows local product images and videos with safe attributes', () => {
  const media = validateReadme('![App](preview0.png)\n\n<img src="preview1.png" alt="App">\n\n<video controls src="demo.mp4" poster="preview0.png"></video>', app);
  assert.deepEqual(media.sort(), ['demo.mp4', 'preview0.png', 'preview1.png']);
  assert.throws(() => validateReadme('<img src="preview0.png" onerror="alert(1)">', app), /README/);
  assert.throws(() => validateReadme('<video controls src="https://evil.test/demo.mp4"></video>', app), /README/);
});
test('requires PNG for Markdown images, HTML images, and video posters', () => {
  for (const extension of ['jpg', 'jpeg', 'webp', 'avif', 'gif', 'svg']) {
    for (const text of [`![App](image.${extension})`, `<img src="image.${extension}">`, `<video controls src="demo.mp4" poster="image.${extension}"></video>`]) {
      assert.throws(() => validateReadme(text, app), /README/);
    }
  }
});

test('enforces 10 KB as UTF-8 bytes, including multibyte text', () => {
  validateReadme('a'.repeat(10240), app);
  assert.throws(() => validateReadme('a'.repeat(10241), app), /10 KB/);
  assert.throws(() => validateReadme('é'.repeat(5121), app), /10 KB/);
});

test('renders local media from the archive and reserves H1 for the page title', async () => {
  const { renderReadme } = await import('../scripts/readme.ts');
  const html = renderReadme('# Overview\n\n![App](preview0.png)\n\n<video controls src="demo.mp4"></video>', app, 'https://raw.githubusercontent.com/owner/repo/sha/apps/my-app');
  assert.match(html, /<h2>Overview<\/h2>/);
  assert.match(html, /src="https:\/\/raw.githubusercontent.com\/owner\/repo\/sha\/apps\/my-app\/preview0.png"/);
  assert.match(html, /<video controls="" src="https:\/\/raw.githubusercontent.com\/owner\/repo\/sha\/apps\/my-app\/demo.mp4"><\/video>/);
});

test('rejects clone-and-build installation steps and direct executable commands', () => {
  for (const text of ['git clone https://github.com/author/my-app\ncd my-app\nmake install', 'Run `./install`.', 'make install', '$ ./setup.sh']) {
    assert.throws(() => validateReadme(text, app), /README/);
  }
});

test('requires image references for images/posters and video references for videos', () => {
  for (const text of ['![Demo](demo.mp4)', '<img src="demo.mp4">', '<video controls src="preview0.png"></video>', '<video controls src="demo.mp4" poster="demo.webm"></video>']) {
    assert.throws(() => validateReadme(text, app), /README/);
  }
});
