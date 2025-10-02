# Plugin Testing Guide

## Overview

This guide explains how to manually test the **Obsidian LaTeX-like Theorem & Equation Referencer** plugin in a live Obsidian environment. Manual testing is critical for Obsidian plugins as they interact with the Obsidian app, markdown rendering, and user interactions.

---

## Prerequisites

- **Obsidian Desktop App** installed (download from https://obsidian.md)
- **Node.js 22.17.0+** installed (run `node -v` to check)
- **Built plugin files** (run `npm run build`)
- **Test vault** (a folder with markdown notes for testing)

---

## Quick Setup

### 1. Build the Plugin

```bash
# From project root
npm install
npm run build
```

**Output**: `main.js`, `styles.css`, `manifest.json` in project root

### 2. Install Plugin to Test Vault

**Option A: Symlink (Recommended for Development)**

```bash
# Create/use a test vault folder
mkdir -p ~/ObsidianTestVault/.obsidian/plugins/

# Symlink this project folder into the test vault
ln -s "$(pwd)" ~/ObsidianTestVault/.obsidian/plugins/obsidian-math-booster

# Rebuild on changes (watch mode)
npm run dev
```

**Option B: Copy Files**

```bash
# Copy plugin to vault's plugin folder
mkdir -p ~/ObsidianTestVault/.obsidian/plugins/obsidian-math-booster/
cp main.js styles.css manifest.json ~/ObsidianTestVault/.obsidian/plugins/obsidian-math-booster/
```

### 3. Enable Plugin in Obsidian

1. Open Obsidian
2. **Open the test vault**: `File → Open folder → Select ~/ObsidianTestVault`
3. **Enable Community Plugins**: 
   - `Settings → Community plugins → Turn off Restricted Mode` (if prompted)
4. **Enable this plugin**:
   - `Settings → Community plugins → Installed plugins → Math Booster → Enable`
5. **Configure settings** (optional):
   - `Settings → Math Booster` (configure theorem styles, prefixes, etc.)

---

## Test Plan

### Test 1: Theorem Callouts

**Purpose**: Verify theorem/definition/lemma callouts render correctly

**Steps:**

1. Create a new note: `Test-Theorems.md`
2. Add the following content:

````markdown
# Theorem Callouts Test

> [!theorem] Pythagorean Theorem
> In a right triangle, $a^2 + b^2 = c^2$ where $c$ is the hypotenuse.

> [!definition] Continuous Function
> A function $f$ is continuous at $x = a$ if:
> $$\lim_{x \to a} f(x) = f(a)$$

> [!lemma] Intermediate Lemma
> If $n$ is even, then $n^2$ is even.

> [!proof]
> Assume $n = 2k$ for some integer $k$.
> Then $n^2 = (2k)^2 = 4k^2 = 2(2k^2)$.
> Thus $n^2$ is even. ∎
````

**Expected Results:**
- ✅ Each callout renders with distinct styling (colored boxes)
- ✅ Theorem callouts show automatic numbering (e.g., "Theorem 1")
- ✅ Math equations render correctly using MathJax/KaTeX
- ✅ Proof environment has proper formatting with QED symbol

**Test in Both Views:**
- **Live Preview** (editing mode with rendered callouts)
- **Reading View** (toggle with `Ctrl/Cmd + E`)

---

### Test 2: Equation Numbering

**Purpose**: Verify automatic equation numbering and display equations

**Steps:**

1. Create a new note: `Test-Equations.md`
2. Add the following content:

````markdown
# Equation Numbering Test

Einstein's mass-energy equation:
$$E = mc^2$$

The quadratic formula:
$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$

Maxwell's equations in differential form:
$$\nabla \cdot \mathbf{E} = \frac{\rho}{\epsilon_0}$$

$$\nabla \cdot \mathbf{B} = 0$$

Reference equation (1) here: [[Test-Equations#^equation-1]]
````

**Expected Results:**
- ✅ Each display equation automatically numbered (1), (2), (3), (4)
- ✅ Numbers appear on the right side of equations
- ✅ Equations render properly in both live preview and reading view
- ✅ Block references work (hovering shows equation preview)

**Advanced**: Add equation labels
````markdown
$$E = mc^2$$ ^energy-equation
````

---

### Test 3: Search & Autocomplete

**Purpose**: Verify theorem/equation search and link autocomplete

**Steps:**

1. **Create multiple notes with theorems**:

   `Note-A.md`:
   ```markdown
   > [!theorem] Fermat's Last Theorem
   > No three positive integers satisfy $a^n + b^n = c^n$ for $n > 2$.
   ```

   `Note-B.md`:
   ```markdown
   > [!theorem] Fundamental Theorem of Calculus
   > $$\int_a^b f'(x)dx = f(b) - f(a)$$
   ```

2. **Test Search Modal**:
   - Open command palette: `Ctrl/Cmd + P`
   - Search for: `Math Booster: Search theorems and equations`
   - Type "theorem" in search box

   **Expected**: List of all theorems appears with previews

3. **Test Link Autocomplete**:
   - Create new note `Test-Links.md`
   - Type `[[` to trigger link autocomplete
   - Type "theorem"

   **Expected**: Autocomplete suggestions show theorem callouts with icons/previews

4. **Test Editor Autocomplete** (if enabled in settings):
   - While typing, enter `@` or configured trigger
   - Type "Fermat"

   **Expected**: Inline suggestions for theorem references

---

### Test 4: Cleveref-Style References

**Purpose**: Verify automatic reference formatting (LaTeX \cref{} style)

**Steps:**

1. Create `Test-References.md`:

````markdown
# Cleveref Test

> [!theorem] Main Result
> The function $f$ is continuous.

> [!lemma] Supporting Result  
> The limit exists.

As shown in [[#Main Result]], we can prove [[#Supporting Result]].

Using equation [[Test-Equations#^equation-1]], we derive...
````

2. **Check references**:
   - Hover over links to see preview
   - Click links to navigate

**Expected Results:**
- ✅ Links to theorems show "Theorem 1" instead of raw title
- ✅ Equation links show "(1)" with equation content
- ✅ Hover preview displays the referenced content
- ✅ References automatically update when theorem order changes

---

### Test 5: Settings & Profiles

**Purpose**: Verify plugin settings work correctly

**Steps:**

1. **Open Settings**: `Settings → Math Booster`

2. **Test Global Settings**:
   - Change theorem prefix: `Thm` → `THM`
   - Change numbering format: `1` → `I` (Roman numerals)
   - Apply changes

3. **Create Profile Settings**:
   - Click "Add Profile"
   - Name: "Lecture Notes"
   - Set folder: `/Lectures/`
   - Configure different theorem style (e.g., "framed")

4. **Verify Profile Application**:
   - Create note in `/Lectures/Lecture-1.md`
   - Add theorem callout
   - Verify it uses profile settings (different style/numbering)

**Expected Results:**
- ✅ Global settings apply to all notes by default
- ✅ Profile settings override global for notes in specified folder
- ✅ Changes take effect without restarting Obsidian

---

### Test 6: Multi-line Equations in Blockquotes/Callouts

**Purpose**: Verify equations work inside special environments

**Steps:**

1. Create `Test-Nested.md`:

````markdown
# Nested Equations Test

> Standard blockquote with math:
> $$\int_0^\infty e^{-x} dx = 1$$

> [!note] Callout with equation
> The Fourier transform is defined as:
> $$\hat{f}(\omega) = \int_{-\infty}^{\infty} f(t) e^{-i\omega t} dt$$
````

**Expected Results:**
- ✅ Equations render inside blockquotes
- ✅ Equations render inside callouts (notes, warnings, etc.)
- ✅ No layout issues or broken rendering

---

### Test 7: PDF Export

**Purpose**: Verify plugin works with PDF export

**Steps:**

1. Open note with theorems and equations
2. Export to PDF:
   - Command palette: `Ctrl/Cmd + P`
   - Type: "Export to PDF"
   - Choose location and export

**Expected Results:**
- ✅ Theorems render with proper styling in PDF
- ✅ Equations display correctly with numbering
- ✅ References are clickable (if supported by viewer)
- ✅ No broken layouts or missing content

---

## Common Issues & Debugging

### Plugin Not Loading

**Check Console for Errors:**
1. Open Developer Tools: `Ctrl/Cmd + Shift + I`
2. Go to **Console** tab
3. Look for red error messages from "Math Booster"

**Common Causes:**
- Missing `manifest.json` or `main.js`
- Plugin not enabled in settings
- Outdated Obsidian version (check manifest `minAppVersion`)

### Equations Not Rendering

**Verify MathJax/KaTeX is enabled:**
- `Settings → Editor → Math → Enable MathJax`
- Try different math renderer if available

**Check Syntax:**
- Ensure `$$` on separate lines for display equations
- Ensure `$` inline math doesn't have spaces: `$x^2$` ✅ `$ x^2 $` ❌

### Theorems Not Numbered

**Check Settings:**
- `Settings → Math Booster → Enable automatic numbering`
- Verify theorem callout syntax: `> [!theorem]` (case-sensitive)

**Rebuild Index:**
- Command palette: `Math Booster: Rebuild index`
- Reload Obsidian: `Ctrl/Cmd + R`

### Autocomplete Not Working

**Enable in Settings:**
- `Settings → Math Booster → Enable link autocomplete`
- `Settings → Math Booster → Enable editor autocomplete`

**Check Trigger:**
- Default trigger is `[[` for links
- May need to type a few characters before suggestions appear

---

## Automated Testing (Future Work)

Currently, Obsidian plugins require manual testing due to UI/app integration. Potential automated test approaches:

1. **Unit Tests**: Test utility functions in isolation
   ```bash
   # Example (if test framework added)
   npm test
   ```

2. **Integration Tests**: Mock Obsidian APIs and test plugin logic
3. **E2E Tests**: Use Playwright/Puppeteer with Obsidian app

**Current Limitations:**
- Obsidian API requires full app context (Vault, MetadataCache, Editor)
- No official test framework from Obsidian
- Plugin rendering depends on Electron/browser environment

---

## Performance Testing

### Index Rebuild Speed

**Test Large Vault:**
1. Vault with 1000+ notes
2. Command palette: `Math Booster: Rebuild index`
3. Monitor Developer Console for timing

**Expected**: < 5 seconds for 1000 notes

### Search Responsiveness

**Test Search Speed:**
1. Open search modal with 100+ theorems indexed
2. Type query characters rapidly
3. Observe lag/delay

**Expected**: < 100ms response time

### Memory Usage

**Monitor Plugin Impact:**
1. Open Developer Console → Memory tab
2. Take heap snapshot before enabling plugin
3. Enable plugin and rebuild index
4. Take another heap snapshot
5. Compare memory increase

**Expected**: < 50MB memory increase for typical vault

---

## Reporting Issues

If you find bugs during testing:

1. **Check existing issues**: https://github.com/RyotaUshio/obsidian-latex-theorem-equation-referencer/issues
2. **Gather information**:
   - Obsidian version: `Settings → About`
   - Plugin version: `manifest.json` file
   - Steps to reproduce
   - Developer console errors (if any)
3. **Create minimal example**: Simplest markdown that reproduces the bug
4. **Submit issue** with all information

---

## Development Workflow

### Watch Mode (Hot Reload)

```bash
# Terminal 1: Build on file changes
npm run dev

# Terminal 2: Rebuild CSS on changes
npm run dev-style
```

**Testing Changes:**
1. Edit source files in `src/`
2. Wait for rebuild (automatic)
3. Reload Obsidian: `Ctrl/Cmd + R`
4. Test changes

**Tips:**
- Keep Developer Console open to see errors immediately
- Use `console.log()` for debugging
- Test in both Live Preview and Reading View
- Test with different themes (light/dark)

---

## Checklist Summary

Before releasing a new version, verify:

- [ ] ✅ Theorem callouts render correctly (all types: theorem, definition, lemma, etc.)
- [ ] ✅ Equation numbering works in display math
- [ ] ✅ Search modal finds theorems and equations
- [ ] ✅ Link autocomplete suggests theorems
- [ ] ✅ Cleveref-style references format correctly
- [ ] ✅ Settings changes apply without restart
- [ ] ✅ Profile settings override global settings
- [ ] ✅ Equations render in callouts and blockquotes
- [ ] ✅ PDF export preserves formatting
- [ ] ✅ No console errors in Developer Tools
- [ ] ✅ Works in both Live Preview and Reading View
- [ ] ✅ Performance acceptable on large vaults (1000+ notes)
- [ ] ✅ Memory usage reasonable (< 50MB)

---

## Additional Resources

- **Obsidian Plugin Documentation**: https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin
- **Obsidian API Reference**: https://docs.obsidian.md/Reference/TypeScript+API
- **Plugin GitHub Repository**: https://github.com/RyotaUshio/obsidian-latex-theorem-equation-referencer
- **Obsidian Community Forum**: https://forum.obsidian.md/
