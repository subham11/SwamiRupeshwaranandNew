import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { DATABASE_SERVICE, DatabaseService } from '../database/database.interface';

export const IS_PUBLIC_KEY = 'isPublic';

interface UserRecord {
  PK: string;
  SK: string;
  id: string;
  email: string;
  name?: string;
  role: 'super_admin' | 'admin' | 'content_editor' | 'user';
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private verifier: any;

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
    @Inject(DATABASE_SERVICE) private readonly databaseService: DatabaseService,
  ) {
    const userPoolId = this.configService.get<string>('COGNITO_USER_POOL_ID', '');
    const clientId = this.configService.get<string>('COGNITO_CLIENT_ID', '');

    if (userPoolId && clientId) {
      this.verifier = CognitoJwtVerifier.create({
        userPoolId,
        clientId,
        tokenUse: 'id',
      });
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    if (!this.verifier) {
      this.logger.error('Cognito JWT verifier not configured (missing COGNITO_USER_POOL_ID or COGNITO_CLIENT_ID)');
      throw new UnauthorizedException('Authentication not configured');
    }

    try {
      // Verify Cognito access token (RSA signature, expiration, issuer, audience)
      const payload = await this.verifier.verify(token);

      // Extract email from Cognito ID token claims
      const email = payload.email || payload['cognito:username'];
      if (!email) {
        this.logger.warn('No email claim found in Cognito ID token');
        throw new UnauthorizedException('Invalid token: missing email claim');
      }

      // Look up user in app's DynamoDB table to get role
      const user = await this.databaseService.get<UserRecord>(
        `USER#${email.toLowerCase()}`,
        'PROFILE',
      );

      // Attach user to request
      (request as any).user = {
        sub: user?.id || payload.sub,
        email: email.toLowerCase(),
        name: user?.name,
        role: user?.role || 'user',
        cognitoSub: payload.sub,
      };

      return true;
    } catch (error) {
      this.logger.warn(`Cognito JWT verification failed: ${error instanceof Error ? error.message : 'unknown'}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
