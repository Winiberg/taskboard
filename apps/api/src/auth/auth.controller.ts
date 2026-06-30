import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt.guard';
import { CurrentUser } from './user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('auth') // Agrupa y organiza visualmente estos endpoints dentro de la interfaz de Swagger
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  /**
   * EVIDENCIA: Endpoint de Registro (/auth/signup)
   * Recibe el payload validado por SignUpDto y delega la creación del usuario al servicio.
   */
  @Post('signup')
  signup(@Body() dto: SignUpDto) {
    return this.auth.signup(dto.email, dto.password, dto.name);
  }

  /**
   * EVIDENCIA: Endpoint de Autenticación (/auth/login)
   * Consume el LoginDto. Si las credenciales son válidas, retorna el JWT al cliente.
   */
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  /**
   * EVIDENCIA: Endpoint de Identidad Protegida (/auth/me)
   * 
   * Explicación de los decoradores para la defensa:
   * 1. @ApiBearerAuth(): Indica a Swagger que este endpoint requiere un token Bearer (activa el candado).
   * 2. @UseGuards(JwtAuthGuard): Bloquea el acceso si el token no existe, está corrupto o expiró.
   * 3. @CurrentUser(): Extrae directamente los datos decodificados que viajan seguros dentro del token.
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: { sub: string; email: string; role: string }) {
    // Retorna con éxito { sub, email, role }. El rol incluido es un plus estratégico 
    // que servirá para la posterior autorización por roles del sistema.
    return user; 
  }
}