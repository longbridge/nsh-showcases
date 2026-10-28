import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateCatalog } from '../scripts/validate.ts';

async function fixture(t, overrides = {}, id = 'my-app') {
  const root = await mkdtemp(join(tmpdir(), 'catalog-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const folder = join(root, 'apps', id);
  await mkdir(folder, { recursive: true });
  const app = { id, name: 'My App', author: 'Someone', category: 'dev', platforms: ['Linux'],
    website: 'https://example.com', source: null, description: 'An app',
    publishedAt: '2026-09-05T00:00:00Z', previews: ['preview0.png'], ...overrides };
  await writeFile(join(folder, 'manifest.json'), JSON.stringify(app));
  await writeFile(join(folder, 'preview0.png'), Buffer.from('89504e470d0a1a0a', 'hex'));
  await writeFile(join(root, 'featured.json'), JSON.stringify([id]));
  return root;
}
test('accepts lowercase IDs, author, website, and local preview files', async t => {
  assert.equal(await validateCatalog(await fixture(t)), 1);
});
test('requires PNG previews with actual PNG contents', async t => {
  for (const extension of ['jpg', 'jpeg', 'webp', 'avif', 'gif', 'svg']) {
    await assert.rejects(validateCatalog(await fixture(t, { previews: [`preview0.${extension}`] })), /filename/);
  }
  const root = await fixture(t);
  const path = join(root, 'apps/my-app/preview0.png');
  await writeFile(path, Buffer.from('0000001c6674797061766966000000006d696631617669666d696166', 'hex'));
  await assert.rejects(validateCatalog(root), /image format/);
});
test('requires PNG for other app images, even when not referenced', async t => {
  const root = await fixture(t);
  const path = join(root, 'apps/my-app/extra.webp');
  await writeFile(path, 'unused image');
  await assert.rejects(validateCatalog(root), /images must use PNG/);
  await rm(path);
  await writeFile(join(root, 'apps/my-app/detail.png'), 'not a PNG');
  await assert.rejects(validateCatalog(root), /image format/);
});
test('keeps Featured exclusively in a valid root list', async t => {
  await assert.rejects(validateCatalog(await fixture(t, { featured: false })), /featured/);
  const root = await fixture(t);
  for (const list of [['missing-app'], ['my-app', 'my-app'], {}]) {
    await writeFile(join(root, 'featured.json'), JSON.stringify(list));
    await assert.rejects(validateCatalog(root), /featured/);
  }
  await writeFile(join(root, 'featured.json'), '[]');
  assert.equal(await validateCatalog(root), 1);
});
test('rejects uppercase folder names and mismatched manifest IDs', async t => {
  await assert.rejects(validateCatalog(await fixture(t, {}, 'Bad-App')), /folder/);
  await assert.rejects(validateCatalog(await fixture(t, { id: 'different' })), /ID/);
});
test('rejects external previews and paths escaping the app directory', async t => {
  for (const name of ['https://example.com/preview0.png', '/tmp/preview0.png', '../preview0.png']) {
    await assert.rejects(validateCatalog(await fixture(t, { previews: [name] })), /filename/);
  }
});
test('rejects missing previews, missing authors, and invalid publication dates', async t => {
  await assert.rejects(validateCatalog(await fixture(t, { previews: ['preview1.png'] })), /preview1.png/);
  await assert.rejects(validateCatalog(await fixture(t, { author: '' })), /author/);
  await assert.rejects(validateCatalog(await fixture(t, { publishedAt: 'yesterday' })), /publishedAt/);
});

test('enforces Twitter weighted description length', async t => {
  assert.equal(await validateCatalog(await fixture(t, { description: 'a'.repeat(280) })), 1);
  await assert.rejects(validateCatalog(await fixture(t, { description: 'a'.repeat(281) })), /280/);
  await assert.rejects(validateCatalog(await fixture(t, { description: '😀'.repeat(141) })), /280/);
});

test('validates optional READMEs and requires referenced media to exist', async t => {
  const root = await fixture(t);
  const path = join(root, 'apps/my-app/README.md');
  await writeFile(path, 'A product overview.\n\n![App](preview0.png)');
  assert.equal(await validateCatalog(root), 1);
  await writeFile(path, '<video controls src="missing.mp4"></video>');
  await assert.rejects(validateCatalog(root), /missing.mp4/);
  await writeFile(path, '[Other](https://evil.test)');
  await assert.rejects(validateCatalog(root), /README/);
});

test('accepts the Native Shell platforms and rejects others', async t => {
  assert.equal(await validateCatalog(await fixture(t, { platforms: ['iOS', 'Android', 'macOS', 'Windows', 'Linux', 'Web'] })), 1);
  await assert.rejects(validateCatalog(await fixture(t, { platforms: ['ios'] })), /unknown platform/);
  await assert.rejects(validateCatalog(await fixture(t, { platforms: ['iOS', 'iOS'] })), /duplicate/);
  await assert.rejects(validateCatalog(await fixture(t, { platforms: [] })), /platforms/);
});

test('accepts the listed categories only', async t => {
  for (const category of ['dev', 'finance', 'work', 'media', 'utility']) {
    assert.equal(await validateCatalog(await fixture(t, { category })), 1);
  }
  await assert.rejects(validateCatalog(await fixture(t, { category: 'terminal' })), /category/);
});
