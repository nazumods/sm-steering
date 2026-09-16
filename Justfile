# sm-steering - Ackermann steering calculator for Scrap Mechanic vehicles
# Requires: just, node >= 24, npm

default:
    @just --list

# Install dependencies
install:
    npm ci

# Dev server at http://localhost:5173
dev:
    npm run dev

# Type-check + production build to dist/
build:
    npm run build

# Run all checks (lint + typecheck + test)
check: lint typecheck test

# Lint and check formatting
lint:
    npm run lint

# Fix lint and formatting issues
fix:
    npm run fix

# Type-check
typecheck:
    npm run typecheck

# Run tests
test:
    npm test

# Remove build artifacts and node_modules
clean:
    rm -rf node_modules dist

# Reinstall from scratch
fresh: clean install
