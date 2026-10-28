import assert from 'node:assert/strict';
import { marked } from 'marked';
import he from 'he';
import { parseFragment, serialize } from 'parse5';

export const MAX_README_BYTES = 10 * 1024;
const mediaPattern = /^[a-z0-9]+(?:[._-][a-z0-9]+)*\.(png|mp4|webm)$/;
const attributes = {
  img: new Set(['src', 'alt', 'width', 'height', 'loading']),
  video: new Set(['src', 'poster', 'controls', 'muted', 'loop', 'preload', 'width', 'height', 'playsinline']),
  source: new Set(['src', 'type']),
};
function normalize(link) {
  const url = new URL(he.decode(link));
  assert(['http:', 'https:'].includes(url.protocol), 'Unsupported URL protocol');
  return url.href.replace(/\/$/, '');
}
function mediaHtml(html, checkMedia, base) {
  const tree = parseFragment(html);
  function visit(node) {
    if (node.nodeName === '#text') return;
    if (node.nodeName !== '#document-fragment') {
      assert(attributes[node.tagName], 'Only img, video and source HTML is allowed');
      for (const attr of node.attrs) {
        assert(attributes[node.tagName].has(attr.name), `Forbidden HTML attribute: ${attr.name}`);
        if (attr.name === 'src' || attr.name === 'poster') {
          checkMedia(attr.value, node.tagName === 'img' || attr.name === 'poster' ? 'image' : 'video');
          if (base) attr.value = `${base}/${attr.value}`;
        }
      }
      if (node.tagName === 'img' || node.tagName === 'source') assert(node.attrs.some(a => a.name === 'src'), 'Media src is required');
      if (node.tagName === 'video') assert(node.attrs.some(a => a.name === 'controls'), 'Videos must provide controls');
    }
    for (const child of node.childNodes ?? []) visit(child);
  }
  visit(tree);
  return serialize(tree);
}

/** Returns the local media filenames that the catalog validator must check. */
export function validateReadme(markdown, app) {
  const fail = message => { throw new Error(`${app.id}: README ${message}`); };
  if (Buffer.byteLength(markdown, 'utf8') > MAX_README_BYTES) fail('exceeds 10 KB (10,240 UTF-8 bytes)');
  const allowed = new Set();
  if (app.website) allowed.add(normalize(app.website));
  if (app.source && new URL(app.source).hostname === 'github.com') allowed.add(normalize(app.source));
  function checkLink(link) {
    try {
      if (!allowed.has(normalize(link))) fail('links must target the exact app website or GitHub repository');
      if (/\.(sh|bash|zsh|ps1|exe|msi|dmg|pkg|deb|rpm|appimage|zip|tar|gz)(?:[?#]|$)/i.test(link)) fail('installer links are forbidden');
    } catch { fail(`disallowed link: ${link}`); }
  }
  const media = new Set();
  function checkMedia(name, kind = 'image') {
    if (!mediaPattern.test(name)) fail(`media must use a local filename: ${name}`);
    if (kind === 'image' && !/\.png$/.test(name)) fail(`image expected: ${name}`);
    if (kind === 'video' && !/\.(mp4|webm)$/.test(name)) fail(`video expected: ${name}`);
    media.add(name);
  }
  const decoded = he.decode(markdown);
  const tokens = marked.lexer(decoded, { gfm: true });
  // Unused reference definitions must obey the same policy; image references may be local.
  for (const definition of Object.values(tokens.links)) {
    if (!mediaPattern.test(definition.href)) checkLink(definition.href);
  }
  marked.walkTokens(tokens, token => {
    if (token.type === 'link') checkLink(token.href);
    if (token.type === 'image') checkMedia(token.href);
    if (token.type === 'code') fail('code blocks and shell scripts are forbidden');
    if (token.type === 'html') {
      try { mediaHtml(token.text, checkMedia); }
      catch (error) { fail(error.message); }
    }
  });
  for (const match of decoded.matchAll(/\b(?:[a-z][a-z0-9+.-]*:\/\/|mailto:|javascript:|data:)[^\s<>\])"']+/gi)) {
    checkLink(match[0].replace(/[.,;!]+$/, ''));
  }
  const commands = /(?:^|[\s`;$|])(?:curl|wget|bash|sh|zsh|fish|powershell|pwsh)\s+\S|\b(?:brew|cargo|npm|pnpm|yarn|bun|pip3?|apt(?:-get)?|dnf|yum|scoop|winget)\s+(?:install|add|dlx|exec|x)\b|\b(?:pacman|yay|paru)\s+-[A-Za-z]*S|#!\s*\/|\bsudo\s+|\b(?:chmod|chown)\s+|\b(?:bash|sh|zsh)\s*$|\b(?:npx|bunx)\s+\S/im;
  if (commands.test(decoded)) fail('installation commands and shell scripts are forbidden');
  const setupCommands = /\bgit\s+(?:clone|submodule)\b|\b(?:make|cmake|ninja)\s+(?:--install|install)\b|(?:^|[\s`])\.\/[\w./-]+|(?:^|\n|`)\s*(?:\$\s*)?(?:cd|echo|printf|export|eval|exec)\s+\S|\$\(/m;
  if (setupCommands.test(decoded)) fail('installation commands and shell scripts are forbidden');
  return [...media];
}

export function renderReadme(markdown, app, mediaBase) {
  validateReadme(markdown, app);
  const tokens = marked.lexer(he.decode(markdown), { gfm: true });
  marked.walkTokens(tokens, token => {
    if (token.type === 'heading') token.depth = Math.min(token.depth + 1, 6);
    if (token.type === 'image') token.href = `${mediaBase}/${token.href}`;
    if (token.type === 'html') token.text = mediaHtml(token.text, () => {}, mediaBase);
  });
  return marked.parser(tokens);
}
