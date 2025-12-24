# OneDrive & Vite Compatibility Issues

## The Problem

OneDrive actively syncs files in your project, which can lock files that Vite needs to modify (like the `.vite` cache directory). This causes `EPERM: operation not permitted` errors.

## Quick Solutions

### Solution 1: Use the Startup Script (Easiest)

Double-click `START_DEV.bat` instead of running `npm run dev`. This script:
- Kills any stuck Node processes
- Cleans the Vite cache
- Starts the dev server

### Solution 2: Pause OneDrive Temporarily

1. Find the OneDrive cloud icon in your Windows system tray (bottom-right)
2. Right-click it
3. Click "Pause syncing" → "2 hours"
4. Run `npm run dev`
5. Resume OneDrive when done working

## Permanent Solutions

### Option A: Move Project Outside OneDrive (Recommended)

Move your project to a location outside OneDrive:

```bash
# Good locations:
C:\Dev\pickle-rally
C:\Projects\pickle-rally
D:\Development\pickle-rally

# Avoid:
C:\Users\nadee\OneDrive\...
```

**Steps:**
1. Close VS Code / terminal
2. Copy the project folder to `C:\Dev\pickle-rally`
3. Open the new location in VS Code
4. Delete the old OneDrive copy (after confirming the new one works)

### Option B: Exclude node_modules from OneDrive

1. Open OneDrive settings (right-click OneDrive icon → Settings)
2. Go to "Backup" → "Manage backup"
3. Choose folders to exclude
4. Or use PowerShell:

```powershell
# Mark node_modules and .vite as OneDrive "online only"
Set-Location "C:\Users\nadee\OneDrive\Desktop\UTA\Fall 2025\KPAK\pickle-rally"
attrib +U node_modules /S /D
attrib +U node_modules\.vite /S /D
```

### Option C: Use .gitignore for OneDrive

Add to `.gitignore` (already done):
```
.vite
node_modules
```

OneDrive should respect `.gitignore`, but it's not always reliable.

## For Development Sessions

**Current workaround:**
1. Pause OneDrive before starting work
2. Use `START_DEV.bat` to start dev server
3. Resume OneDrive after you're done

**Best practice:**
Move the project to `C:\Dev\` or another non-OneDrive location for development.

## Why This Happens

- **Vite** needs to frequently read/write cache files in `node_modules/.vite/`
- **OneDrive** constantly scans and syncs files, locking them temporarily
- **Result**: File permission conflicts when Vite tries to modify locked files

## Additional Tips

1. **Add these to .gitignore** (already added):
   - `node_modules/`
   - `.vite/`
   - `dist/`

2. **Don't commit these to git** - They're build artifacts that shouldn't be synced

3. **Use version control (git)** instead of OneDrive for code backup

4. **OneDrive is great for**:
   - Documents
   - Final builds
   - Documentation

5. **OneDrive is bad for**:
   - Active development
   - node_modules
   - Build caches
   - Frequent file changes
