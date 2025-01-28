import { ApiProperty } from '@nestjs/swagger';

class RefreshTokenData {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Access token',
  })
  accessToken: string;
}

export class RefreshResponseDto {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Token refreshed in successfully' })
  message: string;

  @ApiProperty({
    type: RefreshTokenData,
    description: 'Token information',
  })
  data: RefreshTokenData;

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
