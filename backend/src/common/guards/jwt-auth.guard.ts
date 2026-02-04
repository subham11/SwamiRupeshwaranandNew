import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private verifier: any;

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {
    const userPoolId = this.configService.get<string>('COGNITO_USER_POOL_ID');
    const clientId = this.configService.get<string>('COGNITO_CLIENT_ID');

    if (userPoolId && clientId) {
      // Note: aws-jwt-verify is optional, we'll do basic validation
      // For production, consider adding this package
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

    try {
      // Basic JWT validation (decode and check expiration)
      const payload = this.decodeToken(token);

      if (!payload || this.isTokenExpired(payload)) {
        throw new UnauthorizedException('Token expired');
      }

      // Attach user to request
      (request as any).user = {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
      return JSON.parse(payload);
    } catch {
      return null;
    }
  }

  private isTokenExpired(payload: any): boolean {
    if (!payload.exp) {
      return false;
    }
    // Token exp is in milliseconds, compare with current time in ms
    const now = Date.now();
    return payload.exp < now;
  }
}
