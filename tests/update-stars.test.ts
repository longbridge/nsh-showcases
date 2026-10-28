import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, readFile, writeFile, stat, utimes, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { refreshStars, updateCatalogStars } from '../scripts/update-stars.ts';

test('fetches GitHub counts including zero and timestamps successful updates', async () => {
  const apps = [{ id: 'one', source: 'https://github.com/owner/project', stars: 20 }];
  const request = async url => {
    assert.equal(url, 'https://api.github.com/repos/owner/project');
    return { ok: true, json: async () => ({ stargazers_count: 0 }) };
  };
  await refreshStars(apps, { request, now: '2026-09-05T00:00:00Z', warn: () => {} });
  assert.equal(apps[0].stars, 0);
  assert.equal(apps[0].starsUpdatedAt, '2026-09-05T00:00:00Z');
});

test('retains prior data on API failure and leaves non-GitHub apps unknown', async () => {
  const apps = [
    { id: 'cached', source: 'https://github.com/owner/cached', stars: 42, starsUpdatedAt: '2026-01-01T00:00:00Z' },
    { id: 'unknown', source: 'https://github.com/owner/unknown' },
    { id: 'other', source: 'https://git.example.com/owner/project' },
    { id: 'commercial', source: null },
  ];
  let calls = 0;
  await refreshStars(apps, { request: async () => { calls++; return { ok: false, status: 403 }; }, warn: () => {} });
  assert.equal(calls, 2);
  assert.equal(apps[0].stars, 42);
  assert.equal(apps[0].starsUpdatedAt, '2026-01-01T00:00:00Z');
  assert.equal(apps[1].stars, undefined);
  assert.equal(apps[2].stars, undefined);
  assert.equal(apps[3].stars, undefined);
});

test('preserves the timestamp when the count is unchanged, including zero', async () => {
  const apps = [0, 42].map(stars => ({ source: 'https://github.com/owner/project', stars, starsUpdatedAt: '2026-01-01T00:00:00Z' }));
  for (const app of apps) {
    const before = structuredClone(app);
    await refreshStars([app], { request: async () => ({ ok: true, json: async () => ({ stargazers_count: app.stars }) }) });
    assert.deepEqual(app, before);
  }
});

test('writes only changed manifests and leaves repeated refreshes untouched', async t => {
  const root = await mkdtemp(join(tmpdir(), 'stars-files-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const entries = { unchanged: 7, changed: 3, initial: null, failed: 2, commercial: null };
  const originals = new Map();
  for (const [id, stars] of Object.entries(entries)) {
    const folder = join(root, 'apps', id);
    await mkdir(folder, { recursive: true });
    const path = join(folder, 'manifest.json');
    // Nonstandard whitespace proves untouched files are not reformatted.
    const content = JSON.stringify({ id, source: id === 'commercial' ? null : `https://github.com/owner/${id}`, stars, starsUpdatedAt: null });
    await writeFile(path, content);
    await utimes(path, 100, 100);
    originals.set(id, { content, mtime: (await stat(path)).mtimeMs });
  }
  const options = { now: '2026-09-05T00:00:00Z', warn: () => {}, request: async url => ({
    ok: !url.endsWith('/failed'), status: 503,
    json: async () => ({ stargazers_count: url.endsWith('/initial') ? 0 : 7 }),
  }) };
  assert.equal(await updateCatalogStars(root, options), 2);
  for (const id of ['unchanged', 'failed', 'commercial']) {
    const path = join(root, 'apps', id, 'manifest.json');
    assert.equal(await readFile(path, 'utf8'), originals.get(id).content);
    assert.equal((await stat(path)).mtimeMs, originals.get(id).mtime);
  }
  const changedPath = join(root, 'apps/changed/manifest.json');
  const changed = JSON.parse(await readFile(changedPath, 'utf8'));
  assert.equal(changed.stars, 7);
  assert.equal(changed.starsUpdatedAt, options.now);
  const mtime = (await stat(changedPath)).mtimeMs;
  assert.equal(await updateCatalogStars(root, { ...options, now: '2026-09-12T00:00:00Z' }), 0);
  assert.equal((await stat(changedPath)).mtimeMs, mtime);
});
