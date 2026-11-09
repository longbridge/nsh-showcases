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

/** Directory entry categories, in the order the website lists them. */
export const DIRECTORY_CATEGORIES = ['library', 'component', 'template', 'tool'];

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isText = value => typeof value === 'string' && value.trim().length > 0;
const isDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));

/**
 * Validates `directory/<id>/manifest.json`: community libraries, components,
 * templates and tools for Native Shell. The folder is optional; returns the
 * number of entries.
 */
export async function validateDirectory(root) {
  let entries;
  try { entries = await readdir(join(root, 'directory'), { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return 0; throw error; }
  let count = 0;
  for (const entry of entries) {
    const id = entry.name;
    if (id === 'README.md' && entry.isFile()) continue;
    assert(entry.isDirectory() && ID.test(id), `Invalid directory folder: ${id}`);
    const files = await readdir(join(root, 'directory', id));
    assert.deepEqual(files, ['manifest.json'], `directory/${id}: only manifest.json is allowed`);
    const item = JSON.parse(await readFile(join(root, 'directory', id, 'manifest.json'), 'utf8'));
    const allowed = ['id', 'name', 'author', 'description', 'category', 'platforms', 'source', 'website', 'publishedAt', 'stars', 'starsUpdatedAt'];
    for (const key of Object.keys(item)) assert(allowed.includes(key), `directory/${id}: unknown field ${key}`);
    assert.equal(item.id, id, `directory/${id}: manifest ID must match its folder`);
    assert(isText(item.name) && isText(item.author), `directory/${id}: name and author are required`);
    assert(DIRECTORY_CATEGORIES.includes(item.category), `directory/${id}: invalid category; use ${DIRECTORY_CATEGORIES.join(', ')}`);
    assert(isText(item.description), `directory/${id}: English description required`);
    assert(twitterText.parseTweet(item.description).weightedLength <= 280, `directory/${id}: description exceeds 280 weighted characters`);
    if (item.platforms !== undefined) {
      assert(Array.isArray(item.platforms) && item.platforms.length, `directory/${id}: platforms must be a nonempty list when present`);
      for (const platform of item.platforms) assert(PLATFORMS.includes(platform), `directory/${id}: unknown platform ${platform}; use ${PLATFORMS.join(', ')}`);
      assert.equal(new Set(item.platforms).size, item.platforms.length, `directory/${id}: duplicate platforms`);
    }
    assert(isText(item.source) && new URL(item.source).protocol === 'https:', `directory/${id}: a public https source repository is required`);
    if (item.website != null) assert(new URL(item.website).protocol === 'https:', `directory/${id}: invalid website URL`);
    assert(isDate(item.publishedAt), `directory/${id}: publishedAt must be an ISO 8601 timestamp with timezone`);
    assert(item.stars == null || (Number.isInteger(item.stars) && item.stars >= 0), `directory/${id}: invalid stars`);
    assert(item.starsUpdatedAt == null || isDate(item.starsUpdatedAt), `directory/${id}: invalid starsUpdatedAt`);
    count++;
  }
  return count;
}

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
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  console.log(`Validated ${await validateCatalog(root)} app manifests and screenshots`);
  console.log(`Validated ${await validateDirectory(root)} directory entries`);
}
