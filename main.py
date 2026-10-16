# © BlueBixt 2026, All Rights Reserved.
# The License is under MIT see ./License
import argparse
import traceback
import sys
import json
from pathlib import Path

class Repository:
    def __init__(self, path="."):
        self.path = Path(path).resolve() # git init
        self.git_dir = self.path / ".pygit" 
        self.objects_dir = self.git_dir / "objects" # objects
        self.ref_dir = self.git_dir / "refs"
        self.heads_dir = self.ref_dir / "heads"
        self.head_file = self.git_dir / "HEAD"
        self.index_file = self.git_dir / "index"

    def init(self) -> bool:
        if self.git_dir.exists():
            return False

        self.git_dir.mkdir()
        self.objects_dir.mkdir()
        self.ref_dir.mkdir()
        self.heads_dir.mkdir()

        # create initialize HEAD pointing to a branch 
        
        self.head_file.write_text("ref: refs/heads/master\n")
        self.index_file.write_text(json.dumps({}, indent=2))

        print(f"Initialized a empty Git repository in {self.git_dir}")

        return True

        

def main():
    parser = argparse.ArgumentParser(
        description="Gitto - A Git Platform That Sparks A Little Git."
    )
    subparsers = parser.add_subparsers(
        dest="command",
        help="Available Commands",
        required=True
    )

    # init command
    init_parse = subparsers.add_parser("init", help="Initialize a new repository.")
    init_parse = subparsers.add_parser("add", help="")
    args = parser.parse_args()
    if not args.command: 
        parser.print_help()
        return
    
    try:
        print(args.command)

        if args.command == "init":
            repo = Repository()
            if not repo.init():
                print("Repository already exists")
                return
    except Exception as e:
            print(f"ERRCODE1: {e}")
            traceback.print_exc()
            sys.exit(1)
    

     

main()