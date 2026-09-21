const express = require('express');
const path = require('path');
const { scanAllSkills, getSkillById } = require('./lib/scanner');
const skillService = require('./lib/skillService');
const gitService = require('./lib/gitService');

const app = express();
const PORT = process.env.PORT || 3210;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/skills', (req, res) => {
  try { res.json(scanAllSkills()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/skill', (req, res) => {
  const skill = getSkillById(req.query.id);
  if (!skill) return res.status(404).json({ error: 'Skill not found' });
  res.json(skill);
});

app.get('/api/skill/file', (req, res) => {
  const skill = getSkillById(req.query.id);
  if (!skill) return res.status(404).json({ error: 'Skill not found' });
  try {
    const rel = req.query.path || 'SKILL.md';
    const content = skillService.readSkillFile(skill.path, rel);
    res.json({ path: rel, content });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/skill/file', (req, res) => {
  const skill = getSkillById(req.query.id);
  if (!skill) return res.status(404).json({ error: 'Skill not found' });
  if (!skill.writable) return res.status(403).json({ error: '该 skill 只读，不可编辑' });
  const { path: relPath, content } = req.body;
  try {
    skillService.writeSkillFile(skill.path, relPath || 'SKILL.md', content);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/skill', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name 必填' });
  try {
    const skillDir = skillService.createSkill(name, description || '');
    res.json({ ok: true, path: skillDir });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/git/status', async (req, res) => {
  try { res.json(await gitService.getStatus()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/git/init', async (req, res) => {
  try { res.json(await gitService.initRepo(req.body.remoteUrl)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/git/commit', async (req, res) => {
  try { res.json(await gitService.commitAll(req.body.message)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/git/push', async (req, res) => {
  try { res.json(await gitService.push()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => {
  console.log(`\n  Skills Manager 已启动: http://localhost:${PORT}\n`);
});
