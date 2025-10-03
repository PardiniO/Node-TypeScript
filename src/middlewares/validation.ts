import { body, param, query } from 'express-validator';

export class ValidationMiddleware {
  // Validaciones para usuarios
  public static validateUserRegistration = [
    body('email')
      .isEmail()
      .withMessage('Email debe ser válido')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password debe tener al menos 6 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password debe contener al menos una mayúscula, una minúscula y un número'),
    body('first_name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Nombre debe tener entre 2 y 50 caracteres')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage('Nombre solo puede contener letras y espacios'),
    body('last_name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Apellido debe tener entre 2 y 50 caracteres')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage('Apellido solo puede contener letras y espacios')
  ];

  public static validateUserLogin = [
    body('email')
      .isEmail()
      .withMessage('Email debe ser válido')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password es requerido')
  ];

  public static validateUserUpdate = [
    body('email')
      .optional()
      .isEmail()
      .withMessage('Email debe ser válido')
      .normalizeEmail(),
    body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('Password debe tener al menos 6 caracteres')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password debe contener al menos una mayúscula, una minúscula y un número'),
    body('first_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Nombre debe tener entre 2 y 50 caracteres')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage('Nombre solo puede contener letras y espacios'),
    body('last_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Apellido debe tener entre 2 y 50 caracteres')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage('Apellido solo puede contener letras y espacios')
  ];

  // Validaciones para productos
  public static validateProductCreation = [
    body('name')
      .trim()
      .isLength({ min: 2, max: 255 })
      .withMessage('Nombre del producto debe tener entre 2 y 255 caracteres'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Descripción no puede exceder 1000 caracteres'),
    body('price')
      .isFloat({ min: 0.01 })
      .withMessage('Precio debe ser un número mayor a 0'),
    body('stock')
      .isInt({ min: 0 })
      .withMessage('Stock debe ser un número entero mayor o igual a 0'),
    body('category')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Categoría debe tener entre 2 y 100 caracteres')
  ];

  public static validateProductUpdate = [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 255 })
      .withMessage('Nombre del producto debe tener entre 2 y 255 caracteres'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Descripción no puede exceder 1000 caracteres'),
    body('price')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Precio debe ser un número mayor a 0'),
    body('stock')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Stock debe ser un número entero mayor o igual a 0'),
    body('category')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Categoría debe tener entre 2 y 100 caracteres')
  ];

  // Validaciones para órdenes
  public static validateOrderCreation = [
    body('items')
      .isArray({ min: 1 })
      .withMessage('Items es requerido y debe ser un array con al menos un elemento'),
    body('items.*.product_id')
      .isInt({ min: 1 })
      .withMessage('ID del producto debe ser un número entero válido'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Cantidad debe ser un número entero mayor a 0')
  ];

  public static validateOrderStatusUpdate = [
    body('status')
      .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
      .withMessage('Estado debe ser uno de: pending, processing, shipped, delivered, cancelled')
  ];

  // Validaciones de parámetros
  public static validateIdParam = [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID debe ser un número entero válido')
  ];

  public static validateUserIdParam = [
    param('userId')
      .isInt({ min: 1 })
      .withMessage('ID de usuario debe ser un número entero válido')
  ];

  public static validateCategoryParam = [
    param('category')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Categoría debe tener entre 2 y 100 caracteres')
  ];

  public static validateStatusParam = [
    param('status')
      .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
      .withMessage('Estado debe ser uno de: pending, processing, shipped, delivered, cancelled')
  ];

  // Validaciones de query parameters
  public static validateSearchQuery = [
    query('q')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Término de búsqueda debe tener entre 2 y 100 caracteres')
  ];

  public static validatePaginationQuery = [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Página debe ser un número entero mayor a 0'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Límite debe ser un número entero entre 1 y 100')
  ];

  public static validatePriceRangeQuery = [
    query('minPrice')
      .isFloat({ min: 0 })
      .withMessage('Precio mínimo debe ser un número mayor o igual a 0'),
    query('maxPrice')
      .isFloat({ min: 0 })
      .withMessage('Precio máximo debe ser un número mayor o igual a 0')
  ];

  public static validateStockThresholdQuery = [
    query('threshold')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Umbral debe ser un número entero mayor o igual a 0')
  ];

  // Validación para actualizar stock
  public static validateStockUpdate = [
    body('quantity')
      .isInt()
      .withMessage('Cantidad debe ser un número entero (puede ser negativo para decrementar)')
  ];
}