// © 2026 BlueBixt, All Rights Reserved.
// The license is under MIT.
// Description of the File:
// Deploy to Wrangler with CloudFlare
// Worker.
// BlueBixt <newssungoldentoday@gmail.com>

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
            message: "The official R2 Bucket of Gitto.",
            total_objects: overview.objects.length,
            structure: GITTO_TYPES,
            actual_prefix_counts: counts,
            description: "Gitto is a git platform that are written on PHP and runs on a PHP Framework called Laravel.",
            developed_by: "Developed by Rogge Ramos",
          }, null, 2), { status: 200, headers: { "Content-Type": "application/json" } });
        }

        // Resolve R2 prefix
        const prefixBase = GITTO_TYPES[typeKey];
        if (!prefixBase) {
          return new Response(JSON.stringify({
            error: `Unknown type: ${typeKey}`,
            known_types: Object.keys(GITTO_TYPES),
            tip: "Please go to the official wiki of Gitto."
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
      return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>404 - Not Found | Gitto</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{
    background:#FFF6EE;
    font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
    color:#231C17;
    min-height:100vh;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    text-align:center;
    padding:24px;
  }
  img{
    width:100%;
    max-width:480px;
    height:auto;
    margin-bottom:24px;
  }
  h1{
    font-size:clamp(32px,6vw,48px);
    font-weight:800;
    letter-spacing:-0.03em;
    line-height:1;
  }
  p{
    margin-top:12px;
    font-size:18px;
    color:#8B7566;
    max-width:360px;
    line-height:1.5;
  }
  a{
    margin-top:28px;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    height:48px;
    padding:0 28px;
    border-radius:999px;
    background:#231C17;
    color:#FFF6EE;
    text-decoration:none;
    font-weight:700;
    font-size:15px;
  }
  a:hover{opacity:0.85}
  footer{
    margin-top:40px;
    font-size:12px;
    color:#C2A99A;
  }
</style>
</head>
<body>

  <img src="photos/404 error with a tired person-rafiki.png" alt="404 tired person">

  <h1>404 — File Not Found</h1>
  <p>The page you're looking for is taking a nap. Like this person. 💤</p>

  <a href="/">Go back to Gitto</a>

  <footer>Gitto hit 404!</footer>

</body>
  </html>`, {
        status: 404, headers: { "Content-Type": "text/html" }
      });

    } catch (e) {
      return new Response(JSON.stringify({ error: e.message, stack: e.stack }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }
};
