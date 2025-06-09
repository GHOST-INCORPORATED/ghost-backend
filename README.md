# 🎮 Ghost Backend - Gaming Account Marketplace API

> **Production-ready Node.js backend powering Ghost marketplace with intelligent Postmark email notifications**

A comprehensive backend service for the Ghost gaming account marketplace, featuring sophisticated email automation, secure payment processing, and real-time notifications powered by Postmark's enterprise email delivery platform.

## 🚀 Live Production

- **Live API**: Backend powering [https://www.ghostplay.store](https://www.ghostplay.store)
- **Status**: Production deployment with real transactions
- **Email Delivery**: 99.9% success rate via Postmark
- **Uptime**: 24/7 monitoring and auto-scaling

---

## ✨ Core Features

### 📧 **Production Email System (Postmark)**
- **Transactional Emails**: Purchase confirmations, escrow updates, credential requests
- **Marketing Automation**: New account notifications, weekly seller reports
- **Security Alerts**: Login monitoring, fraud detection, password resets
- **Support Integration**: Inbound email processing for ticket automation
- **Multi-party Notifications**: Buyer/seller/follower coordination

### 🛡️ **Security & Authentication**
- **Firebase Authentication**: Secure user management and sessions
- **Role-based Access Control**: Admin, seller, buyer permissions
- **API Rate Limiting**: Protection against abuse and spam
- **Input Validation**: Comprehensive data sanitization

### 💰 **Payment Processing**
- **Escrow System**: Secure transaction handling
- **Multi-currency Support**: NGN, USD, EUR support
- **Payment Verification**: Automated status tracking
- **Refund Processing**: Automated dispute resolution
- **Transaction Logging**: Complete audit trail

### 📊 **Data Management**
- **Firebase Integration**: Real-time database with Cloud Firestore
- **Firebase Authentication**: Secure user management
- **Firebase Storage**: Cloud-based file and image storage
- **Real-time Updates**: Live data synchronization
- **Firebase Analytics**: Built-in user behavior tracking

---

## 🔧 Technical Architecture

### **Email Service Implementation**

```javascript
// Production Postmark Configuration
const postmarkClient = new postmark.ServerClient(
  process.env.POSTMARK_SERVER_TOKEN
);

// Multi-template email system
class EmailService {
  async sendAccountPurchaseConfirmation(data) {
    return await postmarkClient.sendEmailWithTemplate({
      TemplateId: 'account-purchase-confirmation',
      From: 'noreply@ghostplay.store',
      To: data.buyerEmail,
      TemplateModel: {
        buyerName: data.buyerName,
        accountTitle: data.accountTitle,
        amount: data.amount,
        currency: data.currency,
        escrowId: data.escrowId,
        transactionDate: new Date().toLocaleDateString()
      }
    });
  }
}
```

### **Core API Endpoints**

#### Authentication
```
POST /api/auth/register       # User registration
POST /api/auth/login          # User login
POST /api/auth/refresh        # Token refresh
POST /api/auth/logout         # User logout
POST /api/auth/reset-password # Password reset
```

#### Account Management
```
GET  /api/accounts           # List all accounts
POST /api/accounts           # Create new account listing
GET  /api/accounts/:id       # Get account details
PUT  /api/accounts/:id       # Update account
DELETE /api/accounts/:id     # Delete account
```

#### Transaction Processing
```
POST /api/transactions       # Create transaction
GET  /api/transactions/:id   # Get transaction status
PUT  /api/transactions/:id   # Update transaction
POST /api/escrow/release     # Release escrow funds
POST /api/escrow/dispute     # Create dispute
```

#### Email System
```
POST /api/email/send         # Send transactional email
POST /api/email/webhook      # Postmark webhook handler
GET  /api/email/stats        # Email delivery statistics
POST /api/email/inbound      # Process inbound emails
```

---

## ⚙️ Environment Configuration

### **Environment Variables (.env)**

```bash


# Email Configuration (Postmark)
POSTMARK_SERVER_TOKEN=your_postmark_server_token
DEFAULT_FROM_EMAIL=noreply@ghostplay.store

# Application Configuration
PORT=5000
NODE_ENV=production
```

---

## 🛠️ Installation & Setup

### **Quick Start**

```bash
# Clone repository
git clone https://github.com/GHOST-INCORPORATED/ghost-backend.git
cd ghost-backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Add your Firebase and Postmark credentials

# Start development server
npm run dev
```