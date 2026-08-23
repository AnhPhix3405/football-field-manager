import { ApiProperty } from '@nestjs/swagger';

export class AccessTokenResponseDto {
  @ApiProperty({
    description: 'JWT access token used to authorize protected endpoints.',
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Authorization scheme used with the access token.',
    example: 'Bearer',
    enum: ['Bearer'],
  })
  tokenType: 'Bearer';

  @ApiProperty({
    description: 'Access token lifetime in seconds.',
    example: 900,
    minimum: 1,
  })
  expiresIn: number;
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code.',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message or validation error messages.',
    oneOf: [
      { type: 'string', example: 'Invalid credentials' },
      {
        type: 'array',
        items: { type: 'string' },
        example: ['email must be an email'],
      },
    ],
  })
  message: string | string[];

  @ApiProperty({
    description: 'HTTP error label.',
    example: 'Bad Request',
  })
  error: string;
}
