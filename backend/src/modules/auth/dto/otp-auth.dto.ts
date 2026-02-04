import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, IsNotEmpty } from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({
    description: 'Email address to send OTP',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: '6-digit OTP code',
    example: '123456',
  })
  @IsString()
  @Length(6, 6)
  otp: string;
}

export class OtpResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'OTP expiry time in minutes', required: false })
  expiresIn?: number;
}

export class OtpVerifyResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'JWT access token', required: false })
  accessToken?: string;

  @ApiProperty({ description: 'JWT refresh token', required: false })
  refreshToken?: string;

  @ApiProperty({ description: 'User data', required: false })
  user?: {
    id: string;
    email: string;
    name?: string;
    isNewUser: boolean;
  };
}
