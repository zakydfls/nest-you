import { ApiProperty } from '@nestjs/swagger';

class TokenData {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Access token',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token',
  })
  refreshToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Socket token',
  })
  socketToken: string;

  @ApiProperty({
    example: 'nfdnsdjnfjdnsjfndsnfsdnjf',
    description: 'User Id',
  })
  userId: string;
}

export class LoginResponseDto {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'User logged in successfully' })
  message: string;

  @ApiProperty({
    type: TokenData,
    description: 'Token information',
  })
  data: TokenData;

  @ApiProperty({
    example: null,
    description: 'Error message if any',
  })
  error: string | null;

  @ApiProperty({
    example: {},
    description: 'Additional metadata',
  })
  metadata: Record<string, any>;
}
