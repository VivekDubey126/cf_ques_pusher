// ─────────────────────────────────────────────────────────────────────────────
// CF GitHub Pusher — content.js
// Injects a floating "Push to GitHub" button on Codeforces problem pages.
// On click, shows a rich modal to pick/create a concept folder and push.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  // ── Parse problem info from current URL ──────────────────────────────────
  function parseProblemFromURL() {
    const url = window.location.href;

    // /problemset/problem/1234/A
    let m = url.match(/codeforces\.com\/problemset\/problem\/(\d+)\/([A-Za-z0-9]+)/);
    if (m) return { contestId: m[1], problemIndex: m[2] };

    // /contest/1234/problem/A
    m = url.match(/codeforces\.com\/contest\/(\d+)\/problem\/([A-Za-z0-9]+)/);
    if (m) return { contestId: m[1], problemIndex: m[2] };

    // /gym/1234/problem/A
    m = url.match(/codeforces\.com\/gym\/(\d+)\/problem\/([A-Za-z0-9]+)/);
    if (m) return { contestId: m[1], problemIndex: m[2] };

    return null;
  }

  // ── Get problem title from page DOM ─────────────────────────────────────
  function getProblemTitle() {
    const h = document.querySelector('.problem-statement .title, .header .title');
    if (h) return h.textContent.trim();
    const h1 = document.querySelector('h1');
    if (h1) return h1.textContent.trim();
    return 'Unknown_Problem';
  }

  // ── Create and inject the floating push button ───────────────────────────
  function injectButton() {
    if (document.getElementById('cfg-push-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'cfg-push-btn';
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle;margin-right:6px">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57
          0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695
          -.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99
          .105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225
          -.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405
          c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225
          0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3
          0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
      </svg>
      Push to GitHub
    `;
    btn.className = 'cfg-push-btn';
    document.body.appendChild(btn);

    btn.addEventListener('click', () => openModal());
  }

  // ── Main modal ───────────────────────────────────────────────────────────
  async function openModal() {
    if (!isContextValid()) {
      alert('Extension was reloaded. Please refresh the page and try again.');
      return;
    }
    // Remove old modal if any
    const old = document.getElementById('cfg-modal-overlay');
    if (old) old.remove();

    const problemInfo = parseProblemFromURL();
    const problemTitle = getProblemTitle();

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'cfg-modal-overlay';
    overlay.innerHTML = `
      <div class="cfg-modal" id="cfg-modal">
        <div class="cfg-modal-header">
          <div class="cfg-modal-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57
                0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695
                -.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99
                .105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225
                -.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405
                c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225
                0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3
                0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </div>
          <div>
            <h2 class="cfg-modal-title">Push to GitHub</h2>
            <p class="cfg-modal-subtitle">Organize your CF solution by concept</p>
          </div>
          <button class="cfg-modal-close" id="cfg-close-btn" title="Close">✕</button>
        </div>

        <div class="cfg-modal-body">
          <!-- Problem info card -->
          <div class="cfg-problem-card">
            <div class="cfg-problem-badge" id="cfg-problem-badge">
              ${problemInfo ? problemInfo.contestId + problemInfo.problemIndex : '??'}
            </div>
            <div class="cfg-problem-info">
              <div class="cfg-problem-name" id="cfg-problem-name">${problemTitle}</div>
              <div class="cfg-problem-meta" id="cfg-problem-meta">Fetching submission info…</div>
            </div>
          </div>

          <!-- Concept folder mode -->
          <div class="cfg-section-label">Concept / Topic Folder</div>
          <div class="cfg-folder-mode">
            <label class="cfg-radio-label" id="cfg-radio-new-label">
              <input type="radio" name="folderMode" value="new" id="cfg-radio-new" checked>
              <span class="cfg-radio-custom"></span>
              <span>Create new folder</span>
            </label>
            <label class="cfg-radio-label" id="cfg-radio-existing-label">
              <input type="radio" name="folderMode" value="existing" id="cfg-radio-existing">
              <span class="cfg-radio-custom"></span>
              <span>Add to existing</span>
            </label>
            <label class="cfg-radio-label" id="cfg-radio-root-label">
              <input type="radio" name="folderMode" value="root" id="cfg-radio-root">
              <span class="cfg-radio-custom"></span>
              <span>No folder (repo root)</span>
            </label>
          </div>

          <!-- New folder input -->
          <div id="cfg-new-folder-section">
            <input type="text" id="cfg-new-folder-input" class="cfg-input"
              placeholder="e.g. digit-dp, diameter, bitmask-dp…"
              autocomplete="off" spellcheck="false"/>
            <div class="cfg-suggestions" id="cfg-suggestions"></div>
          </div>

          <!-- Existing folder dropdown -->
          <div id="cfg-existing-folder-section" style="display:none">
            <select id="cfg-folder-select" class="cfg-select">
              <option value="">Loading folders…</option>
            </select>
          </div>

          <!-- Commit message -->
          <div class="cfg-section-label" style="margin-top:14px">Commit Message <span style="font-weight:400;color:#8b949e">(optional)</span></div>
          <input type="text" id="cfg-commit-msg" class="cfg-input" placeholder="Auto-generated if empty"/>

          <!-- Status area -->
          <div id="cfg-status" class="cfg-status" style="display:none"></div>
        </div>

        <div class="cfg-modal-footer">
          <button class="cfg-btn-secondary" id="cfg-cancel-btn">Cancel</button>
          <button class="cfg-btn-primary" id="cfg-push-confirm-btn">
            <span id="cfg-push-btn-text">Push Solution</span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Close handlers
    document.getElementById('cfg-close-btn').onclick = () => overlay.remove();
    document.getElementById('cfg-cancel-btn').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    // ── Radio toggle ──
    const newSection = document.getElementById('cfg-new-folder-section');
    const existingSection = document.getElementById('cfg-existing-folder-section');

    document.querySelectorAll('input[name="folderMode"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const val = document.querySelector('input[name="folderMode"]:checked').value;
        newSection.style.display = val === 'new' ? 'block' : 'none';
        existingSection.style.display = val === 'existing' ? 'block' : 'none';
      });
    });

    // ── Load locally saved concept tags for autocomplete ──
    chrome.storage.local.get(['savedConcepts'], (stored) => {
      const select = document.getElementById('cfg-folder-select');
      const suggestions = document.getElementById('cfg-suggestions');
      const newInput = document.getElementById('cfg-new-folder-input');
      const concepts = stored.savedConcepts || [];

      if (concepts.length > 0) {
        select.innerHTML = concepts.map(f => `<option value="${f}">${f}</option>`).join('');
      } else {
        select.innerHTML = '<option value="">No saved concepts yet</option>';
      }

      // Autocomplete for new folder input from saved concepts
      newInput.addEventListener('input', () => {
        const val = newInput.value.toLowerCase();
        const matches = concepts.filter(f => f.toLowerCase().includes(val) && val.length > 0);
        suggestions.innerHTML = matches.map(f =>
          `<div class="cfg-suggestion-item" data-value="${f}">${f}</div>`
        ).join('');
        suggestions.style.display = matches.length ? 'block' : 'none';
      });

      suggestions.addEventListener('click', e => {
        const item = e.target.closest('.cfg-suggestion-item');
        if (item) {
          newInput.value = item.dataset.value;
          suggestions.style.display = 'none';
        }
      });
    });

    // ── Fetch submission info ──
    let submissionData = null;
    const settings = await getSettings();

    if (!settings.githubToken || !settings.githubRepo) {
      showStatus('cfg-status', 'GitHub settings not configured. Click the extension icon to set up.', 'warn');
    }

    if (settings.cfHandle && problemInfo) {
      const metaEl = document.getElementById('cfg-problem-meta');
      metaEl.textContent = `Fetching latest AC for ${settings.cfHandle}…`;

      // 8-second timeout so it never hangs forever
      const fetchTimeout = setTimeout(() => {
        if (!submissionData) {
          metaEl.textContent = 'Submission fetch timed out. You can still push if code was already loaded.';
          metaEl.style.color = '#d29922';
        }
      }, 8000);

      chrome.runtime.sendMessage({
        action: 'getSubmissions',
        handle: settings.cfHandle,
        contestId: problemInfo.contestId,
        problemIndex: problemInfo.problemIndex
      }, (res) => {
        clearTimeout(fetchTimeout);
        if (res && res.success) {
          submissionData = res;
          metaEl.innerHTML = `
            <span class="cfg-tag">${res.language}</span>
            <span class="cfg-tag">ID #${res.submissionId}</span>
          `;
          const commitInput = document.getElementById('cfg-commit-msg');
          if (!commitInput.value) {
            commitInput.placeholder = `[CF] ${problemInfo.contestId}${problemInfo.problemIndex} - ${res.problemName}`;
          }
        } else {
          metaEl.textContent = (res ? res.error : 'No response from background');
          metaEl.style.color = '#f85149';
          metaEl.style.fontSize = '12px';
        }
      });
    } else if (!settings.cfHandle) {
      document.getElementById('cfg-problem-meta').textContent = 'Set your CF handle in extension settings.';
    }

    // ── Push button ──
    document.getElementById('cfg-push-confirm-btn').addEventListener('click', async () => {
      await handlePush(submissionData, problemInfo, problemTitle, settings, overlay);
    });
  }

  // ── Get settings from storage ────────────────────────────────────────────
  function getSettings() {
    return new Promise(resolve => {
      chrome.storage.local.get(['githubToken', 'githubRepo', 'cfHandle'], resolve);
    });
  }

  // ── Handle the push action ───────────────────────────────────────────────
  async function handlePush(submissionData, problemInfo, problemTitle, settings, overlay) {
    const pushBtn = document.getElementById('cfg-push-confirm-btn');
    const btnText = document.getElementById('cfg-push-btn-text');
    const statusEl = document.getElementById('cfg-status');

    if (!settings.githubToken || !settings.githubRepo) {
      showStatus('cfg-status', 'GitHub token/repo not set. Open extension popup to configure.', 'error');
      return;
    }

    // Determine folder
    const mode = document.querySelector('input[name="folderMode"]:checked').value;
    let concept = '';
    if (mode === 'new') {
      concept = document.getElementById('cfg-new-folder-input').value.trim();
      if (!concept) {
        showStatus('cfg-status', 'Please enter a concept folder name, or choose "No folder".', 'warn');
        return;
      }
    } else if (mode === 'existing') {
      concept = document.getElementById('cfg-folder-select').value;
    }
    // mode === 'root' → concept stays ''

    // Determine problem ID
    const problemId = problemInfo
      ? `${problemInfo.contestId}${problemInfo.problemIndex}`
      : 'CF_' + Date.now();

    const commitMsgInput = document.getElementById('cfg-commit-msg').value.trim();

    // Disable button and show loading
    pushBtn.disabled = true;
    btnText.textContent = 'Fetching code...';
    statusEl.style.display = 'none';

    // Fetch source code
    let code = '';
    let ext = 'cpp';

    if (submissionData && submissionData.submissionId) {
      const cId = submissionData.contestId || problemInfo?.contestId;
      const sId = submissionData.submissionId;
      const url = `https://codeforces.com/contest/${cId}/submission/${sId}`;
      
      try {
        const r = await fetch(url);
        const html = await r.text();
        const match = html.match(/<pre[^>]*id="program-source-text"[^>]*>([\s\S]*?)<\/pre>/i);
        
        if (match) {
          const txt = match[1]
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&#x2F;/g, '/');
          
          code = txt;
          ext = submissionData.ext || 'cpp';
        } else {
          showStatus('cfg-status', 'Could not extract source code. Make sure you are logged in to Codeforces.', 'error');
          pushBtn.disabled = false;
          btnText.textContent = 'Push Solution';
          return;
        }
      } catch (err) {
        showStatus('cfg-status', `Fetch error: ${err.toString()}`, 'error');
        pushBtn.disabled = false;
        btnText.textContent = 'Push Solution';
        return;
      }
    } else {
      showStatus('cfg-status',
        'No accepted submission found. Make sure your CF handle is set and you have an accepted submission for this problem.',
        'error');
      pushBtn.disabled = false;
      btnText.textContent = 'Push Solution';
      return;
    }

    btnText.textContent = 'Pushing to GitHub...';

    // Push to GitHub
    const pushRes = await new Promise(resolve =>
      chrome.runtime.sendMessage({
        action: 'pushToGitHub',
        concept,
        problemId,
        problemName: problemTitle,
        ext,
        code,
        problemUrl: window.location.href,
        submissionId: submissionData?.submissionId,
        contestId: submissionData?.contestId || problemInfo?.contestId,
        commitMsg: commitMsgInput
      }, resolve)
    );

    pushBtn.disabled = false;
    btnText.textContent = 'Push Solution';
 
    if (pushRes && pushRes.success) {
      // Save concept to local storage for future autocomplete
      if (concept) {
        chrome.storage.local.get(['savedConcepts'], (stored) => {
          const concepts = stored.savedConcepts || [];
          if (!concepts.includes(concept)) {
            concepts.push(concept);
            chrome.storage.local.set({ savedConcepts: concepts });
          }
        });
      }
      showStatus('cfg-status',
        `Pushed to <strong>${pushRes.filePath}</strong> — <a href="${pushRes.url}" target="_blank">View on GitHub ↗</a>`,
        'success');
      const floatBtn = document.getElementById('cfg-push-btn');
      if (floatBtn) {
        floatBtn.classList.add('cfg-pushed');
        setTimeout(() => floatBtn.classList.remove('cfg-pushed'), 3000);
      }
    } else {
      showStatus('cfg-status',
        `Push failed: ${pushRes ? pushRes.error : 'No response from background'}`,
        'error');
    }
  }

  // ── Show status message + scroll into view ────────────────────────────────
  function showStatus(id, html, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = html;
    el.className = 'cfg-status cfg-status-' + type;
    el.style.display = 'block';
    // Always scroll the status into view so it's never hidden below the fold
    setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  }

  // ── Inject button when page is ready ────────────────────────────────────
  function init() {
    if (!parseProblemFromURL()) return;
    injectButton();
  }

  // ── Check if extension context is still alive ──────────────────────────
  function isContextValid() {
    try {
      // Accessing chrome.runtime.id throws if context is invalidated
      return !!chrome.runtime.id;
    } catch (e) {
      return false;
    }
  }

  // Run on load + observe DOM for SPA navigation
  init();
  const observer = new MutationObserver(() => {
    // If extension was reloaded, context is dead — disconnect observer cleanly
    if (!isContextValid()) {
      observer.disconnect();
      return;
    }
    try {
      if (!document.getElementById('cfg-push-btn') && parseProblemFromURL()) {
        injectButton();
      }
    } catch (e) {
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

})();
