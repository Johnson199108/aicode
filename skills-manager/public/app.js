const $ = (s) => document.querySelector(s);

let currentSkill = null;
let currentFile = 'SKILL.md';
let allSkills = [];

async function api(url, opts) {
  const r = await fetch(url, opts);
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function loadSkills() {
  allSkills = await api('/api/skills');
  renderList(allSkills);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function renderList(skills) {
  const list = $('#skillList');
  const grouped = {};
  for (const s of skills) {
    if (!grouped[s.sourceLabel]) grouped[s.sourceLabel] = [];
    grouped[s.sourceLabel].push(s);
  }
  list.innerHTML = '';
  for (const [label, items] of Object.entries(grouped)) {
    const group = document.createElement('div');
    group.className = 'group';
    group.innerHTML = `<div class="group-title">${label} <span class="count">${items.length}</span></div>`;
    for (const s of items) {
      const el = document.createElement('div');
      el.className = 'skill-item' + (currentSkill && currentSkill.id === s.id ? ' active' : '');
      el.innerHTML = `
        <div class="skill-item-name">${escapeHtml(s.name)}${s.writable ? '' : ' <span class="ro">只读</span>'}</div>
        <div class="skill-item-desc">${escapeHtml(s.description || s.preview || '')}</div>`;
      el.onclick = () => selectSkill(s);
      group.appendChild(el);
    }
    list.appendChild(group);
  }
}

async function selectSkill(skill) {
  currentSkill = skill;
  currentFile = 'SKILL.md';
  $('#emptyState').hidden = true;
  $('#skillDetail').hidden = false;
  $('#skillName').textContent = skill.name;
  $('#skillDesc').textContent = skill.description || '(无描述)';
  $('#skillSource').textContent = skill.sourceLabel;
  $('#skillSource').className = 'tag tag-' + skill.source;
  $('#skillWritable').textContent = skill.writable ? '可编辑' : '只读';
  $('#skillWritable').className = 'tag ' + (skill.writable ? 'tag-ok' : 'tag-ro');
  $('#skillPath').textContent = skill.path;
  $('#btnSave').disabled = !skill.writable;
  const sel = $('#fileSelect');
  sel.innerHTML = '';
  for (const f of skill.files) {
    const opt = document.createElement('option');
    opt.value = f; opt.textContent = f;
    sel.appendChild(opt);
  }
  sel.value = 'SKILL.md';
  await loadFile('SKILL.md');
  renderList(allSkills);
}

async function loadFile(rel) {
  currentFile = rel;
  const data = await api('/api/skill/file?id=' + encodeURIComponent(currentSkill.id) + '&path=' + encodeURIComponent(rel));
  $('#editor').value = data.content;
  $('#editor').readOnly = !currentSkill.writable;
  if (!$('#preview').hidden) renderPreview();
}

function renderPreview() {
  $('#preview').innerHTML = marked.parse($('#editor').value || '');
}

$('#fileSelect').onchange = (e) => loadFile(e.target.value);
$('#editor').addEventListener('input', () => {
  if (currentSkill && currentSkill.writable) $('#btnSave').disabled = false;
  if (!$('#preview').hidden) renderPreview();
});

$('#btnSave').onclick = async () => {
  if (!currentSkill || !currentSkill.writable) return;
  try {
    await api('/api/skill/file?id=' + encodeURIComponent(currentSkill.id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: currentFile, content: $('#editor').value }),
    });
    await loadSkills();
    flash('已保存');
  } catch (e) { alert(e.message); }
};

$('#btnPreview').onclick = () => {
  const p = $('#preview');
  p.hidden = !p.hidden;
  $('#editor').hidden = !p.hidden;
  $('#btnPreview').textContent = p.hidden ? '预览' : '编辑';
  if (!p.hidden) renderPreview();
};

$('#btnNewSkill').onclick = () => openModal('新建 Skill', `
  <label>Skill 名称<input id="newName" type="text" placeholder="my-skill" /></label>
  <label>描述<input id="newDesc" type="text" placeholder="一句话描述" /></label>
`, async () => {
  const name = $('#newName').value.trim();
  const desc = $('#newDesc').value.trim();
  if (!name) return alert('请输入名称');
  try {
    await api('/api/skill', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name, description: desc }) });
    await loadSkills();
    closeModal();
    flash('已创建 ' + name);
  } catch (e) { alert(e.message); }
});

async function refreshGit() {
  try {
    const s = await api('/api/git/status');
    const el = $('#gitStatus');
    if (!s.initialized) {
      el.textContent = '未初始化 git';
      el.className = 'git-badge warn';
    } else {
      const dirty = s.changed.length;
      el.textContent = `${s.branch || '?'} · ${dirty ? dirty + ' 处改动' : '干净'}${s.remote ? '' : ' · 无远程'}`;
      el.className = 'git-badge ' + (dirty ? 'warn' : 'ok');
    }
  } catch (e) {
    $('#gitStatus').textContent = 'git 状态异常';
  }
}

$('#btnRefresh').onclick = async () => { await loadSkills(); await refreshGit(); flash('已刷新'); };

$('#btnCommit').onclick = () => {
  openModal('提交更改', `<label>提交信息<input id="commitMsg" type="text" value="Update skills" /></label>`, async () => {
    const msg = $('#commitMsg').value.trim() || 'Update skills';
    try {
      await api('/api/git/commit', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: msg }) });
      await refreshGit();
      closeModal();
      flash('已提交');
    } catch (e) { alert(e.message); }
  });
};

$('#btnPush').onclick = async () => {
  try { await api('/api/git/push', { method:'POST' }); await refreshGit(); flash('已推送'); }
  catch (e) { alert('推送失败: ' + e.message + '\n\n若首次推送，请先点击「提交」。'); }
};

function openModal(title, bodyHtml, onOk) {
  $('#modalTitle').textContent = title;
  $('#modalBody').innerHTML = bodyHtml;
  $('#modal').hidden = false;
  $('#modalOk').onclick = onOk;
  $('#modalCancel').onclick = closeModal;
}
function closeModal() { $('#modal').hidden = true; }

function flash(msg) {
  const f = document.createElement('div');
  f.className = 'toast';
  f.textContent = msg;
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 1600);
}

$('#search').addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  renderList(allSkills.filter(s => s.name.toLowerCase().includes(q) || (s.description||'').toLowerCase().includes(q)));
});

loadSkills().catch(e => alert(e.message));
refreshGit();
