import { ApiProperty } from '@nestjs/swagger'; // 1. Importamos el decorador de Swagger
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  // Asegura que el payload contenga un formato string@dominio.com válido
  @ApiProperty({
    description: 'Correo electrónico registrado para iniciar sesión',
    example: 'juan.perez@correo.com',
  })
  @IsEmail() 
  email!: string;

  // Garantiza que la entrada de datos sea texto y cumpla la regla estricta de longitud
  @ApiProperty({
    description: 'Contraseña de la cuenta (mínimo 6 caracteres)',
    example: 'Password123!',
  })
  @IsString() 
  @MinLength(6) 
  password!: string;
}