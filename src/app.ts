import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Database } from './config/database';
import { apiRoutes } from './routes';
import { ErrorMiddleware } from './middlewares';

// Cargar variables de entorno
dotenv.config();

export class App {
  public app: Application;
  private database: Database;

  constructor() {
    this.app = express();
    this.database = Database.getInstance();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Seguridad
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }));

    // Logging
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Parseo de datos
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Headers personalizados
    this.app.use((req, res, next) => {
      res.setHeader('X-API-Version', '1.0.0');
      res.setHeader('X-Powered-By', 'Node7-TypeScript-Backend');
      next();
    });
  }

  private initializeRoutes(): void {
    // Ruta raíz
    this.app.get('/', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Bienvenido a Node7 TypeScript Backend API',
        data: {
          name: 'Node7 TypeScript Backend',
          version: '1.0.0',
          description: 'API REST desarrollada con Node.js, TypeScript, Express y MySQL',
          author: 'UTN Tecnicatura',
          apiUrl: '/api/v1',
          healthCheck: '/api/v1/health',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development'
        }
      });
    });

    // API Routes
    this.app.use('/api/v1', apiRoutes.getRouter());
  }

  private initializeErrorHandling(): void {
    // Middleware para rutas no encontradas
    this.app.use(ErrorMiddleware.notFound);

    // Middleware global de manejo de errores
    this.app.use(ErrorMiddleware.errorHandler);
  }

  public async connectDatabase(): Promise<void> {
    try {
      await this.database.connect();
      console.log('🗄️  Base de datos conectada exitosamente');
    } catch (error) {
      console.error('❌ Error al conectar con la base de datos:', error);
      process.exit(1);
    }
  }

  public async closeDatabaseConnection(): Promise<void> {
    try {
      await this.database.close();
      console.log('🔐 Conexión a base de datos cerrada');
    } catch (error) {
      console.error('❌ Error al cerrar conexión de base de datos:', error);
    }
  }

  public getApp(): Application {
    return this.app;
  }
}