// ─────────────────────────────────────────────────────────────────────────────
// CF GitHub Pusher — content.js
// Injects a floating "Push to GitHub" button on Codeforces problem pages.
// On click, shows a rich modal to pick/create a concept folder and push.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  // ── DSA / CP Tag Dictionary ──────────────────────────────────────────────
  const DSA_TAGS = [
    'dp','dynamic-programming','digit-dp','bitmask-dp','interval-dp','tree-dp',
    'rerooting-dp','dp-on-trees','knapsack','sos-dp','profile-dp','broken-profile-dp',
    'bfs','dfs','graphs','dijkstra','bellman-ford','floyd-warshall','topological-sort',
    'scc','bridges','articulation-points','mst','kruskal','prim','bipartite','matching',
    'trees','binary-tree','bst','lca','euler-tour','hld','heavy-light-decomposition',
    'centroid-decomposition','small-to-large','dsu-on-tree',
    'segment-tree','fenwick-tree','bit','sparse-table','sqrt-decomposition',
    'mo-algorithm','persistent-segment-tree','lazy-propagation',
    'binary-search','ternary-search','two-pointers','sliding-window',
    'greedy','sorting','intervals','activity-selection','constructive',
    'math','number-theory','gcd','lcm','modular-arithmetic','sieve','euler-totient',
    'matrix-exponentiation','combinatorics','game-theory','nim','sprague-grundy',
    'geometry','convex-hull','line-sweep',
    'strings','kmp','z-function','suffix-array','suffix-automaton',
    'aho-corasick','hashing','palindrome','manacher','rabin-karp',
    'stack','queue','deque','priority-queue','heap','trie','dsu','union-find',
    'backtracking','recursion','divide-and-conquer','brute-force',
    'simulation','implementation','ad-hoc','prefix-sum','difference-array',
    'interactive','offline','randomized','flow','max-flow','min-cut',
    'network-flow','2-sat','xor','bitmask','meet-in-the-middle',
  ];

  // Keywords in problem title → suggested tags
  const KEYWORD_MAP = {
    'tree':['trees','dfs','dp-on-trees'],
    'path':['graphs','bfs','dijkstra'],
    'capital':['trees','rerooting-dp'],
    'root':['trees','rerooting-dp'],
    'reroot':['rerooting-dp'],
    'digit':['digit-dp'],
    'bitmask':['bitmask-dp','bitmask'],
    'mask':['bitmask-dp','bitmask'],
    'knapsack':['knapsack','dp'],
    'segment':['segment-tree'],
    'range':['segment-tree','prefix-sum'],
    'query':['segment-tree','fenwick-tree','mo-algorithm'],
    'prime':['sieve','number-theory'],
    'gcd':['math','gcd','number-theory'],
    'xor':['xor','bitmask'],
    'cycle':['graphs','dfs'],
    'shortest':['dijkstra','bfs','graphs'],
    'longest':['dp','binary-search'],
    'subsequence':['dp'],
    'substring':['strings','hashing','kmp'],
    'palindrome':['palindrome','manacher','dp'],
    'sort':['sorting','greedy'],
    'interval':['greedy','intervals','segment-tree'],
    'flow':['max-flow','network-flow'],
    'match':['matching','bipartite'],
    'lca':['lca','trees'],
    'ancestor':['lca','trees'],
    'euler':['euler-tour','trees'],
    'game':['game-theory'],
    'nim':['nim','game-theory'],
    'convex':['convex-hull','geometry'],
    'hull':['convex-hull','geometry'],
    'trie':['trie','strings'],
    'suffix':['suffix-array','suffix-automaton'],
    'binary':['binary-search'],
    'matrix':['matrix-exponentiation','math'],
    'power':['matrix-exponentiation','math'],
    'combination':['combinatorics','math'],
    'permutation':['combinatorics','math'],
    'dsu':['dsu','union-find'],
    'union':['dsu','union-find'],
    'component':['dfs','graphs','dsu'],
    'connected':['bfs','graphs','dsu'],
    'spanning':['mst','kruskal','prim'],
    'topological':['topological-sort','graphs'],
    'bridge':['bridges','graphs'],
    'articulation':['articulation-points','graphs'],
    'strongly':['scc','graphs'],
    'meet':['meet-in-the-middle'],
    'offline':['offline','mo-algorithm'],
    'sqrt':['sqrt-decomposition'],
    'string':['strings'],
    'prefix':['prefix-sum'],
    'difference':['difference-array'],
    'number':['number-theory','math'],
    'count':['dp','combinatorics'],
    'ways':['dp','combinatorics'],
    'greedy':['greedy'],
    'sum':['prefix-sum','dp'],
  };

  // ── Levenshtein distance ──────────────────────────────────────────────────
  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({length: m + 1}, (_, i) =>
      Array.from({length: n + 1}, (_, j) => i === 0 ? j : j === 0 ? i : 0));
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = a[i-1] === b[j-1]
          ? dp[i-1][j-1]
          : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    return dp[m][n];
  }

  // ── Spell-check: find closest DSA tags for a mistyped word ───────────────
  function getSpellSuggestions(word) {
    if (!word || word.length < 3) return [];
    const lower = word.toLowerCase().replace(/\s+/g, '-');
    if (DSA_TAGS.includes(lower)) return [];
    const threshold = Math.max(2, Math.floor(lower.length / 3));
    return DSA_TAGS
      .map(tag => ({ tag, dist: levenshtein(lower, tag) }))
      .filter(x => x.dist <= threshold)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 3)
      .map(x => x.tag);
  }

  // ── Recommend tags from problem title keywords ────────────────────────────
  function getRecommendedTags(title) {
    const lower = title.toLowerCase();
    const matched = new Set();
    for (const [kw, tags] of Object.entries(KEYWORD_MAP)) {
      if (lower.includes(kw)) tags.forEach(t => matched.add(t));
    }
    return [...matched].slice(0, 8);
  }

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
              placeholder="e.g. digit-dp, rerooting-dp, bitmask…"
              autocomplete="off" spellcheck="false"/>
            <div class="cfg-suggestions" id="cfg-suggestions"></div>
            <div id="cfg-spell-hint" class="cfg-spell-hint" style="display:none"></div>
          </div>

          <!-- Recommended tags from problem title -->
          <div id="cfg-recommended-section" style="display:none;margin-top:12px">
            <div class="cfg-rec-label">Suggested for this problem</div>
            <div id="cfg-tag-chips" class="cfg-tag-chips"></div>
          </div>

          <!-- Existing folder search -->
          <div id="cfg-existing-folder-section" style="display:none">
            <div style="position:relative">
              <input type="text" id="cfg-existing-search" class="cfg-input"
                placeholder="Search saved concepts…"
                autocomplete="off" spellcheck="false"/>
              <div class="cfg-suggestions cfg-existing-list" id="cfg-existing-suggestions"></div>
            </div>
            <div id="cfg-existing-selected" class="cfg-existing-selected" style="display:none">
              <span id="cfg-existing-selected-text"></span>
              <button class="cfg-existing-clear" id="cfg-existing-clear">✕</button>
            </div>
          </div>

          <!-- Commit message -->
          <div class="cfg-section-label" style="margin-top:14px">Problem Description / Notes <span style="font-weight:400;color:#8b949e">(what did you learn / approach)</span></div>
          <textarea id="cfg-commit-msg" class="cfg-input" rows="3" placeholder="e.g. Rerooting DP — compute subtree sums, then reroot to get global answer in O(n)" style="resize:vertical;font-family:inherit"></textarea>

          <!-- Status area -->
          <div id="cfg-status" class="cfg-status" style="display:none"></div>
        </div>

        <div class="cfg-modal-footer">
          <button class="cfg-btn-secondary" id="cfg-cancel-btn">Cancel</button>
          <button class="cfg-btn-primary" id="cfg-push-confirm-btn">
            <span id="cfg-push-btn-text">Push Note</span>
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

    // ── Load saved concepts + show recommendations + spell-check ────────────
    chrome.storage.local.get(['savedConcepts'], (stored) => {
      const suggestions = document.getElementById('cfg-suggestions');
      const newInput    = document.getElementById('cfg-new-folder-input');
      const spellHint   = document.getElementById('cfg-spell-hint');
      const recSection  = document.getElementById('cfg-recommended-section');
      const chipContainer = document.getElementById('cfg-tag-chips');
      const concepts    = stored.savedConcepts || [];

      // ── Existing folder search ──
      const existingSearch   = document.getElementById('cfg-existing-search');
      const existingSugg     = document.getElementById('cfg-existing-suggestions');
      const existingSelected = document.getElementById('cfg-existing-selected');
      const existingSelText  = document.getElementById('cfg-existing-selected-text');
      const existingClear    = document.getElementById('cfg-existing-clear');

      function renderExistingList(filter) {
        const matches = concepts.filter(f =>
          f.toLowerCase().includes(filter.toLowerCase())
        );
        if (matches.length === 0) {
          existingSugg.innerHTML = '<div class="cfg-suggestion-item" style="color:#64748b;cursor:default">No saved concepts found</div>';
        } else {
          existingSugg.innerHTML = matches.map(f =>
            `<div class="cfg-suggestion-item" data-value="${f}">${
              filter ? f.replace(new RegExp(`(${filter})`, 'gi'), '<mark class="cfg-match">$1</mark>') : f
            }</div>`
          ).join('');
        }
        existingSugg.style.display = 'block';
      }

      function selectExistingConcept(value) {
        existingSearch.value = value;
        existingSelText.textContent = value;
        existingSelected.style.display = 'flex';
        existingSugg.style.display = 'none';
      }

      existingSearch.addEventListener('focus', () => renderExistingList(existingSearch.value));
      existingSearch.addEventListener('input', () => {
        existingSelected.style.display = 'none';
        renderExistingList(existingSearch.value);
      });
      existingSugg.addEventListener('click', e => {
        const item = e.target.closest('.cfg-suggestion-item[data-value]');
        if (item) selectExistingConcept(item.dataset.value);
      });
      existingClear.addEventListener('click', () => {
        existingSearch.value = '';
        existingSelected.style.display = 'none';
        existingSearch.focus();
      });
      // Hide list when clicking outside
      document.addEventListener('click', e => {
        if (!existingSearch.contains(e.target) && !existingSugg.contains(e.target)) {
          existingSugg.style.display = 'none';
        }
      });

      // Show list when radio switches to 'existing'
      document.querySelectorAll('input[name="folderMode"]').forEach(r => {
        r.addEventListener('change', () => {
          if (r.value === 'existing' && r.checked) {
            setTimeout(() => { existingSearch.focus(); renderExistingList(''); }, 50);
          }
        });
      });

      // ── Show title-based tag recommendations ──
      const recommended = getRecommendedTags(problemTitle);
      if (recommended.length > 0) {
        chipContainer.innerHTML = recommended.map(tag =>
          `<button class="cfg-chip" data-value="${tag}">${tag}</button>`
        ).join('');
        recSection.style.display = 'block';
        chipContainer.addEventListener('click', e => {
          const chip = e.target.closest('.cfg-chip');
          if (chip) {
            newInput.value = chip.dataset.value;
            // Highlight selected chip
            chipContainer.querySelectorAll('.cfg-chip').forEach(c => c.classList.remove('cfg-chip-active'));
            chip.classList.add('cfg-chip-active');
            suggestions.style.display = 'none';
            spellHint.style.display = 'none';
          }
        });
      }

      // ── Live autocomplete: saved concepts + DSA dictionary ──
      newInput.addEventListener('input', () => {
        const val = newInput.value.trim().toLowerCase();

        // Autocomplete: saved concepts first, then DSA_TAGS
        if (val.length > 0) {
          const fromSaved = concepts.filter(f => f.toLowerCase().includes(val));
          const fromDict  = DSA_TAGS.filter(t => t.includes(val) && !fromSaved.includes(t));
          const matches   = [...fromSaved, ...fromDict].slice(0, 8);
          suggestions.innerHTML = matches.map(f => {
            const isSaved = concepts.includes(f);
            return `<div class="cfg-suggestion-item" data-value="${f}">
              ${f}${isSaved ? ' <span class="cfg-saved-badge">saved</span>' : ''}
            </div>`;
          }).join('');
          suggestions.style.display = matches.length ? 'block' : 'none';
        } else {
          suggestions.style.display = 'none';
        }

        // ── Spell-check: show Did you mean hints ──
        if (val.length >= 3 && !DSA_TAGS.includes(val)) {
          const spells = getSpellSuggestions(val);
          if (spells.length > 0) {
            spellHint.innerHTML = `Did you mean: ${spells.map(s =>
              `<span class="cfg-spell-option" data-value="${s}">${s}</span>`
            ).join(' · ')}`;
            spellHint.style.display = 'block';
          } else {
            spellHint.style.display = 'none';
          }
        } else {
          spellHint.style.display = 'none';
        }
      });

      // Click a spell suggestion to accept it
      spellHint.addEventListener('click', e => {
        const opt = e.target.closest('.cfg-spell-option');
        if (opt) {
          newInput.value = opt.dataset.value;
          spellHint.style.display = 'none';
          suggestions.style.display = 'none';
        }
      });

      suggestions.addEventListener('click', e => {
        const item = e.target.closest('.cfg-suggestion-item');
        if (item) {
          newInput.value = item.dataset.value;
          suggestions.style.display = 'none';
          spellHint.style.display = 'none';
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
      concept = document.getElementById('cfg-existing-search').value.trim();
      if (!concept) {
        showStatus('cfg-status', 'Please select or search for an existing folder.', 'warn');
        return;
      }
    }
    // mode === 'root' → concept stays ''

    // Determine problem ID
    const problemId = problemInfo
      ? `${problemInfo.contestId}${problemInfo.problemIndex}`
      : 'CF_' + Date.now();

    const commitMsgInput = document.getElementById('cfg-commit-msg').value.trim();

    // Disable button and show loading
    pushBtn.disabled = true;
    btnText.textContent = 'Preparing note...';
    statusEl.style.display = 'none';

    // Build a markdown note file — no code fetching needed
    const problemLink = window.location.href;
    const userNotes = commitMsgInput; // reuse the notes field

    const noteLines = [
      `# ${problemTitle}`,
      ``,
      `**Problem Link:** ${problemLink}`,
    ];

    if (submissionData && submissionData.submissionId) {
      const cId = submissionData.contestId || problemInfo?.contestId;
      const sId = submissionData.submissionId;
      noteLines.push(`**Submission:** https://codeforces.com/contest/${cId}/submission/${sId}`);
      noteLines.push(`**Language:** ${submissionData.language || 'N/A'}`);
    }

    noteLines.push(``);

    if (userNotes) {
      noteLines.push(`## Notes`);
      noteLines.push(``);
      noteLines.push(userNotes);
    }

    const code = noteLines.join('\n');
    const ext = 'md';

    btnText.textContent = 'Pushing note...';

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
        commitMsg: userNotes
          ? `[CF] ${problemId} - ${problemTitle} | ${concept || 'root'}`
          : `[CF] ${problemId} - ${problemTitle}`
      }, resolve)
    );

    pushBtn.disabled = false;
    btnText.textContent = 'Push Note';
 
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
