import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CacheModule } from '@nestjs/cache-manager';
import * as fs from 'fs';
import * as path from 'path';
jest.mock('fs');
import { v4 as uuidv4 } from 'uuid';

describe('ProductsService', () => {
  let service: ProductsService;
  let cacheManager: Cache;

  const mockProducts = [{
    id: '1',
    name: 'Test Product',
    description: 'Test Description',
    price: 100,
    quantity: 10,
    sold: 3,
    pending_orders: 2,
    created_at: '2024-04-11T12:00:00Z',
    updated_at: '2024-04-11T12:00:00Z',
  },
  {
    id: '2',
    name: 'Another prod',
    description: 'Another desc',
    price: 100,
    quantity: 1,
    sold: 1,
    pending_orders: 2,
    created_at: '2024-04-11T12:00:00Z',
    updated_at: '2024-04-11T12:00:00Z',
  }];

  

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register()],
      providers: [ProductsService],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockProducts));
    service['products'] = mockProducts; 
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      const result = await service.findAll({ requestId: 'test-request', query:{} });
      expect(result).toEqual(mockProducts);
    });
  });

  describe('findAll', () => {
    it('should return product by name', async () => {
      const result = await service.findAll({ requestId: 'test-request', query:{name: 'Test Product'} });
      expect(result).toEqual([mockProducts[0]]);
    });
  });

  describe('findAll', () => {
    it('should return product by description', async () => {
      const result = await service.findAll({ requestId: 'test-request', query:{description: 'Test Description'} });
      expect(result).toEqual([mockProducts[0]]);
    });
  });

  describe('findLowStock', () => {
    it('should return low stock (<2) product', async () => {
      const result = await service.findLowStock({ requestId: 'test-request', query:{threshold: 2} });
      expect(result).toEqual([mockProducts[1]]);
    });
  });

  describe('findMostPopular', () => {
    it('should return top 1 popular product', async () => {
      const result = await service.findMostPopular({ requestId: 'test-request', query:{top: 1} });
      expect(result).toEqual([mockProducts[0]]);
    });
  }); 

  
});
