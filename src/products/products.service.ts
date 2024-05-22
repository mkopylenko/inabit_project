import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Product } from './interfaces/product-interface';
import { ProductsUtils } from './products.utils';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
@Injectable()
export class ProductsService {
  private products: Product[];
  private readonly logger = new Logger(ProductsService.name);

  constructor() {
    this.loadProducts();
  }

  private loadProducts() {
    try{
        const data = fs.readFileSync('products.json', 'utf-8');
        this.products = JSON.parse(data);
        this.logger.log('Products loaded successfully');
    } catch (error) {
        this.logger.error('Failed to load products', error.stack);
    }
  }

  private saveProducts() {
    fs.writeFileSync('products.json', JSON.stringify(this.products, null, 2));
  }

  findAll(req): Product[] {
    this.logger.log(`Request ID: ${req.requestId} - Fetching all products`);
    const query = req.query;
    let results = this.products;

    // Apply filters and sorting
    if (query.name) {
      results = results.filter(product => product.name.includes(query.name));
    }
    if (query.description) {
      results = results.filter(product => product.description.includes(query.description));
    }
    if (query.sortBy) {
        ProductsUtils.sortBy(results, query.sortBy);
    }

    // Apply pagination
    results = ProductsUtils.applyPagination(results,query.page, query.limit);

    return results;
  }
 

  findLowStock(req): Product[] {
    const query = req.query;
    this.logger.log(`Request ID: ${req.requestId} - Fetching low stock products, threshold: ${query.threshold}`);
    const results = this.products.filter(product => product.quantity <= query.threshold).sort((a, b) => a.quantity - b.quantity);
     // Apply pagination
    return ProductsUtils.applyPagination(results,query.page, query.limit);
  }

  findMostPopular(req): Product[] {
    const query = req.query;
    this.logger.log(`Request ID: ${req.requestId} - Fetching top ${top} most popular products`);
    let returnArray = [...this.products].sort((a, b) => b.sold - a.sold);
    if (query.top){
        returnArray= returnArray.slice(0,query.top);
    }
     // Apply pagination
     return ProductsUtils.applyPagination(returnArray,query.page, query.limit);
  }

  create(req): Product {
    const createProductDto = req.body as CreateProductDto;
    this.logger.log(`Request ID: ${req.requestId} - Creating a new product ${JSON.stringify(createProductDto)}`);
    if (this.products.some(product => product.name === createProductDto.name)) {
      throw new BadRequestException('Product name must be unique.');
    }

    const newProduct: Product = {
      ...createProductDto,
      id: uuidv4(),
      sold: 0,
      pending_orders: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.products.push(newProduct);
    this.saveProducts();
    return newProduct;
  }

  update(req): Product {
    const updateProductDto = req.body as UpdateProductDto;
    const id = req.params.id;
    this.logger.log(`Request ID: ${req.requestId} - Updating the product with id ${id}`);
    const productIndex = this.products.findIndex(product => product.id === id);

    if (productIndex === -1) {
      throw new NotFoundException('Product not found.');
    }

    if (updateProductDto.name && this.products.some((product, index) => product.name === updateProductDto.name && index !== productIndex)) {
      throw new BadRequestException('Product name must be unique.');
    }

    const updatedProduct = {
      ...this.products[productIndex],
      ...updateProductDto,
      updated_at: new Date().toISOString(),
    };

    this.products[productIndex] = updatedProduct;
    this.saveProducts();
    return updatedProduct;
  }

  delete(req): void {
    const id = req.params.id;
    this.logger.log(`Request ID: ${req.requestId} - Deleting the product with id ${id}`);
    const productIndex = this.products.findIndex(product => product.id === id);
    if (productIndex === -1) {
      throw new NotFoundException('Product not found.');
    }

    if (this.products[productIndex].pending_orders > 0) {
      throw new BadRequestException('Product with pending orders cannot be deleted.');
    }

    this.products.splice(productIndex, 1);
    this.saveProducts();
  }
}
