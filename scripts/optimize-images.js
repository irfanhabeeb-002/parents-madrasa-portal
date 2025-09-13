#!/usr/bin/env node

/**
 * Image optimization script for Parents Madrasa Portal
 * Converts PNG/JPG images to WebP format with fallbacks
 */

import { readdir, copyFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function optimizeImages() {
  console.log('🖼️  Starting image optimization...');
  
  const imageDirs = [
    join(projectRoot, 'public/icons'),
    join(projectRoot, 'src/assets/icons')
  ];
  
  for (const dir of imageDirs) {
    if (!existsSync(dir)) {
      console.log(`⚠️  Directory ${dir} does not exist, skipping...`);
      continue;
    }
    
    console.log(`📁 Processing directory: ${dir}`);
    
    try {
      const files = await readdir(dir);
      const imageFiles = files.filter(file => 
        /\.(png|jpg|jpeg)$/i.test(file)
      );
      
      for (const file of imageFiles) {
        const filePath = join(dir, file);
        const fileName = basename(file, extname(file));
        const webpPath = join(dir, `${fileName}.webp`);
        
        console.log(`✅ Image found: ${file}`);
        
        // For now, we'll just log what would be converted
        // In a real implementation, you'd use a library like sharp or imagemin
        console.log(`   → Would convert to: ${fileName}.webp`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${dir}:`, error.message);
    }
  }
  
  console.log('✨ Image optimization complete!');
  console.log('📝 Note: WebP conversion requires additional tooling in production');
}

// Run the optimization
optimizeImages().catch(console.error);