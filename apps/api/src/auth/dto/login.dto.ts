import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  // Asegura que el payload contenga un formato string@dominio.com válido
  @IsEmail() 
  email!: string;

  // Garantiza que la entrada de datos sea texto y cumpla la regla estricta de longitud
  @IsString() 
  @MinLength(6) 
  password!: string;
}