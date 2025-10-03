import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../interfaces';

export class ErrorMiddleware {
  public static notFound = (req: Request, res: Response, next: NextFunction): void => {
    const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
    res.status(404);
    next(error);
  };

  public static errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = error.message;

    // Error de cast de MongoDB/MySQL
    if (error.name === 'CastError') {
      message = 'Recurso no encontrado';
      statusCode = 404;
    }

    // Error de validación
    if (error.name === 'ValidationError') {
      statusCode = 400;
    }

    // Error de duplicado (MySQL)
    if (error.message.includes('ER_DUP_ENTRY')) {
      message = 'Recurso duplicado';
      statusCode = 400;
    }

    // Error de conexión a base de datos
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      message = 'Error de conexión a la base de datos';
      statusCode = 500;
    }

    // Error de sintaxis SQL
    if (error.message.includes('ER_PARSE_ERROR')) {
      message = 'Error en consulta SQL';
      statusCode = 500;
    }

    const response: ApiResponse = {
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { error: error.stack })
    };

    console.error(`Error ${statusCode}: ${message}`);
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }

    res.status(statusCode).json(response);
  };

  public static asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };
}