import { ApiProperty } from '@nestjs/swagger';
import { User } from '../domain/user';

export class UserProfileDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'ana@example.com' }) email!: string;
  @ApiProperty({ example: 'Ana' }) nombre!: string;
  @ApiProperty({ example: '2026-09-28T21:40:00.000Z' }) creado_en!: string;

  static from(u: User): UserProfileDto {
    return { id: u.id, email: u.email, nombre: u.displayName, creado_en: u.createdAt.toISOString() };
  }
}
