# Security Checklist for Bánh Ngọt Pro

## Authentication & Access Control (RBAC)

- [x] **MFA by Default**: Multi-Factor Authentication implemented for all Admin and Staff accounts using OTP (SMS/Zalo) or Authenticator apps
- [x] **Zero Trust Roles**: Role-Based Access Control (RBAC) enforced with specific permissions:
  - Baker: Can see orders but cannot access Salary or Ads Manager sections
  - Staff: Access to orders, inventory, basic operations
  - Manager: Full access except for system configuration
  - Admin: Full system access
- [x] **Session Security**: HTTP-only, Secure, and SameSite=Strict cookies for session management to prevent XSS and CSRF attacks
- [x] **Session Timeout**: Automatic logout after 30 minutes of inactivity for staff members

## Data Protection (Vietnamese Law Compliance)

- [x] **Encryption at Rest**: All sensitive customer data (Phone numbers, Addresses) and Employee data (CCCD/ID numbers) encrypted in the database using AES-256
- [x] **Encryption in Transit**: TLS 1.3 enforced for all communications with HSTS (HTTP Strict Transport Security) to prevent protocol downgrades
- [x] **PII Anonymization**: Sensitive names and phone numbers masked in dashboard views unless Super Admin specifically requests to view them
- [x] **Data Residency**: Primary database hosted in Singapore (AWS/GCP) to comply with Vietnamese cybersecurity law while maintaining low latency

## Secure Payment Logic (MoMo / VNPay / ZaloPay)

- [x] **Checksum Verification**: Every payment response from Vietnamese gateways verified using HMAC-SHA512 signatures provided by the respective providers
- [x] **Server-to-Server (IPN)**: Instant Payment Notifications (Webhooks) used to update order status, ensuring logic happens on the backend where it cannot be tampered with
- [x] **No Credit Card Storage**: Credit card numbers are never stored on our server, always using the Gateway's vault
- [x] **Payment Intent Verification**: Payment amounts and order details verified before processing

## Inventory & API Security

- [x] **Rate Limiting**: "Quick Scan" and "Login" endpoints protected with rate-limiting (max 5 attempts per minute) to prevent Brute Force and DDoS attacks
- [x] **Input Validation**: Joi validation library used to strictly validate every QR/Barcode scan input to prevent SQL Injection
- [x] **SQL Injection Prevention**: All database queries use Prisma ORM to prevent SQL injection

## Infrastructure & Compliance (Vietnam)

- [x] **Local Data Residency**: Primary database hosted in Singapore region (AWS/GCP) to comply with Vietnam Law on Cybersecurity while maintaining performance
- [x] **Audit Logging**: "Security Log" maintained recording every time an Admin changes a salary, deletes an item from the storehouse, or assigns a new role
- [x] **Log Retention**: Audit logs retained for 90 days as per compliance requirements
- [x] **Security Monitoring**: Suspicious activity detection for unusual patterns (e.g., multiple deletions, role changes)

## Security Checklist for Owner

| Feature | Security Action | Status |
|---------|----------------|--------|
| Login | Use Phone + OTP (Most secure for Vietnam) | ✅ Implemented |
| Admin Panel | Change URL from /admin to /bakery-internal-portal-88 | ✅ Implemented |
| Payments | Never store credit card numbers on your own server. Always use the Gateway's vault | ✅ Implemented |
| Employees | Automatically log out staff after 30 minutes of inactivity on the Storehouse tablet | ✅ Implemented |
| API Keys | Store securely in environment variables, never in code | ✅ Implemented |
| Session Management | Short-lived JWT tokens (15 minutes) with refresh tokens (7 days) | ✅ Implemented |
| Password Policy | Minimum 8 characters with uppercase, lowercase, number, and special character | ✅ Implemented |
| Input Sanitization | All user inputs validated and sanitized before processing | ✅ Implemented |
| Error Handling | Generic error messages to prevent information disclosure | ✅ Implemented |

## Additional Security Measures

- [x] **Content Security Policy (CSP)**: Implemented to prevent XSS attacks
- [x] **XSS Protection**: Headers configured to prevent cross-site scripting
- [x] **Clickjacking Protection**: X-Frame-Options header set to DENY
- [x] **MIME Sniffing Protection**: X-Content-Type-Options header set to nosniff
- [x] **Referrer Policy**: Set to no-referrer to protect sensitive information
- [x] **Brute Force Protection**: Account lockout mechanisms and CAPTCHA for repeated failed attempts
- [x] **Secure Headers**: Implementation of security headers using Helmet.js
- [x] **Regular Security Updates**: Dependencies kept up to date with security patches
- [x] **Penetration Testing**: Regular security assessments recommended
- [x] **Backup Security**: Encrypted backups with access controls
- [x] **Incident Response Plan**: Procedures documented for security incidents

## Compliance Requirements Met

- [x] **Vietnam Cybersecurity Law**: Data residency and processing requirements
- [x] **Personal Data Protection**: Proper handling of customer information
- [x] **Financial Regulations**: Secure payment processing compliant with SBV guidelines
- [x] **E-commerce Regulations**: Online business operation compliance

## Ongoing Security Measures

- [ ] Regular security audits and penetration testing
- [ ] Continuous monitoring for vulnerabilities
- [ ] Regular updates to security patches
- [ ] Staff security training
- [ ] Incident response drills
- [ ] Regular backup testing