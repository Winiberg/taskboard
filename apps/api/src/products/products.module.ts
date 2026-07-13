import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { AuthModule } from '../auth/auth.module'; // 1. Importamos el módulo de autenticación y roles

@Module({
  imports: [
    AuthModule // 2. Agregamos el arreglo de imports para proteger este módulo
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}