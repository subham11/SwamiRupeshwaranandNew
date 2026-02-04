import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok', description: 'Health status' })
  status: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', description: 'Timestamp' })
  timestamp: string;

  @ApiProperty({ example: 'swami-rupeshwaranand-api', description: 'Service name' })
  service: string;

  @ApiProperty({ example: '1.0.0', description: 'Service version' })
  version: string;
}
