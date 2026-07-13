import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TokenDto {
  @ApiProperty({
    description: 'Refresh token emitido en login/signup/refresh',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  refresh_token!: string;
}