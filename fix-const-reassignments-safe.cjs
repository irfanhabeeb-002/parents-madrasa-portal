const fs = require('fs');
const path = require('path');

function fixConstReassignments() {
  console.log('Starting safe const reassignment fixes...');
  
  const srcDir = path.join(__dirname, 'src');
  let totalFixed = 0;
  
  function analyzeAndFixFile(filePath) {
    if (!fs.existsSync(filePath)) return false;
    
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let modified = false;
    
    // Split content into lines for easier analysis
    const lines = content.split('\n');
    const modifiedLines = [...lines];
    
    // Track variables declared as const
    const constVariables = new Map();
    
    // First pass: identify const declarations
    lines.forEach((line, index) => {
      // Match const declarations (but not imports, exports, or type definitions)
      const constMatch = line.match(/^(\s*)const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(.+);?\s*$/);
      if (constMatch && !line.includes('import') && !line.includes('export') && !line.includes('interface') && !line.includes('type ')) {
        const [, indent, varName, value] = constMatch;
        
        // Skip if it's clearly a constant (uppercase, function, component, or literal)
        if (varName === varName.toUpperCase() || 
            value.includes('=>') || 
            value.includes('function') ||
            value.match(/^[A-Z][a-zA-Z]*$/) ||
            value.match(/^['"`]/) ||
            value.match(/^\d+$/) ||
            value.includes('React.') ||
            value.includes('useState') ||
            value.includes('useCallback') ||
            value.includes('useMemo') ||
            value.includes('useRef')) {
          return;
        }
        
        constVariables.set(varName, { index, indent, value, line });
      }
    });
    
    // Second pass: check for reassignments
    const reassignedVars = new Set();
    
    lines.forEach((line, index) => {
      constVariables.forEach((info, varName) => {
        // Skip the declaration line itself
        if (index === info.index) return;
        
        // Check for various reassignment patterns
        const reassignmentPatterns = [
          new RegExp(`^\\s*${varName}\\s*=\\s*[^=]`), // Direct assignment
          new RegExp(`^\\s*${varName}\\s*\\+=`), // Addition assignment
          new RegExp(`^\\s*${varName}\\s*-=`), // Subtraction assignment
          new RegExp(`^\\s*${varName}\\s*\\*=`), // Multiplication assignment
          new RegExp(`^\\s*${varName}\\s*/=`), // Division assignment
          new RegExp(`\\+\\+${varName}`), // Pre-increment
          new RegExp(`${varName}\\+\\+`), // Post-increment
          new RegExp(`--${varName}`), // Pre-decrement
          new RegExp(`${varName}--`), // Post-decrement
        ];
        
        if (reassignmentPatterns.some(pattern => pattern.test(line))) {
          reassignedVars.add(varName);
        }
      });
    });
    
    // Third pass: fix for-loop const declarations
    lines.forEach((line, index) => {
      const forLoopMatch = line.match(/^(\s*)for\s*\(\s*const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
      if (forLoopMatch) {
        const [, indent, varName] = forLoopMatch;
        modifiedLines[index] = line.replace(`const ${varName}`, `let ${varName}`);
        modified = true;
      }
    });
    
    // Fourth pass: apply fixes for reassigned variables
    reassignedVars.forEach(varName => {
      const info = constVariables.get(varName);
      if (info) {
        const newLine = info.line.replace(`const ${varName}`, `let ${varName}`);
        modifiedLines[info.index] = newLine;
        modified = true;
      }
    });
    
    if (modified) {
      const newContent = modifiedLines.join('\n');
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Fixed const reassignments in: ${path.relative(srcDir, filePath)}`);
      console.log(`  Variables changed to let: ${Array.from(reassignedVars).join(', ')}`);
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
        if (analyzeAndFixFile(fullPath)) {
          totalFixed++;
        }
      }
    });
  }
  
  processDirectory(srcDir);
  console.log(`\nTotal files fixed: ${totalFixed}`);
  
  return totalFixed;
}

// Run the fix
fixConstReassignments();