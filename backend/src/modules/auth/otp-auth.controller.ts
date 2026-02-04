import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { OtpAuthService } from './otp-auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import {
  RequestOtpDto,
  VerifyOtpDto,
  OtpResponseDto,
  OtpVerifyResponseDto,
} from './dto/otp-auth.dto';
import {
  LoginDto,
  LoginResponseDto,
  SetPasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  RefreshTokenDto,
} from './dto/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class OtpAuthController {
  constructor(private readonly otpAuthService: OtpAuthService) {}

  // ============================================
  // OTP Endpoints
  // ============================================

  @Public()
  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request OTP',
    description: 'Send a one-time password to the provided email address for login/signup',
  })
  @ApiBody({ type: RequestOtpDto })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    type: OtpResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - cooldown period active or invalid email',
  })
  async requestOtp(@Body() dto: RequestOtpDto): Promise<OtpResponseDto> {
    return this.otpAuthService.requestOtp(dto.email);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify OTP',
    description: 'Verify the OTP and authenticate the user. Creates account if user is new.',
  })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully - returns tokens and user data',
    type: OtpVerifyResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'OTP expired or not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid OTP or too many attempts',
  })
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<OtpVerifyResponseDto> {
    return this.otpAuthService.verifyOtp(dto.email, dto.otp);
  }

  @Public()
  @Post('otp/resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend OTP',
    description: 'Resend OTP to the email address (subject to cooldown)',
  })
  @ApiBody({ type: RequestOtpDto })
  @ApiResponse({
    status: 200,
    description: 'OTP resent successfully',
    type: OtpResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cooldown period active',
  })
  async resendOtp(@Body() dto: RequestOtpDto): Promise<OtpResponseDto> {
    return this.otpAuthService.resendOtp(dto.email);
  }

  // ============================================
  // Password Endpoints
  // ============================================

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with password',
    description: 'Authenticate user with email and password',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password',
  })
  async loginWithPassword(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.otpAuthService.loginWithPassword(dto.email, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Post('set-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Set password',
    description: 'Set a password for the authenticated user (after OTP login)',
  })
  @ApiBody({ type: SetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password set successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Passwords do not match or invalid password format',
  })
  async setPassword(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: SetPasswordDto,
  ) {
    return this.otpAuthService.setPassword(
      user.sub,
      user.email,
      dto.password,
      dto.confirmPassword,
    );
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Forgot password',
    description: 'Request OTP for password reset',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset OTP sent if account exists',
    type: OtpResponseDto,
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<OtpResponseDto> {
    return this.otpAuthService.requestPasswordResetOtp(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password',
    description: 'Reset password using OTP',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired OTP',
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.otpAuthService.resetPassword(dto.email, dto.otp, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change password',
    description: 'Change password for authenticated user',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Current password is incorrect',
  })
  async changePassword(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.otpAuthService.changePassword(
      user.sub,
      user.email,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  // ============================================
  // Token & Profile Endpoints
  // ============================================

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh token',
    description: 'Get a new access token using refresh token',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'New tokens generated',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
  })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.otpAuthService.refreshToken(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Get the current authenticated user profile',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile',
  })
  async getProfile(@CurrentUser() user: CurrentUserData) {
    return this.otpAuthService.getProfile(user.sub, user.email);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Update the current authenticated user profile',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  async updateProfile(
    @CurrentUser() user: CurrentUserData,
    @Body() updates: { name?: string; phone?: string },
  ) {
    return this.otpAuthService.updateProfile(user.sub, user.email, updates);
  }
}
