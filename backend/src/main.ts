import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet());

  const frontendUrl = config.getOrThrow<string>('FRONTEND_URL');

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      // Sin Origin (server-to-server) o el frontend configurado: permitido.
      if (!origin || origin === frontendUrl) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = Number(config.get('PORT') ?? 4000);
  await app.listen(port, '0.0.0.0');

  console.log(`[api] escuchando en http://0.0.0.0:${port}`);
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[api] no se pudo iniciar: ${message}`);
  process.exit(1);
});
