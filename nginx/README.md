# Nginx Reverse Proxy for ScanASHA APIs

This setup provides a secure HTTPS gateway to the ScanASHA API services:

- Intel Scraper API: https://localhost/api/intel/
- Audit Engine API: https://localhost/api/audit/
- Permission Scanner API: https://localhost/api/permissions/

## Self-Signed Certificates

The setup uses self-signed SSL certificates for development. In a production environment, you should replace these with proper certificates from a trusted authority.

## Testing the Setup

Once the docker-compose stack is running, you can access the APIs through the reverse proxy at:

```
https://localhost/api/intel/
https://localhost/api/audit/
https://localhost/api/permissions/
```

Note: Since we're using self-signed certificates, your browser will show a security warning. This is expected in development environments.

## Fixing Content Security Policy (CSP) Errors

If you're encountering CSP errors in your frontend application, you need to:

1. Update your frontend API calls to use the new proxy paths:
   - Change `https://localhost:3000/...` to `https://localhost/api/intel/...`
   - Change `https://localhost:3001/...` to `https://localhost/api/audit/...`
   - Change `https://localhost:3002/...` to `https://localhost/api/permissions/...`

2. For direct access to the permission scanner's `/scan` endpoint, you can use:
   - `https://localhost/scan`

3. Update your frontend's CSP to include the new domains:
   ```
   Content-Security-Policy: default-src 'self' 'unsafe-inline' 'unsafe-eval' ... https://localhost
   ```

## Production Deployment

For a production deployment:

1. Replace the self-signed certificates in `./nginx/ssl/` with certificates from a trusted authority
2. Update the `server_name` in the Nginx configuration to match your domain
3. Implement proper rate limiting and security measures 