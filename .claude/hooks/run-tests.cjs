// PostToolUse hook: run workspace tests after editing a test file.
//
// Hooks receive their payload as JSON on stdin (not in an env var). This
// file is .cjs because the repo root package.json sets "type": "module",
// which would otherwise make Node treat a plain .js file here as ESM and
// reject `require`.
const fs = require('fs');
const { execSync } = require('child_process');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function main() {
  let input = {};
  try {
    input = JSON.parse(readStdin() || '{}');
  } catch {
    input = {};
  }

  const toolInput = input.tool_input || {};
  // Edit/Write/MultiEdit carry `file_path`; NotebookEdit carries `notebook_path`.
  const fp = (toolInput.file_path || toolInput.notebook_path || '').replace(/\\/g, '/');

  if (!fp.includes('.test.') && !fp.includes('.spec.')) {
    process.exit(0);
  }

  let workspace = null;
  if (fp.includes('/frontend/')) {
    workspace = 'frontend';
  } else if (fp.includes('/backend/')) {
    workspace = 'backend';
  }

  if (!workspace) process.exit(0);

  try {
    console.log(`Running tests in ${workspace}/...`);
    execSync('npm test', { cwd: workspace, stdio: 'inherit' });
  } catch {
    // Tests failed — output is already visible; don't block the hook.
  }

  process.exit(0);
}

main();
