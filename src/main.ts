import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './filters/http-exception.filter';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  
  // Enable CORS
  app.enableCors();
  
  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Hotels API endpoint: http://localhost:${port}/hotels`);
  logger.log(`Hotels Suppliers API endpoint: http://localhost:${port}/hotels/suppliers`);
  logger.log(`Hotel And Destination IDs API endpoint: http://localhost:${port}/hotels/ids`);
}
bootstrap();
