const fs = require('fs');
const path = require('path');

// Function to fix const assignments in a file
function fixConstAssignments(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    let changes = 0;
    
    // Fix const declarations that are later reassigned
    const patterns = [
      // Variables that are reassigned
      { from: /const (filteredClasses|filteredRecordings|filteredNotes|filteredExercises|paginatedRecordings|paginatedNotes) = /g, to: 'let $1 = ' },
      { from: /const (exercises|notes|recordings|results|items) = /g, to: 'let $1 = ' },
      { from: /const (totalRecords|processed|failed|totalWarnings|earnedPoints|cleanedCount|total) = 0;/g, to: 'let $1 = 0;' },
      { from: /const (consecutiveDaysPresent|longestStreak|currentStreak|score|value) = /g, to: 'let $1 = ' },
      { from: /const (notifications) = mockNotifications/g, to: 'let $1 = mockNotifications' },
      
      // For loops with const iterators
      { from: /for \(const (i|j|attempt) = /g, to: 'for (let $1 = ' },
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
      console.log(`Fixed ${changes} const assignment issues in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

// List of files to fix
const filesToFix = [
  'src/services/attendanceService.ts',
  'src/services/classService.ts',
  'src/services/dashboardService.ts',
  'src/services/dataImportExport.ts',
  'src/services/dataManager.ts',
  'src/services/dataSync.ts',
  'src/services/dataValidation.ts',
  'src/services/errorHandlingService.ts',
  'src/services/exerciseService.ts',
  'src/services/noteService.ts',
  'src/services/recordingService.ts',
  'src/services/searchService.ts',
  'src/services/storageService.ts',
  'src/services/zoomRecordingService.ts',
  'src/services/zoomService.ts',
  'src/services/BackupService.ts',
  'src/services/PerformanceService.ts',
  'src/test/integration/dataOperations.test.ts',
  'src/test/integration/performance.test.ts',
  'src/pages/__tests__/Profile.visual.test.tsx',
  'src/services/__tests__/dashboardService.test.ts',
  'src/data/questionsData.ts',
  'src/config/security.ts'
];

// Apply fixes to all files
filesToFix.forEach(fixConstAssignments);

console.log('Const assignment fixes completed!');