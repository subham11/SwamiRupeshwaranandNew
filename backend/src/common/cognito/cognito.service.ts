import { Injectable, Inject, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  AdminInitiateAuthCommand,
  AdminRespondToAuthChallengeCommand,
  AdminUpdateUserAttributesCommand,
  AdminSetUserPasswordCommand,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  AuthFlowType,
  ChallengeNameType,
  MessageActionType,
} from '@aws-sdk/client-cognito-identity-provider';

export interface CognitoUser {
  username: string;
  email: string;
  name?: string;
  status?: string;
  enabled?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
}

export interface CustomAuthInitResult {
  session: string;
  challengeName: string;
  challengeParameters: Record<string, string>;
}

@Injectable()
export class CognitoService {
  private readonly userPoolId: string;
  private readonly clientId: string;

  constructor(
    @Inject('COGNITO_CLIENT')
    private readonly client: CognitoIdentityProviderClient,
    private readonly configService: ConfigService,
  ) {
    this.userPoolId = this.configService.get<string>('COGNITO_USER_POOL_ID', '');
    this.clientId = this.configService.get<string>('COGNITO_CLIENT_ID', '');
  }

  async createUser(email: string, temporaryPassword: string, name?: string): Promise<CognitoUser> {
    const userAttributes = [
      { Name: 'email', Value: email },
      { Name: 'email_verified', Value: 'true' },
    ];

    if (name) {
      userAttributes.push({ Name: 'name', Value: name });
    }

    const command = new AdminCreateUserCommand({
      UserPoolId: this.userPoolId,
      Username: email,
      UserAttributes: userAttributes,
      TemporaryPassword: temporaryPassword,
      MessageAction: MessageActionType.SUPPRESS, // Don't send welcome email
    });

    const result = await this.client.send(command);

    return {
      username: result.User?.Username || email,
      email,
      name,
      status: result.User?.UserStatus,
      enabled: result.User?.Enabled,
      createdAt: result.User?.UserCreateDate,
    };
  }

