#!/bin/bash
# Presubmit checks script - runs quality gates before submission

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running presubmit checks...${NC}"

# Check if dependencies are installed
if ! python -c "import mypy" 2>/dev/null; then
    echo -e "${YELLOW}Installing dev dependencies...${NC}"
    pip install -e ".[dev]"
fi

# Run type checking with mypy
echo -e "${YELLOW}Running mypy (type checking)...${NC}"
if mypy app --strict --check-untyped-defs; then
    echo -e "${GREEN}✓ mypy passed${NC}"
else
    echo -e "${RED}✗ mypy failed${NC}"
    exit 1
fi

# Run linting with ruff
echo -e "${YELLOW}Running ruff (linting)...${NC}"
if ruff check app --select E,F,W,I,N,UP,B,A,C4,ISC; then
    echo -e "${GREEN}✓ ruff passed${NC}"
else
    echo -e "${RED}✗ ruff failed${NC}"
    exit 1
fi

# Run security checks with bandit
echo -e "${YELLOW}Running bandit (security checks)...${NC}"
if bandit -r app -ll; then
    echo -e "${GREEN}✓ bandit passed${NC}"
else
    echo -e "${YELLOW}⚠ bandit found issues (check severity)${NC}"
fi

# Run dead code detection with vulture
echo -e "${YELLOW}Running vulture (dead code detection)...${NC}"
if vulture app --min-confidence 80; then
    echo -e "${GREEN}✓ vulture passed${NC}"
else
    echo -e "${YELLOW}⚠ vulture found potential dead code${NC}"
fi

# Run tests
echo -e "${YELLOW}Running pytest...${NC}"
if python -m pytest tests -v; then
    echo -e "${GREEN}✓ pytest passed${NC}"
else
    echo -e "${RED}✗ pytest failed${NC}"
    exit 1
fi

echo -e "${GREEN}All presubmit checks passed!${NC}"
