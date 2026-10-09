#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { buildSwaggerSpec } = require('../swagger.config');

const outDir = path.resolve(__dirname, '../../tasky-docs/public');
const outFile = path.join(outDir, 'openapi.json');

const spec = buildSwaggerSpec();
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(spec, null, 2));
console.log(`OpenAPI exporté → ${outFile}`);
