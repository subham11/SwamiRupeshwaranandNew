import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private readonly jwtSecret: string;

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.get('JWT_SECRET', 'ashram-jwt-secret-key-2024');
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

    const payload = this.verifyAndDecodeToken(token);

    if (!payload) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Only allow access tokens, not refresh tokens
    if (payload.type === 'refresh') {
      throw new UnauthorizedException('Access token required');
    }

    // Attach user to request
    (request as any).user = {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role || 'user',
    };

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  /**
   * Verify JWT signature (HMAC-SHA256) and decode payload.
   * Uses base64url encoding matching OtpAuthService token generation.
   * Returns decoded payload or null if invalid/expired.
   */
  private verifyAndDecodeToken(token: string): any | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [header, payload, signature] = parts;

      // Verify HMAC-SHA256 signature
      const expectedSignature = crypto
        .createHmac('sha256', this.jwtSecret)
        .update(`${header}.${payload}`)
        .digest('base64url');

      if (!crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      )) {
        this.logger.warn('JWT signature verification failed');
        return null;
      }

      // Decode payload using base64url (matching OtpAuthService)
      const decoded = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf-8'),
      );

      // Check expiration (exp is in milliseconds, matching OtpAuthService)
      if (decoded.exp && decoded.exp < Date.now()) {
        this.logger.debug('JWT token expired');
        return null;
      }

      return decoded;
    } catch (error) {
      this.logger.warn(`JWT verification error: ${error instanceof Error ? error.message : 'unknown'}`);
      return null;
    }
  }
}
