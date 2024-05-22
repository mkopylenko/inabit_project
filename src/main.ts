import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestIdInterceptor } from './interceptors/requestid.interceptor';
import { RequestIdExceptionFilter } from './filters/requestid-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new RequestIdInterceptor());
  app.useGlobalFilters(new RequestIdExceptionFilter());
  await app.listen(3000);
}
bootstrap();
