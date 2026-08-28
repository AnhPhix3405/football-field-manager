import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
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
import { CreatePostDto } from './dto/create-post.dto';
import {
  PaginatedPostsResponseDto,
  PostResponseDto,
} from './dto/post-response.dto';
import { SearchPostsQueryDto } from './dto/search-posts-query.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';

@ApiTags('Opponent Posts')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({
  description: 'The access token is missing, invalid, or expired.',
  type: ApiErrorResponseDto,
})
@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an opponent-search post' })
  @ApiCreatedResponse({ type: PostResponseDto })
  @ApiBadRequestResponse({
    description: 'The request body failed validation.',
    type: ApiErrorResponseDto,
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePostDto,
  ): Promise<PostResponseDto> {
    return this.postsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Find opponent posts',
    description:
      "Finds open future posts by radius, play date, time window, and skill level. The authenticated user's own posts are excluded.",
  })
  @ApiOkResponse({ type: PaginatedPostsResponseDto })
  @ApiBadRequestResponse({
    description: 'The query parameters or search range are invalid.',
    type: ApiErrorResponseDto,
  })
  search(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SearchPostsQueryDto,
  ): Promise<PaginatedPostsResponseDto> {
    return this.postsService.search(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'View an opponent-search post' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PostResponseDto })
  @ApiBadRequestResponse({
    description: 'The post id is not a valid UUID.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'The post does not exist.',
    type: ApiErrorResponseDto,
  })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PostResponseDto> {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an owned opponent-search post' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PostResponseDto })
  @ApiBadRequestResponse({
    description: 'The request body or time range is invalid.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'maxPlayers is below the already accepted application count.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'The post does not exist or is not owned by the user.',
    type: ApiErrorResponseDto,
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    return this.postsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an owned opponent-search post' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'The post was soft deleted.' })
  @ApiBadRequestResponse({
    description: 'The post id is not a valid UUID.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'The post does not exist or is not owned by the user.',
    type: ApiErrorResponseDto,
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.postsService.remove(id, user.id);
  }
}
