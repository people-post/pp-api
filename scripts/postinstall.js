#!/usr/bin/env node

/**
 * Postinstall: build pp-api when dist/ is missing (e.g. when installed from GitHub).
 * Published packages include dist/, so this is a no-op for registry installs.
 */

import fs from 'fs';
import { execSync } from 'child_process';

if (fs.existsSync('dist')) process.exit(0);

if (!fs.existsSync('node_modules') || fs.readdirSync('node_modules').length === 0) {
  execSync('npm install --omit=dev', { stdio: 'inherit' });
}

execSync('npm run build', { stdio: 'inherit' });
