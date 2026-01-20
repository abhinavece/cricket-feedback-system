#!/bin/bash

# Local development script for AI Service
# Usage: ./run-local.sh

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🤖 Starting AI Service locally...${NC}"

# Determine which Python to use (prefer 3.12, fallback to 3.11, avoid 3.14)
PYTHON_CMD=""
if command -v python3.12 &> /dev/null; then
    PYTHON_CMD="python3.12"
    echo -e "${GREEN}✅ Using Python 3.12 (recommended)${NC}"
elif command -v python3.11 &> /dev/null; then
    PYTHON_CMD="python3.11"
    echo -e "${GREEN}✅ Using Python 3.11${NC}"
elif command -v python3.13 &> /dev/null; then
    PYTHON_CMD="python3.13"
    echo -e "${YELLOW}⚠️  Using Python 3.13 (3.12 recommended)${NC}"
elif command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
    PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)
    
    if [ "$PYTHON_MINOR" -ge 14 ]; then
        echo -e "${RED}❌ Python 3.14 detected - not compatible with protobuf/google-generativeai${NC}"
        echo -e "${YELLOW}   Python 3.14 has breaking changes that cause import errors${NC}"
        echo ""
        echo -e "${BLUE}📦 Installing Python 3.12...${NC}"
        if command -v brew &> /dev/null; then
            brew install python@3.12
            if command -v python3.12 &> /dev/null; then
                PYTHON_CMD="python3.12"
                echo -e "${GREEN}✅ Python 3.12 installed successfully${NC}"
            else
                echo -e "${RED}❌ Failed to install Python 3.12${NC}"
                echo -e "${YELLOW}   Please install manually: brew install python@3.12${NC}"
                exit 1
            fi
        else
            echo -e "${RED}❌ Homebrew not found. Please install Python 3.12 manually:${NC}"
            echo -e "${YELLOW}   brew install python@3.12${NC}"
            echo -e "${YELLOW}   Or download from: https://www.python.org/downloads/${NC}"
            exit 1
        fi
    else
        PYTHON_CMD="python3"
        echo -e "${GREEN}✅ Using ${PYTHON_VERSION}${NC}"
    fi
else
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    exit 1
fi

# Set environment variables
export AI_SERVICE_ENABLED="true"
export AI_PROVIDER="google_ai_studio"
export GOOGLE_AI_STUDIO_API_KEY="${GOOGLE_AI_STUDIO_API_KEY:-AIzaSyCDhD-bx8zcbdPPcTmtaKOz3wdBFQP4-tE}"
export DAILY_REQUEST_LIMIT="500"
export MIN_CONFIDENCE_THRESHOLD="0.7"
export LOG_LEVEL="INFO"
export BACKEND_CALLBACK_URL="http://localhost:5001"

echo -e "${BLUE}📋 Configuration:${NC}"
echo -e "   AI_SERVICE_ENABLED: ${AI_SERVICE_ENABLED}"
echo -e "   AI_PROVIDER: ${AI_PROVIDER}"
echo -e "   GOOGLE_AI_STUDIO_API_KEY: ${GOOGLE_AI_STUDIO_API_KEY:0:20}... (hidden)"
echo -e "   DAILY_REQUEST_LIMIT: ${DAILY_REQUEST_LIMIT}"
echo -e "   PORT: 8010"
echo ""

# Check if virtual environment exists and if it needs to be recreated
NEED_NEW_VENV=false
CURRENT_PYTHON=$(${PYTHON_CMD} --version 2>&1 | cut -d' ' -f2)
CURRENT_PYTHON_MINOR=$(echo $CURRENT_PYTHON | cut -d'.' -f2)

if [ ! -d "venv" ]; then
    NEED_NEW_VENV=true
elif [ -d "venv" ]; then
    # Check if venv was created with different Python version
    if [ -f "venv/bin/python" ]; then
        VENV_PYTHON=$(venv/bin/python --version 2>&1 | cut -d' ' -f2)
        VENV_PYTHON_MINOR=$(echo $VENV_PYTHON | cut -d'.' -f2)
        
        # Always recreate if venv is Python 3.14 (incompatible)
        if [ "$VENV_PYTHON_MINOR" -ge 14 ]; then
            echo -e "${YELLOW}⚠️  Virtual environment uses Python 3.14 (incompatible)${NC}"
            echo -e "${YELLOW}   Recreating with ${CURRENT_PYTHON}...${NC}"
            rm -rf venv
            NEED_NEW_VENV=true
        elif [ "$VENV_PYTHON" != "$CURRENT_PYTHON" ]; then
            echo -e "${YELLOW}⚠️  Virtual environment was created with different Python version${NC}"
            echo -e "${YELLOW}   Recreating with ${CURRENT_PYTHON}...${NC}"
            rm -rf venv
            NEED_NEW_VENV=true
        fi
    else
        echo -e "${YELLOW}⚠️  Virtual environment appears corrupted, recreating...${NC}"
        rm -rf venv
        NEED_NEW_VENV=true
    fi
fi

if [ "$NEED_NEW_VENV" = true ]; then
    echo -e "${BLUE}📦 Creating virtual environment with ${PYTHON_CMD}...${NC}"
    ${PYTHON_CMD} -m venv venv
fi

# Activate virtual environment
echo -e "${BLUE}🔌 Activating virtual environment...${NC}"
source venv/bin/activate

# Install/upgrade dependencies
echo -e "${BLUE}📥 Installing/upgrading dependencies...${NC}"
pip install --upgrade pip setuptools wheel

# Install dependencies
echo -e "${BLUE}📦 Installing project dependencies...${NC}"
pip install -r requirements.txt

# Run the service
echo -e "${GREEN}🚀 Starting AI Service on http://localhost:8010${NC}"
echo -e "${BLUE}📖 API Docs: http://localhost:8010/docs${NC}"
echo -e "${BLUE}❤️  Health: http://localhost:8010/health${NC}"
echo -e "${BLUE}📊 Status: http://localhost:8010/status${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

uvicorn app:app --host 0.0.0.0 --port 8010 --reload
