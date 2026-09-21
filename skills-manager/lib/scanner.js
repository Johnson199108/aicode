const fs = require('fs');
const path = require('path');
const os = require('os');

const TRAE_DIR = path.join(os.homedir(), '.trae-cn');

const SOURCES = [
  { key: 'custom', label: '自定义', root: path.join(TRAE_DIR, 'skills'), writable: true },
  { key: 'plugin', label: '插件', root: path.join(TRAE_DIR, 'plugins'), writable: false },
  { key: 'builtin', label: '内置', root: path.join(TRAE_DIR, 'builtin'), writable: false },
];

function findSkillDirs(root, maxDepth = 6) {
  const results = [];
  function walk(dir, depth) {
    if (depth > maxDepth) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch { return; }
    if (entries.some(e => e.isFile() && e.name === 'SKILL.md')) {
      results.push(dir);
      return;
    }
    for (const e of entries) {
      if (e.isDirectory() && !e.name.startsWith('.')) {
        walk(path.join(dir, e.name), depth + 1);
      }
    }
  }
  walk(root, 0);
  return results;
}

function parseFrontmatter(raw) {
  const fm = { name: '', description: '' };
  let body = raw;
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (m) {
    const block = m[1];
    body = m[2] || '';
    const nm = block.match(/^name:\s*"?(.*?)"?\s*$/m);
    const dm = block.match(/^description:\s*"?(.*?)"?\s*$/m);
    if (nm) fm.name = nm[1];
    if (dm) fm.description = dm[1];
  }
  return { frontmatter: fm, body };
}

function listFiles(dir, base = dir) {
  const out = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return out; }
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(full, base));
    else out.push(path.relative(base, full));
  }
  return out;
}

function parseSkill(skillDir, source) {
  const skillMdPath = path.join(skillDir, 'SKILL.md');
  let raw = '';
  try { raw = fs.readFileSync(skillMdPath, 'utf8'); } catch {}
  const { frontmatter, body } = parseFrontmatter(raw);
  const relPath = path.relative(source.root, skillDir);
  const folderName = path.basename(skillDir);
  return {
    id: `${source.key}:${relPath}`,
    name: frontmatter.name || folderName,
    description: frontmatter.description || '',
    source: source.key,
    sourceLabel: source.label,
    writable: source.writable,
    path: skillDir,
    folderName,
    files: listFiles(skillDir),
    preview: body.replace(/^#+\s.*$/m, '').trim().slice(0, 160),
  };
}

function scanAllSkills() {
  const all = [];
  for (const source of SOURCES) {
    if (!fs.existsSync(source.root)) continue;
    for (const d of findSkillDirs(source.root)) {
      try { all.push(parseSkill(d, source)); } catch {}
    }
  }
  return all;
}

function getSkillById(id) {
  const idx = id.indexOf(':');
  if (idx < 0) return null;
  const sourceKey = id.slice(0, idx);
  const relPath = id.slice(idx + 1);
  const source = SOURCES.find(s => s.key === sourceKey);
  if (!source) return null;
  const skillDir = path.join(source.root, relPath);
  if (!fs.existsSync(path.join(skillDir, 'SKILL.md'))) return null;
  return parseSkill(skillDir, source);
}

module.exports = { scanAllSkills, getSkillById, SOURCES, TRAE_DIR };
