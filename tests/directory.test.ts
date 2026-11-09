import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateDirectory } from '../scripts/validate.ts';

async function fixture(t, overrides = {}, id = 'secure-storage') {
  const root = await mkdtemp(join(tmpdir(), 'directory-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const folder = join(root, 'directory', id);
  await mkdir(folder, { recursive: true });
  const item = { id, name: 'Secure Storage', author: 'Someone', category: 'library',
    description: 'Keychain and Keystore storage for NSH apps.', source: 'https://github.com/someone/secure-storage',
    publishedAt: '2026-11-09T00:00:00Z', ...overrides };
  await writeFile(join(folder, 'manifest.json'), JSON.stringify(item));
  await writeFile(join(root, 'directory', 'README.md'), '# Directory');
  return root;
}

test('accepts a minimal entry and a missing directory folder', async t => {
  assert.equal(await validateDirectory(await fixture(t)), 1);
  const empty = await mkdtemp(join(tmpdir(), 'directory-empty-'));
  t.after(() => rm(empty, { recursive: true, force: true }));
  assert.equal(await validateDirectory(empty), 0);
});
test('accepts every category and optional platforms and website', async t => {
  for (const category of ['library', 'component', 'template', 'tool']) {
    assert.equal(await validateDirectory(await fixture(t, { category })), 1);
  }
  assert.equal(await validateDirectory(await fixture(t, { platforms: ['iOS', 'Android'], website: 'https://example.com' })), 1);
});
test('rejects invalid categories, platforms and unknown fields', async t => {
  await assert.rejects(validateDirectory(await fixture(t, { category: 'app' })), /category/);
  await assert.rejects(validateDirectory(await fixture(t, { platforms: ['ios'] })), /unknown platform/);
  await assert.rejects(validateDirectory(await fixture(t, { platforms: [] })), /platforms/);
  await assert.rejects(validateDirectory(await fixture(t, { featured: true })), /unknown field/);
});
test('requires an https source, matching ID, author and publication date', async t => {
  await assert.rejects(validateDirectory(await fixture(t, { source: null })), /source/);
  await assert.rejects(validateDirectory(await fixture(t, { source: 'http://github.com/a/b' })), /source/);
  await assert.rejects(validateDirectory(await fixture(t, { id: 'other' })), /ID/);
  await assert.rejects(validateDirectory(await fixture(t, { author: '' })), /author/);
  await assert.rejects(validateDirectory(await fixture(t, { publishedAt: 'today' })), /publishedAt/);
  await assert.rejects(validateDirectory(await fixture(t, {}, 'Bad_Id')), /folder/);
});
test('allows only the manifest in an entry folder and limits descriptions', async t => {
  const root = await fixture(t);
  await writeFile(join(root, 'directory/secure-storage/logo.png'), 'x');
  await assert.rejects(validateDirectory(root), /only manifest.json/);
  await assert.rejects(validateDirectory(await fixture(t, { description: 'a'.repeat(281) })), /280/);
});
