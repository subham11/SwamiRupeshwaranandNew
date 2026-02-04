import { Injectable } from '@nestjs/common';
import { CognitoService } from '@/common/cognito';
import { LoginDto, LoginResponseDto, RefreshTokenDto, NewPasswordDto } from './dto';

@Injectable()
export class AuthService {
  constructor(private readonly cognitoService: CognitoService) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const result = await this.cognitoService.authenticate(loginDto.email, loginDto.password);

    return {
      success: true,
      message: 'Login successful',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      idToken: result.idToken,
      expiresIn: result.expiresIn,
    };
  }

  async refreshToken(refreshDto: RefreshTokenDto): Promise<LoginResponseDto> {
    const result = await this.cognitoService.refreshToken(refreshDto.refreshToken);

    return {
      success: true,
      message: 'Token refreshed successfully',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      idToken: result.idToken,
      expiresIn: result.expiresIn,
    };
  }

  async setNewPassword(newPasswordDto: NewPasswordDto): Promise<LoginResponseDto> {
    const result = await this.cognitoService.respondToNewPasswordChallenge(
      newPasswordDto.email,
      newPasswordDto.newPassword,
      newPasswordDto.session,
    );

    return {
      success: true,
      message: 'Password set successfully',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      idToken: result.idToken,
      expiresIn: result.expiresIn,
    };
  }
}
