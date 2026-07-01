// ─────────────────────────────────────────────────────────────────────────────
// CF GitHub Pusher — background.js (Service Worker)
// Handles: GitHub API calls, CF API calls
// ─────────────────────────────────────────────────────────────────────────────

// Map CF language strings → file extensions
function getFileExtension(language) {
  if (!language) return 'cpp';
  const lang = language.toLowerCase();
  if (lang.includes('c++') || lang.includes('g++') || lang.includes('msvc') || lang.includes('clang++')) return 'cpp';
  if (lang.includes('python') || lang.includes('pypy')) return 'py';
  if (lang.includes('java')) return 'java';
  if (lang.includes('kotlin')) return 'kt';
  if (lang.includes('rust')) return 'rs';
  if (lang.includes('go')) return 'go';
  if (lang.includes('javascript') || lang.includes('node')) return 'js';
  if (lang.includes('c#')) return 'cs';
  if (lang.includes('ruby')) return 'rb';
  if (lang.includes('haskell')) return 'hs';
  if (lang.includes('pascal') || lang.includes('delphi')) return 'pas';
  if (lang.includes('d lang') || lang.includes('dlang')) return 'd';
  if (lang.includes('ocaml')) return 'ml';
  if (lang.includes('scala')) return 'scala';
  if (lang.includes('perl')) return 'pl';
  if (lang.includes('php')) return 'php';
  return 'cpp'; // default
}

// Sanitize string for use in a filename
function sanitizeFilename(str) {
  return str.replace(/[^a-zA-Z0-9._\-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

// ─── MESSAGE HANDLER ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // ── Fetch recent CF submissions for a handle + problem ──
  if (request.action === 'getSubmissions') {
    const { handle, contestId, problemIndex } = request;
    const url = `https://codeforces.com/api/user.status?handle=${handle}&from=1&count=30`;

    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.status !== 'OK') {
          sendResponse({ success: false, error: 'CF API error: ' + data.comment });
          return;
        }
        // Find latest AC submission for this problem
        const submissions = data.result.filter(s =>
          s.verdict === 'OK' &&
          String(s.problem.contestId) === String(contestId) &&
          s.problem.index.toUpperCase() === problemIndex.toUpperCase()
        );
        if (submissions.length === 0) {
          sendResponse({ success: false, error: 'No accepted submission found for this problem with handle: ' + handle });
          return;
        }
        const latest = submissions[0]; // sorted newest first by CF API
        sendResponse({
          success: true,
          submissionId: latest.id,
          language: latest.programmingLanguage,
          ext: getFileExtension(latest.programmingLanguage),
          contestId: latest.problem.contestId,
          problemName: latest.problem.name,
          problemIndex: latest.problem.index
        });
      })
      .catch(err => sendResponse({ success: false, error: err.toString() }));

    return true; // async
  }

  // ── Fetch source code from a CF submission page ──
  if (request.action === 'getSubmissionCode') {
    const { contestId, submissionId } = request;
    // Try both /contest/ and /problemset/ URLs
    const url = `https://codeforces.com/contest/${contestId}/submission/${submissionId}`;

    fetch(url, { credentials: 'include' })
      .then(r => r.text())
      .then(html => {
        // Extract code from <pre id="program-source-text">
        const match = html.match(/<pre[^>]*id="program-source-text"[^>]*>([\s\S]*?)<\/pre>/i);
        if (match) {
          // Decode HTML entities
          const txt = match[1]
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&#x2F;/g, '/');
          sendResponse({ success: true, code: txt });
        } else {
          sendResponse({ success: false, error: 'Could not extract source code. Make sure you are logged in to Codeforces.' });
        }
      })
      .catch(err => sendResponse({ success: false, error: err.toString() }));

    return true;
  }


  // ── Test GitHub connection ──
  if (request.action === 'testConnection') {
    chrome.storage.local.get(['githubToken', 'githubRepo'], async (stored) => {
      if (!stored.githubToken || !stored.githubRepo) {
        sendResponse({ success: false, error: 'Token or Repo not set.' });
        return;
      }
      try {
        const res = await fetch(`https://api.github.com/repos/${stored.githubRepo}`, {
          headers: {
            'Authorization': `Bearer ${stored.githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        const json = await res.json();
        if (res.ok) {
          sendResponse({ success: true, repoFullName: json.full_name, private: json.private });
        } else {
          sendResponse({ success: false, status: res.status, error: json.message || 'Unknown error' });
        }
      } catch (err) {
        sendResponse({ success: false, error: err.toString() });
      }
    });
    return true;
  }

  // ── Push solution file to GitHub ──
  if (request.action === 'pushToGitHub') {
    chrome.storage.local.get(['githubToken', 'githubRepo'], async (stored) => {
      if (!stored.githubToken || !stored.githubRepo) {
        sendResponse({ success: false, error: 'GitHub Token or Repo not set. Open the extension popup to configure.' });
        return;
      }

      try {
        const token = stored.githubToken;
        const repo = stored.githubRepo;
        const { concept, problemId, problemName, ext, code, problemUrl, submissionId, contestId, commitMsg } = request;

        const safeProblemName = sanitizeFilename(problemName);
        const fileName = `${problemId}_${safeProblemName}.${ext}`;
        const filePath = concept ? `${concept}/${fileName}` : fileName;

        // Determine comment character based on file extension
        let commentPrefix = '//';
        if (['py', 'rb', 'pl'].includes(ext)) {
          commentPrefix = '#';
        } else if (ext === 'hs') {
          commentPrefix = '--';
        }

        // Add problem link and submission link at the top of the file
        let fileContent = '';
        if (problemUrl) {
          fileContent += `${commentPrefix} Problem Link: ${problemUrl}\n`;
        }
        if (contestId && submissionId) {
          fileContent += `${commentPrefix} Submission Link: https://codeforces.com/contest/${contestId}/submission/${submissionId}\n`;
        }
        if (fileContent) {
          fileContent += `\n`;
        }
        fileContent += code;

        const base64Content = btoa(unescape(encodeURIComponent(fileContent)));
        const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;

        // Check if file exists (to get SHA for update)
        let sha = null;
        const getRes = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        if (getRes.ok) {
          const getJson = await getRes.json();
          sha = getJson.sha;
        }

        const body = {
          message: commitMsg || `[CF Pusher] Add ${problemId} ${problemName}${concept ? ' | ' + concept : ''}`,
          content: base64Content
        };
        if (sha) body.sha = sha;

        const putRes = await fetch(apiUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        if (putRes.ok) {
          const putJson = await putRes.json();
          sendResponse({
            success: true,
            filePath,
            url: putJson.content?.html_url || `https://github.com/${repo}/blob/main/${filePath}`
          });
        } else {
          const errJson = await putRes.json();
          // Include HTTP status for easier debugging
          sendResponse({ success: false, error: `[HTTP ${putRes.status}] ${errJson.message || 'GitHub API error'}` });
        }
      } catch (err) {
        sendResponse({ success: false, error: err.toString() });
      }
    });
    return true;
  }
});
