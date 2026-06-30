import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard'; // Importamos el guardián de roles

@ApiTags('Productos') // Esto agrupa tus endpoints bajo la pestaña "Productos" en Swagger
@ApiBearerAuth() // Muestra el candado de autenticación en Swagger para poder pegar el token
@UseGuards(JwtAuthGuard) // Protege todas las rutas de este controlador exigiendo un JWT válido
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(RolesGuard) // <--- SOLO EL ADMIN PUEDE CREAR PRODUCTOS
  @ApiOperation({ summary: 'Crear un nuevo producto en el inventario (Solo Admin)' })
  create(@Body() createProductDto: CreateProductDto) {
    // Al globalizar los productos, ya no enviamos el user.sub (ID de dueño) al servicio
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de todos los productos globales con paginación' })
  @ApiQuery({ name: 'skip', required: false, description: 'Número de registros a saltar', default: 0 })
  @ApiQuery({ name: 'take', required: false, description: 'Número de registros a traer', default: 10 })
  findAll(
    @Query('skip') skip = '0',
    @Query('take') take = '10',
  ) {
    // Eliminamos user.sub porque el catálogo de inventario ahora es compartido y visible por todos
    return this.productsService.findAll(Number(skip), Number(take));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar un producto por su id_producto' })
  findOne(@Param('id') id: string) {
    // Eliminamos user.sub porque la consulta ya no se restringe por propiedad
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard) // <--- SOLO EL ADMIN PUEDE EDITAR PRODUCTOS
  @ApiOperation({ summary: 'Actualizar los datos de un producto por ID (Solo Admin)' })
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    // Eliminamos el filtro de usuario para que el administrador pueda actualizar el stock global
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard) // <--- SOLO EL ADMIN PUEDE ELIMINAR PRODUCTOS
  @ApiOperation({ summary: 'Eliminar un producto del inventario (Solo Admin)' })
  remove(@Param('id') id: string) {
    // Eliminamos user.sub del flujo
    return this.productsService.remove(id);
  }
}