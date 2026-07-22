'use strict';
const fs   = require('fs');
const path = require('path');

const inputPath = path.resolve(__dirname, '..', 'input.json');
if (!fs.existsSync(inputPath)) {
  console.error('❌  input.json not found at project root. Create it first.');
  process.exit(1);
}

const cfg = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

module.exports = {
  BASE_URL:         cfg.baseUrl.replace(/\/$/, ''),
  TOKENS: {
    participant: cfg.participant || null,
    organizer:   cfg.organizer   || null,
    admin:       cfg.admin       || null,
    none:        null
  },
  TIMEOUT_MS: 10000,
  DELAY_MS:   200   // between requests
};
