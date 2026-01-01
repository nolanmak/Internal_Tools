import { NextRequest, NextResponse } from 'next/server';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { fromIni } from '@aws-sdk/credential-providers';

// Use named profile for local dev, falls back to env vars / IAM role in production
const isDev = process.env.NODE_ENV === 'development';

const secretsClient = new SecretsManagerClient({
  region: 'us-east-1',
  ...(isDev && { credentials: fromIni({ profile: 'shadowshare' }) }),
});

const SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:975050218051:secret:ShadowShareAccess-oZqqoj';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    // Fetch secret from AWS Secrets Manager
    const command = new GetSecretValueCommand({ SecretId: SECRET_ARN });
    const secretResponse = await secretsClient.send(command);

    if (!secretResponse.SecretString) {
      console.error('Secret value is empty');
      return NextResponse.json(
        { success: false, error: 'Authentication service unavailable' },
        { status: 500 }
      );
    }

    // Parse the secret JSON to get the access codes
    const secretData = JSON.parse(secretResponse.SecretString);
    const accessCodesRaw = secretData.ShadowShareAccessCode;

    if (!accessCodesRaw) {
      console.error('ShadowShareAccessCode key not found in secret');
      return NextResponse.json(
        { success: false, error: 'Authentication service misconfigured' },
        { status: 500 }
      );
    }

    // Parse comma-separated passwords and trim whitespace
    const validPasswords = accessCodesRaw
      .split(',')
      .map((pw: string) => pw.trim())
      .filter((pw: string) => pw.length > 0);

    // Check if provided password matches any valid password
    const isValid = validPasswords.includes(password);

    if (isValid) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Auth validation error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed. Please try again.' },
      { status: 500 }
    );
  }
}
