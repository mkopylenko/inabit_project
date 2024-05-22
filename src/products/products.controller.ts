import { Controller, Get, Post, Body, Param, Delete, Query, Put, Req } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './interfaces/product-interface';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Get()
    findAll(@Req() req): Promise<Product[]> {
        return this.productsService.findAll(req);
    }

    @Get('low-stock')
    findLowStock(@Req() req): Promise<Product[]> {
        return this.productsService.findLowStock(req);
    }

    @Get('most-popular')
    findMostPopular(@Req() req): Promise<Product[]> {
        return this.productsService.findMostPopular(req);
    }

    @Post()
    create(@Req() req): Product {
        return this.productsService.create(req);
    }

    @Put(':id')
    update(@Req() req): Product {
        return this.productsService.update(req);
    }

    @Delete(':id')
    delete(@Req() req): void {
        this.productsService.delete(req);
    }
}

