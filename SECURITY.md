# Security Policy

## Overview

Daily Planner takes security seriously. This document outlines our security practices, data protection measures, and how to report security vulnerabilities.

## Authentication & Authorization

### Supabase Authentication

- **Authentication Provider**: Supabase Auth handles all user authentication
- **Session Management**: Secure session tokens stored in localStorage with auto-refresh
- **Password Requirements**: Enforced by Supabase (minimum 6 characters)
- **Email Verification**: Required for new account signups

### Row-Level Security (RLS)

All database tables must have Row-Level Security policies configured in Supabase to ensure:

- Users can only access their own data
- No cross-user data leakage
- Proper isolation between user accounts

**Required RLS Policies:**

```sql
-- Example for tasks table
CREATE POLICY "Users can only access their own tasks"
ON tasks FOR ALL
USING (auth.uid() = user_id);

-- Apply similar policies to: projects, areas, tags, subtasks, etc.
```

## Data Protection

### Data in Transit

- **HTTPS Only**: All communication with Supabase API uses HTTPS
- **WebSocket Security**: Realtime subscriptions use secure WebSocket (WSS)
- **Certificate Validation**: Enforced by the browser and Tauri

### Data at Rest

#### Local Storage Encryption

- **Offline Queue**: Encrypted using Web Crypto API (AES-GCM 256-bit)
- **Algorithm**: AES-GCM with 96-bit IV
- **Key Derivation**: Browser fingerprint-based (consider upgrading to PBKDF2 for production)

#### Database Storage

- **Supabase Encryption**: Data encrypted at rest by Supabase infrastructure
- **Backup Encryption**: Automatic encrypted backups by Supabase

### Input Sanitization

All user inputs are sanitized to prevent XSS attacks:

- **Task Titles**: HTML escaped, control characters removed
- **Task Notes**: HTML escaped, preserves newlines
- **Project/Area/Tag Names**: Length-limited, HTML escaped
- **Colors**: Validated against safe CSS color formats

## Content Security Policy (CSP)

The application enforces a strict Content Security Policy:

```
default-src 'self';
connect-src 'self' https://*.supabase.co wss://*.supabase.co;
script-src 'self' 'wasm-unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self' data:;
worker-src 'self' blob:;
```

**What this prevents:**

- ✅ Blocks inline scripts (XSS protection)
- ✅ Restricts external resource loading
- ✅ Prevents code injection attacks
- ✅ Allows only necessary Supabase connections

## Rate Limiting

### Supabase Rate Limits

Supabase provides built-in rate limiting:

- **Anonymous requests**: Limited per IP
- **Authenticated requests**: Per user limits
- **Realtime connections**: Connection limits per project

### Recommendations

For production deployments, consider implementing:

- Client-side request throttling
- Exponential backoff for retries (already implemented for offline sync)
- User-facing feedback for rate limit errors

## API Key Management

### Public Keys (Safe to Expose)

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase anonymous/public key

These are designed to be public and are protected by RLS policies.

### Secret Keys (NEVER Expose)

- ⚠️ **NEVER** include `SUPABASE_SERVICE_ROLE_KEY` in frontend code
- ⚠️ **NEVER** commit `.env` files with secrets to version control
- ⚠️ Use environment variables for sensitive configuration

## Offline Security

### Offline Queue Protection

- **Encryption**: All queued operations encrypted before localStorage storage
- **Data Validation**: Operations validated before execution
- **Retry Limits**: Maximum 3 retries with exponential backoff
- **Automatic Cleanup**: Failed operations removed after max retries

### Sync Security

- **Online Detection**: Only syncs when online
- **Conflict Resolution**: Last-write-wins strategy
- **Error Handling**: Graceful degradation on sync failures

## Security Best Practices

### For Users

1. **Use Strong Passwords**: Minimum 12 characters with mixed case, numbers, and symbols
2. **Enable 2FA**: If available through Supabase Auth
3. **Keep Software Updated**: Regularly update the application
4. **Secure Your Device**: Use device encryption and screen locks
5. **Log Out on Shared Devices**: Always sign out when using shared computers

### For Developers

1. **Review RLS Policies**: Regularly audit Supabase RLS policies
2. **Update Dependencies**: Keep all packages up to date
3. **Code Reviews**: Security-focused code reviews for all changes
4. **Input Validation**: Always sanitize user inputs
5. **Error Handling**: Never expose sensitive data in error messages

## Known Limitations

1. **Local Storage**: While encrypted, local storage can be accessed with physical device access
2. **Browser Security**: Security depends on browser implementation of Web Crypto API
3. **Offline Data**: Offline queue data is only as secure as device security
4. **No E2E Encryption**: Data is not end-to-end encrypted (Supabase can access it)

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

1. **DO NOT** open a public GitHub issue
2. **Email**: [Your security contact email]
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue.

## Security Updates

This document is regularly updated as security practices evolve. Last updated: January 2026.

## Compliance

### Data Privacy

- **GDPR**: Users can request data export/deletion
- **Data Retention**: User data retained only while account is active
- **Data Portability**: Export functionality available

### Audit Trail

- **User Actions**: Tracked via Supabase audit logs
- **Database Changes**: Logged by Supabase
- **Authentication Events**: Logged by Supabase Auth

## Additional Resources

- [Supabase Security Documentation](https://supabase.com/docs/guides/platform/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
