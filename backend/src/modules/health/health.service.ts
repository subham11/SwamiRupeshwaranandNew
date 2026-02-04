import { Injectable } from '@nestjs/common';
import { HealthResponseDto } from './dto/health-response.dto';

@Injectable()
export class HealthService {
  check(): HealthResponseDto {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'swami-rupeshwaranand-api',
      version: '1.0.0',
    };
  }

  readiness(): HealthResponseDto {
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      service: 'swami-rupeshwaranand-api',
      version: '1.0.0',
    };
  }
}
