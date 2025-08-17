#!/bin/bash

# Git Credential Switcher
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
    echo ""
}

# Function to set work credentials
set_work_credentials() {
    echo -e "${YELLOW}Switching to WORK credentials...${NC}"
    git config --global user.name "aninda"
    git config --global user.email "aninda@truxco.energy"
    echo -e "${GREEN}✓ Work credentials set successfully!${NC}"
    echo ""
    show_current_config
}

# Function to set personal credentials
set_personal_credentials() {
    echo -e "${YELLOW}Switching to PERSONAL credentials...${NC}"
    echo -e "${BLUE}Please enter your personal GitHub details:${NC}"
    
    read -p "Enter your personal name: " personal_name
    read -p "Enter your personal email: " personal_email
    
    git config --global user.name "$personal_name"
    git config --global user.email "$personal_email"
    
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
            read -p "Enter your personal name: " personal_name
            read -p "Enter your personal email: " personal_email
            git config user.name "$personal_name"
            git config user.email "$personal_email"
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

# Main menu
main_menu() {
    echo -e "${BLUE}=== Git Credential Switcher ===${NC}"
    echo ""
    show_current_config
    echo -e "${BLUE}Choose an option:${NC}"
    echo "1) Switch to WORK credentials (global)"
    echo "2) Switch to PERSONAL credentials (global)"
    echo "3) Set credentials for CURRENT REPOSITORY only"
    echo "4) Show current configuration"
    echo "5) Exit"
    echo ""
    
    read -p "Enter your choice (1-5): " choice
    
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