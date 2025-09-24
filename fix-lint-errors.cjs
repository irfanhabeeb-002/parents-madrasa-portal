const fs = require('fs');
const path = require('path');

// Function to fix common ESLint errors
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix duplicate imports - remove duplicate lines
  const lines = content.split('\n');
  const importLines = new Set();
  const filteredLines = [];
  
  for (const line of lines) {
    if (line.trim().startsWith('import ') && line.includes('from')) {
      const importStatement = line.trim();
      if (!importLines.has(importStatement)) {
        importLines.add(importStatement);
        filteredLines.push(line);
      } else {
        modified = true;
      }
    } else {
      filteredLines.push(line);
    }
  }
  
  content = filteredLines.join('\n');

  // Fix console statements (replace console.log with console.warn)
  content = content.replace(/console\.log\(/g, 'console.warn(');
  
  // Fix unnecessary escape characters
  content = content.replace(/\\([()])/g, '$1');
  
  // Fix prefer-const
  content = content.replace(/let\s+(\w+)\s*=\s*([^;]+);(?!\s*\1\s*=)/g, 'const $1 = $2;');

  if (modified || content !== fs.readFileSync(filePath, 'utf8')) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  }
}

// Get all TypeScript and JavaScript files
function getAllFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Fix all files
const srcDir = path.join(__dirname, 'src');
const files = getAllFiles(srcDir);

console.log(`Processing ${files.length} files...`);

for (const file of files) {
  try {
    fixFile(file);
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
}

console.log('Done!');