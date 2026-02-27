// PostToolUse hook: run workspace tests after editing a test file
const { execSync } = require('child_process');

const input = JSON.parse(process.env.CLAUDE_TOOL_INPUT || '{}');
const fp = (input.file_path || '').replace(/\\/g, '/');

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
  // Tests failed — output is already visible; don't block the hook
}
