#!/usr/bin/env python3
"""
Git commit and push script for FleetFlow
"""
import subprocess
import sys
import os

def run_command(cmd, description):
    """Run a shell command and return output."""
    print(f"\n{description}...")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd="/workspaces/fleetflow")
        if result.returncode != 0:
            print(f"❌ Error: {result.stderr}")
            return False
        print(f"✅ {result.stdout}")
        return True
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False

def main():
    """Main function."""
    os.chdir("/workspaces/fleetflow")
    
    # Stage files
    files_to_add = [
        "README.md",
        ".env.example", 
        "docker-compose.yml",
        "backend/Dockerfile",
        "frontend/package.json",
        "frontend/Dockerfile"
    ]
    
    print("🚀 Starting FleetFlow git push...\n")
    
    # Add files
    for file in files_to_add:
        if not run_command(f"git add '{file}'", f"Adding {file}"):
            sys.exit(1)
    
    # Check status
    run_command("git status --short", "Current staged files")
    
    # Commit
    commit_msg = """docs: Add comprehensive README with setup instructions and environment config

- Created detailed README.md with prerequisites, quick start guide, manual setup, database migrations
- Added .env.example with all required environment variables
- Created docker-compose.yml for local development (PostgreSQL, backend, frontend)
- Added Dockerfiles for backend (FastAPI) and frontend (Next.js)
- Updated frontend package.json with Next.js and dependencies
- Includes end-to-end POD submission testing guide
- Added API documentation and troubleshooting sections
- Includes deployment guide for production environments"""
    
    if not run_command(f'git commit -m "{commit_msg}"', "Committing changes"):
        sys.exit(1)
    
    # Push
    if not run_command("git push origin main", "Pushing to main branch"):
        sys.exit(1)
    
    print("\n✨ All done! Changes pushed successfully.")
    print("📍 Repository: https://github.com/botmankevo/fleetflow")

if __name__ == "__main__":
    main()
