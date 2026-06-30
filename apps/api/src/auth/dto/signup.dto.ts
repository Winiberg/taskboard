import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class SignUpDto {
  // Restricción de formato de correo electrónico
  @IsEmail() 
  email!: string;

  // Restricción técnica de ciberseguridad exigida por la pauta (mínimo 6 caracteres)
  @IsString() 
  @MinLength(6) 
  password!: string;

  // Cumple con la opcionalidad definida en nuestro schema.prisma
  @IsOptional() 
  @IsString() 
  name?: string;
}