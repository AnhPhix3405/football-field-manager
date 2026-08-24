import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../../core/dto/api-error-response.dto';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import {
  FieldAvailabilityResponseDto,
  FieldDetailResponseDto,
  PaginatedFieldsResponseDto,
} from './dto/field-response.dto';
import { SearchFieldsQueryDto } from './dto/search-fields-query.dto';
import { FieldsService } from './fields.service';

@ApiTags('Fields')
@Controller('fields')
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @Get()
  @ApiOperation({ summary: 'Search active fields by location, price, and services' })
  @ApiOkResponse({ type: PaginatedFieldsResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  search(@Query() query: SearchFieldsQueryDto): Promise<PaginatedFieldsResponseDto> {
    return this.fieldsService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'View field details, courts, services, and pricing' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: FieldDetailResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<FieldDetailResponseDto> {
    return this.fieldsService.findOne(id);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Check court availability and occupied slots for a date' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: FieldAvailabilityResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  availability(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: AvailabilityQueryDto,
  ): Promise<FieldAvailabilityResponseDto> {
    return this.fieldsService.availability(id, query);
  }
}
