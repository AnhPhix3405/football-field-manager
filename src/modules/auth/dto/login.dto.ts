import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Registered email address.',
    example: 'player@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Account password.',
    example: 'StrongPass123',
    minLength: 1,
    maxLength: 72,
    writeOnly: true,
  })
  @IsString()
  @Length(1, 72)
  password: string;
}
