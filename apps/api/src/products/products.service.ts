import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. CREAR UN PRODUCTO
  async create(createProductDto: CreateProductDto) {
    let fechaConvertida: Date | undefined = undefined;

    if (createProductDto.fecha_vencimiento) {
      // Separamos el string "DD-MM-AAAA" por sus guiones
      const [dia, mes, anio] = createProductDto.fecha_vencimiento.split('-');
      // Creamos el objeto Date en formato ISO que entiende JS y PostgreSQL
      fechaConvertida = new Date(`${anio}-${mes}-${dia}T00:00:00.000Z`);

      // REGLA DE NEGOCIO: Validar que la fecha de vencimiento sea hoy o en el futuro
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (fechaConvertida < hoy) {
        throw new BadRequestException('La fecha de vencimiento no puede ser una fecha pasada.');
      }
    }

    // Guardar físicamente en PostgreSQL usando Prisma
    return this.prisma.product.create({
      data: {
        ...createProductDto,
        // Reemplazamos el string chileno por el objeto Date real para Prisma
        fecha_vencimiento: fechaConvertida, 
      },
    });
  }

  // 2. LISTAR PRODUCTOS CON PAGINACIÓN
  async findAll(skip: number, take: number) {
    return this.prisma.product.findMany({
      skip: skip,
      take: take,
      orderBy: { createdAt: 'desc' },
    });
  }

  // 3. BUSCAR UN SOLO PRODUCTO POR ID
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id_producto: id },
    });

    if (!product) {
      throw new NotFoundException(`El producto con ID ${id} no fue encontrado.`);
    }
    return product;
  }

  // 4. ACTUALIZAR LOS DATOS DE UN PRODUCTO
  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findOne(id);

    let fechaConvertida: Date | undefined = undefined;

    // Si el usuario actualiza la fecha, hacemos el mismo proceso de conversión y validación
    if (updateProductDto.fecha_vencimiento) {
      const [dia, mes, anio] = updateProductDto.fecha_vencimiento.split('-');
      fechaConvertida = new Date(`${anio}-${mes}-${dia}T00:00:00.000Z`);

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaConvertida < hoy) {
        throw new BadRequestException('La fecha de vencimiento no puede ser una fecha pasada.');
      }
    }

    return this.prisma.product.update({
      where: { id_producto: id },
      data: {
        ...updateProductDto,
        // Si se envió fecha se actualiza con el objeto Date, si no, se pasa undefined y Prisma lo ignora
        fecha_vencimiento: fechaConvertida, 
      },
    });
  }

  // 5. ELIMINAR UN PRODUCTO DEL INVENTARIO
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.delete({
      where: { id_producto: id },
    });
  }
}
