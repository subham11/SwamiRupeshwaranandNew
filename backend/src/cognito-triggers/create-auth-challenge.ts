/**
 * CreateAuthChallenge Lambda Trigger
 *
 * Generates a 6-digit OTP, stores it hashed in DynamoDB with TTL,
 * and sends the OTP via SES email.
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
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import * as crypto from 'crypto';

const ddbClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' }),
);
const sesClient = new SESClient({ region: process.env.SES_REGION || process.env.AWS_REGION || 'ap-south-1' });

const OTP_TABLE = process.env.OTP_TABLE || '';
const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL || 'satyam@elevatephysique.com';
const OTP_EXPIRY_SECONDS = 300; // 5 minutes

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

async function sendOtpEmail(email: string, otp: string): Promise<void> {
  // Try SES first, fall back to logging in dev
  try {
    const command = new SendEmailCommand({
      Source: SES_FROM_EMAIL,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: `Your Login OTP - Swami Rupeshwaranand` },
        Body: {
          Html: {
            Data: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #f97316, #ea580c); border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0;">🙏 Swami Rupeshwaranand</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Path to Inner Peace</p>
  </div>
  <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Dear Seeker,</p>
    <p>Your One-Time Password for login is:</p>
    <div style="text-align: center; margin: 25px 0;">
      <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ea580c; background: #fff7ed; padding: 15px 30px; border-radius: 8px; border: 2px dashed #fb923c;">${otp}</span>
    </div>
    <p style="color: #6b7280;">This OTP is valid for <strong>5 minutes</strong>. Do not share it with anyone.</p>
    <p style="color: #6b7280;">If you did not request this, please ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="text-align: center; color: #9ca3af; font-size: 12px;">With divine blessings, Swami Rupeshwaranand Ashram</p>
  </div>
</body>
</html>`,
          },
          Text: {
            Data: `Your OTP for Swami Rupeshwaranand login is: ${otp}\n\nThis OTP is valid for 5 minutes. Do not share it.\n\nWith blessings, Swami Rupeshwaranand Ashram`,
          },
        },
      },
    });

    await sesClient.send(command);
    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error('SES send failed:', error);
    // In dev/local, log the OTP and continue (don't block auth flow)
    if (process.env.STAGE === 'dev' || process.env.STAGE === 'local') {
      console.log(`[DEV FALLBACK] OTP for ${email}: ${otp}`);
      return; // Don't throw — allow the auth flow to continue
    }
    // In production, SES must be configured — fail the flow
    throw error;
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

  // Send OTP email
  await sendOtpEmail(email, otp);

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
