// ─────────────────────────────────────────────────────────────────────────────
// CF GitHub Pusher — popup.js
// Handles settings save/load and PAT show/hide toggle
// ─────────────────────────────────────────────────────────────────────────────

const tokenInput  = document.getElementById('githubToken');
const repoInput   = document.getElementById('githubRepo');
const handleInput = document.getElementById('cfHandle');
const saveBtn     = document.getElementById('saveBtn');
const saveBtnText = document.getElementById('save-btn-text');
const statusMsg   = document.getElementById('statusMsg');
const toggleBtn   = document.getElementById('toggleToken');

// ── Load saved settings ─────────────────────────────────────────────────────
chrome.storage.local.get(['githubToken', 'githubRepo', 'cfHandle'], (result) => {
  if (result.githubToken) tokenInput.value  = result.githubToken;
  if (result.githubRepo)  repoInput.value   = result.githubRepo;
  if (result.cfHandle)    handleInput.value = result.cfHandle;
});

// ── Toggle PAT visibility ───────────────────────────────────────────────────
toggleBtn.addEventListener('click', () => {
  const isHidden = tokenInput.type === 'password';
  tokenInput.type = isHidden ? 'text' : 'password';
  const icon = document.getElementById('eye-icon');
  // Strikethrough eye icon when visible
  if (isHidden) {
    icon.innerHTML = `
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    `;
  } else {
    icon.innerHTML = `
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    `;
  }
});

// ── Save settings ───────────────────────────────────────────────────────────
saveBtn.addEventListener('click', () => {
  const token  = tokenInput.value.trim();
  const repo   = repoInput.value.trim();
  const handle = handleInput.value.trim();

  // Validation
  if (!token) {
    showStatus('⚠️ Please enter your GitHub Personal Access Token.', 'error');
    tokenInput.focus();
    return;
  }
  if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
    showStatus('⚠️ Token looks invalid. It should start with ghp_ or github_pat_', 'error');
    return;
  }
  if (!repo || !repo.includes('/')) {
    showStatus('⚠️ Repo should be in the format username/repo-name', 'error');
    repoInput.focus();
    return;
  }
  if (!handle) {
    showStatus('⚠️ CF handle is required to auto-fetch submissions.', 'error');
    handleInput.focus();
    return;
  }

  saveBtnText.textContent = 'Saving…';
  saveBtn.disabled = true;

  chrome.storage.local.set({ githubToken: token, githubRepo: repo, cfHandle: handle }, () => {
    saveBtn.disabled = false;
    saveBtnText.textContent = 'Save Settings';
    showStatus('✅ Settings saved! Head to a CF problem page and click "Push to GitHub".', 'success');
  });
});

// ── Test Connection ─────────────────────────────────────────────────────────
const testBtn     = document.getElementById('testBtn');
const testBtnText = document.getElementById('test-btn-text');

testBtn.addEventListener('click', () => {
  testBtnText.textContent = '⏳ Testing…';
  testBtn.disabled = true;

  chrome.runtime.sendMessage({ action: 'testConnection' }, (res) => {
    testBtn.disabled = false;
    testBtnText.textContent = '🔌 Test Connection';
    if (res && res.success) {
      showStatus(`✅ Connected! Repo: ${res.repoFullName} (${res.private ? 'private' : 'public'})`, 'success');
    } else {
      const status = res && res.status ? ` [HTTP ${res.status}]` : '';
      showStatus(`❌${status} ${res ? res.error : 'No response'}`, 'error');
    }
  });
});

// ── Helpers ─────────────────────────────────────────────────────────────────
function showStatus(msg, type) {
  statusMsg.textContent = msg;
  statusMsg.className = 'status-msg status-' + type;
  statusMsg.style.display = 'block';
  // Auto-hide success after 4 seconds
  if (type === 'success') {
    setTimeout(() => { statusMsg.style.display = 'none'; }, 5000);
  }
}
