# Security Implementation for Bánh Ngọt Pro

## Overview
This document outlines the comprehensive security measures implemented in the Bánh Ngọt Pro bakery management system for the Vietnamese market, following enterprise-grade security standards and Vietnamese cybersecurity law compliance.

## Infrastructure Security

### VPC & Network Security
- **VPC Deployment**: Backend and database deployed inside Virtual Private Cloud, isolated from public internet exposure
- **Network Segmentation**:
  - Public Subnet: Load Balancer (ALB) and NAT Gateway only
  - Private Subnet: Next.js Server and Admin ERP (can reach internet for API calls to payment gateways)
  - Database Subnet: PostgreSQL database in deepest private layer, only accessible by application server

### DDoS Protection & WAF Layer
- **Rate Limiting Configuration**:
  - Storefront: 100 requests per 5 minutes per IP
  - Login/Admin: 20 requests per minute per IP
  - General API: 50 requests per 2 minutes per IP
- **WAF Protection**: AWS WAF with managed rule groups including IP reputation lists
- **Header Sanitization**: Automatic stripping of `x-middleware-subrequest` header at Load Balancer to prevent token injection attacks

## Application-Level Security

### Authentication & Token Security
- **JWT Implementation**: Short-lived access tokens (15 minutes) with refresh tokens (7 days)
- **Secure Cookie Configuration**:
  - `httpOnly: true`: Prevents XSS from stealing tokens
  - `secure: true`: Only sent over HTTPS in production
  - `sameSite: 'lax'`: Prevents CSRF attacks
  - Proper path restrictions and expiration controls
- **Multi-Factor Authentication (MFA)**: OTP-based verification for admin and staff accounts
- **Social Login Integration**: Secure Zalo and Facebook OAuth flows

### Database Security
- **Encryption at Rest**: AES-256 encryption for all sensitive customer data (phone numbers, addresses, ID numbers) and employee data
- **Parameterized Queries**: All database interactions use Prisma ORM to prevent SQL injection
- **PII Anonymization**: Masked display of sensitive information unless explicitly accessed by Super Admin

### Payment Security
- **Checksum Verification**: All payment responses from Vietnamese gateways (VNPay, MoMo, ZaloPay) verified using HMAC-SHA512 signatures
- **Server-to-Server (IPN)**: Instant Payment Notifications for secure order status updates
- **No Direct Card Storage**: Credit card information never stored on our servers

## API Security

### Input Validation & Sanitization
- **Joi Validation**: Strict input validation for all API endpoints
- **SQL Injection Prevention**: All queries use parameterized inputs via Prisma ORM
- **XSS Prevention**: React auto-escapes data; no `dangerouslySetInnerHTML` for user-generated content

### Content Security Policy (CSP)
- **Strict Policies**: CSP headers limiting script sources to trusted domains
- **Payment Gateway Whitelisting**: Explicit allowance for MoMo, VNPay, and ZaloPay domains

## Vietnamese Market Compliance

### Data Residency
- **Local Data Storage**: Primary database hosted in compliance with Vietnamese cybersecurity law requirements
- **Regional Servers**: Deployment in Singapore region for low latency while maintaining compliance

### Cultural Security Considerations
- **Phone-Based Authentication**: Primary authentication via Vietnamese phone numbers
- **Social Integration**: Secure Zalo integration following Vietnamese user preferences
- **Local Payment Methods**: Full support for VNPay, MoMo, ZaloPay with proper security measures

## Monitoring & Audit Trail

### Audit Logging
- **Comprehensive Logs**: Every administrative action logged (salary changes, inventory adjustments, role assignments)
- **Access Tracking**: All sensitive data access recorded with timestamps and user identification
- **Security Events**: Failed login attempts, MFA failures, and other security-related events logged

### Session Management
- **Automatic Logout**: Staff tablets automatically log out after 30 minutes of inactivity
- **Session Security**: Proper session invalidation on logout
- **Concurrent Session Control**: Prevention of multiple simultaneous sessions where appropriate

## Security Headers

### HTTP Security Headers
- **X-Content-Type-Options**: Prevents MIME-type confusion attacks
- **X-Frame-Options**: DENY to prevent clickjacking
- **X-XSS-Protection**: Enabled with block mode
- **Strict-Transport-Security**: Enforced with long max-age and subdomain inclusion
- **Referrer-Policy**: Strict origin handling

## Summary of Attack Prevention

| Attack Type | Defense Strategy | Implementation |
|-------------|------------------|----------------|
| DDoS | Rate Limiting + Geo-Blocking | AWS WAF / Express Rate Limiting |
| SQL Injection | Parameterized Queries | Prisma ORM / Backend Validation |
| XSS | HttpOnly Cookies + CSP | Next.js Middleware / Helmet.js |
| Token Injection | Header Sanitization | Load Balancer (ALB) Configuration |
| Data Theft | Encryption at Rest | AES-256 / PostgreSQL |
| Session Hijacking | Secure Cookie Config | HTTP-only, Secure, SameSite flags |
| Payment Fraud | Checksum Verification | HMAC-SHA512 / IPN Validation |

This comprehensive security implementation ensures the Bánh Ngọt Pro system meets enterprise-grade security standards while complying with Vietnamese market requirements and legal regulations.