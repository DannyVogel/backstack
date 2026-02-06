# Security Policy

## Reporting Issues

For security vulnerabilities, bugs, or feedback, please [open a GitHub issue](https://github.com/DannyVogel/backstack/issues). Include detailed steps to reproduce if applicable.

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
