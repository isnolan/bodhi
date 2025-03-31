import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class captchaDto {
  @ApiProperty({ description: '', example: '' })
  @IsNotEmpty()
  @IsString()
  account: string;

  @ApiProperty({ description: 'Region', example: 'zh-CN' })
  @IsString()
  locale: string;
}

export class loginDto extends captchaDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  code: string;
}

// login-email.dto.ts
export class LoginEmailDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  password: string;
}

export class LoginCodeDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  code: string;
}
