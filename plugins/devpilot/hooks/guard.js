#!/usr/bin/env node
'use strict';

/**
 * DevPilot guard: a Claude Code PreToolUse hook.
 *
 * Reads the pending tool call as JSON on stdin and answers with a permission
 * decision:
 *   deny  - catastrophic and almost never intended (rm -rf /, force-push to main, mkfs)
 *   ask   - legitimate but risky; the user confirms (git reset --hard, curl | sh, reading .env)
 *   (none) - everything else proceeds through Claude Code's normal permission flow
 *
 * Set DEVPILOT_GUARD=off to disable. Zero dependencies; Node 16+.
 */

const path = require('path');

const DENY = 'deny';
const ASK = 'ask';

// Targets whose recursive deletion / chmod wipes a machine or home directory.
const ROOT_TARGETS = new Set([
  '/', '/*', '~', '~/*', '$home', '${home}', '$home/*', '${home}/*',
  'c:', 'c:/*', '/c', '/c/*', '%userprofile%', '$env:userprofile',
  '/etc', '/usr', '/bin', '/sbin', '/boot', '/var', '/lib', '/lib64', '/opt',
  '/home', '/root', '/system', '/users', '/library', '/applications',
  'c:/windows', 'c:/users', 'c:/program files', 'c:/program files (x86)',
]);

// Targets that wipe the whole working directory: sometimes intended, so ask.
const CWD_TARGETS = new Set(['.', './*', '..', '../*', '*', '.*']);

const PROTECTED_BRANCHES = new Set(['main', 'master', 'production', 'prod', 'trunk']);

const SHELLS = new Set(['sh', 'bash', 'zsh', 'dash', 'ksh', 'fish', 'pwsh', 'powershell', 'cmd']);
const PREFIXES = new Set(['sudo', 'doas', 'command', 'exec', 'nohup', 'time', 'nice', 'env', 'xargs']);
const READERS = new Set([
  'cat', 'less', 'more', 'head', 'tail', 'bat', 'nl', 'xxd', 'od', 'strings', 'base64',
  'type', 'get-content', 'gc', 'cp', 'scp', 'copy', 'copy-item',
]);
const SAFE_ENV_SUFFIXES = new Set(['example', 'sample', 'template', 'dist', 'defaults']);

// ---------------------------------------------------------------- helpers

