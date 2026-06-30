import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. CREAR UN PRODUCTO EN EL INVENTARIO GLOBAL
  async create(createProductDto: CreateProductDto) {
    let fechaConvertida: Date | undefined = undefined;

    if (createProductDto.fecha_vencimiento) {
      fechaConvertida = new Date(createProductDto.fecha_vencimiento);

      // REGLA DE NEGOCIO: Validar que la fecha sea válida y futura
      if (isNaN(fechaConvertida.getTime())) {
        throw new BadRequestException('Formato de fecha inválido.');
      }

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (fechaConvertida < hoy) {
        throw new BadRequestException('La fecha de vencimiento no puede ser una fecha pasada.');
      }
    }

    // Guardar físicamente en PostgreSQL en el catálogo global de la empresa
    return this.prisma.product.create({
      data: {
        ...createProductDto,
        fecha_vencimiento: fechaConvertida, 
      },
    });
  }

  // 2. LISTAR TODOS LOS PRODUCTOS GLOBALES CON PAGINACIÓN
  async findAll(skip: number, take: number) {
    // Quitamos la cláusula "where: { userId }" para que todos compartan el stock
    return this.prisma.product.findMany({
      skip: skip,
      take: take,
      orderBy: { createdAt: 'desc' },
    });
  }

  // 3. BUSCAR UN SOLO PRODUCTO POR SU ID ÚNICO
  async findOne(id: string) {
    // Cambiamos findFirst por findUnique, buscando directamente por la PK id_producto
    const product = await this.prisma.product.findUnique({
      where: { id_producto: id },
    });

    if (!product) {
      throw new NotFoundException(`El producto con ID ${id} no fue encontrado.`);
    }
    return product;
  }

  // 4. ACTUALIZAR LOS DATOS DE UN PRODUCTO (Solo Admin)
  async update(id: string, updateProductDto: UpdateProductDto) {
    // 1. Verificamos que el producto exista en la base de datos
    await this.findOne(id);

    // 2. Preparamos los datos
    const dataToUpdate: any = { ...updateProductDto };

    // 3. Procesamos la fecha si viene en el DTO
    if (updateProductDto.fecha_vencimiento) {
      const fecha = new Date(updateProductDto.fecha_vencimiento);
      
      if (isNaN(fecha.getTime())) {
        throw new BadRequestException('Formato de fecha inválido.');
      }

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (fecha < hoy) {
        throw new BadRequestException('La fecha de vencimiento no puede ser una fecha pasada.');
      }

      dataToUpdate.fecha_vencimiento = fecha;
    } else {
      delete dataToUpdate.fecha_vencimiento;
    }

    // 4. Actualizamos usando los datos procesados en la fila global
    return this.prisma.product.update({
      where: { id_producto: id },
      data: dataToUpdate,
    });
  }

  // 5. ELIMINAR UN PRODUCTO DEL INVENTARIO GLOBAL (Solo Admin)
  async remove(id: string) {
    // Aseguramos que exista antes de ejecutar el borrado
    await this.findOne(id);
    
    return this.prisma.product.delete({
      where: { id_producto: id },
    });
  }
}