import {
  Body,
  Controller,
  Get,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../../core/dto/api-error-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { PaginatedPostsResponseDto } from '../posts/dto/post-response.dto';
import { PostHistoryQueryDto } from './dto/post-history-query.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfilesService } from './profiles.service';

@ApiTags('Profiles')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({
  description: 'The access token is missing, invalid, or expired.',
  type: ApiErrorResponseDto,
})
@UseGuards(JwtAuthGuard)
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  @ApiOperation({ summary: 'View the authenticated user profile' })
  @ApiOkResponse({ type: ProfileResponseDto })
  @ApiNotFoundResponse({
    description: 'The profile does not exist.',
    type: ApiErrorResponseDto,
  })
  getMyProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.getMyProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the authenticated user profile' })
  @ApiOkResponse({ type: ProfileResponseDto })
  @ApiBadRequestResponse({
    description: 'The request body failed validation.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The phone number is already registered.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'The profile does not exist.',
    type: ApiErrorResponseDto,
  })
  updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.updateMyProfile(user.id, dto);
  }

  @Get('me/posts')
  @ApiOperation({ summary: 'View the authenticated user post history' })
  @ApiOkResponse({ type: PaginatedPostsResponseDto })
  @ApiBadRequestResponse({
    description: 'The query parameters failed validation.',
    type: ApiErrorResponseDto,
  })
  getMyPostHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PostHistoryQueryDto,
  ): Promise<PaginatedPostsResponseDto> {
    return this.profilesService.getMyPostHistory(user.id, query);
  }
}
