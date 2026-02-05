/**
 * Script to create or update the super admin user
 * Usage: npx ts-node scripts/create-super-admin.ts
 */

import { DynamoDBClient, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';

const SUPER_ADMIN_EMAIL = 'subham11@gmail.com';
const SUPER_ADMIN_NAME = 'Subham (Super Admin)';
const SUPER_ADMIN_ID = 'super-admin-001';

// Configuration
const isLocal = process.env.IS_LOCAL === 'true' || process.env.NODE_ENV === 'development';
const TABLE_NAME = process.env.TABLE_NAME || 'swami-rupeshwaranand-api-local-main';
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';
const REGION = process.env.AWS_REGION || 'ap-south-1';

const dynamoClient = new DynamoDBClient({
  region: REGION,
  ...(isLocal && { endpoint: 'http://localhost:8000' }),
});

const cognitoClient = new CognitoIdentityProviderClient({
  region: REGION,
});

async function checkUserExistsInDynamoDB(): Promise<boolean> {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
      ExpressionAttributeValues: {
        ':pk': { S: 'USER' },
        ':sk': { S: `EMAIL#${SUPER_ADMIN_EMAIL}` },
      },
    });
    const result = await dynamoClient.send(command);
    return (result.Items?.length ?? 0) > 0;
  } catch (error) {
    console.error('Error checking user in DynamoDB:', error);
    return false;
  }
}

async function createUserInDynamoDB(): Promise<void> {
  const now = new Date().toISOString();
  
  const command = new PutItemCommand({
    TableName: TABLE_NAME,
    Item: {
      PK: { S: `USER#${SUPER_ADMIN_ID}` },
      SK: { S: `USER#${SUPER_ADMIN_ID}` },
      GSI1PK: { S: 'USER' },
      GSI1SK: { S: `EMAIL#${SUPER_ADMIN_EMAIL}` },
      id: { S: SUPER_ADMIN_ID },
      email: { S: SUPER_ADMIN_EMAIL },
      name: { S: SUPER_ADMIN_NAME },
      role: { S: 'super_admin' },
      status: { S: 'active' },
      createdAt: { S: now },
      updatedAt: { S: now },
    },
  });

  await dynamoClient.send(command);
  console.log('✅ Super Admin created in DynamoDB');
}

async function checkUserExistsInCognito(): Promise<boolean> {
  if (!USER_POOL_ID) {
    console.log('⚠️  Cognito User Pool ID not configured, skipping Cognito check');
    return true;
  }

  try {
    const command = new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: SUPER_ADMIN_EMAIL,
    });
    await cognitoClient.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'UserNotFoundException') {
      return false;
    }
    throw error;
  }
}

async function createUserInCognito(): Promise<void> {
  if (!USER_POOL_ID) {
    console.log('⚠️  Cognito User Pool ID not configured, skipping Cognito user creation');
    return;
  }

  // Generate a temporary password
  const tempPassword = generateTempPassword();

  try {
    // Create user in Cognito
    const createCommand = new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: SUPER_ADMIN_EMAIL,
      TemporaryPassword: tempPassword,
      UserAttributes: [
        { Name: 'email', Value: SUPER_ADMIN_EMAIL },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'name', Value: SUPER_ADMIN_NAME },
        { Name: 'custom:role', Value: 'super_admin' },
      ],
      MessageAction: 'SUPPRESS', // Don't send welcome email
    });

    await cognitoClient.send(createCommand);
    console.log('✅ Super Admin created in Cognito');
    console.log(`📧 Email: ${SUPER_ADMIN_EMAIL}`);
    console.log(`🔑 Temporary Password: ${tempPassword}`);
    console.log('⚠️  Please change this password on first login!');
  } catch (error: any) {
    if (error.name === 'UsernameExistsException') {
      console.log('ℹ️  User already exists in Cognito');
    } else {
      throw error;
    }
  }
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function main(): Promise<void> {
  console.log('🚀 Creating Super Admin User...\n');
  console.log(`Environment: ${isLocal ? 'LOCAL' : 'PRODUCTION'}`);
  console.log(`Table: ${TABLE_NAME}`);
  console.log(`Region: ${REGION}\n`);

  try {
    // Check and create in DynamoDB
    const existsInDB = await checkUserExistsInDynamoDB();
    if (existsInDB) {
      console.log('ℹ️  Super Admin already exists in DynamoDB');
    } else {
      await createUserInDynamoDB();
    }

    // Check and create in Cognito (only if not local)
    if (!isLocal) {
      const existsInCognito = await checkUserExistsInCognito();
      if (!existsInCognito) {
        await createUserInCognito();
      } else {
        console.log('ℹ️  Super Admin already exists in Cognito');
      }
    } else {
      console.log('ℹ️  Skipping Cognito for local environment');
    }

    console.log('\n✅ Super Admin setup complete!');
    console.log(`\n📧 Super Admin Email: ${SUPER_ADMIN_EMAIL}`);
    console.log(`🔒 Role: super_admin`);
  } catch (error) {
    console.error('❌ Error creating Super Admin:', error);
    process.exit(1);
  }
}

main();
