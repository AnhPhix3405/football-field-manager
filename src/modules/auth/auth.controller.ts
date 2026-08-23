import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto, @Req() request: Request) {
    return this.authService.register(dto, this.getContext(request));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() request: Request) {
    return this.authService.login(dto, this.getContext(request));
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto, @Req() request: Request) {
    return this.authService.refresh(dto, this.getContext(request));
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: RefreshTokenDto): Promise<void> {
    await this.authService.logout(dto);
  }

  private getContext(request: Request) {
    return {
      userAgent: request.get('user-agent') ?? null,
      ipAddress: request.ip ?? null,
    };
  }
}
