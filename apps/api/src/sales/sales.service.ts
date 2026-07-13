import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { $Enums } from '@prisma/client'; // Importamos el enum oficial de Prisma para los roles

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  // REGISTRAR UNA VENTA (Con múltiples productos y descuento de stock)
  async create(createSaleDto: { items: { id_producto: string; cantidad: number }[] }, userId: string) {
    if (!createSaleDto.items || createSaleDto.items.length === 0) {
      throw new BadRequestException('La venta debe contener al menos un producto.');
    }

    // Iniciamos una transacción robusta en la base de datos
    return this.prisma.$transaction(async (tx) => {
      let totalBoleta = 0;
      const detallesAInsertar: { id_producto: string; cantidad: number; precio_unitario: number }[] = [];

      for (const item of createSaleDto.items) {
        // 1. Validar existencia del producto
        const product = await tx.product.findUnique({
          where: { id_producto: item.id_producto },
        });

        if (!product) {
          throw new NotFoundException(`El producto con ID ${item.id_producto} no existe.`);
        }

        // 2. Validar Stock disponible
        if (product.stock < item.cantidad) {
          throw new BadRequestException(
            `Stock insuficiente para "${product.nombre_producto}". Disponible: ${product.stock}, Solicitado: ${item.cantidad}`
          );
        }

        // 3. Descontar del inventario
        await tx.product.update({
          where: { id_producto: item.id_producto },
          data: { stock: product.stock - item.cantidad },
        });

        // 4. Calcular totales
        const subtotal = product.precio * item.cantidad;
        totalBoleta += subtotal;

        // Guardamos los datos estructurales del detalle
        detallesAInsertar.push({
          id_producto: item.id_producto,
          cantidad: item.cantidad,
          precio_unitario: product.precio,
        });
      }

      // 5. Crear la Cabecera de la Venta junto con todos sus detalles insertados
      return tx.sale.create({
        data: {
          userId,
          total: totalBoleta,
          details: {
            create: detallesAInsertar,
          },
        },
        include: {
          details: {
            include: { product: true },
          },
        },
      });
    });
  }

  // LISTAR VENTAS (Aislamiento multiusuario optimizado sin re-consultar el usuario)
  async findAll(userId: string, role: $Enums.Role) {
    // Si es ADMIN: Puede ver absolutamente todas las ventas de la empresa
    if (role === $Enums.Role.ADMIN) {
      return this.prisma.sale.findMany({
        include: {
          user: { select: { name: true, email: true, role: true } },
          details: { include: { product: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Si es VENDEDOR: Filtro estricto en la BD por su propio userId
    return this.prisma.sale.findMany({
      where: { userId }, 
      include: {
        details: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // OBTENER UNA VENTA POR ID (Con filtro de seguridad directo desde los parámetros del token)
  async findOne(id: string, userId: string, role: $Enums.Role) {
    // Determinamos la cláusula basándonos directamente en el rol que vino del JWT
    const whereClause = role === $Enums.Role.ADMIN ? { id_venta: id } : { id_venta: id, userId };

    const sale = await this.prisma.sale.findFirst({
      where: whereClause,
      include: {
        details: { include: { product: true } },
      },
    });

    // Si no existe la venta o pertenece a otro vendedor, retorna un código 404 para cumplir el aislamiento
    if (!sale) {
      throw new NotFoundException(`No se encontró la venta con ID ${id} asociada a tu usuario.`);
    }

    return sale;
  }

  // ACTUALIZAR UNA VENTA PROPIA (Exigencia de rúbrica)
  async update(id: string, userId: string, role: $Enums.Role, updateSaleDto: any) {
    // findOne validará automáticamente la existencia y propiedad usando el rol del token
    await this.findOne(id, userId, role);

    return this.prisma.sale.update({
      where: { id_venta: id },
      data: { ...updateSaleDto },
    });
  }

  // ELIMINAR UNA VENTA PROPIA (Exigencia de rúbrica - Borrado físico seguro)
  async remove(id: string, userId: string, role: $Enums.Role) {
    // findOne validará automáticamente la existencia y propiedad usando el rol del token
    await this.findOne(id, userId, role);

    return this.prisma.sale.delete({
      where: { id_venta: id },
    });
  }
}