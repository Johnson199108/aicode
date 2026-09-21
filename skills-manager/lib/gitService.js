const simpleGit = require('simple-git');
const path = require('path');
const os = require('os');

const CUSTOM_SKILLS_DIR = path.join(os.homedir(), '.trae-cn', 'skills');

function git() {
  return simpleGit(CUSTOM_SKILLS_DIR);
}

async function getStatus() {
  const g = git();
  const isRepo = await g.checkIsRepo().catch(() => false);
  if (!isRepo) {
    return { initialized: false, remote: null, branch: null, changed: [], clean: true };
  }
  const status = await g.status();
  let remote = null;
  const remotes = await g.getRemotes(true).catch(() => []);
  if (remotes.length) remote = remotes[0].refs.fetch || remotes[0].refs.push || null;
  return {
    initialized: true,
    branch: status.current,
    changed: status.files.map(f => ({ path: f.path, status: f.status })),
    clean: status.isClean(),
    remote,
    ahead: status.ahead,
    behind: status.behind,
  };
}

async function initRepo(remoteUrl) {
  const g = git();
  const isRepo = await g.checkIsRepo().catch(() => false);
  if (!isRepo) {
    await g.init();
  }
  if (remoteUrl) {
    const remotes = await g.getRemotes(true).catch(() => []);
    if (remotes.find(r => r.name === 'origin')) {
      await g.removeRemote('origin').catch(() => {});
    }
    await g.addRemote('origin', remoteUrl);
  }
  return getStatus();
}

async function commitAll(message) {
  const g = git();
  await g.add('.');
  const status = await g.status();
  if (status.isClean()) throw new Error('没有可提交的更改');
  await g.commit(message || 'Update skills');
  await g.raw(['branch', '-M', 'main']).catch(() => {});
  return getStatus();
}

async function push() {
  const g = git();
  const status = await g.status();
  const branch = status.current || 'main';
  await g.raw(['push', '-u', 'origin', branch]);
  return getStatus();
}

module.exports = { getStatus, initRepo, commitAll, push, CUSTOM_SKILLS_DIR };
