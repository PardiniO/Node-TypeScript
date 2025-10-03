import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { AuthMiddleware, ValidationMiddleware } from '../middlewares';

export class ProductRoutes {
  public router: Router;
  private productController: ProductController;

  constructor() {
    this.router = Router();
    this.productController = new ProductController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Rutas públicas (lectura de productos)
    this.router.get(
      '/',
      ValidationMiddleware.validatePaginationQuery,
      this.productController.getAllProducts
    );

    this.router.get(
      '/search',
      ValidationMiddleware.validateSearchQuery,
      ValidationMiddleware.validatePaginationQuery,
      this.productController.searchProducts
    );

    this.router.get(
      '/categories',
      this.productController.getCategories
    );

    this.router.get(
      '/category/:category',
      ValidationMiddleware.validateCategoryParam,
      ValidationMiddleware.validatePaginationQuery,
      this.productController.getProductsByCategory
    );

    this.router.get(
      '/price-range',
      ValidationMiddleware.validatePriceRangeQuery,
      ValidationMiddleware.validatePaginationQuery,
      this.productController.getProductsByPriceRange
    );

    this.router.get(
      '/low-stock',
      ValidationMiddleware.validateStockThresholdQuery,
      this.productController.getLowStockProducts
    );

    this.router.get(
      '/stats',
      this.productController.getProductStats
    );

    this.router.get(
      '/:id',
      ValidationMiddleware.validateIdParam,
      this.productController.getProductById
    );

    // Rutas protegidas (requieren autenticación para modificar)
    this.router.post(
      '/',
      AuthMiddleware.authenticate,
      ValidationMiddleware.validateProductCreation,
      this.productController.createProduct
    );

    this.router.put(
      '/:id',
      AuthMiddleware.authenticate,
      ValidationMiddleware.validateIdParam,
      ValidationMiddleware.validateProductUpdate,
      this.productController.updateProduct
    );

    this.router.patch(
      '/:id/stock',
      AuthMiddleware.authenticate,
      ValidationMiddleware.validateIdParam,
      ValidationMiddleware.validateStockUpdate,
      this.productController.updateStock
    );

    this.router.delete(
      '/:id',
      AuthMiddleware.authenticate,
      ValidationMiddleware.validateIdParam,
      this.productController.deleteProduct
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}