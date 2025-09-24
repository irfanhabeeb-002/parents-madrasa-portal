const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to fix HTML entities in TypeScript/JavaScript files
function fixHtmlEntities(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
      return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    let changes = 0;
    
    // Fix HTML entities back to proper quotes in code
    const patterns = [
      { from: /&apos;/g, to: "'" },
      { from: /&quot;/g, to: '"' },
      { from: /&ldquo;/g, to: '"' },
      { from: /&rdquo;/g, to: '"' },
      { from: /&lsquo;/g, to: "'" },
      { from: /&rsquo;/g, to: "'" },
    ];
    
    patterns.forEach(pattern => {
      const matches = content.match(pattern.from);
      if (matches) {
        content = content.replace(pattern.from, pattern.to);
        changes += matches.length;
      }
    });
    
    if (changes > 0) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Fixed ${changes} HTML entities in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

// Get all TypeScript and JavaScript files
try {
  const files = execSync('find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx"', { 
    encoding: 'utf8',
    cwd: __dirname 
  }).split('\n').filter(f => f.trim());
  
  files.forEach(fixHtmlEntities);
  console.log('HTML entity fixes completed!');
} catch (error) {
  // Fallback for Windows
  const filesToFix = [
    'src/services/offlineQueue.ts',
    'src/components/exercises/EnhancedExerciseComponent.tsx',
    'src/components/exercises/ExerciseComponent.tsx',
    'src/components/notifications/AnnouncementsBanner.tsx',
    'src/components/pwa/InstallPrompt.tsx',
    'src/components/pwa/SyncStatus.tsx',
    'src/components/recordings/RecordingCard.tsx',
    'src/components/recordings/SearchAndFilter.tsx',
    'src/components/recordings/VideoPlayer.tsx',
    'src/components/ui/CalendarView.tsx',
    'src/components/ui/ExamTimer.tsx',
    'src/components/ui/LazyImage.tsx',
    'src/components/ui/MobileMenu.tsx',
    'src/components/ui/Modal.tsx',
    'src/components/ui/WhatsAppButton.tsx',
    'src/components/zoom/ZoomMeeting.tsx',
    'src/contexts/AuthContext.tsx',
    'src/hooks/useZoom.ts',
    'src/pages/Dashboard.tsx',
    'src/pages/ExamsAttendance.tsx',
    'src/pages/LiveClass.tsx',
    'src/pages/Recordings.tsx',
    'src/services/attendanceService.ts',
    'src/services/BackupService.ts',
    'src/services/PerformanceService.ts',
    'src/services/classService.ts',
    'src/services/dashboardService.ts',
    'src/services/dataImportExport.ts',
    'src/services/errorHandlingService.ts',
    'src/services/searchService.ts',
    'src/services/storageService.ts',
    'src/test/integration/dataOperations.test.ts',
    'src/test/integration/performance.test.ts'
  ];
  
  filesToFix.forEach(fixHtmlEntities);
  console.log('HTML entity fixes completed!');
}