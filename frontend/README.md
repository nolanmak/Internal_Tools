# ShadowShare - Secure File Sharing

A Next.js application for secure temporary file sharing, specifically designed for .env files and text-based configuration files.

## Features

- 🔐 **Password Protected**: Access controlled with hardcoded password
- 📁 **File Upload**: Drag & drop or click to upload .env, .txt, .json, .yaml, .log, and .conf files
- ☁️ **S3 Integration**: Files stored in AWS S3 with 24-hour auto-deletion
- 🔗 **Direct Links**: Get direct download links for shared files
- 📱 **Responsive**: Works on desktop and mobile devices
- 🎨 **Modern UI**: Clean, dark theme with Tailwind CSS

## Quick Start

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your AWS credentials and S3 bucket name
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)**

## Configuration

### Environment Variables

Create a `.env.local` file in the frontend directory:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# S3 Bucket (from your CDK deployment)
S3_BUCKET_NAME=internal-tools-credentials
```

### Access Password

The application uses a hardcoded password: `ShadowShare2025_j232jjsk7n4p8m2`

To change this, edit the password in `src/lib/auth.ts`.

## Security Features

- **Session-based authentication** (stored in sessionStorage)
- **File type validation** (only allows specific text-based files)
- **File size limits** (5MB maximum)
- **Auto-deletion** (files deleted after 24 hours via S3 lifecycle)
- **No public access** (all files require direct links)

## Supported File Types

- `.env` files
- `.txt` and `.text` files
- `.json` files
- `.yaml` and `.yml` files
- `.log` files
- `.conf` and `.config` files

## Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Deploy to Vercel
```bash
npx vercel
```

Make sure to add your environment variables in the Vercel dashboard.

## S3 Bucket Policy

Your S3 bucket should have a policy that allows the application to upload files. The CDK deployment automatically sets this up with the correct permissions.

## Tech Stack

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **AWS SDK v3** for S3 integration
- **Lucide React** for icons

## File Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/upload/        # S3 upload API endpoint
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Main page
│   ├── components/
│   │   ├── FileUpload.tsx     # File upload interface
│   │   └── LoginForm.tsx      # Password authentication
│   └── lib/
│       ├── auth.ts            # Authentication utilities
│       └── s3.ts              # S3 upload utilities
├── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

Private internal tool - not for public distribution.