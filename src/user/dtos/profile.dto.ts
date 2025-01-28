import { IsEnum, IsOptional, IsString, IsDate, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export class ProfileDto {
  @IsOptional()
  @IsString()
  display_name: string;

  @IsOptional()
  @IsEnum(Gender)
  gender: Gender;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  birthday: Date;

  @IsOptional()
  @IsString()
  horoscope: string;

  @IsOptional()
  @IsString()
  zodiac: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toString())
  weight: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests: string[];

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toString())
  height: string;
}
