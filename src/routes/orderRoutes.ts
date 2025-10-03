import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';
import { AuthMiddleware, ValidationMiddleware } from '../middlewares';

export class OrderRoutes {
  public router: Router;
  private orderController: OrderController;

  constructor() {
    this.router = Router();
    this.orderController = new OrderController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Rutas para usuarios autenticados (sus propias órdenes)
    this.router.get(
      '/my-orders',
      AuthMiddleware.authenticate,
      ValidationMiddleware.validatePaginationQuery,
      this.orderController.getMyOrders
    );

    this.router.post(
      '/',
      AuthMiddleware.authenticate,
      ValidationMiddleware.validateOrderCreation,
      this.orderController.createOrder
    );

    this.router.patch(
      '/:id/cancel',
      AuthMiddleware.authenticate,
      ValidationMiddleware.validateIdParam,
      this.orderController.cancelMyOrder
    );

    // Rutas administrativas (requieren autenticación)
    this.router.get(
      '/',
      AuthMiddleware.authenticate,
      ValidationMiddleware.validatePaginationQuery,
      this.orderController.getAllOrders
    );

    this.router.get(
      '/stats',
      AuthMiddleware.authenticate,
      this.orderController.getOrderStats
    );

    this.router.get(
      '/status/:status',
      AuthMiddleware.authenticate,
      ValidationMiddleware.validateStatusParam,
      ValidationMiddleware.validatePaginationQuery,
      this.orderController.getOrdersByStatus
    );

    this.router.get(
      '/user/:userId',
      AuthMiddleware.authenticate,
      ValidationMiddleware.validateUserIdParam,
      ValidationMiddleware.validatePaginationQuery,
      this.orderController.getOrdersByUser
    );

    this.router.get(
      '/:id',
      AuthMiddleware.authenticate,
      ValidationMiddleware.validateIdParam,
      this.orderController.getOrderById
    );

    this.router.get(
      '/:id/details',
      AuthMiddleware.authenticate,
      ValidationMiddleware.validateIdParam,
      this.orderController.getOrderWithItems
    );

    this.router.post(
      '/user/:userId',
      AuthMiddleware.authenticate,
      ValidationMiddleware.validateUserIdParam,
      ValidationMiddleware.validateOrderCreation,
      this.orderController.createOrderForUser
    );

    this.router.patch(
      '/:id/status',
      AuthMiddleware.authenticate,
      ValidationMiddleware.validateIdParam,
      ValidationMiddleware.validateOrderStatusUpdate,
      this.orderController.updateOrderStatus
    );

    this.router.patch(
      '/:id/cancel-admin',
      AuthMiddleware.authenticate,
      ValidationMiddleware.validateIdParam,
      this.orderController.cancelOrder
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}