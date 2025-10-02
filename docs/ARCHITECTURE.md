# Plugin Architecture

**Version**: 2a.3.1  
**Target**: Obsidian v1.3.5+

## Dual Rendering Architecture

### Edit Mode (Live Preview / Source)
- **Direct parsing** from CodeMirror state
- Files: `src/theorem-callouts/{state-field,view-plugin}.ts`
- No index involved, real-time parsing

### Reading Mode (Preview / Published)
- **Index-based** retrieval from MathIndex
- Files: `src/theorem-callouts/renderer.ts`
- Pre-built index in memory

**Critical**: Bugs may only appear in one mode. Always test both.

---

## Data Flow (Reading Mode)

```
User Edit → Manager.reload()
  ↓
Web Worker (markdown.ts) → Parse → JsonTheoremCalloutBlock
  ↓
Transferable.transferable() → JSON serialization
  ↓
Main Thread: Transferable.value() → JSON back to main
  ↓
MarkdownPage.from() → TheoremCalloutBlock.from()
  ↓
new TheoremCalloutBlock() → super() → Object.assign(this, init)
  ↓
MathIndex.set() → Store in memory
  ↓
TheoremCalloutRenderer.update() → Display
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/main.ts` | Plugin entry point, registers processors |
| `src/index/manager.ts` | Coordinates file imports, manages index |
| `src/index/import/markdown.ts` | **Web worker** - parses markdown |
| `src/index/typings/markdown.ts` | Class definitions (MarkdownBlock hierarchy) |
| `src/utils/parse.ts` | Parse theorem callout settings from text |
| `src/theorem-callouts/renderer.ts` | Reading mode renderer |
| `tsconfig.json` | **Critical**: `useDefineForClassFields: false` |

---

## Debugging Techniques

### Web Worker Logs Don't Show
**Problem**: `console.log()` in `src/index/import/markdown.ts` doesn't appear in DevTools.  
**Solution**: Test parsing in main thread:
```typescript
// Add temp command in main.ts
const { readTheoremCalloutSettings } = require('./utils/parse');
const settings = readTheoremCalloutSettings(line, false);
console.log('Settings:', settings);
```

### Strategic Logging Points
```typescript
// 1. Manager (before deserialization)
// src/index/manager.ts - reload()
console.log('[Manager] Raw from worker:', result);

// 2. Deserialization (class instantiation)
// src/index/typings/markdown.ts - TheoremCalloutBlock.from()
console.log('[TCB] Input:', object.$settings);
const instance = new TheoremCalloutBlock({...});
console.log('[TCB] Created:', instance.$settings);

// 3. Renderer (display)
// src/theorem-callouts/renderer.ts
console.log('[Renderer]:', block.$settings);
```

### Filter Logs by Context
```typescript
if (file.path.includes('MyNote')) console.log('DEBUG:', data);
if (block.$blockId === 'abc123') console.log('DEBUG:', block);
```

---

## Critical Bug Fix: TypeScript Class Fields

### Problem
TypeScript 5.7+ with `target: "ES2022"` defaults `useDefineForClassFields: true`.

**Behavior**:
```typescript
class Child extends Parent {
    $settings: Type;  // No initializer
}
// Execution order:
// 1. new Child({$settings: {...}})
// 2. super() → Object.assign(this, init) sets $settings ✅
// 3. Constructor returns
// 4. TypeScript: this.$settings = undefined ❌ OVERWRITES!
```

### Solution
**tsconfig.json**:
```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": false  // ← REQUIRED for Object.assign() pattern
  }
}
```

**Defensive** (documents intent, doesn't fix runtime):
```typescript
$settings!: MinimalTheoremCalloutSettings;  // ! = "I will assign this"
```

### Testing
```typescript
// Check deserialization preserves properties
const json = { $settings: {...} };
const instance = TheoremCalloutBlock.from(json, file, normalizer);
console.assert(instance.$settings !== undefined);
```

---

## Theorem Callout Format

```markdown
> [!theorem|title=Pythagorean Theorem|number=1.1]
> For a right triangle: $a^2 + b^2 = c^2$

^block-id
```

**Parsed Settings**:
```typescript
{
  type: "theorem",     // or "lemma", "proposition", etc.
  number: "1.1",       // "auto" | "none" | custom
  title: "Pythagorean Theorem",
  fold: "",            // "" | "a" | "u"
  legacy: false
}
```

**Display**: `{Type} {Number} ({Title})`  
Example: "Theorem 1.1 (Pythagorean Theorem)"

---

## Common Pitfalls

### 1. Properties Undefined After Constructor
**Symptom**: `instance.$settings` is `undefined` despite passing to constructor.  
**Cause**: `useDefineForClassFields: true` (ES2022 default).  
**Fix**: Set `useDefineForClassFields: false` in tsconfig.json.

### 2. Edit Mode Works, Reading Mode Broken
**Cause**: Different code paths. Reading mode uses index deserialization.  
**Debug**: Add logs in `manager.ts` and `TheoremCalloutBlock.from()`.

### 3. Block Not Found in Index
**Causes**:
- File not imported yet (wait for index build)
- Line number mismatch (Obsidian metadata vs actual position)
- Wrong block type (check `block.$type === 'theorem'`)

### 4. Worker Logs Invisible
**Cause**: Web worker runs in isolated context.  
**Fix**: Test parsing logic in main thread or check raw worker result in manager.

---

## Build & Test

```bash
# Build
npm run build

# Type check
npm run tsc

# Watch mode
npm run dev
```

**Always rebuild** after source changes. Plugin won't pick up edits until rebuilt.

---

## Version Compatibility

- **TypeScript**: 5.7.2
- **Node.js**: >=22.0.0
- **Obsidian**: >=1.3.5 (minAppVersion)
- **Target**: ES2022 with `useDefineForClassFields: false`

---

## Quick Reference

### Affected by useDefineForClassFields Bug
- `TheoremCalloutBlock` (primary)
- `EquationBlock`
- All `MarkdownBlock` subclasses
- Any class using `Object.assign(this, init)` in constructor

### Testing Checklist
- [ ] Test in edit mode (live preview)
- [ ] Test in reading mode (preview)
- [ ] Verify `$settings` not `undefined` after deserialization
- [ ] Check theorem subtitle displays correctly
- [ ] Build succeeds without errors
