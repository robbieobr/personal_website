// PreToolUse hook: block edits to .env files.
//
// Hooks receive their payload as JSON on stdin (not in an env var), with the
// current PreToolUse schema. This file is .cjs because the repo root
// package.json sets "type": "module", which would otherwise make Node treat
// a plain .js file here as ESM and reject `require`.
const fs = require('fs');

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
  const fp = toolInput.file_path || toolInput.notebook_path || '';
  const name = fp.replace(/\\/g, '/').split('/').pop() || '';

  if (name === '.env' || name.startsWith('.env.')) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason:
            'Editing .env files is blocked. Modify manually to avoid accidental credential changes.',
        },
      })
    );
  }

  process.exit(0);
}

main();
