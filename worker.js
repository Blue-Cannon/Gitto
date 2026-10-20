export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      const lower = path.toLowerCase();
      const method = request.method;
      const bucket = env.GITTO;

      // ===============================
      // GITTO R2 SCHEMA - 70+ TYPES
      // bucket = "gitto"
      // ===============================
      const GITTO_TYPES = {
        // Core Git
        "repositories": "repositories/", "repository": "repositories/",
        "repos": "repositories/", "repo": "repositories/",
        "branches": "branches/", "commits": "commits/", "tags": "tags/",
        "releases": "releases/", "blobs": "blobs/", "trees": "trees/",
        
        // Collaboration
        "forks": "forks/", "fork": "forks/",
        "issues": "issues/", "issue": "issues/",
        "pull-requests": "pull-requests/", "pulls": "pull-requests/", "prs": "pull-requests/", "pr": "pull-requests/",
        "comments": "comments/", "reviews": "reviews/", "review": "reviews/",
        
        // Actions & CI/CD
        "actions": "actions/", "action": "actions/",
        "workflows": "workflows/", "workflow": "workflows/",
        "runs": "actions/runs/", "jobs": "actions/jobs/",
        "artifacts": "artifacts/", "caches": "caches/",
        "runners": "runners/", "secrets": "secrets/", "variables": "variables/",
        "deployments": "deployments/", "environments": "environments/",
        
        // Project Management
        "projects": "projects/", "boards": "projects/",
        "milestones": "milestones/", "labels": "labels/",
        "discussions": "discussions/",
        "inbox": "inbox/", "notifications": "inbox/",
        
        // Settings & Config
        "migrations": "migrations/", "migration": "migrations/",
        "settings": "repository-settings/", "repository-settings": "repository-settings/",
        "repo-settings": "repository-settings/", "custom-properties": "custom-properties/",
        "properties": "custom-properties/", "rules": "rulesets/",
        "rulesets": "rulesets/", "webhooks": "webhooks/", "keys": "deploy-keys/",
        "deploy-keys": "deploy-keys/", "collaborators": "collaborators/",
        "teams": "teams/", "permissions": "permissions/",
        
        // Advanced
        "agents": "agents/", "agent": "agents/",
        "pages": "pages/", "wikis": "wikis/", "wiki": "wikis/",
        "packages": "packages/", "codespaces": "codespaces/",
        "dependency-graph": "dependency-graph/", "dependencies": "dependency-graph/",
        "security": "security/", "alerts": "security-alerts/",
        "security-alerts": "security-alerts/", "code-scanning": "code-scanning/",
        "secret-scanning": "secret-scanning/", "dependabot": "dependabot/",
        "checks": "checks/", "statuses": "statuses/", "traffic": "traffic/",
        "clones": "traffic/clones/", "views": "traffic/views/",
        "stargazers": "stargazers/", "watchers": "watchers/", "subscribers": "watchers/",
        "contributors": "contributors/", "languages": "languages/",
        
        // Git internal
        "git": "git/"
      };

      // Language detection - block PHP
      if (lower.endsWith('.php') || lower.endsWith('.phtml')) {
        return new Response(JSON.stringify({
          blocked: true, file: path, language: "PHP",
          reason: "PHP disabled on Workers",
          bucket: "gitto"
        }, null, 2), { status: 403, headers: { "Content-Type": "application/json" } });
      }

      async function listR2(prefix) {
        if (!bucket) return { error: "R2 bucket 'gitto' not bound" };
        const list = await bucket.list({ prefix, limit: 1000 });
        return list.objects.map(o => ({
          key: o.key,
          size: o.size,
          uploaded: o.uploaded
        }));
      }

      async function getR2(key) {
        if (!bucket) return null;
        const obj = await bucket.get(key);
        if (!obj) return null;
        const text = await obj.text();
        try { return JSON.parse(text); } catch { return text; }
      }

      async function putR2(key, data) {
        if (!bucket) throw new Error("No bucket");
        await bucket.put(key, JSON.stringify(data, null, 2), {
          httpMetadata: { contentType: "application/json" }
        });
        return key;
      }

      // ========== /api/* ROUTER ==========
      if (path.startsWith("/api/")) {
        const parts = path.replace("/api/", "").split('/').filter(Boolean);
        const typeKey = parts[0]?.toLowerCase();
        
        // /api/ overview
        if (!typeKey) {
          const overview = bucket ? await bucket.list({ limit: 100 }) : { objects: [] };
          const counts = {};
          overview.objects.forEach(o => {
            const top = o.key.split('/')[0];
            counts[top] = (counts[top] || 0) + 1;
          });
          return new Response(JSON.stringify({
            bucket: "gitto",
            message: "Gitto - Full GitHub Clone on R2",
            total_objects: overview.objects.length,
            structure: GITTO_TYPES,
            actual_prefix_counts: counts,
            contains: [
              "Repository", "Migration", "Fork", "Issues", "Pull Requests", 
              "Action", "Inbox", "Agents", "Custom Properties", "Repository Setting",
              "Branches", "Commits", "Releases", "Workflows", "Artifacts",
              "Projects", "Discussions", "Packages", "Security", "Wiki", "Pages",
              "and 64+ more..."
            ],
            endpoints: {
              "GET /api/repos": "List repositories",
              "GET /api/forks?repo=name": "List forks",
              "GET /api/issues?repo=name": "Issues",
              "GET /api/pull-requests?repo=name": "PRs",
              "GET /api/actions?repo=name": "Actions",
              "GET /api/inbox": "Inbox/Notifications",
              "GET /api/agents": "Agents",
              "GET /api/custom-properties": "Custom Properties",
              "GET /api/migrations": "Migrations",
              "GET /api/settings?repo=name": "Repo Settings",
              "POST /api/{type}": "Create new entry (body JSON)",
              "GET /git/{repo}.git/info/refs": "Git clone"
            }
          }, null, 2), { status: 200, headers: { "Content-Type": "application/json" } });
        }

        // Resolve R2 prefix
        const prefixBase = GITTO_TYPES[typeKey];
        if (!prefixBase) {
          return new Response(JSON.stringify({
            error: `Unknown type: ${typeKey}`,
            known_types: Object.keys(GITTO_TYPES),
            tip: "Use /api/ to see all 70+ types"
          }, null, 2), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        const repo = url.searchParams.get("repo") || url.searchParams.get("repository") || parts[1];
        const id = url.searchParams.get("id") || parts[2];

        // CREATE - POST
        if (method === "POST" || method === "PUT") {
          try {
            const body = await request.json();
            const keyId = id || body.id || Date.now().toString();
            const repoPart = repo ? `${repo}/` : "";
            const key = `${prefixBase}${repoPart}${keyId}.json`;
            await putR2(key, { ...body, _type: typeKey, _repo: repo || null, _created: new Date().toISOString() });
            return new Response(JSON.stringify({ success: true, bucket: "gitto", key, type: typeKey, repo }), { status: 201, headers: { "Content-Type": "application/json" } });
          } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
          }
        }

        // GET single item
        if (id && repo) {
          const data = await getR2(`${prefixBase}${repo}/${id}.json`) || await getR2(`${prefixBase}${repo}/${id}`);
          if (!data) return new Response(JSON.stringify({ error: "Not found", key: `${prefixBase}${repo}/${id}` }), { status: 404, headers: { "Content-Type": "application/json" } });
          return new Response(JSON.stringify({ bucket: "gitto", type: typeKey, repo, id, data }, null, 2), { status: 200, headers: { "Content-Type": "application/json" } });
        }

        // LIST
        const listPrefix = repo ? `${prefixBase}${repo}/` : prefixBase;
        const items = await listR2(listPrefix);
        
        return new Response(JSON.stringify({
          bucket: "gitto",
          type: typeKey,
          r2_prefix: listPrefix,
          repo: repo || "all",
          count: items.length,
          [typeKey]: items
        }, null, 2), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      // ========== GIT PROTOCOL ==========
      if (path.startsWith("/git/")) {
        const match = path.match(/^\/git\/(.+?\.git)(\/.*)?$/);
        if (!match) return new Response(JSON.stringify({ error: "Invalid git path" }), { status: 400, headers: { "Content-Type": "application/json" } });
        const repoName = match[1];
        const action = match[2] || "";
        if (bucket && action.includes("info/refs")) {
          const obj = await bucket.get(`git/${repoName}/info/refs`);
          if (!obj) return new Response(`Repo ${repoName} not found`, { status: 404 });
          const service = url.searchParams.get("service") || "git-upload-pack";
          return new Response(obj.body, { headers: { "Content-Type": `application/${service}-advertisement`, "Cache-Control": "no-cache" } });
        }
        return new Response(JSON.stringify({ bucket: "gitto", git: true, repo: repoName, clone: `git clone https://${url.hostname}/git/${repoName}` }, null, 2), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      // Static
      if (env.ASSETS) {
        try {
          const asset = await env.ASSETS.fetch(request);
          if (asset.status !== 404) return asset;
        } catch {}
      }

      // Root
      if (path === "/" || path === "/index.html") {
        return new Response(`Hello User! If this response show this means
        the website is perfectly response to worker.`, { status: 200, headers: { "Content-Type": "text/plain" } });
      }

      // 404
      return new Response(`<!DOCTYPE html><html><head><title>404 Gitto</title><style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fafafb} .card{background:#fff;padding:32px;border-radius:16px;max-width:700px;text-align:center} img{max-width:280px}</style></head><body><div class="card"><img src="/photos/404%20error%20with%20a%20tired%20person-rafiki.png" onerror="this.outerHTML='😴'"><h1>404 - ${path}</h1><p>Bucket <b>gitto</b> has 70+ types. Try <a href="/api/">/api/</a></p><a href="/api/" style="background:#111;color:#fff;padding:10px 16px;border-radius:999px;text-decoration:none">View All Types</a></div></body></html>`, {
        status: 404, headers: { "Content-Type": "text/html" }
      });

    } catch (e) {
      return new Response(JSON.stringify({ error: e.message, stack: e.stack }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }
};
