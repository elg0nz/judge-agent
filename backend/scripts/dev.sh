#!/bin/bash
# Development server startup script

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Judge Agent backend development server...${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env from .env.example${NC}"
    cp .env.example .env
    echo -e "${YELLOW}Please update .env with your configuration${NC}"
fi

# Install dependencies if needed
if ! python -c "import fastapi" 2>/dev/null; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    pip install -e ".[dev]"
fi

# Run uvicorn with auto-reload
echo -e "${GREEN}Starting uvicorn on http://localhost:8000${NC}"
echo -e "${GREEN}API docs available at http://localhost:8000/docs${NC}"

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
