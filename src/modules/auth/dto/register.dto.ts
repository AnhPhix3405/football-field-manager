import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Unique email address used to sign in.',
    example: 'player@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Unique phone number containing 9 to 15 digits; a leading + is allowed.',
    example: '+84901234567',
    pattern: '^[0-9+]{9,15}$',
  })
  @IsOptional()
  @Matches(/^[0-9+]{9,15}$/)
  phone?: string;

  @ApiProperty({
    description:
      'Password containing at least one uppercase letter, one lowercase letter, and one number.',
    example: 'StrongPass123',
    minLength: 8,
    maxLength: 72,
    writeOnly: true,
  })
  @IsString()
  @Length(8, 72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'password must contain uppercase, lowercase and number',
  })
  password: string;

  @ApiProperty({
    description: 'Player display name.',
    example: 'Nguyen Van A',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @Length(2, 100)
  fullName: string;
}
