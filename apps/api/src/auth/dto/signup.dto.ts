import { ApiProperty } from '@nestjs/swagger'; // 1. Importamos el decorador de Swagger
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class SignUpDto {
  // Restricción de formato de correo electrónico
  @ApiProperty({
    description: 'Correo electrónico único para el registro de la cuenta',
    example: 'juan.perez@correo.com',
  })
  @IsEmail() 
  email!: string;

  // Restricción técnica de ciberseguridad exigida por la pauta (mínimo 6 caracteres)
  @ApiProperty({
    description: 'Contraseña de acceso al sistema POS (mínimo 6 caracteres)',
    example: 'Password123!',
  })
  @IsString() 
  @MinLength(6) 
  password!: string;

  // Cumple con la opcionalidad definida en nuestro schema.prisma
  @ApiProperty({
    description: 'Nombre completo opcional del usuario o cajero',
    example: 'Juan Pérez',
    required: false, // 2. Le indicamos a Swagger que este campo no es obligatorio enviar
  })
  @IsOptional() 
  @IsString() 
  name?: string;
}