import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { Module, MiddlewareConsumer } from '@nestjs/common';
import { Logger } from './middleware/logger';
import { RequestId } from './middleware/requestid';

@Module({
  imports: [ProductsModule],
  controllers: [AppController],
  providers: [AppService],
})



@Module({
  imports: [ProductsModule],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestId, Logger)
      .forRoutes('*');
  }
}

