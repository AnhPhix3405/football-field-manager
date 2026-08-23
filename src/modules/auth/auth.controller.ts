import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { CookieOptions, Request, Response } from 'express';
import { AuthService, TokenPair } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;

@Controller('auth')
export class AuthController {
  private readonly cookieName =
    process.env.REFRESH_TOKEN_COOKIE_NAME ?? 'refresh_token';

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.authService.register(dto, this.getContext(request));
    this.setRefreshTokenCookie(response, tokens.refreshToken);
    return this.toAccessTokenResponse(tokens);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.authService.login(dto, this.getContext(request));
    this.setRefreshTokenCookie(response, tokens.refreshToken);
    return this.toAccessTokenResponse(tokens);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.[this.cookieName] as string | undefined;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token cookie is missing');
    }

    const tokens = await this.authService.refresh(
      refreshToken,
      this.getContext(request),
    );
    this.setRefreshTokenCookie(response, tokens.refreshToken);
    return this.toAccessTokenResponse(tokens);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const refreshToken = request.cookies?.[this.cookieName] as string | undefined;
    await this.authService.logout(refreshToken);
    response.clearCookie(this.cookieName, this.cookieOptions());
  }

  private toAccessTokenResponse(tokens: TokenPair) {
    return {
      accessToken: tokens.accessToken,
      tokenType: tokens.tokenType,
      expiresIn: tokens.expiresIn,
    };
  }

  private setRefreshTokenCookie(response: Response, refreshToken: string): void {
    response.cookie(this.cookieName, refreshToken, {
      ...this.cookieOptions(),
      maxAge:
        Number(
          process.env.JWT_REFRESH_TTL_SECONDS ?? THIRTY_DAYS_IN_SECONDS,
        ) * 1000,
    });
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      path: '/api/v1/auth',
    };
  }

  private getContext(request: Request) {
    return {
      userAgent: request.get('user-agent') ?? null,
      ipAddress: request.ip ?? null,
    };
  }
}
