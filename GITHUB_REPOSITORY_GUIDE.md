# GitHub Repository Guide

## ✅ Files that SHOULD be in your GitHub repository:

### Core Application Files

- `src/` - All source code files
- `public/` - Static assets and PWA files
- `index.html` - Main HTML file
- `package.json` - Dependencies and scripts
- `package-lock.json` - Locked dependency versions

### Configuration Files

- `.env.example` - Template for environment variables (NO SECRETS)
- `vite.config.ts` - Build configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `vitest.config.ts` - Test configuration
- `eslint.config.js` - Linting configuration
- `.prettierrc` - Code formatting configuration
- `.prettierignore` - Files to ignore for formatting
- `.lintstagedrc.json` - Pre-commit hook configuration

### Deployment and CI/CD

- `.github/workflows/` - GitHub Actions workflows
- `vercel.json` - Vercel deployment configuration
- `lighthouserc.js` - Performance testing configuration
- `scripts/` - Deployment and utility scripts
- `Dockerfile` - Docker configuration
- `.dockerignore` - Docker ignore file

### Documentation

- `README.md` - Project documentation
- `DEPLOYMENT_CHECKLIST.md` - Production deployment guide
- `FIREBASE_SETUP.md` - Firebase setup instructions
- `*.md` files - All documentation files

### Firebase Configuration

- `firestore.rules` - Firestore security rules
- `storage.rules` - Firebase Storage security rules

### Git Configuration

- `.gitignore` - Files to ignore in git
- `.husky/` - Git hooks configuration

## ❌ Files that should NOT be in your GitHub repository:

### Environment Variables (SENSITIVE DATA)

- `.env` - Contains actual API keys and secrets
- `.env.local` - Local environment overrides
- `.env.production` - Production credentials
- `.env.staging` - Staging credentials
- `.env.development.local` - Development overrides
- `.env.test.local` - Test environment overrides

### Build Artifacts

- `dist/` - Production build output
- `build/` - Alternative build directory
- `node_modules/` - Dependencies (managed by npm)
- `coverage/` - Test coverage reports

### Temporary and Cache Files

- `.cache/` - Build cache
- `.vite/` - Vite cache
- `*.log` - Log files
- `*.tmp` - Temporary files
- `backups/` - Local backup files
- `lighthouse-reports/` - Performance test reports

### IDE and OS Files

- `.vscode/` - VS Code settings (except extensions.json)
- `.idea/` - IntelliJ IDEA settings
- `.DS_Store` - macOS system files
- `Thumbs.db` - Windows system files
- `*.swp`, `*.swo` - Vim swap files

## 🔧 Commands to clean up your repository:

If you've already pushed sensitive files, run these commands:

```bash
# Remove files from git history (DANGEROUS - creates new history)
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env .env.production .env.staging' \
  --prune-empty --tag-name-filter cat -- --all

# Force push the cleaned history (WARNING: This rewrites history)
git push origin --force --all

# Alternative safer approach - just remove from current commit
git rm --cached .env .env.production .env.staging
git commit -m "Remove sensitive environment files"
git push
```

## 🛡️ Security Best Practices:

### 1. Environment Variables

- Never commit actual API keys or secrets
- Use `.env.example` as a template
- Set environment variables in your deployment platform (Vercel, etc.)
- Use different credentials for development, staging, and production

### 2. Firebase Configuration

- Use separate Firebase projects for dev/staging/production
- Keep Firebase service account keys out of the repository
- Use Firebase security rules to protect data

### 3. API Keys

- Rotate any API keys that were accidentally committed
- Use environment variables for all sensitive configuration
- Consider using secret management services for production

## 📝 Current Repository Status:

After running the cleanup, your repository should contain:

```
parents-madrasa-portal/
├── .github/workflows/          # CI/CD pipelines
├── .husky/                     # Git hooks
├── public/                     # Static assets
├── scripts/                    # Deployment scripts
├── src/                        # Source code
│   ├── components/
│   ├── config/
│   ├── contexts/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   ├── types/
│   └── utils/
├── .dockerignore
├── .env.example               # Template only
├── .gitignore
├── .lintstagedrc.json
├── .prettierignore
├── .prettierrc
├── DEPLOYMENT_CHECKLIST.md
├── Dockerfile
├── eslint.config.js
├── firestore.rules
├── index.html
├── lighthouserc.js
├── vercel.json
├── package.json
├── package-lock.json
├── README.md
├── storage.rules
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── [other documentation files]
```

## 🚀 Next Steps:

1. **Update your `.gitignore`** (already done)
2. **Remove sensitive files** (already done)
3. **Create environment files locally** for development:
   ```bash
   cp .env.example .env
   # Edit .env with your development credentials
   ```
4. **Set up environment variables** in your deployment platform
5. **Rotate any API keys** that were accidentally committed
6. **Test your application** to ensure it still works

## 🔄 Regular Maintenance:

- Review `.gitignore` regularly
- Audit commits before pushing
- Use pre-commit hooks to prevent sensitive data commits
- Regularly rotate API keys and credentials
- Keep documentation up to date

Remember: **Never commit sensitive data to version control!**
