/**
 * PostAuthentication Lambda Trigger
 *
 * Logs successful authentication events and syncs user data
 * to the application's DynamoDB table.
 *
 * This ensures the app's USER# records stay in sync with Cognito
 * for both password and OTP login flows.
 */

import type { PostAuthenticationTriggerEvent, PostAuthenticationTriggerHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const ddbClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' }),
);

const MAIN_TABLE = process.env.MAIN_TABLE || '';

export const handler: PostAuthenticationTriggerHandler = async (
  event: PostAuthenticationTriggerEvent,
) => {
  const email = (event.request.userAttributes?.email || event.userName).toLowerCase().trim();
  const name = event.request.userAttributes?.name;
  const cognitoSub = event.request.userAttributes?.sub || event.userName;

  console.log('PostAuthentication trigger', JSON.stringify({
    userName: event.userName,
    triggerSource: event.triggerSource,
    email,
  }));

  if (!MAIN_TABLE) {
    console.warn('MAIN_TABLE not configured, skipping user sync');
    return event;
  }

  try {
    // Check if user exists in app table
    const existing = await ddbClient.send(new GetCommand({
      TableName: MAIN_TABLE,
      Key: { PK: `USER#${email}`, SK: 'PROFILE' },
    }));

    const now = new Date().toISOString();

    if (existing.Item) {
      // Update last login and ensure Cognito sub is synced
      await ddbClient.send(new UpdateCommand({
        TableName: MAIN_TABLE,
        Key: { PK: `USER#${email}`, SK: 'PROFILE' },
        UpdateExpression: 'SET lastLoginAt = :now, updatedAt = :now, cognitoSub = :sub',
        ExpressionAttributeValues: {
          ':now': now,
          ':sub': cognitoSub,
        },
      }));
      console.log(`Updated last login for: ${email}`);
    } else {
      // Create new user record (first-time login via Cognito)
      const userId = uuidv4();
      await ddbClient.send(new PutCommand({
        TableName: MAIN_TABLE,
        Item: {
          PK: `USER#${email}`,
          SK: 'PROFILE',
          id: userId,
          cognitoSub,
          email,
          name: name || undefined,
          hasPassword: event.triggerSource === 'PostAuthentication_Authentication',
          isVerified: true,
          role: 'user',
          createdAt: now,
          updatedAt: now,
          lastLoginAt: now,
          GSI1PK: 'USER',
          GSI1SK: now,
        },
      }));
      console.log(`Created new user record for: ${email}`);
    }
  } catch (error) {
    console.error('Error syncing user to DynamoDB:', error);
    // Don't fail authentication if sync fails
  }

  return event;
};
