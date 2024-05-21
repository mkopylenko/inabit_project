import { Controller, Get, Post, Body, Param, Delete, Query, Put } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './interfaces/product-interface';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() query): Product[] {
    return this.productsService.findAll(query);
  }

  @Get('low-stock')
  findLowStock(@Query('threshold') threshold: number): Product[] {
    return this.productsService.findLowStock(threshold);
  }

  @Get('most-popular')
  findMostPopular(): Product[] {
    return this.productsService.findMostPopular();
  }

  @Post()
  create(@Body() createProductDto: CreateProductDto): Product {
    return this.productsService.create(createProductDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto): Product {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string): void {
    this.productsService.delete(id);
  }
}

