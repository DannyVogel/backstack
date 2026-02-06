# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it privately:

1. **Do not** open a public GitHub issue
2. Email security concerns to backstack@danny-v.me
3. Include detailed steps to reproduce

## Response Timeline

- Acknowledgment: Within 48 hours
- Initial assessment: Within 1 week
- Fix timeline: Depends on severity

## Security Best Practices

When deploying BackStack:

1. **Use strong API keys** - Generate random, long API keys
2. **Enable HTTPS** - Always use TLS in production
3. **Restrict CORS origins** - Only allow necessary domains
4. **Secure environment variables** - Never commit secrets
5. **Regular updates** - Keep dependencies current

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.x.x   | Yes       |

## Known Security Considerations

- SQLite database should be on encrypted storage in production
- API keys are compared using timing-safe comparison
- Rate limiting is enabled by default
