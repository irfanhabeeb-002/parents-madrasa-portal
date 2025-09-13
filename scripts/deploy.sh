#!/bin/bash

# Deployment Script for Parents Madrasa Portal
# Usage: ./scripts/deploy.sh [environment] [--dry-run]

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_DIR/dist"
BACKUP_DIR="$PROJECT_DIR/backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="staging"
DRY_RUN=false
SKIP_TESTS=false
SKIP_BUILD=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    production|staging|development)
      ENVIRONMENT="$1"
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [environment] [options]"
      echo ""
      echo "Environments:"
      echo "  production    Deploy to production"
      echo "  staging       Deploy to staging (default)"
      echo "  development   Deploy to development"
      echo ""
      echo "Options:"
      echo "  --dry-run     Show what would be deployed without actually deploying"
      echo "  --skip-tests  Skip running tests before deployment"
      echo "  --skip-build  Skip building the application"
      echo "  -h, --help    Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Logging functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
  log_info "Checking dependencies..."
  
  local missing_deps=()
  
  if ! command -v node &> /dev/null; then
    missing_deps+=("node")
  fi
  
  if ! command -v npm &> /dev/null; then
    missing_deps+=("npm")
  fi
  
  if ! command -v git &> /dev/null; then
    missing_deps+=("git")
  fi
  
  if [ ${#missing_deps[@]} -ne 0 ]; then
    log_error "Missing required dependencies: ${missing_deps[*]}"
    exit 1
  fi
  
  log_success "All dependencies are installed"
}

# Validate environment
validate_environment() {
  log_info "Validating environment: $ENVIRONMENT"
  
  case $ENVIRONMENT in
    production)
      if [ ! -f "$PROJECT_DIR/.env.production" ]; then
        log_error "Production environment file not found: .env.production"
        exit 1
      fi
      ;;
    staging)
      if [ ! -f "$PROJECT_DIR/.env.staging" ]; then
        log_error "Staging environment file not found: .env.staging"
        exit 1
      fi
      ;;
    development)
      if [ ! -f "$PROJECT_DIR/.env" ]; then
        log_warning "Development environment file not found: .env"
        log_info "Using .env.example as fallback"
      fi
      ;;
  esac
  
  log_success "Environment validation passed"
}

# Check git status
check_git_status() {
  log_info "Checking git status..."
  
  cd "$PROJECT_DIR"
  
  # Check if we're in a git repository
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_warning "Not in a git repository"
    return
  fi
  
  # Check for uncommitted changes
  if ! git diff-index --quiet HEAD --; then
    log_warning "You have uncommitted changes"
    if [ "$ENVIRONMENT" = "production" ]; then
      log_error "Cannot deploy to production with uncommitted changes"
      exit 1
    fi
  fi
  
  # Check current branch
  local current_branch=$(git branch --show-current)
  log_info "Current branch: $current_branch"
  
  case $ENVIRONMENT in
    production)
      if [ "$current_branch" != "main" ]; then
        log_error "Production deployments must be from 'main' branch"
        exit 1
      fi
      ;;
    staging)
      if [ "$current_branch" != "staging" ] && [ "$current_branch" != "main" ]; then
        log_warning "Staging deployments should be from 'staging' or 'main' branch"
      fi
      ;;
  esac
  
  log_success "Git status check passed"
}

# Install dependencies
install_dependencies() {
  log_info "Installing dependencies..."
  
  cd "$PROJECT_DIR"
  
  if [ ! -f "package-lock.json" ]; then
    log_warning "package-lock.json not found, running npm install"
    npm install
  else
    npm ci
  fi
  
  log_success "Dependencies installed"
}

# Run tests
run_tests() {
  if [ "$SKIP_TESTS" = true ]; then
    log_warning "Skipping tests (--skip-tests flag provided)"
    return
  fi
  
  log_info "Running tests..."
  
  cd "$PROJECT_DIR"
  
  # Type checking
  log_info "Running type checking..."
  npm run typecheck
  
  # Linting
  log_info "Running linter..."
  npm run lint
  
  # Unit tests
  log_info "Running unit tests..."
  npm run test
  
  # Accessibility tests
  log_info "Running accessibility tests..."
  npm run test:accessibility
  
  log_success "All tests passed"
}

