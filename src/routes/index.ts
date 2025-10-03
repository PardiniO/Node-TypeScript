import { Router } from 'express';
import { UserRoutes } from './userRoutes';
import { ProductRoutes } from './productRoutes';
import { OrderRoutes } from './orderRoutes';

export class ApiRoutes {
  public router: Router;
  private userRoutes: UserRoutes;
  private productRoutes: ProductRoutes;
  private orderRoutes: OrderRoutes;

  constructor() {
    this.router = Router();
    this.userRoutes = new UserRoutes();
    this.productRoutes = new ProductRoutes();
    this.orderRoutes = new OrderRoutes();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Ruta de salud/estado de la API
    this.router.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'API funcionando correctamente',
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development'
        }
      });
    });

    // Información de la API
    this.router.get('/', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Bienvenido a la API Node7 TypeScript Backend',
        data: {
          name: 'Node7 TypeScript Backend API',
          version: '1.0.0',
          description: 'API REST desarrollada con Node.js, TypeScript, Express y MySQL',
          endpoints: {
            users: '/api/v1/users',
            products: '/api/v1/products',
            orders: '/api/v1/orders',
            health: '/api/v1/health'
          },
          documentation: 'Consulta el README.md para más información',
          timestamp: new Date().toISOString()
        }
      });
    });

    // Registrar rutas de módulos
    this.router.use('/users', this.userRoutes.getRouter());
    this.router.use('/products', this.productRoutes.getRouter());
    this.router.use('/orders', this.orderRoutes.getRouter());
  }

  public getRouter(): Router {
    return this.router;
  }
}

// Exportar instancia única
export const apiRoutes = new ApiRoutes();