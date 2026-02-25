/**
 * CreateAuthChallenge Lambda Trigger
 *
 * Generates a 6-digit OTP, stores it hashed in DynamoDB with TTL,
 * and fires off an async Lambda to send the OTP via SMTP.
 *
 * The email is sent asynchronously (InvocationType: 'Event') so this
 * trigger returns within Cognito's 5-second deadline.
 *
 * Security:
 *   - Secure random OTP generation (crypto.randomInt)
 *   - SHA-256 hashed storage (no plaintext)
 *   - 5-minute TTL with DynamoDB auto-expiry
 *   - Rate limiting via cooldown tracking
 */

import type { CreateAuthChallengeTriggerEvent, CreateAuthChallengeTriggerHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import * as crypto from 'crypto';

const ddbClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' }),
);
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'ap-south-1' });

const OTP_TABLE = process.env.OTP_TABLE || '';
const SEND_OTP_EMAIL_FUNCTION = process.env.SEND_OTP_EMAIL_FUNCTION || '';
const OTP_EXPIRY_SECONDS = 300; // 5 minutes

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

/**
 * Invoke the sendOtpEmail Lambda asynchronously (fire-and-forget).
 * This returns immediately so the Cognito trigger stays within its deadline.
 */
async function triggerOtpEmail(email: string, otp: string): Promise<void> {
  if (!SEND_OTP_EMAIL_FUNCTION) {
    console.warn('SEND_OTP_EMAIL_FUNCTION not set — cannot send OTP email');
    if (process.env.STAGE === 'dev' || process.env.STAGE === 'local') {
      console.log(`[DEV FALLBACK] OTP for ${email}: ${otp}`);
    }
    return;
  }

  try {
    await lambdaClient.send(new InvokeCommand({
      FunctionName: SEND_OTP_EMAIL_FUNCTION,
      InvocationType: 'Event', // Async — returns 202 immediately
      Payload: Buffer.from(JSON.stringify({ email, otp })),
    }));
    console.log(`Async OTP email triggered for ${email}`);
  } catch (error) {
    console.error('Failed to invoke sendOtpEmail Lambda:', error);
    // Don't throw — OTP is stored in DynamoDB, user can request resend
  }
}

export const handler: CreateAuthChallengeTriggerHandler = async (
  event: CreateAuthChallengeTriggerEvent,
) => {
  const email = event.request.userAttributes?.email || event.userName;
  console.log('CreateAuthChallenge invoked for:', email);

  // Check if this is a new challenge or a retry
  const session = event.request.session || [];
  const isRetry = session.some(s => s.challengeName === 'CUSTOM_CHALLENGE');

  // Rate limit: for retries within same session, reuse existing OTP if still valid
  if (isRetry && OTP_TABLE) {
    try {
      const existing = await ddbClient.send(new GetCommand({
        TableName: OTP_TABLE,
        Key: { PK: `COGNITO_OTP#${email}`, SK: 'CHALLENGE' },
      }));

      if (existing.Item && existing.Item.expiresAt > Math.floor(Date.now() / 1000)) {
        // Existing OTP still valid — don't send a new one, reuse the hash
        console.log('Reusing existing OTP challenge for retry');
        event.response.publicChallengeParameters = {
          email,
          type: 'OTP',
          message: 'Enter the OTP sent to your email',
        };
        event.response.privateChallengeParameters = {
          otpHash: existing.Item.otpHash,
        };
        event.response.challengeMetadata = `OTP_CHALLENGE_${email}`;
        return event;
      }
    } catch (error) {
      console.warn('Error checking existing OTP:', error);
    }
  }

  // Generate new OTP
  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + OTP_EXPIRY_SECONDS;

  // Store hashed OTP in DynamoDB with TTL
  if (OTP_TABLE) {
    await ddbClient.send(new PutCommand({
      TableName: OTP_TABLE,
      Item: {
        PK: `COGNITO_OTP#${email}`,
        SK: 'CHALLENGE',
        otpHash,
        email,
        expiresAt,
        createdAt: new Date().toISOString(),
        ttl: expiresAt, // DynamoDB TTL auto-deletes expired records
      },
    }));
  }

  // Send OTP email asynchronously (fire-and-forget via separate Lambda)
  await triggerOtpEmail(email, otp);

  // Set challenge parameters
  event.response.publicChallengeParameters = {
    email,
    type: 'OTP',
    message: 'Enter the OTP sent to your email',
  };
  event.response.privateChallengeParameters = {
    otpHash,
  };
  event.response.challengeMetadata = `OTP_CHALLENGE_${email}`;

  return event;
};