function tokenize(segment) {
  const tokens = segment.match(/"[^"]*"|'[^']*'|\S+/g) || [];
  return tokens.map((t) => t.replace(/^(["'])([\s\S]*)\1$/, '$2'));
}

function splitSegments(command) {
  return command.split(/&&|\|\||[;|&\n]/).map((s) => s.trim()).filter(Boolean);
}

function normalizeTarget(target) {
  const t = target.toLowerCase().replace(/\\/g, '/');
  return t.replace(/\/+$/, '') || '/';
}

function commandName(token) {
  return path.basename(token.replace(/\\/g, '/')).toLowerCase().replace(/\.exe$/, '');
}

function stripPrefixes(tokens) {
  const out = tokens.slice();
  for (;;) {
    if (!out.length) return out;
    const name = commandName(out[0]);
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(out[0])) {
      out.shift();
    } else if (PREFIXES.has(name)) {
      out.shift();
      while (out.length && out[0].startsWith('-')) {
        const flag = out.shift();
        if (['-u', '-g', '-n', '-i', '-P'].includes(flag) && out.length) out.shift();
      }
    } else {
      return out;
    }
  }
}

function isSecretPath(p) {
  if (!p) return false;
  const norm = String(p).replace(/\\/g, '/');
  const base = path.posix.basename(norm).toLowerCase();
  if (base === '.env') return true;
  if (base.startsWith('.env.')) return !SAFE_ENV_SUFFIXES.has(base.slice(5));
  if (/^id_(rsa|dsa|ecdsa|ed25519)$/.test(base)) return true;
  if (/\.(pem|key|p12|pfx|keystore|jks)$/.test(base)) return true;
  if (['.netrc', '.pgpass', '.npmrc', '.pypirc'].includes(base)) return true;
  if (/^secrets?\.(ya?ml|json|toml)$/.test(base)) return true;
  if (/(^|\/)\.aws\/credentials$/.test(norm.toLowerCase())) return true;
  return false;
}

function worst(results) {
  return results.find((r) => r && r.decision === DENY) || results.find((r) => r && r.decision === ASK) || null;
}

// ---------------------------------------------------------------- rules

function checkDelete(name, args) {
  let recursive = false;
  let targets = [];

  if (name === 'rm') {
    if (args.includes('--no-preserve-root')) {
      return { decision: DENY, reason: 'rm --no-preserve-root would delete the entire filesystem.' };
    }
    // Short bundles like -r / -rf / -Rf, plus PowerShell's `rm -Recurse` alias.
    recursive = args.some(
      (a) => a === '--recursive' || /^-[a-zA-Z]{0,3}[rR][a-zA-Z]{0,3}$/.test(a) && a.length <= 5 || /^-rec/i.test(a),
    );
    targets = args.filter((a) => !a.startsWith('-'));
  } else if (['remove-item', 'ri', 'del', 'erase', 'rd', 'rmdir'].includes(name)) {
    const lower = args.map((a) => a.toLowerCase());
    recursive = lower.some((a) => a.startsWith('-r') || a === '/s');
    targets = args.filter((a) => !a.startsWith('-') && !/^\/[sqfa]$/i.test(a));
  } else {
    return null;
  }

  if (!recursive) return null;
  for (const t of targets.map(normalizeTarget)) {
    if (ROOT_TARGETS.has(t)) {
      return { decision: DENY, reason: `Recursive delete of "${t}" would wipe the system or home directory.` };
    }
  }
  for (const t of targets.map(normalizeTarget)) {
    if (CWD_TARGETS.has(t)) {
      return { decision: ASK, reason: `Recursive delete of "${t}" removes everything in the current or parent directory.` };
    }
  }
  return null;
}

function checkGit(args) {
  let i = 0;
  while (i < args.length && args[i].startsWith('-')) {
    if (['-C', '-c', '--git-dir', '--work-tree'].includes(args[i])) i++;
    i++;
  }
  const sub = args[i];
  const rest = args.slice(i + 1);

  if (sub === 'push') {
    const refspecs = rest.filter((a) => !a.startsWith('-'));
    const branchOf = (ref) => ref.replace(/^\+/, '').split(':').pop().replace(/^refs\/heads\//, '');
    const hitsProtected = refspecs.some((r) => PROTECTED_BRANCHES.has(branchOf(r)));
    const force = rest.some(
      (a) => a === '--force' || a.startsWith('--force-with-lease') || a.startsWith('--force-if-includes') ||
        /^-[a-zA-Z]*f/.test(a) || a.startsWith('+'),
    );
    const del = rest.includes('--delete') || rest.includes('-d') || refspecs.some((r) => r.startsWith(':'));

    if ((force || del) && hitsProtected) {
      return { decision: DENY, reason: 'Force-pushing to or deleting a protected branch (main/master/production) rewrites shared history.' };
    }
    if (force) return { decision: ASK, reason: 'Force push overwrites remote history.' };
    if (del) return { decision: ASK, reason: 'This deletes a remote branch.' };
    return null;
  }
  if (sub === 'reset' && rest.includes('--hard')) {
    return { decision: ASK, reason: 'git reset --hard discards uncommitted changes permanently.' };
  }
  if (sub === 'clean' && rest.some((a) => a === '--force' || /^-[a-zA-Z]*f/.test(a))) {
    return { decision: ASK, reason: 'git clean -f permanently deletes untracked files.' };
  }
  if ((sub === 'checkout' || sub === 'restore') && rest.includes('.') && !rest.includes('--staged')) {
    return { decision: ASK, reason: `git ${sub} . discards all uncommitted changes in the working tree.` };
  }
  if (sub === 'branch' && rest.includes('-D')) {
    return { decision: ASK, reason: 'git branch -D force-deletes a branch, even if unmerged.' };
  }
  if (sub === 'stash' && (rest[0] === 'clear' || rest[0] === 'drop')) {
    return { decision: ASK, reason: `git stash ${rest[0]} permanently removes stashed work.` };
  }
  if (sub === 'filter-branch' || sub === 'filter-repo') {
    return { decision: ASK, reason: 'This rewrites the entire repository history.' };
  }
  return null;
}

function checkSegment(segment, depth) {
  const tokens = stripPrefixes(tokenize(segment));
  if (!tokens.length) return null;
  const name = commandName(tokens[0]);
  const args = tokens.slice(1);

  // Nested shells: bash -c "...", powershell -Command "...", eval "..."
  if (depth < 3) {
    if (SHELLS.has(name)) {
      const idx = args.findIndex((a) => ['-c', '/c', '-command'].includes(a.toLowerCase()));
      if (idx !== -1 && args[idx + 1]) return checkCommand(args.slice(idx + 1).join(' '), depth + 1);
    }
    if (name === 'eval' || name === 'invoke-expression' || name === 'iex') {
      return checkCommand(args.join(' '), depth + 1);
    }
  }

  const del = checkDelete(name, args);
  if (del) return del;

  if (name === 'git') return checkGit(args);

  if (name === 'find') {
    const start = normalizeTarget(args.find((a) => !a.startsWith('-')) || '.');
    const destructive = args.includes('-delete') || (args.includes('-exec') && args.some((a) => commandName(a) === 'rm'));
    if (destructive && ROOT_TARGETS.has(start)) {
      return { decision: DENY, reason: `find ${start} with -delete would wipe the system or home directory.` };
    }
  }

  if ((name === 'chmod' || name === 'chown') && args.some((a) => /^-[a-zA-Z]*R/.test(a) || a === '--recursive')) {
    if (args.filter((a) => !a.startsWith('-')).some((a) => ROOT_TARGETS.has(normalizeTarget(a)))) {
      return { decision: DENY, reason: `Recursive ${name} on a system or home directory can break the machine.` };
    }
  }

  if (/^mkfs(\.|$)/.test(name)) return { decision: DENY, reason: 'mkfs formats a disk.' };
  if (name === 'dd' && args.some((a) => /^of=\/dev\/(sd|hd|nvme|disk|mmcblk|xvd)/.test(a))) {
    return { decision: DENY, reason: 'dd to a raw disk device destroys its contents.' };
  }
  if ((name === 'format' || name === 'format.com') && args.some((a) => /^[a-z]:/i.test(a))) {
    return { decision: DENY, reason: 'format erases a drive.' };
  }
  if (['shutdown', 'reboot', 'halt', 'poweroff', 'stop-computer', 'restart-computer'].includes(name)) {
    return { decision: ASK, reason: 'This shuts down or restarts the machine.' };
  }

  const publishes =
    (['npm', 'pnpm', 'yarn'].includes(name) && args[0] === 'publish') ||
    (name === 'cargo' && args[0] === 'publish') ||
    (name === 'twine' && args[0] === 'upload') ||
    (name === 'gem' && args[0] === 'push') ||
    (name === 'docker' && args[0] === 'push') ||
    (name === 'gh' && args[0] === 'release' && args[1] === 'create');
  if (publishes) return { decision: ASK, reason: 'This publishes to a public registry or release page.' };

  if (READERS.has(name) && args.some(isSecretPath)) {
    return { decision: ASK, reason: 'This reads a secrets file (.env, private key or credentials) into the conversation.' };
  }
  return null;
}

function checkCommand(command, depth = 0) {
  const raw = String(command || '');
  const results = [];

  if (/:\s*\(\s*\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;?\s*:/.test(raw)) {
    results.push({ decision: DENY, reason: 'Fork bomb detected.' });
  }
  if (/>\s*\/dev\/(sd|hd|nvme|disk|mmcblk|xvd)/.test(raw)) {
    results.push({ decision: DENY, reason: 'Redirecting output to a raw disk device destroys its contents.' });
  }
  if (
    /\b(curl|wget|iwr|irm|invoke-webrequest|invoke-restmethod)\b[^|;&]*\|\s*(sudo\s+)?(sh|bash|zsh|dash|ksh|python3?|node|perl|ruby|iex|invoke-expression|pwsh|powershell)\b/i.test(raw) ||
    /\b(ba|z)?sh\s+<\(\s*(curl|wget)\b/i.test(raw)
  ) {
    results.push({ decision: ASK, reason: 'Piping a downloaded script straight into an interpreter runs unreviewed remote code.' });
  }
  if (/\b(drop\s+(database|schema|table)|truncate\s+table)\b/i.test(raw)) {
    results.push({ decision: ASK, reason: 'This drops or truncates database objects.' });
  }

  for (const segment of splitSegments(raw)) results.push(checkSegment(segment, depth));
  return worst(results);
}

/**
 * Decide on a tool call. Returns { decision, reason } or null to stay out of the way.
 */
function evaluate(toolName, toolInput) {
  const input = toolInput || {};
  switch (toolName) {
    case 'Bash':
    case 'PowerShell':
      return checkCommand(input.command);
    case 'Read':
      return isSecretPath(input.file_path)
        ? { decision: ASK, reason: 'This reads a secrets file (.env, private key or credentials) into the conversation.' }
        : null;
    case 'Edit':
    case 'MultiEdit':
    case 'Write':
    case 'NotebookEdit': {
      const target = input.file_path || input.notebook_path;
      return isSecretPath(target)
        ? { decision: ASK, reason: 'This modifies a secrets file (.env, private key or credentials).' }
        : null;
    }
    default:
      return null;
  }
}

function main() {
  if (String(process.env.DEVPILOT_GUARD || '').toLowerCase() === 'off') return;

  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => { raw += chunk; });
  process.stdin.on('end', () => {
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return; // Malformed input: fail open, let Claude Code's own permissions decide.
    }
    const result = evaluate(payload.tool_name, payload.tool_input);
    if (!result) return;
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: result.decision,
        permissionDecisionReason: `DevPilot guard: ${result.reason}`,
      },
    }));
  });
}

if (require.main === module) main();

module.exports = { evaluate, checkCommand, isSecretPath, tokenize, splitSegments };
