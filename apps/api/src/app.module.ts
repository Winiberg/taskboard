import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SalesModule } from './sales/sales.module'; // 1. Importamos el nuevo módulo de ventas

@Module({
  imports: [
    PrismaModule, 
    ProductsModule, 
    UsersModule, 
    AuthModule,
    SalesModule // 2. Registramos SalesModule para habilitar el flujo de boletas y el stock
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}