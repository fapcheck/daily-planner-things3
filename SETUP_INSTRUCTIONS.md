# Setup Instructions - Follow These Steps

Your code is already pushed to GitHub! Now complete these 5 simple steps:

## Step 1: Configure GitHub Secrets (2 minutes)

### Option A: Quick Setup - Click this link:
👉 **https://github.com/fapcheck/your-daily-planner/settings/secrets/actions/new**

### Manual Steps:
1. Go to: https://github.com/fapcheck/your-daily-planner/settings/secrets/actions
2. Click **"New repository secret"**
3. Add **Secret 1**:
   - Name: `VITE_SUPABASE_URL`
   - Value: Your Supabase project URL (get from step below)
4. Click **"Add secret"**
5. Click **"New repository secret"** again
6. Add **Secret 2**:
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: Your Supabase anon key (get from step below)
7. Click **"Add secret"**

### How to get Supabase credentials:
1. Go to https://supabase.com/dashboard
2. Click on your project
3. Go to **Settings** → **API** (left sidebar)
4. Copy:
   - **Project URL** → Paste into `VITE_SUPABASE_URL`
   - **anon/public key** → Paste into `VITE_SUPABASE_ANON_KEY`

---

## Step 2: Enable GitHub Pages (1 minute)

👉 **Direct link: https://github.com/fapcheck/your-daily-planner/settings/pages**

Steps:
1. Click the link above
2. Under **"Build and deployment"** → **"Source"**:
   - Select: **Deploy from a branch**
3. Under **"Branch"**:
   - Select branch: `main`
   - Select folder: `root`
4. Click **"Save"**

Your site will be live at: **https://fapcheck.github.io/your-daily-planner/**

---

## Step 3: Test the Build (Optional but recommended)

👉 **Direct link: https://github.com/fapcheck/your-daily-planner/actions**

Steps:
1. Click the link above
2. You should see the "Build and Test" workflow running
3. Wait for it to complete (usually 3-5 minutes)
4. If all checks pass ✅, your setup is working!

---

## Step 4: Create a GitHub Release (2 minutes)

👉 **Direct link: https://github.com/fapcheck/your-daily-planner/releases/new**

Steps:
1. Click the link above
2. Fill in:
   - Choose a tag: Select `v1.0.0`
   - Release title: `Version 1.0.0 - Initial Release`
   - Description:
     ```
     ## Features
     - Task management with multiple views (Inbox, Today, Upcoming, etc.)
     - AI-powered task breakdown and daily planning
     - Project and area management with progress tracking
     - Finance management (transactions, debts, budgets)
     - Offline support with automatic sync
     - Cross-platform (Web, Windows, macOS, Linux)
     
     ## Downloads
     - Windows: MSI and NSIS installers
     - macOS: DMG package
     - Linux: AppImage
     ```
3. Click **"Publish release"**

GitHub will automatically build and attach desktop installers to the release!

---

## Step 5: Verify Everything is Working

### Check Your Repository:
👉 **https://github.com/fapcheck/your-daily-planner**

### Check Your Website (after Step 2):
👉 **https://fapcheck.github.io/your-daily-planner/**

### Check Your Releases (after Step 4):
👉 **https://github.com/fapcheck/your-daily-planner/releases**

### Check Actions:
👉 **https://github.com/fapcheck/your-daily-planner/actions**

---

## Troubleshooting

### Issue: Build fails in Actions
**Solution**: Make sure GitHub Secrets are set correctly (Step 1). Check that you copied the exact values from Supabase.

### Issue: GitHub Pages shows 404
**Solution**: Wait 5-10 minutes after enabling Pages (Step 2). GitHub takes a few minutes to deploy.

### Issue: Desktop installers not attached to release
**Solution**: Make sure you completed Step 4 to create a release. The CI/CD will build installers automatically.

### Issue: Supabase connection error
**Solution**: Verify your `.env` file locally has the same values as your GitHub Secrets.

---

## Quick Reference Links

| Task | Link |
|------|------|
| Repository Home | https://github.com/fapcheck/your-daily-planner |
| Add GitHub Secrets | https://github.com/fapcheck/your-daily-planner/settings/secrets/actions/new |
| GitHub Pages Settings | https://github.com/fapcheck/your-daily-planner/settings/pages |
| Actions/Builds | https://github.com/fapcheck/your-daily-planner/actions |
| Create Release | https://github.com/fapcheck/your-daily-planner/releases/new |
| Your Website | https://fapcheck.github.io/your-daily-planner/ |

---

## What You've Accomplished ✅

- ✅ Project code pushed to GitHub
- ✅ Version 1.0.0 tagged
- ✅ CI/CD workflows configured
- ✅ Documentation complete
- ✅ Ready for deployment

## Next Steps

After completing the 5 steps above:

1. **Share your project** with the world!
2. **Add a description** to your GitHub repository (Settings → General → About)
3. **Create an issue tracker** for feature requests and bugs
4. **Add a project website** or landing page if desired
5. **Start developing** new features!

---

## Need Help?

If you run into any issues:
- Check the Actions tab for error messages
- Review the logs in failed workflows
- Refer to the MIGRATION_GUIDE.md file
- Open an issue in your repository

Good luck! 🚀


