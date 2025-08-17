# Git Credential Management

This directory contains scripts to easily switch between different Git credentials (work vs personal).

## Current Work Credentials
- **Name:** aninda
- **Email:** aninda@truxco.energy

## Quick Setup

### Method 1: Interactive Script (Recommended)
```bash
# Run the interactive switcher
./scripts/git-switch.sh
```

### Method 2: Quick Commands
```bash
# Load aliases (run once per terminal session)
source ./scripts/git-aliases.sh

# Then use these commands:
git-work      # Switch to work credentials globally
git-personal  # Switch to personal credentials globally  
git-who       # Show current git user
git-switch    # Run interactive switcher
```

### Method 3: Manual Commands
```bash
# Switch to work credentials
git config --global user.name "aninda"
git config --global user.email "aninda@truxco.energy"

# Switch to personal credentials
git config --global user.name "YOUR_PERSONAL_NAME"
git config --global user.email "YOUR_PERSONAL_EMAIL"

# Set credentials for current repository only (doesn't affect global)
git config user.name "YOUR_NAME"
git config user.email "YOUR_EMAIL"
```

## Permanent Setup (Optional)

To make the aliases available in all terminal sessions, add this to your `~/.zshrc`:

```bash
# Git credential switcher
source /Users/anindasundarroy/Desktop/personal/royal-media/scripts/git-aliases.sh
```

Then reload your shell:
```bash
source ~/.zshrc
```

## SSH Key Management

If you use different SSH keys for work and personal accounts, you might also want to set up SSH config:

```bash
# Edit SSH config
nano ~/.ssh/config
```

Add entries like:
```
# Work GitHub
Host github-work
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_rsa_work

# Personal GitHub  
Host github-personal
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_rsa_personal
```

Then clone repos using:
```bash
git clone git@github-work:company/repo.git
git clone git@github-personal:yourusername/repo.git
```

## Notes

- **Global credentials** affect all repositories on your system
- **Repository-specific credentials** only affect the current repository
- Always verify your credentials before committing: `git config user.email`
- The interactive script will prompt you for personal details when switching to personal credentials