(function (global) {
  'use strict';

  const Hobo = {
    version: 'stable-1.0.0',
    config: {
      githubRepo: null,
      githubToken: null,
      pistonApi: 'https://emkc.org/api/v2/piston',
      pyodideCdn: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
      gittoApi: null,
      debug: true
    },

    // 70+ Languages via Piston API (website compiler)
    languages: {
      // Popular
      javascript: { ext: 'js', version: '18.15.0', runtime: 'node', piston: 'javascript' },
      python: { ext: 'py', version: '3.10.0', runtime: 'python', piston: 'python', wasm: 'pyodide' },
      typescript: { ext: 'ts', version: '5.0.3', piston: 'typescript' },
      php: { ext: 'php', version: '8.2.3', piston: 'php' },
      ruby: { ext: 'rb', version: '3.0.1', piston: 'ruby' },
      go: { ext: 'go', version: '1.16.2', piston: 'go' },
      rust: { ext: 'rs', version: '1.68.2', piston: 'rust' },
      java: { ext: 'java', version: '15.0.2', piston: 'java' },
      c: { ext: 'c', version: '10.2.0', piston: 'c' },
      cpp: { ext: 'cpp', version: '10.2.0', piston: 'c++' },
      csharp: { ext: 'cs', version: '6.12.0', piston: 'csharp' },
      swift: { ext: 'swift', version: '5.3.3', piston: 'swift' },
      kotlin: { ext: 'kt', version: '1.8.20', piston: 'kotlin' },
      // Web
      html: { ext: 'html', runtime: 'browser' },
      css: { ext: 'css', runtime: 'browser' },
      // Esoteric
      brainfuck: { ext: 'bf', piston: 'brainfuck' },
      lua: { ext: 'lua', version: '5.4.0', piston: 'lua', wasm: 'fengari' },
      perl: { ext: 'pl', version: '5.36.0', piston: 'perl' },
      bash: { ext: 'sh', version: '5.2.0', piston: 'bash' },
      // More via Piston
      elixir: { piston: 'elixir' },
      haskell: { piston: 'haskell' },
      dart: { piston: 'dart' },
      scala: { piston: 'scala' },
      r: { piston: 'r' },
      julia: { piston: 'julia' },
      // Custom - Gitto DSL
      hobo: { ext: 'hobo', runtime: 'hobo' }
    },

    // Core: Make GitHub Pages Dynamic
    init(options = {}) {
      this.config = { ...this.config, ...options };
      this.log(`Hey! The dynamic engine was started! At version ${this.version}`);
      
      // Auto-mount dynamic routes
      this.mountRouter();
      this.mountCodeBlocks();
      this.mountLiveEditors();
      this.mountStartDynamic(); // NEW: support <div data-hobo-start-dynamic>
      
      // Connect to Gitto if available
      if (this.config.gittoApi) {
        this.connectGitto();
      }

      return this;
    },

    // NEW: Support user's requested syntax: <script src="example.js"><div data-hobo-start-dynamic>
    mountStartDynamic() {
      const runBlock = async (el) => {
        const lang = (el.getAttribute('data-hobo-lang') || el.getAttribute('lang') || 'javascript').toLowerCase();
        const src = el.getAttribute('data-hobo-src');
        const runMode = el.getAttribute('data-hobo-run') || 'auto'; // auto, click, manual
        
        let code = el.textContent.trim();
        
        // If data-hobo-src, load external file
        if (src) {
          try {
            const res = await fetch(src);
            code = await res.text();
          } catch (e) {
            this.log(`Failed to load src ${src}`, e);
          }
        }
        
        if (!code) return;
        
        // Create output container
        let output = el.querySelector('.hobo-output');
        if (!output) {
          output = document.createElement('div');
          output.className = 'hobo-output';
          output.style.cssText = 'background:#000;color:#0f0;padding:12px;border-radius:8px;margin-top:8px;font-family:monospace;white-space:pre-wrap;min-height:20px;border:1px solid #222';
          el.appendChild(output);
        }
        
        // Create run button if click mode
        let btn = el.querySelector('.hobo-run-btn');
        if (runMode === 'click' && !btn) {
          btn = document.createElement('button');
          btn.className = 'hobo-run-btn';
          btn.textContent = `▶ Run ${lang}`;
          btn.style.cssText = 'margin-top:8px;padding:6px 12px;background:#fff;color:#000;border:0;border-radius:999px;cursor:pointer;font-weight:600';
          el.appendChild(btn);
          btn.onclick = async () => {
            btn.textContent = '⏳ Running...';
            const r = await this.compile(lang, code);
            output.textContent = r.stdout || r.stderr || '(no output)';
            btn.textContent = `▶ Run ${lang} ${r.success ? '✓' : '✗'}`;
          };
          return; // wait for click
        }
        
        // Auto run
        output.textContent = `⏳ Running ${lang}...`;
        try {
          const r = await this.compile(lang, code);
          output.textContent = r.stdout || r.stderr || '(empty)';
          output.style.borderColor = r.success ? '#0f0' : '#f00';
          el.setAttribute('data-hobo-status', r.success ? 'success' : 'error');
        } catch (e) {
          output.textContent = `Error: ${e.message}`;
          output.style.borderColor = '#f00';
        }
      };

      const initBlocks = () => {
        document.querySelectorAll('[data-hobo-start-dynamic]').forEach(el => {
          if (el.dataset.hoboMounted) return;
          el.dataset.hoboMounted = '1';
          runBlock(el);
        });
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBlocks);
      } else {
        initBlocks();
      }
      
      // Also watch for dynamically added blocks (e.g. via example.js)
      new MutationObserver(initBlocks).observe(document.body, { childList: true, subtree: true });
    },

    // 1. COMPILER/INTERPRETER HUB via Website (Piston API)
    async compile(lang, code, input = '') {
      const langCfg = this.languages[lang.toLowerCase()];
      if (!langCfg) throw new Error(`Language ${lang} not supported. Try: ${Object.keys(this.languages).join(', ')}`);

      // Fast path: JS runs natively in browser
      if (langCfg.runtime === 'browser' || lang === 'javascript' || lang === 'js') {
        return this.runJS(code);
      }

      // WASM path: Python via Pyodide (no API call, runs in browser = dynamic Pages!)
      if (lang === 'python' && this.pyodide) {
        return this.runPyodide(code);
      }

      // Website compiler path: Piston API (70+ languages)
      try {
        const res = await fetch(`${this.config.pistonApi}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: langCfg.piston || lang,
            version: langCfg.version || '*',
            files: [{ name: `main.${langCfg.ext || 'txt'}`, content: code }],
            stdin: input
          })
        });
        const data = await res.json();
        return {
          language: lang,
          code,
          stdout: data.run?.stdout || '',
          stderr: data.run?.stderr || data.message || '',
          output: data.run?.output || '',
          code: data.run?.code,
          success: data.run?.code === 0,
          via: 'piston-api'
        };
      } catch (e) {
        // Fallback to Gitto API if configured
        if (this.config.gittoApi) {
          return this.compileViaGitto(lang, code, input);
        }
        throw e;
      }
    },

    // Alias: run = compile
    async run(lang, code, input) {
      return this.compile(lang, code, input);
    },

    // 2. JS - Native dynamic on Pages
    runJS(code) {
      try {
        const logs = [];
        const origLog = console.log;
        console.log = (...args) => logs.push(args.join(' '));
        const result = Function(`"use strict"; return (async () => { ${code} })()`)();
        console.log = origLog;
        return Promise.resolve(result).then(v => ({
          language: 'javascript',
          stdout: logs.join('\n') + (v !== undefined ? '\n' + String(v) : ''),
          success: true,
          via: 'browser-native'
        })).catch(e => ({
          stdout: '',
          stderr: e.message,
          success: false,
          via: 'browser-native'
        }));
      } catch (e) {
        return { stdout: '', stderr: e.message, success: false, via: 'browser-native' };
      }
    },

    // 3. Python via Pyodide WASM - makes Pages truly dynamic
    async loadPyodide() {
      if (this.pyodide) return this.pyodide;
      if (typeof loadPyodide === 'undefined') {
        await this.loadScript(`${this.config.pyodideCdn}pyodide.js`);
      }
      this.pyodide = await loadPyodide({ indexURL: this.config.pyodideCdn });
      this.log('Pyodide loaded - Python now runs on GitHub Pages!');
      return this.pyodide;
    },

    async runPyodide(code) {
      try {
        const py = await this.loadPyodide();
        // Capture stdout
        let output = '';
        py.setStdout({ batched: (s) => { output += s; } });
        const result = await py.runPythonAsync(code);
        return {
          language: 'python',
          stdout: output + (result !== undefined ? String(result) : ''),
          success: true,
          via: 'pyodide-wasm'
        };
      } catch (e) {
        return { stdout: '', stderr: e.message, success: false, via: 'pyodide-wasm' };
      }
    },

    // 4. Compile via Gitto API (your Cloudflare Worker)
    async compileViaGitto(lang, code, input) {
      if (!this.config.gittoApi) throw new Error('No Gitto API configured');
      const res = await fetch(`${this.config.gittoApi}/api/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang, code, input })
      });
      return res.json();
    },

    // 5. GitHub Pages Dynamic Router (makes static Pages act like PHP/Node)
    mountRouter() {
      // Turn data-hobo-route into dynamic pages
      document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('[data-hobo-route]').forEach(el => {
          const route = el.getAttribute('data-hobo-route');
          const lang = el.getAttribute('data-hobo-lang') || 'javascript';
          // If URL matches route, execute code inside
          if (location.pathname.endsWith(route) || route === '*') {
            this.run(lang, el.textContent).then(r => {
              if (r.success && el.hasAttribute('data-hobo-render')) {
                el.innerHTML = `<pre>${this.escape(r.stdout)}</pre>`;
              }
            });
          }
        });
      });

      // Hijack fetch to make Pages dynamic: /api/* -> Gitto or GitHub
      const origFetch = window.fetch;
      window.fetch = async (url, ...args) => {
        if (typeof url === 'string' && url.startsWith('/api/') && this.config.gittoApi) {
          url = this.config.gittoApi + url;
        }
        return origFetch(url, ...args);
      };
    },

    // 6. Auto-run <pre><code class="language-python"> blocks -> makes README dynamic
    mountCodeBlocks() {
      document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('pre code[class*="language-"]').forEach(block => {
          const lang = block.className.match(/language-(\w+)/)?.[1];
          if (!lang || !this.languages[lang]) return;
          
          // Add Run button
          const btn = document.createElement('button');
          btn.textContent = `▶ Run ${lang}`;
          btn.style.cssText = 'position:absolute;top:4px;right:4px;padding:2px 8px;font-size:12px;cursor:pointer;background:#111;color:#fff;border-radius:999px;border:0';
          const pre = block.parentElement;
          pre.style.position = 'relative';
          pre.appendChild(btn);
          
          btn.onclick = async () => {
            btn.textContent = '⏳ Running...';
            const result = await this.compile(lang, block.textContent);
            let out = pre.querySelector('.hobo-output');
            if (!out) {
              out = document.createElement('div');
              out.className = 'hobo-output';
              out.style.cssText = 'background:#0a0a0a;color:#0f0;padding:12px;margin-top:8px;border-radius:8px;font-family:monospace;white-space:pre-wrap';
              pre.after(out);
            }
            out.textContent = result.stdout || result.stderr || '(no output)';
            btn.textContent = `▶ Run ${lang} ${result.success ? '✓' : '✗'}`;
          };
        });
      });
    },

    // 7. Live Editors (like CodePen but on GitHub Pages)
    mountLiveEditors() {
      document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('[data-hobo-live]').forEach(container => {
          const lang = container.getAttribute('data-hobo-live') || 'javascript';
          const editor = document.createElement('textarea');
          editor.style.cssText = 'width:100%;height:120px;font-family:monospace;background:#111;color:#fff;padding:12px;border-radius:8px';
          editor.value = container.textContent.trim() || `// Write ${lang} here\nconsole.log("Hobo live!")`;
          container.textContent = '';
          container.appendChild(editor);
          
          const output = document.createElement('pre');
          output.style.cssText = 'background:#f5f5f5;padding:12px;border-radius:8px;margin-top:8px;min-height:40px';
          container.appendChild(output);
          
          const run = async () => {
            const r = await this.compile(lang, editor.value);
            output.textContent = r.stdout || r.stderr;
          };
          editor.addEventListener('input', this.debounce(run, 500));
          run();
        });
      });
    },

    // 8. Deploy to GitHub (and GitHub Pages) via API
    async deployToGitHub({ repo, token, files, message = 'Deploy via Hobo' }) {
      const ghRepo = repo || this.config.githubRepo;
      const ghToken = token || this.config.githubToken;
      
      if (!ghRepo) throw new Error('Set repo: Hobo.deployToGitHub({ repo: "user/repo" })');
      if (!ghToken) throw new Error('Set GitHub token: Hobo.init({ githubToken: "ghp_..." }) or pass token');

      const headers = {
        'Authorization': `Bearer ${ghToken}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      };

      // Get default branch
      const repoInfo = await fetch(`https://api.github.com/repos/${ghRepo}`, { headers }).then(r => r.json());
      const branch = repoInfo.default_branch || 'main';

      // Get latest commit
      const ref = await fetch(`https://api.github.com/repos/${ghRepo}/git/ref/heads/${branch}`, { headers }).then(r => r.json());
      const latestCommitSha = ref.object.sha;

      const commit = await fetch(`https://api.github.com/repos/${ghRepo}/git/commits/${latestCommitSha}`, { headers }).then(r => r.json());
      const treeSha = commit.tree.sha;

      // Create blobs for files: files = { "user/js/stable/hobo.js": "content", "index.html": "..." }
      const tree = [];
      for (const [path, content] of Object.entries(files)) {
        const blob = await fetch(`https://api.github.com/repos/${ghRepo}/git/blobs`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ content: btoa(unescape(encodeURIComponent(content))), encoding: 'base64' })
        }).then(r => r.json());
        tree.push({ path, mode: '100644', type: 'blob', sha: blob.sha });
      }

      const newTree = await fetch(`https://api.github.com/repos/${ghRepo}/git/trees`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ base_tree: treeSha, tree })
      }).then(r => r.json());

      const newCommit = await fetch(`https://api.github.com/repos/${ghRepo}/git/commits`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message, tree: newTree.sha, parents: [latestCommitSha] })
      }).then(r => r.json());

      await fetch(`https://api.github.com/repos/${ghRepo}/git/refs/heads/${branch}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ sha: newCommit.sha })
      });

      return {
        success: true,
        commit: newCommit.sha,
        url: `https://${ghRepo.split('/')[0]}.github.io/${ghRepo.split('/')[1]}/`,
        message: `Deployed ${Object.keys(files).length} files to ${ghRepo}@${branch}`
      };
    },

    // 9. Quick deploy current page to GitHub Pages
    async deployCurrentPage() {
      const files = {
        'index.html': document.documentElement.outerHTML,
        'user/js/stable/hobo.js': HoboSource // self-reference
      };
      return this.deployToGitHub({ files, message: 'Hobo auto-deploy GitHub Pages dynamic' });
    },

    // 10. Connect to Gitto (your R2 clone)
    async connectGitto() {
      if (!this.config.gittoApi) return;
      try {
        const res = await fetch(`${this.config.gittoApi}/api/`);
        const data = await res.json();
        this.log(`Connected to Gitto: ${data.bucket} with ${data.total_objects} objects`);
        this.gitto = data;
      } catch (e) {
        this.log('Gitto not reachable', e);
      }
    },

    // Utils
    loadScript(src) {
      return new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = res;
        s.onerror = rej;
        document.head.appendChild(s);
      });
    },
    escape(s) { return s.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); },
    log(...args) { if (this.config.debug) console.log('[Hobo]', ...args); },
    debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
  };

  // Save source for self-deploy
  const HoboSource = `(${Hobo.init.toString()})(); /* full source in user/js/stable/hobo.js */`;

  // Expose
  global.Hobo = Hobo;
  if (typeof module !== 'undefined') module.exports = Hobo;

  // Auto-init if data-hobo-auto
  if (typeof document !== 'undefined' && document.currentScript?.hasAttribute('data-hobo-auto')) {
    Hobo.init(JSON.parse(document.currentScript.getAttribute('data-hobo-config') || '{}'));
  }

})(typeof window !== 'undefined' ? window : this);
