#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const entry = path.join(__dirname, '..', 'dist', 'src', 'cli.js');

if (!fs.existsSync(entry)) {
  console.error(
    'LeadRat Dev Assistant is not built. Run "npm install" and "npm run build" inside .ai-dev-assistant, or use the published package.'
  );
  process.exit(1);
}

import(pathToFileURL(entry).href).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