  async getUser(username: string): Promise<CognitoUser | null> {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      });

      const result = await this.client.send(command);

      const email = result.UserAttributes?.find((attr) => attr.Name === 'email')?.Value || '';
      const name = result.UserAttributes?.find((attr) => attr.Name === 'name')?.Value;

      return {
        username: result.Username || username,
        email,
        name,
        status: result.UserStatus,
        enabled: result.Enabled,
        createdAt: result.UserCreateDate,
        updatedAt: result.UserLastModifiedDate,
      };
    } catch (error: any) {
      if (error.name === 'UserNotFoundException') {
        return null;
      }
      throw error;
    }
  }

  async deleteUser(username: string): Promise<void> {
    const command = new AdminDeleteUserCommand({
      UserPoolId: this.userPoolId,
      Username: username,
    });

    await this.client.send(command);
  }

  /**
   * Password-based login (USER_PASSWORD_AUTH via Admin API)
   */
  async authenticate(email: string, password: string): Promise<AuthResult> {
    try {
      const command = new AdminInitiateAuthCommand({
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });

      const result = await this.client.send(command);

      // Handle new password required challenge
      if (result.ChallengeName === ChallengeNameType.NEW_PASSWORD_REQUIRED) {
        throw new BadRequestException({
          message: 'New password required',
          challengeName: result.ChallengeName,
          session: result.Session,
        });
      }

      if (!result.AuthenticationResult) {
        throw new UnauthorizedException('Authentication failed');
      }

      return {
        accessToken: result.AuthenticationResult.AccessToken || '',
        refreshToken: result.AuthenticationResult.RefreshToken || '',
        idToken: result.AuthenticationResult.IdToken || '',
        expiresIn: result.AuthenticationResult.ExpiresIn || 3600,
      };
    } catch (error: any) {
      if (error.name === 'NotAuthorizedException' || error.name === 'UserNotFoundException') {
        throw new UnauthorizedException('Invalid credentials');
      }
      throw error;
    }
  }

  /**
   * Initiate CUSTOM_AUTH flow for OTP-based passwordless login.
   * Triggers DefineAuthChallenge → CreateAuthChallenge (sends OTP email).
   * Returns session token to be used with respondToCustomChallenge().
   */
  async initiateCustomAuth(email: string): Promise<CustomAuthInitResult> {
    try {
      const command = new InitiateAuthCommand({
        ClientId: this.clientId,
        AuthFlow: AuthFlowType.CUSTOM_AUTH,
        AuthParameters: {
          USERNAME: email,
        },
      });

      const result = await this.client.send(command);

      if (!result.Session || !result.ChallengeName) {
        throw new UnauthorizedException('Failed to initiate OTP flow');
      }

      return {
        session: result.Session,
        challengeName: result.ChallengeName,
        challengeParameters: result.ChallengeParameters || {},
      };
    } catch (error: any) {
      if (error.name === 'UserNotFoundException') {
        throw new UnauthorizedException('User not found');
      }
      throw error;
    }
  }

  /**
   * Respond to CUSTOM_CHALLENGE with OTP answer.
   * If OTP is correct, returns Cognito tokens.
   * If wrong, returns a new challenge for retry.
   */
  async respondToCustomChallenge(
    email: string,
    answer: string,
    session: string,
  ): Promise<AuthResult | CustomAuthInitResult> {
    try {
      const command = new RespondToAuthChallengeCommand({
        ClientId: this.clientId,
        ChallengeName: ChallengeNameType.CUSTOM_CHALLENGE,
        ChallengeResponses: {
          USERNAME: email,
          ANSWER: answer,
        },
        Session: session,
      });

      const result = await this.client.send(command);

      // If tokens are returned, authentication succeeded
      if (result.AuthenticationResult) {
        return {
          accessToken: result.AuthenticationResult.AccessToken || '',
          refreshToken: result.AuthenticationResult.RefreshToken || '',
          idToken: result.AuthenticationResult.IdToken || '',
          expiresIn: result.AuthenticationResult.ExpiresIn || 3600,
        };
      }

      // Another challenge issued (wrong OTP, retry)
      if (result.ChallengeName && result.Session) {
        return {
          session: result.Session,
          challengeName: result.ChallengeName,
          challengeParameters: result.ChallengeParameters || {},
        };
      }

      throw new UnauthorizedException('Authentication failed');
    } catch (error: any) {
      if (error.name === 'NotAuthorizedException') {
        throw new UnauthorizedException('Too many failed attempts. Please request a new OTP.');
      }
      if (error.name === 'CodeMismatchException') {
        throw new UnauthorizedException('Invalid OTP');
      }
      throw error;
    }
  }

  async respondToNewPasswordChallenge(
    email: string,
    newPassword: string,
    session: string,
  ): Promise<AuthResult> {
    const command = new AdminRespondToAuthChallengeCommand({
      UserPoolId: this.userPoolId,
      ClientId: this.clientId,
      ChallengeName: ChallengeNameType.NEW_PASSWORD_REQUIRED,
      ChallengeResponses: {
        USERNAME: email,
        NEW_PASSWORD: newPassword,
      },
      Session: session,
    });

    const result = await this.client.send(command);

    if (!result.AuthenticationResult) {
      throw new UnauthorizedException('Failed to set new password');
    }

    return {
      accessToken: result.AuthenticationResult.AccessToken || '',
      refreshToken: result.AuthenticationResult.RefreshToken || '',
      idToken: result.AuthenticationResult.IdToken || '',
      expiresIn: result.AuthenticationResult.ExpiresIn || 3600,
    };
  }

  async setUserPassword(username: string, password: string, permanent = true): Promise<void> {
    const command = new AdminSetUserPasswordCommand({
      UserPoolId: this.userPoolId,
      Username: username,
      Password: password,
      Permanent: permanent,
    });

    await this.client.send(command);
  }

  async updateUserAttributes(username: string, attributes: Record<string, string>): Promise<void> {
    const userAttributes = Object.entries(attributes).map(([name, value]) => ({
      Name: name,
      Value: value,
    }));

    const command = new AdminUpdateUserAttributesCommand({
      UserPoolId: this.userPoolId,
      Username: username,
      UserAttributes: userAttributes,
    });

    await this.client.send(command);
  }

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const command = new AdminInitiateAuthCommand({
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      });

      const result = await this.client.send(command);

      if (!result.AuthenticationResult) {
        throw new UnauthorizedException('Token refresh failed');
      }

      return {
        accessToken: result.AuthenticationResult.AccessToken || '',
        refreshToken: refreshToken, // Refresh token doesn't change
        idToken: result.AuthenticationResult.IdToken || '',
        expiresIn: result.AuthenticationResult.ExpiresIn || 3600,
      };
    } catch (error: any) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
