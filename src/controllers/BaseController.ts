import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ApiResponse, PaginationParams } from '../interfaces';

export abstract class BaseController {
  protected sendResponse<T>(
    res: Response,
    statusCode: number,
    success: boolean,
    message: string,
    data?: T,
    error?: string
  ): void {
    const response: ApiResponse<T> = {
      success,
      message,
      ...(data !== undefined && { data }),
      ...(error && { error })
    };

    res.status(statusCode).json(response);
  }

  protected sendSuccess<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode: number = 200
  ): void {
    this.sendResponse(res, statusCode, true, message, data);
  }

  protected sendError(
    res: Response,
    message: string,
    error?: string,
    statusCode: number = 400
  ): void {
    this.sendResponse(res, statusCode, false, message, undefined, error);
  }

  protected sendServerError(res: Response, error: string = 'Error interno del servidor'): void {
    this.sendError(res, 'Error interno del servidor', error, 500);
  }

  protected sendNotFound(res: Response, message: string = 'Recurso no encontrado'): void {
    this.sendError(res, message, undefined, 404);
  }

  protected sendUnauthorized(res: Response, message: string = 'No autorizado'): void {
    this.sendError(res, message, undefined, 401);
  }

  protected sendForbidden(res: Response, message: string = 'Acceso denegado'): void {
    this.sendError(res, message, undefined, 403);
  }

  protected sendValidationError(res: Response, errors: any[]): void {
    this.sendError(
      res,
      'Errores de validación',
      errors.map(err => err.msg).join(', '),
      422
    );
  }

  protected validateRequest(req: Request, res: Response): boolean {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      this.sendValidationError(res, errors.array());
      return false;
    }
    return true;
  }

  protected getPaginationParams(req: Request): PaginationParams {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  protected async handleAsyncRoute(
    req: Request,
    res: Response,
    handler: (req: Request, res: Response) => Promise<void>
  ): Promise<void> {
    try {
      await handler(req, res);
    } catch (error) {
      console.error('Error en controlador:', error);
      
      if (error instanceof Error) {
        // Errores de validación o de negocio
        if (error.message.includes('no encontrado') || error.message.includes('not found')) {
          this.sendNotFound(res, error.message);
        } else if (
          error.message.includes('ya existe') ||
          error.message.includes('duplicado') ||
          error.message.includes('inválido') ||
          error.message.includes('insuficiente')
        ) {
          this.sendError(res, error.message);
        } else {
          this.sendServerError(res, error.message);
        }
      } else {
        this.sendServerError(res);
      }
    }
  }

  protected extractUserIdFromToken(req: Request): number {
    // Asumiendo que el middleware de autenticación agrega el usuario al request
    const user = (req as any).user;
    if (!user || !user.id) {
      throw new Error('Usuario no autenticado');
    }
    return user.id;
  }

  protected isValidId(id: string): boolean {
    const numId = parseInt(id);
    return !isNaN(numId) && numId > 0;
  }

  protected parseNumericParam(param: string, paramName: string): number {
    const numParam = parseInt(param);
    if (isNaN(numParam) || numParam <= 0) {
      throw new Error(`${paramName} debe ser un número válido mayor a 0`);
    }
    return numParam;
  }
}