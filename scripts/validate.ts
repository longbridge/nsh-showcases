import assert from 'node:assert/strict';
import twitterText from 'twitter-text';
import { validateReadme } from './readme.ts';
import { readdir, readFile, realpath } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Category IDs, in the order the website lists them. */
export const CATEGORIES = ['dev', 'finance', 'work', 'media', 'utility'];

/** The platforms Native Shell apps run on, spelled as manifests write them. */
export const PLATFORMS = ['iOS', 'Android', 'macOS', 'Windows', 'Linux', 'Web'];

export async function validateCatalog(root) {
  const ids = [];
  const text = value => typeof value === 'string' && value.trim().length > 0;
  const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
  for (const entry of await readdir(join(root, 'apps'), { withFileTypes: true })) {
    const id = entry.name;
    assert(entry.isDirectory() && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id), `Invalid app folder: ${id}`);
    const folder = join(root, 'apps', id);
    for (const name of await readdir(folder)) {
      assert(!/\.(jpe?g|webp|avif|gif|svg|bmp|tiff?|ico|heic|heif|apng)$/i.test(name), `${id}: images must use PNG: ${name}`);
      if (/\.png$/i.test(name)) {
        const path = await realpath(join(folder, name));
        assert.equal(dirname(path), await realpath(folder), `${id}: image outside app folder`);
        const bytes = await readFile(path);
        assert(bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')), `${id}: incorrect image format for ${name}`);
      }
    }
    const app = JSON.parse(await readFile(join(folder, 'manifest.json'), 'utf8'));
    assert.equal(app.id, id, `${id}: manifest ID must match its folder`);
    assert(text(app.author), `${id}: author is required`);
    assert(text(app.name) && CATEGORIES.includes(app.category), `${id}: invalid name or category`);
    assert(Array.isArray(app.platforms) && app.platforms.length, `${id}: missing platforms`);
    for (const platform of app.platforms) assert(PLATFORMS.includes(platform), `${id}: unknown platform ${platform}; use ${PLATFORMS.join(', ')}`);
    assert.equal(new Set(app.platforms).size, app.platforms.length, `${id}: duplicate platforms`);
    assert(text(app.description), `${id}: English description required`);
    assert(twitterText.parseTweet(app.description).weightedLength <= 280, `${id}: description exceeds 280 weighted characters`);
    assert(app.website || app.source, `${id}: project link required`);
    for (const link of [app.website, app.source]) {
      if (link != null) assert(['http:', 'https:'].includes(new URL(link).protocol), `${id}: invalid project URL`);
    }
    assert(!Object.hasOwn(app, 'featured'), `${id}: featured belongs in root featured.json, not the manifest`);
    assert(app.building === undefined || typeof app.building === 'boolean', `${id}: invalid building`);
    assert(date(app.publishedAt), `${id}: publishedAt must be an ISO 8601 timestamp with timezone`);
    assert(app.stars == null || (Number.isInteger(app.stars) && app.stars >= 0), `${id}: invalid stars`);
    assert(app.starsUpdatedAt == null || date(app.starsUpdatedAt), `${id}: invalid starsUpdatedAt`);
    assert(Array.isArray(app.previews) && app.previews.length, `${id}: preview required`);
    for (const name of app.previews) {
      assert(typeof name === 'string' && /^preview\d*\.png$/i.test(name), `${id}: invalid preview filename`);
      const path = await realpath(join(folder, name));
      assert.equal(dirname(path), await realpath(folder), `${id}: preview outside app folder`);
      const data = await readFile(path);
      const valid = data.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
      assert(valid, `${id}: incorrect image format for ${name}`);
    }
    let readme;
    try { readme = await readFile(join(folder, 'README.md'), 'utf8'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (readme !== undefined) {
      const path = await realpath(join(folder, 'README.md'));
      assert.equal(dirname(path), await realpath(folder), id + ': README must stay in the app folder');
      for (const name of validateReadme(readme, app)) {
        const media = await realpath(join(folder, name));
        assert.equal(dirname(media), await realpath(folder), id + ': media must stay in the app folder');
        const bytes = await readFile(media);
        assert(bytes.length, id + ': empty media file ' + name);
      }
    }
    ids.push(id);
  }
  assert(ids.length, 'The catalog must not be empty');
  const featured = JSON.parse(await readFile(join(root, 'featured.json'), 'utf8'));
  assert(Array.isArray(featured) && new Set(featured).size === featured.length && featured.every(id => ids.includes(id)), 'Invalid featured.json');
  return ids.length;
}

if (import.meta.main) {
  console.log(`Validated ${await validateCatalog(join(dirname(fileURLToPath(import.meta.url)), '..'))} app manifests and screenshots`);
}
