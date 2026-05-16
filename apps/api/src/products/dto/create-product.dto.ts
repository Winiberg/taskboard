import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, Min, IsOptional, Matches } from 'class-validator'; // <-- Cambiamos IsDateString por Matches

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

  @ApiProperty({ description: 'Precio unitario del producto en CLP' })
  @IsInt({ message: 'El precio debe ser un número entero (pesos chilenos)' })
  @Min(1, { message: 'El precio debe ser un número positivo mayor a cero' })
  precio!: number;

  //Formato (DD-MM-AAAA)
  @ApiPropertyOptional({ description: 'Fecha de vencimiento del producto (Formato: DD-MM-AAAA)', example: '30-01-2027' })
  @Matches(/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/, {
    message: 'La fecha de vencimiento debe tener el formato DD-MM-AAAA (ejemplo: 30-01-2027)',
  })
  @IsOptional()
  fecha_vencimiento?: string;
}