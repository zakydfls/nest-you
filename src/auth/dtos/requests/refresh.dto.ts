import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class RefreshDto {
  @ApiProperty({
    example: 'secret',
    description: 'Refresh token of the user',
  })
  @IsNotEmpty()
  refreshToken: string;
}
