import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto, RefreshTokenDto, NewPasswordDto } from './dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() refreshDto: RefreshTokenDto): Promise<LoginResponseDto> {
    return this.authService.refreshToken(refreshDto);
  }

  @Post('new-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set new password (for first-time login)' })
  @ApiBody({ type: NewPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password set successfully',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid session' })
  async setNewPassword(@Body() newPasswordDto: NewPasswordDto): Promise<LoginResponseDto> {
    return this.authService.setNewPassword(newPasswordDto);
  }
}
