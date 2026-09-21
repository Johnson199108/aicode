const fs = require('fs');
const path = require('path');
const { SOURCES } = require('./scanner');

const CUSTOM_ROOT = SOURCES.find(s => s.key === 'custom').root;

function readSkillFile(skillPath, relPath) {
  const full = path.join(skillPath, relPath || 'SKILL.md');
  return fs.readFileSync(full, 'utf8');
}

function writeSkillFile(skillPath, relPath, content) {
  const full = path.join(skillPath, relPath || 'SKILL.md');
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}

function createSkill(name, description) {
  const skillDir = path.join(CUSTOM_ROOT, name);
  if (fs.existsSync(skillDir)) throw new Error('skill 已存在: ' + name);
  fs.mkdirSync(skillDir, { recursive: true });
  const content = `---\nname: "${name}"\ndescription: "${description}"\n---\n\n# ${name}\n\nTODO: 在此添加 skill 内容。\n`;
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content, 'utf8');
  return skillDir;
}

module.exports = { readSkillFile, writeSkillFile, createSkill, CUSTOM_ROOT };
