#!/usr/bin/env node

/**
 * Deployment Script for Parents Madrasa Portal
 * Usage: node scripts/deploy.js [environment] [--dry-run]
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_DIR = path.dirname(__dirname);
const BUILD_DIR = path.join(PROJECT_DIR, 'dist');
const BACKUP_DIR = path.join(PROJECT_DIR, 'backups');

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Default values
let environment = 'staging';
let dryRun = false;
let skipTests = false;
let skipBuild = false;

// Parse command line arguments
const args = process.argv.slice(2);
args.forEach((arg, index) => {
  switch (arg) {
    case 'production':
    case 'staging':
    case 'development':
      environment = arg;
      break;
    case '--dry-run':
      dryRun = true;
      break;
    case '--skip-tests':
      skipTests = true;
      break;
    case '--skip-build':
      skipBuild = true;
      break;
    case '-h':
    case '--help':
      console.log('Usage: node scripts/deploy.js [environment] [options]');
      console.log('');
      console.log('Environments:');
      console.log('  production    Deploy to production');
      console.log('  staging       Deploy to staging (default)');
      console.log('  development   Deploy to development');
      console.log('');
      console.log('Options:');
      console.log('  --dry-run     Show what would be deployed without actually deploying');
      console.log('  --skip-tests  Skip running tests before deployment');
      console.log('  --skip-build  Skip building the application');
      console.log('  -h, --help    Show this help message');
      process.exit(0);
    default:
      if (!arg.startsWith('--')) {
        console.error(`Unknown option: ${arg}`);
        process.exit(1);
      }
  }
});

// Logging functions
const log = {
  info: (message) => console.log(`${colors.blue}[INFO]${colors.reset} ${message}`),
  success: (message) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`),
  warning: (message) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`),
  error: (message) => console.log(`${colors.red}[ERROR]${colors.reset} ${message}`)
};

// Execute command with error handling
const execCommand = (command, options = {}) => {
  try {
    const result = execSync(command, { 
      stdio: 'inherit', 
      cwd: PROJECT_DIR,
      ...options 
    });
    return result;
  } catch (error) {
    log.error(`Command failed: ${command}`);
    throw error;
  }
};

// Check if required tools are installed
const checkDependencies = () => {
  log.info('Checking dependencies...');
  
  const requiredCommands = ['node', 'npm'];
  const missingDeps = [];
  
  requiredCommands.forEach(cmd => {
    try {
      execSync(`${cmd} --version`, { stdio: 'ignore' });
    } catch (error) {
      missingDeps.push(cmd);
    }
  });
  
  if (missingDeps.length > 0) {
    log.error(`Missing required dependencies: ${missingDeps.join(', ')}`);
    process.exit(1);
  }
  
  log.success('All dependencies are installed');
};

// Validate environment
const validateEnvironment = () => {
  log.info(`Validating environment: ${environment}`);
  
  const envFiles = {
    production: '.env.production',
    staging: '.env.staging',
    development: '.env'
  };
  
  const envFile = envFiles[environment];
  if (envFile && !fs.existsSync(path.join(PROJECT_DIR, envFile))) {
    if (environment === 'development') {
      log.warning(`Development environment file not found: ${envFile}`);
      log.info('Using .env.example as fallback');
    } else {
      log.error(`Environment file not found: ${envFile}`);
      process.exit(1);
    }
  }
  
  log.success('Environment validation passed');
};

// Check git status
const checkGitStatus = () => {
  log.info('Checking git status...');
  
  try {
    // Check if we're in a git repository
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    
    // Check for uncommitted changes
    try {
      execSync('git diff-index --quiet HEAD --', { stdio: 'ignore' });
    } catch (error) {
      log.warning('You have uncommitted changes');
      if (environment === 'production') {
        log.error('Cannot deploy to production with uncommitted changes');
        process.exit(1);
      }
    }
    
    // Check current branch
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    log.info(`Current branch: ${currentBranch}`);
    
    if (environment === 'production' && currentBranch !== 'main') {
      log.error('Production deployments must be from \'main\' branch');
      process.exit(1);
    }
    
    if (environment === 'staging' && !['staging', 'main'].includes(currentBranch)) {
      log.warning('Staging deployments should be from \'staging\' or \'main\' branch');
    }
    
  } catch (error) {
    log.warning('Not in a git repository');
  }
  
  log.success('Git status check passed');
};

// Install dependencies
const installDependencies = () => {
  log.info('Installing dependencies...');
  
  if (!fs.existsSync(path.join(PROJECT_DIR, 'package-lock.json'))) {
    log.warning('package-lock.json not found, running npm install');
    execCommand('npm install');
  } else {
    execCommand('npm ci');
  }
  
  log.success('Dependencies installed');
};

// Run tests
const runTests = () => {
  if (skipTests) {
    log.warning('Skipping tests (--skip-tests flag provided)');
    return;
  }
  
  log.info('Running tests...');
  
  // Type checking
  log.info('Running type checking...');
  execCommand('npm run typecheck');
  
  // Linting
  log.info('Running linter...');
  execCommand('npm run lint');
  
  // Unit tests
  log.info('Running unit tests...');
  execCommand('npm run test');
  
  // Accessibility tests
  log.info('Running accessibility tests...');
  execCommand('npm run test:accessibility');
  
  log.success('All tests passed');
};

// Build application
const buildApplication = () => {
  if (skipBuild) {
    log.warning('Skipping build (--skip-build flag provided)');
    return;
  }
  
  log.info(`Building application for ${environment}...`);
  
  // Copy environment file
  const envFiles = {
    production: '.env.production',
    staging: '.env.staging'
  };
  
  if (envFiles[environment]) {
    const srcFile = path.join(PROJECT_DIR, envFiles[environment]);
    const destFile = path.join(PROJECT_DIR, '.env.local');
    
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, destFile);
    }
  }
  
  // Build
  execCommand(`npm run build`, { env: { ...process.env, NODE_ENV: environment } });
  
  // Verify build output
  if (!fs.existsSync(BUILD_DIR)) {
    log.error(`Build directory not found: ${BUILD_DIR}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(path.join(BUILD_DIR, 'index.html'))) {
    log.error('Build output invalid: index.html not found');
    process.exit(1);
  }
  
  // Get build size
  const stats = fs.statSync(BUILD_DIR);
  log.info(`Build completed successfully`);
  
  log.success('Application built successfully');
};

// Create backup
const createBackup = () => {
  if (dryRun) {
    log.info('[DRY RUN] Would create backup');
    return;
  }
  
  log.info('Creating backup...');
  
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupName = `backup_${environment}_${timestamp}`;
  const backupPath = path.join(BACKUP_DIR, backupName);
  
  // Create backup of current build
  if (fs.existsSync(BUILD_DIR)) {
    fs.cpSync(BUILD_DIR, backupPath, { recursive: true });
    log.success(`Backup created: ${backupPath}`);
  } else {
    log.warning('No existing build to backup');
  }
  
  // Keep only last 5 backups
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(name => name.startsWith('backup_'))
    .map(name => ({
      name,
      path: path.join(BACKUP_DIR, name),
      mtime: fs.statSync(path.join(BACKUP_DIR, name)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime);
  
  if (backups.length > 5) {
    backups.slice(5).forEach(backup => {
      fs.rmSync(backup.path, { recursive: true, force: true });
    });
  }
};

// Deploy to Netlify
const deployNetlify = () => {
  log.info(`Deploying to Netlify (${environment})...`);
  
  if (dryRun) {
    log.info('[DRY RUN] Would deploy to Netlify');
    return;
  }
  
  // Check if Netlify CLI is installed
  try {
    execSync('netlify --version', { stdio: 'ignore' });
  } catch (error) {
    log.info('Installing Netlify CLI...');
    execCommand('npm install -g netlify-cli');
  }
  
  // Deploy based on environment
  const siteIds = {
    production: process.env.NETLIFY_PRODUCTION_SITE_ID,
    staging: process.env.NETLIFY_STAGING_SITE_ID,
    development: process.env.NETLIFY_DEV_SITE_ID
  };
  
  const siteId = siteIds[environment];
  if (!siteId) {
    log.error(`Netlify site ID not configured for ${environment}`);
    log.info(`Please set NETLIFY_${environment.toUpperCase()}_SITE_ID environment variable`);
    process.exit(1);
  }
  
  const deployCommand = environment === 'production' 
    ? `netlify deploy --prod --dir=dist --site=${siteId}`
    : `netlify deploy --dir=dist --site=${siteId}`;
  
  execCommand(deployCommand);
  
  log.success('Deployed to Netlify');
};

// Send notification
const sendNotification = (status, message) => {
  if (dryRun) {
    log.info(`[DRY RUN] Would send notification: ${message}`);
    return;
  }
  
  log.info('Sending notification...');
  
  // This would integrate with your notification service (Slack, Discord, etc.)
  // For now, just log the message
  if (status === 'success') {
    log.success(`Deployment notification: ${message}`);
  } else {
    log.error(`Deployment notification: ${message}`);
  }
};

// Main deployment function
const main = async () => {
  try {
    log.info(`Starting deployment to ${environment}...`);
    
    if (dryRun) {
      log.warning('DRY RUN MODE - No actual changes will be made');
    }
    
    // Pre-deployment checks
    checkDependencies();
    validateEnvironment();
    checkGitStatus();
    
    // Build and test
    installDependencies();
    runTests();
    createBackup();
    buildApplication();
    
    // Deploy
    deployNetlify();
    
    // Notify success
    sendNotification('success', `Deployment to ${environment} completed successfully! 🚀`);
    
    log.success('Deployment completed successfully!');
    
  } catch (error) {
    log.error('Deployment failed!');
    sendNotification('error', `Deployment to ${environment} failed! ❌`);
    process.exit(1);
  }
};

// Run main function
main();