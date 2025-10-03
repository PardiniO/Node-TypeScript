import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { AuthMiddleware, ValidationMiddleware } from '../middlewares';

export class UserRoutes {
  public router: Router;
  private userController: UserController;

  constructor() {
    this.router = Router();
    this.userController = new UserController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Rutas públicas (sin autenticación)
    this.router.post(
      '/register',
      ValidationMiddleware.validateUserRegistration,
      this.userController.register
    );

    this.router.post(
      '/login',
      ValidationMiddleware.validateUserLogin,
      this.userController.login
    );

    // Rutas protegidas (requieren autenticación)
    this.router.get(
      '/profile',
      AuthMiddleware.authenticate,
      this.userController.getProfile
    );

    this.router.put(
      '/profile',
      AuthMiddleware.authenticate,
      ValidationMiddleware.validateUserUpdate,
      this.userController.updateProfile
    );

    // Rutas administrativas (requieren autenticación)
    this.router.get(
      '/',
      AuthMiddleware.authenticate,
      ValidationMiddleware.validatePaginationQuery,
      this.userController.getAllUsers
    );

    this.router.get(
      '/search',
      AuthMiddleware.authenticate,
      ValidationMiddleware.validateSearchQuery,
      ValidationMiddleware.validatePaginationQuery,
      this.userController.searchUsers
    );

    this.router.get(
      '/stats',
      AuthMiddleware.authenticate,
      this.userController.getUserStats
    );

    this.router.get(
      '/:id',
      AuthMiddleware.authenticate,
      ValidationMiddleware.validateIdParam,
      this.userController.getUserById
    );

    this.router.post(
      '/',
      AuthMiddleware.authenticate,
      ValidationMiddleware.validateUserRegistration,
      this.userController.createUser
    );

    this.router.put(
      '/:id',
      AuthMiddleware.authenticate,
      ValidationMiddleware.validateIdParam,
      ValidationMiddleware.validateUserUpdate,
      this.userController.updateUser
    );

    this.router.delete(
      '/:id',
      AuthMiddleware.authenticate,
      ValidationMiddleware.validateIdParam,
      this.userController.deleteUser
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}