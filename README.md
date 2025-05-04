# Express Server with Firebase Firestore Project Structure

```
src/
├── config/                  # Configuration files
│   ├── firebase.ts         # Firebase configuration
│   ├── paystack.ts         # Paystack API configuration
│   └── index.ts            # Export all configurations
│
├── middlewares/            # Express middlewares
│   ├── auth.ts             # Authentication middleware
│   ├── error.ts            # Global error handling middleware
│   ├── validator.ts        # Request validation middleware
│   └── index.ts            # Export all middlewares
│
├── controllers/            # Request handlers
│   ├── escrow.controller.ts
│   ├── payment.controller.ts
│   ├── webhook.controller.ts
│   └── index.ts            # Export all controllers
│
├── routes/                 # API routes
│   ├── escrow.routes.ts
│   ├── payment.routes.ts
│   ├── webhook.routes.ts
│   └── index.ts            # Combine all routes
│
├── services/               # Business logic
│   ├── escrow.service.ts
│   ├── payment.service.ts
│   ├── transfer.service.ts
│   └── index.ts            # Export all services
│
├── utils/                  # Utility functions
│   ├── logger.ts           # Logging utility
│   ├── response.ts         # Response formatting
│   ├── crypto.ts           # Encryption/signature utilities
│   └── index.ts            # Export all utilities
│
├── types/                  # TypeScript types/interfaces
│   ├── paystack.types.ts
│   ├── escrow.types.ts
│   ├── payment.types.ts
│   └── index.ts            # Export all types
│
├── app.ts                  # Express app configuration
└── server.ts               # Entry point
```