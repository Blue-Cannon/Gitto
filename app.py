# © BlueBixt 2026, All Rights Reserved.
# The License is under MIT see ./License
"""
app.py - Web + CLI entrypoint for Gitto
- Provides a minimal Repository implementation (stored under .pygit)
- Exposes simple HTTP API endpoints (Flask) so this repository can be deployed on Vercel
- Preserves the original CLI behavior when invoked directly
"""

from pathlib import Path
import json
import traceback
import sys
import argparse
from flask import Flask, request, jsonify

app = Flask(__name__)

class Repository:
    def __init__(self, path="."):
        self.path = Path(path).resolve()
        self.git_dir = self.path / ".pygit"
        self.objects_dir = self.git_dir / "objects"
        self.ref_dir = self.git_dir / "refs"
        self.heads_dir = self.ref_dir / "heads"
        self.head_file = self.git_dir / "HEAD"
        self.index_file = self.git_dir / "index"

    def init(self) -> bool:
        """Initialize a new repository. Returns True if created, False if already exists."""
        if self.git_dir.exists():
            return False

        # create directories (parents True for safety)
        self.objects_dir.mkdir(parents=True, exist_ok=True)
        self.heads_dir.mkdir(parents=True, exist_ok=True)

        # write HEAD and index
        self.git_dir.mkdir(parents=True, exist_ok=True)
        self.head_file.write_text("ref: refs/heads/master\n")
        self.index_file.write_text(json.dumps({}, indent=2))

        return True

    def status(self) -> dict:
        """Return a simple status dictionary describing repository state."""
        return {
            "path": str(self.path),
            "git_dir": str(self.git_dir),
            "initialized": self.git_dir.exists(),
            "has_HEAD": self.head_file.exists(),
            "index_exists": self.index_file.exists()
        }

    def add(self, file_path: str, content: str = None) -> dict:
        """Add a file to the index. This is a minimal in-repo index stored as JSON.
        If content is provided, write/overwrite the working file as well.
        Returns the updated index mapping.
        """
        if not self.git_dir.exists():
            raise RuntimeError("Repository not initialized. Call init() first.")

        # ensure the working file's parent exists
        target = self.path / file_path
        if content is not None:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content)

        # load index
        idx = {}
        if self.index_file.exists():
            try:
                idx = json.loads(self.index_file.read_text())
            except Exception:
                idx = {}

        idx[file_path] = {
            "path": file_path,
            "staged": True
        }

        self.index_file.write_text(json.dumps(idx, indent=2))
        return idx

    def read_index(self) -> dict:
        if not self.index_file.exists():
            return {}
        try:
            return json.loads(self.index_file.read_text())
        except Exception:
            return {}


# HTTP API endpoints for simple operations. These are intentionally tiny and aim to provide a deployable surface for Vercel. The Vercel Python builder can deploy a single app.py as a serverless function.

@app.route("/api/init", methods=["POST"])
def http_init():
    payload = request.get_json(silent=True) or {}
    path = payload.get("path", ".")
    repo = Repository(path)
    try:
        created = repo.init()
        return jsonify({"created": created, "status": repo.status()}), 201 if created else 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/status", methods=["GET"])
def http_status():
    path = request.args.get("path", ".")
    repo = Repository(path)
    return jsonify(repo.status())

@app.route("/api/add", methods=["POST"])
def http_add():
    payload = request.get_json(silent=True) or {}
    path = payload.get("repo_path", ".")
    file_path = payload.get("file_path")
    content = payload.get("content")

    if not file_path:
        return jsonify({"error": "file_path is required"}), 400

    repo = Repository(path)
    try:
        idx = repo.add(file_path, content)
        return jsonify({"index": idx})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def cli_main():
    parser = argparse.ArgumentParser(description="Gitto - A Git Platform That Sparks A Little Git.")
    subparsers = parser.add_subparsers(dest="command", help="Available Commands", required=True)

    init_parser = subparsers.add_parser("init", help="Initialize a new repository.")
    init_parser.add_argument("path", nargs="?", default=".")

    add_parser = subparsers.add_parser("add", help="Add a file to index.")
    add_parser.add_argument("file_path")
    add_parser.add_argument("--repo-path", default=".")
    add_parser.add_argument("--content", default=None)

    args = parser.parse_args()
    if args.command == "init":
        repo = Repository(args.path)
        if not repo.init():
            print("Repository already exists")
            return
        print(f"Initialized a empty Git repository in {repo.git_dir}")

    if args.command == "add":
        repo = Repository(args.repo_path)
        try:
            idx = repo.add(args.file_path, args.content)
            print("Added to index:")
            print(json.dumps(idx, indent=2))
        except Exception as e:
            print(f"ERR: {e}")
            traceback.print_exc()
            sys.exit(1)


# keep compatibility with previous main.py by exposing a main function
def main():
    cli_main()


if __name__ == "__main__":
    # If invoked as a server process, start Flask development server.
    # On Vercel the builder will import this file instead of running it.
    try:
        # If any CLI args were provided, treat it as CLI invocation
        if len(sys.argv) > 1:
            cli_main()
        else:
            # start simple Flask server for local testing
            app.run(host="0.0.0.0", port=8000, debug=True)
    except Exception as e:
        print(f"ERRCODE_RUNTIME: {e}")
        traceback.print_exc()
        sys.exit(1)
