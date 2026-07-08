# Install Deta Space CLI - Manual Steps

## ⚠️ Important: Use the Correct CLI

We need **Deta Space CLI** (NOT "space-cli" for Space Cloud, and NOT the old "deta" CLI)

## Installation Method 1: WinGet (Easiest)

Open PowerShell or Command Prompt and run:

```cmd
winget install --id Deta.Space.CLI
```

Wait for installation to complete, then verify:

```cmd
space --version
```

## Installation Method 2: Direct Download

If winget doesn't work:

1. Go to: https://github.com/deta/space-cli/releases/latest
2. Download: `space-cli-windows-amd64.exe`
3. Rename it to: `space.exe`
4. Move it to: `C:\Windows\System32\` (requires admin)
5. Open a NEW Command Prompt and run: `space --version`

## Installation Method 3: PowerShell Script

```powershell
iwr https://deta.space/assets/space-cli.ps1 -useb | iex
```

Then close and reopen your terminal.

## Verification

After installation, run:

```cmd
space --version
```

You should see something like:
```
Space CLI v0.x.x
```

## Next Step

Once installed, tell me "CLI installed" and I'll continue with the deployment!

---

**Having trouble?** Let me know which error you're getting.
