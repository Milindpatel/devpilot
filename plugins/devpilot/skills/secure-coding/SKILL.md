---
name: secure-coding
description: Secure-by-default coding guardrails. Use when writing or modifying code that handles user input, authentication, sessions, passwords, file paths, shell commands, SQL queries, HTML rendering, file uploads, secrets, crypto or outbound HTTP requests.
---

# Secure coding guardrails

Apply these while writing code. Don't wait for a review to catch them.

## Input and injection

- **SQL**: always use parameterised queries or the ORM's bound parameters. Never build SQL with string concatenation or f-strings.
- **Shell**: avoid the shell. Pass argument arrays (`execFile`, `subprocess.run([...], shell=False)`). If a shell is unavoidable, quote every argument with the platform's quoting helper.
- **Paths**: resolve user-supplied paths against a base directory and reject the result if it escapes that directory (`path.resolve` + prefix check, `Path.resolve().is_relative_to()`).
- **HTML**: rely on the framework's auto-escaping. Treat `innerHTML`, `dangerouslySetInnerHTML`, `v-html` and `|safe` as red flags that need sanitisation (DOMPurify).
- **Validate at the boundary** with a schema (Zod, Pydantic, JSON Schema) using allow-lists, and reject unknown fields.

## Auth and sessions

- Hash passwords with **argon2id**, **bcrypt** or **scrypt**, never with MD5, SHA-1 or unsalted SHA-256.
- Check authorization **on every request, server-side**, including ownership (`resource.owner_id == current_user.id`).
- JWT: pin the algorithm, verify the signature and `exp`/`aud`/`iss`, and keep tokens short-lived.
- Cookies: `HttpOnly`, `Secure`, `SameSite=Lax` or `Strict`.
- Compare secrets in constant time (`crypto.timingSafeEqual`, `hmac.compare_digest`).

## Secrets and crypto

- Read secrets from environment variables or a secret manager. Never hardcode them, log them or return them in errors.
- Make sure `.env` is listed in `.gitignore`, and commit a `.env.example` with placeholder values.
- Use a CSPRNG for tokens (`crypto.randomBytes`, `secrets.token_urlsafe`), never `Math.random()` or `random`.
- Use vetted primitives (AES-GCM, libsodium), never home-made crypto, and never turn off TLS verification.

## Network and files

- **SSRF**: when fetching user-supplied URLs, allow-list hosts and block private, link-local and metadata IP ranges (169.254.169.254).
- **Uploads**: check size and content type, store outside the web root, and generate the filenames yourself.
- **Deserialisation**: never `pickle`/`yaml.load`/`eval` untrusted data; use `yaml.safe_load` and JSON.

## Errors and logging

- Return generic error messages to clients and log the details server-side.
- Never log passwords, tokens, full card numbers or other sensitive personal data.

If a requirement forces you to break one of these rules, add a code comment explaining why, and mention it to the user.
