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
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { CookieOptions, Request, Response } from 'express';
import { AuthService } from './auth.service';
import type { TokenPair } from './auth.service';
import {
  AccessTokenResponseDto,
  ErrorResponseDto,
} from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly cookieName =
    process.env.REFRESH_TOKEN_COOKIE_NAME ?? 'refresh_token';

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a player account',
    description:
      'Creates an active user account, returns an access token, and stores the refresh token in an HttpOnly cookie.',
  })
  @ApiConsumes('application/json')
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    description:
      'Account created. A refresh token is returned in the HttpOnly Set-Cookie header.',
    type: AccessTokenResponseDto,
    headers: {
      'Set-Cookie': {
        description: 'HttpOnly refresh token cookie.',
        schema: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'The request body failed validation.',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The email address or phone number is already registered.',
    type: ErrorResponseDto,
  })
  async register(
    @Body() dto: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AccessTokenResponseDto> {
    const tokens = await this.authService.register(dto, this.getContext(request));
    this.setRefreshTokenCookie(response, tokens.refreshToken);
    return this.toAccessTokenResponse(tokens);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log in',
    description:
      'Authenticates an active account, returns an access token, and stores the refresh token in an HttpOnly cookie.',
  })
  @ApiConsumes('application/json')
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description:
      'Authentication succeeded. A refresh token is returned in the HttpOnly Set-Cookie header.',
    type: AccessTokenResponseDto,
    headers: {
      'Set-Cookie': {
        description: 'HttpOnly refresh token cookie.',
        schema: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'The request body failed validation.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'The credentials are invalid or the account is not active.',
    type: ErrorResponseDto,
  })
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AccessTokenResponseDto> {
    const tokens = await this.authService.login(dto, this.getContext(request));
    this.setRefreshTokenCookie(response, tokens.refreshToken);
    return this.toAccessTokenResponse(tokens);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('refresh-token')
  @ApiOperation({
    summary: 'Refresh the token pair',
    description:
      'Rotates the refresh token from the HttpOnly cookie and returns a new access token.',
  })
  @ApiOkResponse({
    description:
      'Token rotation succeeded. The new refresh token replaces the previous cookie.',
    type: AccessTokenResponseDto,
    headers: {
      'Set-Cookie': {
        description: 'Rotated HttpOnly refresh token cookie.',
        schema: { type: 'string' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description:
      'The refresh token cookie is missing, expired, invalid, revoked, or already used.',
    type: ErrorResponseDto,
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AccessTokenResponseDto> {
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
  @ApiCookieAuth('refresh-token')
  @ApiOperation({
    summary: 'Log out',
    description:
      'Revokes the current refresh-token session when possible and always clears the refresh-token cookie.',
  })
  @ApiNoContentResponse({
    description: 'Logout completed. The refresh-token cookie was cleared.',
    headers: {
      'Set-Cookie': {
        description: 'Expired refresh-token cookie.',
        schema: { type: 'string' },
      },
    },
  })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const refreshToken = request.cookies?.[this.cookieName] as string | undefined;
    await this.authService.logout(refreshToken);
    response.clearCookie(this.cookieName, this.cookieOptions());
  }

  private toAccessTokenResponse(tokens: TokenPair): AccessTokenResponseDto {
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
