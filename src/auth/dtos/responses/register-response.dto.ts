import { ApiProperty } from '@nestjs/swagger';

class UserDataDto {
  @ApiProperty({ example: 'test@gmail.com' })
  email: string;

  @ApiProperty({ example: 'test' })
  username: string;

  @ApiProperty({ example: '' })
  about: string;

  @ApiProperty({ example: '' })
  avatar: string;

  @ApiProperty({ example: [], type: [String] })
  interests: string[];

  @ApiProperty({ example: '' })
  display_name: string;

  @ApiProperty({ example: '' })
  gender: string;

  @ApiProperty({ example: 'user' })
  role: string;

  @ApiProperty({ example: null })
  birthday: Date | null;

  @ApiProperty({ example: '' })
  horoscope: string;

  @ApiProperty({ example: '' })
  zodiac: string;

  @ApiProperty({ example: '' })
  weight: string;

  @ApiProperty({ example: '' })
  height: string;

  @ApiProperty({ example: '67988bd7d3aa2a4cf509c234' })
  _id: string;

  @ApiProperty({ example: '2025-01-28T07:48:39.358Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-28T07:48:39.358Z' })
  updatedAt: Date;

  @ApiProperty({ example: 0 })
  __v: number;
}

export class RegisterResponseDto {
  @ApiProperty({ example: 201 })
  statusCode: number;

  @ApiProperty({ example: 'User registered successfully' })
  message: string;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: UserDataDto })
  data: UserDataDto;

  @ApiProperty({ example: null })
  error: string | null;

  @ApiProperty({ example: null })
  metadata: string | null;
}
