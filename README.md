# Bánh Ngọt Pro - Vietnamese Bakery System

A comprehensive full-stack web application for a Vietnamese bakery with integrated local payment gateways, shipping services, and admin management.

## Features

### 🏪 Customer Storefront
- Vietnamese language support (Tiếng Việt)
- Mobile-first responsive design
- Product catalog with categories
- Shopping cart functionality
- Multiple payment options

### 👨‍💼 Admin Dashboard
- Order management with Kanban board
- Inventory tracking
- Financial reporting
- Staff management
- Voucher/marketing tools

### 🇻🇳 Vietnam-Specific Features
- Phone number based authentication
- Social login (Zalo, Facebook)
- Local payment gateways: VNPay, MoMo, ZaloPay, COD
- Shipping integration: Ahamove, GrabExpress
- Vietnamese localization throughout

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js, React |
| Backend | Node.js, Express, NestJS |
| Database | PostgreSQL, Prisma ORM |
| Authentication | JWT, Phone number verification |
| Payments | VNPay, MoMo, ZaloPay SDKs |
| Shipping | Ahamove, GrabExpress APIs |
| Deployment | Google Cloud Platform, AWS |

## Project Structure

```
my-bakery/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   └── ui/
│   │   ├── pages/
│   │   │   └── admin/
│   │   ├── locales/
│   │   │   ├── vi/
│   │   │   └── en/
│   │   └── i18n.js
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   └── prisma/
└── shared/
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` with your configuration:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/banh_ngot_pro"

# JWT
JWT_SECRET="your-jwt-secret-key"

# VNPay
VNPAY_TMNCODE="your-vnpay-tmncode"
VNPAY_HASHSECRET="your-vnpay-hashsecret"
VNPAY_MERCHANT="your-vnpay-merchant"

# MoMo
MOMO_PARTNER_CODE="your-momo-partner-code"
MOMO_ACCESS_KEY="your-momo-access-key"
MOMO_SECRET_KEY="your-momo-secret-key"

# ZaloPay
ZALOPAY_APP_ID="your-zalopay-app-id"
ZALOPAY_KEY1="your-zalopay-key1"
ZALOPAY_KEY2="your-zalopay-key2"

# Ahamove
AHAMOVE_PARTNER_ID="your-ahamove-partner-id"
AHAMOVE_API_KEY="your-ahamove-api-key"

# GrabExpress
GRABEXPRESS_CLIENT_ID="your-grabexpress-client-id"
GRABEXPRESS_CLIENT_SECRET="your-grabexpress-client-secret"
```

5. Run database migrations:
```bash
npx prisma migrate dev
```

6. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/social-login` - Social login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id` - Update order (Admin)

### Payments
- `POST /api/payments/process` - Process payment
- `GET /api/payments/:id` - Get payment by ID
- `POST /api/payments/refund/:id` - Refund payment

### Vouchers
- `GET /api/vouchers` - Get active vouchers
- `POST /api/vouchers/validate` - Validate voucher
- `POST /api/vouchers/apply` - Apply voucher to order
- `POST /api/vouchers` - Create voucher (Admin)

## Environment Variables

The application requires various environment variables for third-party integrations. These should be configured in the `.env` file in the backend directory.

## Database Schema

The application uses PostgreSQL with Prisma ORM. The schema includes models for:
- Users and authentication
- Products and categories
- Orders and order items
- Inventory and ingredients
- Payments and transactions
- Shipping information
- Vouchers and promotions
- Staff and salary records

## Payment Integration

The system supports multiple Vietnamese payment methods:
- **VNPay**: Secure online banking payments
- **MoMo**: Popular digital wallet
- **ZaloPay**: Integrated with Zalo messaging platform
- **COD**: Cash on delivery option

## Shipping Integration

Real-time shipping calculations with:
- **Ahamove**: Local delivery service
- **GrabExpress**: Fast delivery via Grab platform

## Localization

The application is fully localized in Vietnamese with English as fallback:
- All UI text is translatable
- Currency displayed in Vietnamese Dong (₫)
- Vietnamese phone number validation
- Localized date/time formats

## Admin Features

The admin dashboard includes:
- Kanban-style order management
- Inventory tracking with low-stock alerts
- Financial reporting and salary calculations
- Voucher management system
- Staff management tools

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting to prevent abuse
- SQL injection prevention via Prisma
- XSS protection with Helmet.js

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.