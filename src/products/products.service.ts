import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Product } from './interfaces/product-interface';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
@Injectable()
export class ProductsService {
  private products: Product[];

  constructor() {
    this.loadProducts();
  }

  private loadProducts() {
    const data = fs.readFileSync('products.json', 'utf-8');
    this.products = JSON.parse(data);
  }

  private saveProducts() {
    fs.writeFileSync('products.json', JSON.stringify(this.products, null, 2));
  }

  findAll(query): Product[] {
    let results = this.products;

    // Apply filters and sorting
    if (query.name) {
      results = results.filter(product => product.name.includes(query.name));
    }
    if (query.description) {
      results = results.filter(product => product.description.includes(query.description));
    }
    if (query.sortBy) {
      results.sort((a, b) => {
        if (a[query.sortBy] < b[query.sortBy]) return -1;
        if (a[query.sortBy] > b[query.sortBy]) return 1;
        return 0;
      });
    }

    // Apply pagination
    if (query.page && query.limit) {
      const page = parseInt(query.page, 10);
      const limit = parseInt(query.limit, 10);
      results = results.slice((page - 1) * limit, page * limit);
    }

    return results;
  }

  findLowStock(threshold: number): Product[] {
    return this.products.filter(product => product.quantity <= threshold);
  }

  findMostPopular(): Product[] {
    return [...this.products].sort((a, b) => b.sold - a.sold);
  }

  create(createProductDto: CreateProductDto): Product {
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

  update(id: string, updateProductDto: UpdateProductDto): Product {
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

  delete(id: string): void {
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