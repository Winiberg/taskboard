import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, Min, IsOptional, IsISO8601 } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: 'Nombre descriptivo del producto' })
  @IsString({ message: 'El nombre del producto debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre del producto no puede estar vacío' })
  nombre_producto!: string;

  @ApiPropertyOptional({ description: 'Descripción detallada del producto' })
  @IsString({ message: 'La descripción debe ser un texto' })
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ description: 'Cantidad disponible en bodega', default: 0 })
  @IsInt({ message: 'El stock debe ser un número entero' })
  @Min(0, { message: 'El stock no puede ser un valor negativo' })
  stock!: number;

  @ApiProperty({ description: 'Precio unitario del producto' })
  @IsInt({ message: 'El precio debe ser un número entero' })
  @Min(1, { message: 'El precio debe ser un número positivo mayor a cero' })
  precio!: number;

  @ApiPropertyOptional({ 
    description: 'Fecha de vencimiento del producto (Formato ISO 8601: AAAA-MM-DD)', 
    example: '2027-01-30' 
  })
  @IsISO8601({ strict: true }, { message: 'La fecha de vencimiento debe tener el formato ISO 8601 (AAAA-MM-DD)' })
  @IsOptional()
  fecha_vencimiento?: string;
}