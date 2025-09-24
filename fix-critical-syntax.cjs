const fs = require('fs');
const path = require('path');

// Function to fix critical syntax errors
function fixCriticalSyntax(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
      return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    let changes = 0;
    
    // Fix the most critical syntax errors
    const patterns = [
      // Fix broken variable names
      { from: /const _performance\.now\(\)/g, to: 'const startTime' },
      { from: /const performance\.now\(\)/g, to: 'const startTime' },
      { from: /performance\.now\(\): number/g, to: 'startTime: number' },
      { from: /performance\.now\(\): 0/g, to: 'startTime: 0' },
      { from: /performance\.now\(\): 100/g, to: 'startTime: 100' },
      { from: /performance\.now\(\): 50/g, to: 'startTime: 50' },
      
      // Fix broken user references
      { from: /const user\?\.\w+ \|\| ""/g, to: 'const userId' },
      { from: /user\?\.\w+ \|\| "": string/g, to: 'userId: string' },
      { from: /user\?\.\w+ \|\| "": 'test-user'/g, to: 'userId: "test-user"' },
      
      // Fix broken this.backupData references
      { from: /const _this\.backupData/g, to: 'const backupData' },
      
      // Fix broken method signatures
      { from: /trackTiming\(name: string, startTime: number, endTime\?\: number\): void/g, to: 'trackTiming(name: string, startTime: number, endTime?: number): void' },
      
      // Fix broken interface definitions
      { from: /userId\?: string;/g, to: 'userId?: string;' },
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
      console.log(`Fixed ${changes} critical syntax errors in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

// List of files with critical syntax errors
const filesToFix = [
  'src/services/PerformanceService.ts',
  'src/services/searchService.ts',
  'src/services/dataImportExport.ts',
  'src/services/errorHandlingService.ts',
  'src/test/integration/dataOperations.test.ts',
  'src/test/integration/performance.test.ts'
];

// Apply fixes to all files
filesToFix.forEach(fixCriticalSyntax);

console.log('Critical syntax fixes completed!');