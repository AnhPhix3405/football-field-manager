import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../../core/dto/api-error-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import {
  ApplicationDecisionResponseDto,
  ApplicationResponseDto,
} from './dto/application-response.dto';
import { DecideApplicationDto } from './dto/decide-application.dto';
import { MatchesService } from './matches.service';

@ApiTags('Opponent Matching')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({
  description: 'The access token is missing, invalid, or expired.',
  type: ApiErrorResponseDto,
})
@UseGuards(JwtAuthGuard)
@Controller('posts')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post(':postId/applications')
  @ApiOperation({ summary: 'Apply to join an opponent-search post' })
  @ApiParam({ name: 'postId', format: 'uuid' })
  @ApiCreatedResponse({ type: ApplicationResponseDto })
  @ApiBadRequestResponse({
    description: 'The post id is not a valid UUID.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description:
      'The user owns the post, already applied, or the post is full.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  apply(
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApplicationResponseDto> {
    return this.matchesService.apply(postId, user.id);
  }

  @Get(':postId/applications')
  @ApiOperation({ summary: 'List applications for an owned post' })
  @ApiParam({ name: 'postId', format: 'uuid' })
  @ApiOkResponse({ type: [ApplicationResponseDto] })
  @ApiBadRequestResponse({
    description: 'The post id is not a valid UUID.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'The post does not exist or is not owned by the user.',
    type: ApiErrorResponseDto,
  })
  listForPost(
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApplicationResponseDto[]> {
    return this.matchesService.listForPost(postId, user.id);
  }

  @Patch(':postId/applications/:applicationId')
  @ApiOperation({
    summary: 'Accept or reject an application',
    description:
      'Accepting updates the player count and atomically creates a direct conversation.',
  })
  @ApiParam({ name: 'postId', format: 'uuid' })
  @ApiParam({ name: 'applicationId', format: 'uuid' })
  @ApiOkResponse({ type: ApplicationDecisionResponseDto })
  @ApiBadRequestResponse({
    description: 'A UUID or decision value is invalid.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'The application was decided or the post is full.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  decide(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DecideApplicationDto,
  ): Promise<ApplicationDecisionResponseDto> {
    return this.matchesService.decide(postId, applicationId, user.id, dto);
  }
}

@ApiTags('Opponent Matching')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('applications')
export class MyApplicationsController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('me')
  @ApiOperation({ summary: 'List the authenticated user applications' })
  @ApiOkResponse({ type: [ApplicationResponseDto] })
  @ApiUnauthorizedResponse({
    description: 'The access token is missing, invalid, or expired.',
    type: ApiErrorResponseDto,
  })
  listMine(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApplicationResponseDto[]> {
    return this.matchesService.listMine(user.id);
  }
}
