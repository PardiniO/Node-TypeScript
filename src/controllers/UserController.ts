import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/UserModel';
import { BaseController } from './BaseController';
import { User } from '../interfaces';

export class UserController extends BaseController {
  private userModel: UserModel;

  constructor() {
    super();
    this.userModel = new UserModel();
  }

  public getAllUsers = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      const pagination = this.getPaginationParams(req);
      const users = await this.userModel.getAllUsers(pagination);
      
      this.sendSuccess(res, 'Usuarios obtenidos exitosamente', users);
    });
  };

  public getUserById = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      const { id } = req.params;
      
      if (!this.isValidId(id)) {
        this.sendError(res, 'ID de usuario inválido');
        return;
      }

      const user = await this.userModel.getUserById(parseInt(id));
      
      if (!user) {
        this.sendNotFound(res, 'Usuario no encontrado');
        return;
      }

      // Remover la contraseña del response
      const { password, ...userWithoutPassword } = user;
      this.sendSuccess(res, 'Usuario obtenido exitosamente', userWithoutPassword);
    });
  };

  public createUser = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      if (!this.validateRequest(req, res)) {
        return;
      }

      const { email, password, first_name, last_name } = req.body;

      const userData: Omit<User, 'id' | 'created_at' | 'updated_at'> = {
        email,
        password,
        first_name,
        last_name,
        is_active: true
      };

      const userId = await this.userModel.createUser(userData);
      
      this.sendSuccess(
        res,
        'Usuario creado exitosamente',
        { id: userId },
        201
      );
    });
  };

  public updateUser = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      const { id } = req.params;
      
      if (!this.isValidId(id)) {
        this.sendError(res, 'ID de usuario inválido');
        return;
      }

      if (!this.validateRequest(req, res)) {
        return;
      }

      const userId = parseInt(id);
      const updateData: Partial<User> = req.body;

      // Remover campos que no se deben actualizar directamente
      delete (updateData as any).id;
      delete (updateData as any).created_at;
      delete (updateData as any).updated_at;

      const updated = await this.userModel.updateUser(userId, updateData);
      
      if (!updated) {
        this.sendNotFound(res, 'Usuario no encontrado');
        return;
      }

      this.sendSuccess(res, 'Usuario actualizado exitosamente');
    });
  };

  public deleteUser = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      const { id } = req.params;
      
      if (!this.isValidId(id)) {
        this.sendError(res, 'ID de usuario inválido');
        return;
      }

      const userId = parseInt(id);
      const deleted = await this.userModel.deleteUser(userId);
      
      if (!deleted) {
        this.sendNotFound(res, 'Usuario no encontrado');
        return;
      }

      this.sendSuccess(res, 'Usuario eliminado exitosamente');
    });
  };

  public searchUsers = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      const { q: searchTerm } = req.query;
      
      if (!searchTerm || typeof searchTerm !== 'string') {
        this.sendError(res, 'Término de búsqueda requerido');
        return;
      }

      const pagination = this.getPaginationParams(req);
      const users = await this.userModel.searchUsers(searchTerm, pagination);
      
      this.sendSuccess(res, 'Búsqueda completada', users);
    });
  };

  public getUserStats = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      const stats = await this.userModel.getUserStats();
      this.sendSuccess(res, 'Estadísticas obtenidas exitosamente', stats);
    });
  };

  // Métodos de autenticación
  public login = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      if (!this.validateRequest(req, res)) {
        return;
      }

      const { email, password } = req.body;

      const user = await this.userModel.authenticateUser(email, password);
      
      if (!user) {
        this.sendUnauthorized(res, 'Credenciales inválidas');
        return;
      }

      // Generar JWT token
      const token = this.generateToken(user);
      
      // Remover la contraseña del response
      const { password: _, ...userWithoutPassword } = user;
      
      this.sendSuccess(res, 'Login exitoso', {
        user: userWithoutPassword,
        token
      });
    });
  };

  public register = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      if (!this.validateRequest(req, res)) {
        return;
      }

      const { email, password, first_name, last_name } = req.body;

      const userData: Omit<User, 'id' | 'created_at' | 'updated_at'> = {
        email,
        password,
        first_name,
        last_name,
        is_active: true
      };

      const userId = await this.userModel.createUser(userData);
      
      // Obtener el usuario creado para generar el token
      const newUser = await this.userModel.getUserById(userId);
      if (!newUser) {
        this.sendServerError(res, 'Error al crear usuario');
        return;
      }

      const token = this.generateToken(newUser);
      
      // Remover la contraseña del response
      const { password: _, ...userWithoutPassword } = newUser;
      
      this.sendSuccess(
        res,
        'Usuario registrado exitosamente',
        {
          user: userWithoutPassword,
          token
        },
        201
      );
    });
  };

  public getProfile = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      const userId = this.extractUserIdFromToken(req);
      const user = await this.userModel.getUserById(userId);
      
      if (!user) {
        this.sendNotFound(res, 'Usuario no encontrado');
        return;
      }

      // Remover la contraseña del response
      const { password, ...userWithoutPassword } = user;
      this.sendSuccess(res, 'Perfil obtenido exitosamente', userWithoutPassword);
    });
  };

  public updateProfile = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      if (!this.validateRequest(req, res)) {
        return;
      }

      const userId = this.extractUserIdFromToken(req);
      const updateData: Partial<User> = req.body;

      // Remover campos que no se deben actualizar directamente
      delete (updateData as any).id;
      delete (updateData as any).created_at;
      delete (updateData as any).updated_at;
      delete (updateData as any).is_active; // No permitir que el usuario se desactive a sí mismo

      const updated = await this.userModel.updateUser(userId, updateData);
      
      if (!updated) {
        this.sendServerError(res, 'Error al actualizar perfil');
        return;
      }

      this.sendSuccess(res, 'Perfil actualizado exitosamente');
    });
  };

  private generateToken(user: User): string {
    const payload = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name
    };

    const secret = process.env.JWT_SECRET || 'default_secret_key';

    return jwt.sign(payload, secret, { expiresIn: '24h' });
  }
}