// PreToolUse hook: block edits to .env files
const input = JSON.parse(process.env.CLAUDE_TOOL_INPUT || '{}');
const fp = input.file_path || '';
const name = fp.replace(/\\/g, '/').split('/').pop() || '';

if (name === '.env' || name.startsWith('.env.')) {
  console.log(JSON.stringify({
    decision: 'block',
    reason: 'Editing .env files is blocked. Modify manually to avoid accidental credential changes.'
  }));
  process.exit(2);
}
