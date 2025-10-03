import bcrypt from 'bcryptjs';
import { User, PaginationParams, PaginatedResponse } from '../interfaces';
import { BaseModel } from './BaseModel';

export class UserModel extends BaseModel {
  constructor() {
    super('users');
  }

  public async getAllUsers(pagination?: PaginationParams): Promise<User[] | PaginatedResponse<User>> {
    if (pagination) {
      const [users, total] = await Promise.all([
        this.findAll<User>('is_active = 1', [], pagination),
        this.count('is_active = 1')
      ]);
      
      return this.buildPaginatedResponse(users, pagination, total);
    }
    
    return await this.findAll<User>('is_active = 1');
  }

  public async getUserById(id: number): Promise<User | null> {
    return await this.findById<User>(id);
  }

  public async getUserByEmail(email: string): Promise<User | null> {
    return await this.findOne<User>('email = ?', [email]);
  }

  public async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    // Verificar si el email ya existe
    const existingUser = await this.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    // Encriptar la contraseña
    const hashedPassword = await this.hashPassword(userData.password);
    
    const userToCreate = {
      ...userData,
      password: hashedPassword,
      is_active: true
    };

    return await this.create<User>(userToCreate);
  }

  public async updateUser(id: number, userData: Partial<User>): Promise<boolean> {
    // Si se va a actualizar la contraseña, encriptarla
    if (userData.password) {
      userData.password = await this.hashPassword(userData.password);
    }

    // Si se va a actualizar el email, verificar que no exista
    if (userData.email) {
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser && existingUser.id !== id) {
        throw new Error('El email ya está registrado por otro usuario');
      }
    }

    const affectedRows = await this.updateById<User>(id, userData);
    return affectedRows > 0;
  }

  public async deleteUser(id: number): Promise<boolean> {
    // Soft delete - marcar como inactivo
    const affectedRows = await this.updateById<User>(id, { is_active: false });
    return affectedRows > 0;
  }

  public async hardDeleteUser(id: number): Promise<boolean> {
    // Hard delete - eliminar completamente
    const affectedRows = await this.deleteById(id);
    return affectedRows > 0;
  }

  public async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  public async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    
    if (!user || !user.is_active) {
      return null;
    }

    const isValidPassword = await this.validatePassword(password, user.password);
    if (!isValidPassword) {
      return null;
    }

    // Remover la contraseña del objeto de respuesta
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  public async searchUsers(
    searchTerm: string,
    pagination?: PaginationParams
  ): Promise<User[] | PaginatedResponse<User>> {
    const conditions = `
      (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?) 
      AND is_active = 1
    `;
    const searchValue = `%${searchTerm}%`;
    const values = [searchValue, searchValue, searchValue];

    if (pagination) {
      const [users, total] = await Promise.all([
        this.findAll<User>(conditions, values, pagination),
        this.count(conditions, values)
      ]);
      
      return this.buildPaginatedResponse(users, pagination, total);
    }
    
    return await this.findAll<User>(conditions, values);
  }

  public async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    recentlyRegistered: number;
  }> {
    const [total, active, inactive, recentlyRegistered] = await Promise.all([
      this.count(),
      this.count('is_active = 1'),
      this.count('is_active = 0'),
      this.count('created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND is_active = 1')
    ]);

    return {
      total,
      active,
      inactive,
      recentlyRegistered
    };
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }
}