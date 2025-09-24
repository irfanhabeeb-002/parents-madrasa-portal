import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a comprehensive _headers file
const headersContent = `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin

/*.js
  Content-Type: application/javascript; charset=utf-8
  Cache-Control: public, max-age=31536000, immutable

/*.mjs
  Content-Type: application/javascript; charset=utf-8
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Content-Type: text/css; charset=utf-8
  Cache-Control: public, max-age=31536000, immutable

/*.json
  Content-Type: application/json; charset=utf-8

/manifest.json
  Content-Type: application/manifest+json; charset=utf-8

/js/*.js
  Content-Type: application/javascript; charset=utf-8
  Cache-Control: public, max-age=31536000, immutable

/css/*.css
  Content-Type: text/css; charset=utf-8
  Cache-Control: public, max-age=31536000, immutable`;

// Write the headers file
fs.writeFileSync(path.join(__dirname, 'dist', '_headers'), headersContent);

// Create redirects file
const redirectsContent = `/*    /index.html   200`;
fs.writeFileSync(path.join(__dirname, 'dist', '_redirects'), redirectsContent);

console.log('Deployment files fixed!');
