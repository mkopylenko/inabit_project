import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { Product } from './interfaces/product-interface';
import { ProductsUtils } from './products.utils';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
@Injectable()
export class ProductsService {
    private readonly cacheTllDefault: number = 60000; //ms  
    private products: Product[];
    private readonly logger = new Logger(ProductsService.name);

    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
        this.loadProducts();
    }

    async findAll(req): Promise<Product[]> {
        return await this.processGetRequest(req, 'products', 'Fetching all products');
    }


    async findLowStock(req): Promise<Product[]> {
        return await this.processGetRequest(req, 'products_low', `Fetching low stock products, threshold: ${req.query.threshold}`);
    }

    async findMostPopular(req): Promise<Product[]> {
        return await this.processGetRequest(req, 'products_pop', `Fetching top ${req.query.top} most popular products`);
    }

    private async processGetRequest(req, cachePrefix, logMessage){
        this.logger.log(`Request ID: ${req.requestId} - ${logMessage}`);
        const query = req.query;
        const cacheKey = `${cachePrefix}_${JSON.stringify(query)}`;
        const cachedProducts = await this.tryGetFromCache(cacheKey, req);
        if (cachedProducts) {
            return cachedProducts;
        }
        let results = this.products;

        // Apply filters and sorting
       results = this.productsFilter(query);

        // Apply pagination
        results = ProductsUtils.applyPagination(results, query.page, query.limit);
        // cache
        await this.cacheManager.set(cacheKey, results, this.cacheTllDefault);
        this.logger.log(`Request ID: ${req.requestId} - Products cached`, ProductsService.name);

        return results;
    }

    private productsFilter(query){
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
        if (query.threshold)
        {
            results = this.products.filter(product => product.quantity <= query.threshold).sort((a, b) => a.quantity - b.quantity);
        }
        if (query.top)
        {
             results = [...this.products].sort((a, b) => b.sold - a.sold);
            results = results.slice(0, query.top);
        }
        return results;
    }

    create(req): Product {
        const createProductDto = req.body as CreateProductDto;
        this.logger.log(`Request ID: ${req.requestId} - Creating a new product ${JSON.stringify(createProductDto)}`);
        if (this.products.some(product => product.name === createProductDto.name)) {
            const error = 'Product name must be unique.';
            this.logError(req, error);
            throw new BadRequestException(error);
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
            const error = 'Product not found.';
            this.logError(req, error);
            throw new NotFoundException(error);
        }

        if (updateProductDto.name && this.products.some((product, index) => product.name === updateProductDto.name
         && index !== productIndex)) {
            const error = 'Product name must be unique.';
            this.logError(req, error);
            throw new BadRequestException(error);
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
            const error = 'Product not found.';
            this.logError(req, error);
            throw new NotFoundException(error);
        }

        if (this.products[productIndex].pending_orders > 0) {
            const error = 'Product with pending orders cannot be deleted.';
            this.logError(req, error);
            throw new BadRequestException(error);
        }

        this.products.splice(productIndex, 1);
        this.saveProducts();
    }

    private logError(req, error) {
        this.logger.error(`Request ID: ${req.requestId} - ${error}`);
    }

    private async tryGetFromCache(cacheKey, req) {
        const cachedProducts = await this.cacheManager.get(cacheKey);
        if (cachedProducts) {
            this.logger.log(`Request ID: ${req.requestId} - Returning cached products`, ProductsService.name);
            return cachedProducts as Product[];
        }
        return null;
    }
    private loadProducts() {
        try {
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
}
