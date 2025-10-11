# Build Guide

## Quick Reference

### 🚀 Fresh Start (Clean Build)
```bash
npm run fresh-install  # Clean everything + install
npm run build          # Build the plugin
```

### 🔄 Rebuild Project
```bash
npm run clean:build    # Clean build artifacts
npm run build          # Build the plugin
```

### ⚡ Quick Development Check
```bash
npm run quality:all     # Automatically cleans compiled JS + full quality check
```

### 🛠️ Development Workflow
```bash
npm run dev            # Automatically cleans + starts development build (watch mode)
npm run dev:styles     # Start SASS watch (separate terminal)
```

## Commands Explained

| Command | Purpose |
|---------|---------|
| `fresh-install` | Nuclear option: clean everything + reinstall |
| `quality:all` | **Auto-cleans** + runs all quality checks (required before commit) |
| `build` | Production build (bundle + styles) |
| `dev` | **Auto-cleans** + development build with watch mode |
| `lint` | **Auto-cleans** + code linting |
| `verify` | Full verification: fresh install + quality + build |

## Pre-Commit Pipeline
Git commits automatically run:
1. ✨ **Auto-clean compiled JS files**
2. Check TypeScript types
3. Lint code
4. Run tests  
5. Verify build

## Common Issues
- **Lint errors**: Now **automatically resolved** - scripts auto-clean compiled JS
- **Build fails**: Check `npm run check-types` for TypeScript errors
- **Tests fail**: Now **automatically resolved** - tests auto-clean before running
- **Node modules**: Use `npm run fresh-install` for dependency issues

## Dependencies
- Node.js ≥24.0.0
- All dependencies managed via npm (see package.json)