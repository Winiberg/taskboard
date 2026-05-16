import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Productos') // Esto agrupa tus endpoints bajo la pestaña "Productos" en Swagger
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo producto en el inventario' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de productos con paginación' })
  @ApiQuery({ name: 'skip', required: false, description: 'Número de registros a saltar', default: 0 })
  @ApiQuery({ name: 'take', required: false, description: 'Número de registros a traer', default: 10 })
  findAll(@Query('skip') skip = '0', @Query('take') take = '10') {
    return this.productsService.findAll(Number(skip), Number(take));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar un producto por su id_producto' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar los datos de un producto por ID' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un producto del inventario' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
