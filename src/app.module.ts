import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { Module, MiddlewareConsumer } from '@nestjs/common';
import { Logger } from './middleware/logger';
import { RequestId } from './middleware/requestid';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [ProductsModule],
  controllers: [AppController],
  providers: [AppService],
})



@Module({
  imports: [
    CacheModule.register({
      ttl: 60, // seconds
      max: 100, // maximum number of items in cache
      isGlobal: true
    }),
    ProductsModule
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestId, Logger)
      .forRoutes('*');
  }
}

