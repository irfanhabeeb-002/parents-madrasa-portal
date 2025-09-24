const fs = require('fs');
const path = require('path');

function fixRemainingConstIssues() {
  console.log('Fixing remaining const reassignment issues...');
  
  const srcDir = path.join(__dirname, 'src');
  let totalFixed = 0;
  
  // Specific files and patterns that need fixing
  const specificFixes = [
    {
      file: 'contexts/AuthContext.tsx',
      patterns: [
        { from: /(\s+)const\s+(userFriendlyMessage|actionableGuidance)\s*=/, to: '$1let $2 =' }
      ]
    },
    {
      file: 'pages/Profile.tsx',
      patterns: [
        { from: /(\s+)const\s+(errorMessage|actionableGuidance)\s*=/, to: '$1let $2 =' }
      ]
    },
    {
      file: 'components/layout/BottomNavigation.tsx',
      patterns: [
        { from: /(\s+)const\s+(announcement)\s*=/, to: '$1let $2 =' }
      ]
    },
    {
      file: 'components/exercises/EnhancedExerciseComponent.tsx',
      patterns: [
        { from: /(\s+)const\s+(optionClasses)\s*=/, to: '$1let $2 =' }
      ]
    },
    {
      file: 'components/exercises/ExerciseComponent.tsx',
      patterns: [
        { from: /(\s+)const\s+(optionClasses)\s*=/, to: '$1let $2 =' }
      ]
    },
    {
      file: 'services/attendanceService.ts',
      patterns: [
        { from: /(\s+)const\s+(userAttendance)\s*=/, to: '$1let $2 =' }
      ]
    },
    {
      file: 'components/ui/CalendarView.tsx',
      patterns: [
        { from: /(\s+)const\s+(newMonth|newYear)\s*=/, to: '$1let $2 =' }
      ]
    },
    {
      file: 'services/BackupService.ts',
      patterns: [
        { from: /(\s+)const\s+(finalBackupData|deviceId)\s*=/, to: '$1let $2 =' }
      ]
    },
    {
      file: 'services/PerformanceService.ts',
      patterns: [
        { from: /(\s+)const\s+(totalPageLoad|pageLoadCount|clsValue)\s*=/, to: '$1let $2 =' }
      ]
    }
  ];
  
  // Additional patterns to catch any remaining issues
  const globalPatterns = [
    // Variables that are commonly reassigned
    { from: /(\s+)const\s+(filteredClasses|filteredRecordings|filteredNotes|filteredExercises|results|items|recordings|notes|exercises|userAttendance|notifications|processed|failed|totalWarnings|earnedPoints|paginatedNotes|paginatedRecordings|score|value|result|attempts|currentFocusIndex|currentStreak|longestStreak|consecutiveDaysPresent|totalRecords|finalBackupData|deviceId|clsValue|totalPageLoad|pageLoadCount|cleanedCount|total|optionClasses|announcement|errorMessage|actionableGuidance|userFriendlyMessage|newMonth|newYear)\s*=/, to: '$1let $2 =' },
    
    // For loop variables
    { from: /for\s*\(\s*const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, to: 'for (let $1' },
    
    // Loop index variables in any context
    { from: /(\s+)const\s+(i|j|k|index|attempt)\s*=/, to: '$1let $2 =' }
  ];
  
  function fixFile(filePath) {
    if (!fs.existsSync(filePath)) return false;
    
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let modified = false;
    
    // Apply global patterns to all files
    globalPatterns.forEach(pattern => {
      const newContent = content.replace(pattern.from, pattern.to);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  }
  
  function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        processDirectory(fullPath);
      } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
        if (fixFile(fullPath)) {
          console.log(`Fixed: ${path.relative(srcDir, fullPath)}`);
          totalFixed++;
        }
      }
    });
  }
  
  // Apply specific fixes first
  specificFixes.forEach(fix => {
    const filePath = path.join(srcDir, fix.file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      fix.patterns.forEach(pattern => {
        const newContent = content.replace(pattern.from, pattern.to);
        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      });
      
      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed specific patterns in: ${fix.file}`);
        totalFixed++;
      }
    }
  });
  
  // Then apply global fixes
  processDirectory(srcDir);
  
  console.log(`\nTotal files fixed: ${totalFixed}`);
  return totalFixed;
}

// Run the fix
fixRemainingConstIssues();