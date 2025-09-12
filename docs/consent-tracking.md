# Consent Tracking System

## Overview
The FLYR dashboard now implements a comprehensive consent tracking system that stores user consent records in MongoDB for legal compliance and audit purposes.

## What Gets Stored

When a user interacts with the consent wall, the following information is recorded:

- **Session ID**: Unique identifier for the user session
- **IP Address**: User's IP address (handles proxy headers)
- **User Agent**: Browser user agent string
- **Terms Version**: Version of terms they agreed to (currently 1.0.0)
- **Action**: Whether they "agreed" or "declined"
- **Timestamp**: Exact time of consent
- **Expires At**: When the consent expires (24 hours)
- **Metadata**: Parsed browser, OS, device, referrer, and language

## Implementation Details

### Database Schema
- Collection: `consents`
- TTL Index: Automatically deletes records after 30 days
- Indexes: sessionId, ipAddress, timestamp, expiresAt

### API Endpoints

1. **POST /api/consent**
   - Records user consent (agree/decline)
   - Returns session ID and expiration time

2. **GET /api/consent?sessionId={id}**
   - Checks if valid consent exists for session
   - Used by consent wall to verify status

3. **GET /api/admin/consent-logs**
   - Admin endpoint to view consent records
   - Requires authorization header
   - Supports pagination and filtering

4. **POST /api/admin/consent-logs**
   - Exports consent data as CSV
   - Requires authorization header

### Security Features

- Session-based tracking (not user accounts)
- Automatic expiration after 24 hours
- Audit trail for both agreements and declines
- IP address logging for legal protection
- Terms version tracking for compliance

## Admin Access

To access consent logs via API:

```bash
# View logs
curl -H "Authorization: Bearer your-admin-secret-key" \
  "https://yourdomain.com/api/admin/consent-logs?page=1&limit=50"

# Export as CSV
curl -X POST -H "Authorization: Bearer your-admin-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2025-01-01","endDate":"2025-01-31"}' \
  "https://yourdomain.com/api/admin/consent-logs"
```

## Environment Variables

Add to your `.env.local`:
```
ADMIN_SECRET=your-secure-admin-secret-key
```

## Legal Benefits

1. **Proof of Consent**: Database records prove users agreed to terms
2. **Audit Trail**: Track who agreed/declined and when
3. **Version Control**: Know which terms version users agreed to
4. **Compliance**: Meets GDPR requirements for consent tracking
5. **Defense**: Protects against false claims of unauthorized use

## Privacy Considerations

- No personal data beyond IP and browser info
- Automatic deletion after 30 days
- Session-based, not tied to user accounts
- Minimal data collection principle