# Build application
build_application() {
  if [ "$SKIP_BUILD" = true ]; then
    log_warning "Skipping build (--skip-build flag provided)"
    return
  fi
  
  log_info "Building application for $ENVIRONMENT..."
  
  cd "$PROJECT_DIR"
  
  # Copy environment file
  case $ENVIRONMENT in
    production)
      cp .env.production .env.local
      ;;
    staging)
      cp .env.staging .env.local
      ;;
  esac
  
  # Build
  NODE_ENV=$ENVIRONMENT npm run build
  
  # Verify build output
  if [ ! -d "$BUILD_DIR" ]; then
    log_error "Build directory not found: $BUILD_DIR"
    exit 1
  fi
  
  if [ ! -f "$BUILD_DIR/index.html" ]; then
    log_error "Build output invalid: index.html not found"
    exit 1
  fi
  
  # Get build size
  local build_size=$(du -sh "$BUILD_DIR" | cut -f1)
  log_info "Build size: $build_size"
  
  log_success "Application built successfully"
}

# Create backup
create_backup() {
  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would create backup"
    return
  fi
  
  log_info "Creating backup..."
  
  mkdir -p "$BACKUP_DIR"
  
  local timestamp=$(date +"%Y%m%d_%H%M%S")
  local backup_name="backup_${ENVIRONMENT}_${timestamp}"
  local backup_path="$BACKUP_DIR/$backup_name"
  
  # Create backup of current build
  if [ -d "$BUILD_DIR" ]; then
    cp -r "$BUILD_DIR" "$backup_path"
    log_success "Backup created: $backup_path"
  else
    log_warning "No existing build to backup"
  fi
  
  # Keep only last 5 backups
  cd "$BACKUP_DIR"
  ls -t | tail -n +6 | xargs -r rm -rf
}

# Deploy to Vercel
deploy_vercel() {
  log_info "Deploying to Vercel ($ENVIRONMENT)..."
  
  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would deploy to Vercel"
    return
  fi
  
  cd "$PROJECT_DIR"
  
  # Check if Vercel CLI is installed
  if ! command -v vercel &> /dev/null; then
    log_info "Installing Vercel CLI..."
    npm install -g vercel
  fi
  
  # Deploy based on environment
  case $ENVIRONMENT in
    production)
      vercel --prod
      ;;
    *)
      vercel
      ;;
  esac
  
  log_success "Deployed to Vercel"
}

# Run post-deployment tests
run_post_deployment_tests() {
  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would run post-deployment tests"
    return
  fi
  
  log_info "Running post-deployment tests..."
  
  cd "$PROJECT_DIR"
  
  case $ENVIRONMENT in
    production)
      if command -v playwright &> /dev/null; then
        npm run test:smoke:production
      else
        log_warning "Playwright not installed, skipping smoke tests"
      fi
      ;;
    staging)
      if command -v playwright &> /dev/null; then
        npm run test:e2e:staging
      else
        log_warning "Playwright not installed, skipping E2E tests"
      fi
      ;;
  esac
  
  log_success "Post-deployment tests completed"
}

# Send notification
send_notification() {
  local status=$1
  local message=$2
  
  if [ "$DRY_RUN" = true ]; then
    log_info "[DRY RUN] Would send notification: $message"
    return
  fi
  
  log_info "Sending notification..."
  
  # This would integrate with your notification service (Slack, Discord, etc.)
  # For now, just log the message
  if [ "$status" = "success" ]; then
    log_success "Deployment notification: $message"
  else
    log_error "Deployment notification: $message"
  fi
}

# Main deployment function
main() {
  log_info "Starting deployment to $ENVIRONMENT..."
  
  if [ "$DRY_RUN" = true ]; then
    log_warning "DRY RUN MODE - No actual changes will be made"
  fi
  
  # Pre-deployment checks
  check_dependencies
  validate_environment
  check_git_status
  
  # Build and test
  install_dependencies
  run_tests
  create_backup
  build_application
  
  # Deploy
  deploy_vercel
  run_post_deployment_tests
  
  # Notify success
  send_notification "success" "Deployment to $ENVIRONMENT completed successfully! 🚀"
  
  log_success "Deployment completed successfully!"
}

# Error handling
trap 'log_error "Deployment failed!"; send_notification "error" "Deployment to $ENVIRONMENT failed! ❌"; exit 1' ERR

# Run main function
main "$@"