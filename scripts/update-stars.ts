import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function refreshStars(apps, { request = fetch, now = new Date().toISOString(), warn = console.warn } = {}) {
  const headers = { Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  for (let index = 0; index < apps.length; index += 6) {
    await Promise.all(apps.slice(index, index + 6).map(async app => {
      if (!app.source) return;
      const url = new URL(app.source);
      const parts = url.pathname.replace(/\.git\/?$/, '').split('/').filter(Boolean);
      if (url.hostname !== 'github.com' || parts.length !== 2) return;
      try {
        const response = await request(`https://api.github.com/repos/${parts.map(encodeURIComponent).join('/')}`, { headers, signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!Number.isInteger(data.stargazers_count) || data.stargazers_count < 0) throw new Error('Invalid star count');
        if (app.stars !== data.stargazers_count) {
          app.stars = data.stargazers_count;
          app.starsUpdatedAt = now;
        }
      } catch (error) { warn(`[stars] Keeping previous data for ${app.id}: ${error.message}`); }
    }));
  }
  return apps;
}

export async function updateCatalogStars(root: string, options = {}) {
  const paths = (await readdir(join(root, 'apps'))).sort().map(id => join(root, 'apps', id, 'manifest.json'));
  const apps = await Promise.all(paths.map(async path => JSON.parse(await readFile(path, 'utf8'))));
  const before = apps.map(app => JSON.stringify(app));
  await refreshStars(apps, options);
  let updated = 0;
  for (let index = 0; index < paths.length; index++) {
    if (JSON.stringify(apps[index]) === before[index]) continue;
    await writeFile(paths[index], `${JSON.stringify(apps[index], null, 2)}\n`);
    updated++;
  }
  return updated;
}

if (import.meta.main) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  console.log(`Updated GitHub Stars in ${await updateCatalogStars(root)} manifests`);
}
