#!/bin/bash

# Quick Git Credential Commands
# Source this file or add these to your ~/.zshrc or ~/.bashrc

# Quick switch to work credentials
alias git-work='git config --global user.name "aninda" && git config --global user.email "aninda@truxco.energy" && echo "✓ Switched to WORK credentials"'

# Quick switch to personal credentials (you'll need to update these with your personal details)
alias git-personal='git config --global user.name "YOUR_PERSONAL_NAME" && git config --global user.email "YOUR_PERSONAL_EMAIL" && echo "✓ Switched to PERSONAL credentials"'

# Show current git user
alias git-who='echo "Current Git User:" && git config --global user.name && git config --global user.email'

# Quick switch for current repository only
alias git-work-repo='git config user.name "aninda" && git config user.email "aninda@truxco.energy" && echo "✓ Set WORK credentials for this repository"'

# Interactive switcher
alias git-switch='bash $(pwd)/scripts/git-switch.sh'

echo "Git credential aliases loaded!"
echo "Available commands:"
echo "  git-work       - Switch to work credentials globally"
echo "  git-personal   - Switch to personal credentials globally"
echo "  git-who        - Show current git user"
echo "  git-work-repo  - Set work credentials for current repo only"
echo "  git-switch     - Interactive credential switcher"