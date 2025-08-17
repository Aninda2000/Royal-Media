#!/bin/bash

# Enhanced Git Credential Switcher with GitHub CLI support
# This script helps you easily switch between work and personal GitHub credentials

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to display current git config
show_current_config() {
    echo -e "${BLUE}Current Git Configuration:${NC}"
    echo -e "Name: ${GREEN}$(git config --global user.name)${NC}"
    echo -e "Email: ${GREEN}$(git config --global user.email)${NC}"
    
    # Check GitHub CLI status
    if command -v gh &> /dev/null; then
        echo -e "${BLUE}GitHub CLI Status:${NC}"
        gh_status=$(gh auth status 2>&1)
        if echo "$gh_status" | grep -q "Logged in"; then
            gh_user=$(echo "$gh_status" | grep "account" | awk '{print $5}')
            echo -e "Authenticated as: ${GREEN}$gh_user${NC}"
        else
            echo -e "${RED}Not authenticated with GitHub CLI${NC}"
        fi
    else
        echo -e "${YELLOW}GitHub CLI not installed${NC}"
    fi
    echo ""
}

# Function to set work credentials
set_work_credentials() {
    echo -e "${YELLOW}Switching to WORK credentials...${NC}"
    git config --global user.name "aninda"
    git config --global user.email "aninda@truxco.energy"
    
    # Switch GitHub CLI to work account if available
    if command -v gh &> /dev/null; then
        echo -e "${BLUE}Switching GitHub CLI to work account...${NC}"
        gh auth logout 2>/dev/null || true
        echo -e "${YELLOW}Please authenticate with your WORK GitHub account (aninda_truxco)${NC}"
        gh auth login --scopes repo,workflow,gist
    fi
    
    echo -e "${GREEN}✓ Work credentials set successfully!${NC}"
    echo ""
    show_current_config
}

# Function to set personal credentials
set_personal_credentials() {
    echo -e "${YELLOW}Switching to PERSONAL credentials...${NC}"
    
    # Set git config
    git config --global user.name "Aninda2000"
    git config --global user.email "anindaroy100@gmail.com"
    
    # Switch GitHub CLI to personal account if available
    if command -v gh &> /dev/null; then
        echo -e "${BLUE}Switching GitHub CLI to personal account...${NC}"
        gh auth logout 2>/dev/null || true
        echo -e "${YELLOW}Please authenticate with your PERSONAL GitHub account (Aninda2000)${NC}"
        gh auth login --scopes repo,workflow,gist
    fi
    
    echo -e "${GREEN}✓ Personal credentials set successfully!${NC}"
    echo ""
    show_current_config
}

# Function to set credentials for current repository only
set_repo_credentials() {
    echo -e "${YELLOW}Setting credentials for CURRENT REPOSITORY only...${NC}"
    echo -e "${BLUE}Choose credentials type:${NC}"
    echo "1) Work credentials"
    echo "2) Personal credentials"
    echo "3) Custom credentials"
    
    read -p "Enter your choice (1-3): " repo_choice
    
    case $repo_choice in
        1)
            git config user.name "aninda"
            git config user.email "aninda@truxco.energy"
            echo -e "${GREEN}✓ Work credentials set for this repository!${NC}"
            ;;
        2)
            git config user.name "Aninda2000"
            git config user.email "anindaroy100@gmail.com"
            echo -e "${GREEN}✓ Personal credentials set for this repository!${NC}"
            ;;
        3)
            read -p "Enter custom name: " custom_name
            read -p "Enter custom email: " custom_email
            git config user.name "$custom_name"
            git config user.email "$custom_email"
            echo -e "${GREEN}✓ Custom credentials set for this repository!${NC}"
            ;;
        *)
            echo -e "${RED}Invalid choice!${NC}"
            return 1
            ;;
    esac
    
    echo ""
    echo -e "${BLUE}Repository-specific Git Configuration:${NC}"
    echo -e "Name: ${GREEN}$(git config user.name)${NC}"
    echo -e "Email: ${GREEN}$(git config user.email)${NC}"
}

# Function to clear cached credentials
clear_credentials() {
    echo -e "${YELLOW}Clearing cached credentials...${NC}"
    
    # Clear macOS keychain
    security delete-internet-password -s github.com 2>/dev/null && echo -e "${GREEN}✓ Cleared GitHub credentials from keychain${NC}" || echo -e "${BLUE}No GitHub credentials found in keychain${NC}"
    
    # Clear git credential cache
    git config --global --unset-all credential.helper 2>/dev/null || true
    git config --global credential.helper osxkeychain
    
    echo -e "${GREEN}✓ Credential cache cleared${NC}"
    echo ""
}

# Main menu
main_menu() {
    echo -e "${BLUE}=== Enhanced Git Credential Switcher ===${NC}"
    echo ""
    show_current_config
    echo -e "${BLUE}Choose an option:${NC}"
    echo "1) Switch to WORK credentials (global + GitHub CLI)"
    echo "2) Switch to PERSONAL credentials (global + GitHub CLI)"
    echo "3) Set credentials for CURRENT REPOSITORY only"
    echo "4) Show current configuration"
    echo "5) Clear cached credentials"
    echo "6) Exit"
    echo ""
    
    read -p "Enter your choice (1-6): " choice
    
    case $choice in
        1)
            set_work_credentials
            ;;
        2)
            set_personal_credentials
            ;;
        3)
            set_repo_credentials
            ;;
        4)
            show_current_config
            ;;
        5)
            clear_credentials
            ;;
        6)
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice! Please try again.${NC}"
            echo ""
            main_menu
            ;;
    esac
}

# Run the main menu
main_menu