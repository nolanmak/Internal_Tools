import { NextRequest, NextResponse } from 'next/server';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const secretsClient = new SecretsManagerClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
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
