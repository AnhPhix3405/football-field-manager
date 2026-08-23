import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @Matches(/^[0-9+]{9,15}$/)
  phone?: string;

  @IsString()
  @Length(8, 72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'password must contain uppercase, lowercase and number',
  })
  password: string;

  @IsString()
  @Length(2, 100)
  fullName: string;
}
