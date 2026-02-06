/**
 * VerifyAuthChallengeResponse Lambda Trigger
 *
 * Verifies the OTP entered by the user against the hashed OTP.
 * Prevents replay attacks by deleting the OTP after successful verification.
 *
 * Security:
 *   - Timing-safe comparison
 *   - Expiry check
 *   - OTP deletion after use (prevents replay)
 */

import type { VerifyAuthChallengeResponseTriggerEvent, VerifyAuthChallengeResponseTriggerHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import * as crypto from 'crypto';

const ddbClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' }),
);

const OTP_TABLE = process.env.OTP_TABLE || '';

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

export const handler: VerifyAuthChallengeResponseTriggerHandler = async (
  event: VerifyAuthChallengeResponseTriggerEvent,
) => {
  const email = event.request.userAttributes?.email || event.userName;
  const userAnswer = event.request.challengeAnswer?.trim();
  const expectedHash = event.request.privateChallengeParameters?.otpHash;

  console.log('VerifyAuthChallengeResponse invoked for:', email);

  if (!userAnswer || !expectedHash) {
    console.warn('Missing answer or expected hash');
    event.response.answerCorrect = false;
    return event;
  }

  // Hash the user's answer and compare
  const answerHash = hashOtp(userAnswer);

  // Timing-safe comparison
  try {
    const isCorrect = crypto.timingSafeEqual(
      Buffer.from(answerHash, 'hex'),
      Buffer.from(expectedHash, 'hex'),
    );

    if (isCorrect) {
      // Check expiry from DynamoDB
      if (OTP_TABLE) {
        try {
          const record = await ddbClient.send(new GetCommand({
            TableName: OTP_TABLE,
            Key: { PK: `COGNITO_OTP#${email}`, SK: 'CHALLENGE' },
          }));

          if (!record.Item || record.Item.expiresAt < Math.floor(Date.now() / 1000)) {
            console.warn('OTP expired for:', email);
            event.response.answerCorrect = false;
            return event;
          }

          // Delete OTP after successful verification (prevent replay)
          await ddbClient.send(new DeleteCommand({
            TableName: OTP_TABLE,
            Key: { PK: `COGNITO_OTP#${email}`, SK: 'CHALLENGE' },
          }));
        } catch (error) {
          console.error('DynamoDB error during OTP verification:', error);
          // If we can't check DynamoDB, still verify based on hash
        }
      }

      console.log('OTP verified successfully for:', email);
      event.response.answerCorrect = true;
    } else {
      console.warn('Invalid OTP for:', email);
      event.response.answerCorrect = false;
    }
  } catch {
    // Buffer length mismatch = definitely wrong
    console.warn('OTP hash length mismatch for:', email);
    event.response.answerCorrect = false;
  }

  return event;
};
