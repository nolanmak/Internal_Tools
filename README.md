# ShadowShare - Secure Password & Credential Sharing Tool

A secure, self-hosted solution for sharing sensitive credentials and files with automatic expiration and client-side encryption.

## 🔐 Overview

ShadowShare is a secure file sharing platform designed specifically for sharing sensitive credentials, environment files, and other confidential data. Built with security-first principles, it ensures that sensitive data is encrypted client-side and automatically expires after a configurable time period.

### Key Features

- **Client-Side Encryption**: Files are encrypted in the browser using AES-GCM before upload
- **Automatic Expiration**: Files automatically expire after 24 hours (configurable)
- **One-Time Access**: Optional single-use links that self-destruct after first access
- **No Plain-Text Storage**: Backend never sees unencrypted data
- **Secure URLs**: Custom domain builds trust vs direct S3 links
- **Zero AWS Access Required**: Recipients don't need AWS credentials

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 15 with TypeScript
- React 18
- Tailwind CSS
- Web Crypto API for client-side encryption
- AWS SDK for S3 integration

**Backend & Infrastructure:**
- AWS CDK for Infrastructure as Code
- AWS S3 for encrypted file storage
- AWS Cognito for authentication
- AWS API Gateway for secure endpoints
- DynamoDB for metadata and TTL management

### Security Flow

1. **Upload Phase**
   - User uploads file through web interface
   - File is encrypted client-side with AES-GCM
   - Encrypted data stored in S3 with random object key
   - Unique sharing code generated and mapped to S3 location
   - Encryption key embedded in URL fragment (never sent to server)

2. **Share Phase**
   - Uploader receives shareable URL: `https://share.company.com/s/abc123#encryption-key`
   - Link can be shared via any communication channel
   - Recipient needs no special access or credentials

3. **Download Phase**
   - Recipient visits shared URL
   - Frontend validates sharing code with backend
   - Backend generates presigned S3 download URL
   - Encrypted file downloaded directly from S3
   - File decrypted client-side using key from URL fragment

4. **Cleanup Phase**
   - Files automatically expire after 24 hours
   - Optional immediate deletion after first access
   - S3 lifecycle rules ensure complete cleanup

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+ for CDK
- AWS CLI configured
- AWS CDK v2 installed

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Internal_Tools
   ```

2. **Install dependencies:**
   ```bash
   # Frontend dependencies
   cd frontend
   npm install
   cd ..

   # CDK dependencies
   cd infra
   pip install -r requirements.txt
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your AWS account details
   ```

4. **Deploy infrastructure:**
   ```bash
   cd infra
   cdk deploy --all
   ```

5. **Start development server:**
   ```bash
   cd frontend
   npm run dev
   ```

### Environment Variables

Create a `.env` file in the project root:

```env
CDK_DEFAULT_ACCOUNT=your-aws-account-id
CDK_DEFAULT_REGION=us-east-1
ENV=production
```

## 📁 Project Structure

```
Internal_Tools/
├── frontend/                 # Next.js React application
│   ├── src/
│   │   ├── app/             # Next.js app router pages
│   │   ├── components/      # Reusable React components
│   │   └── lib/             # Utility functions and crypto
│   ├── package.json
│   └── next.config.js
├── infra/                   # AWS CDK infrastructure
│   ├── stacks/
│   │   ├── auth_stack.py    # Cognito authentication
│   │   ├── api_stack.py     # API Gateway configuration
│   │   └── credential_sharing_stack.py  # S3 and DynamoDB
│   ├── app.py               # CDK app entry point
│   └── cdk.json
└── README.md
```

## 🔧 Configuration

### File Expiration

Default expiration is 24 hours. To modify:

1. Update S3 lifecycle rules in `credential_sharing_stack.py`
2. Adjust DynamoDB TTL settings
3. Update frontend validation logic

### Security Settings

- **Encryption**: AES-GCM with 256-bit keys
- **Key Generation**: Cryptographically secure random keys
- **Access Control**: Cognito-based authentication for uploaders
- **Rate Limiting**: Configurable via API Gateway

## 🛡️ Security Considerations

- **Zero-Knowledge Architecture**: Server never has access to encryption keys
- **Forward Secrecy**: Encryption keys are not stored anywhere
- **Automatic Cleanup**: All data has mandatory expiration
- **HTTPS Everywhere**: All traffic encrypted in transit
- **Input Validation**: All uploads validated and sanitized
- **Access Logging**: All access attempts logged for audit

## 📊 Usage Examples

### Sharing Environment Files
```bash
# Upload .env file via web interface
# Receive: https://share.company.com/s/abc123#key456
# Share URL with team member
# File automatically expires in 24h
```

### One-Time Secrets
```bash
# Enable "burn after reading" mode
# File deleted immediately after first access
# Perfect for temporary passwords or API keys
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This tool is designed for internal use within trusted networks. While security measures are implemented, always follow your organization's security policies when sharing sensitive data.