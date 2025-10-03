import mysql from 'mysql2/promise';
import { DatabaseConfig } from '../interfaces';

export class Database {
  private static instance: Database;
  private pool: mysql.Pool | null = null;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    try {
      const config: DatabaseConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'node7_db',
        connectionLimit: 10,
        acquireTimeout: 60000,
        timeout: 60000,
      };

      this.pool = mysql.createPool({
        ...config,
        waitForConnections: true,
        queueLimit: 0,
        charset: 'utf8mb4',
        timezone: '+00:00',
      });

      // Verificar la conexión
      const connection = await this.pool.getConnection();
      console.log('✅ Conexión a MySQL establecida exitosamente');
      connection.release();
    } catch (error) {
      console.error('❌ Error al conectar con MySQL:', error);
      throw error;
    }
  }

  public getPool(): mysql.Pool {
    if (!this.pool) {
      throw new Error('Base de datos no inicializada. Llama a connect() primero.');
    }
    return this.pool;
  }

  public async query<T = any>(
    sql: string,
    values?: any[]
  ): Promise<T[]> {
    try {
      const [rows] = await this.getPool().execute(sql, values);
      return rows as T[];
    } catch (error) {
      console.error('Error en consulta SQL:', error);
      throw error;
    }
  }

  public async queryOne<T = any>(
    sql: string,
    values?: any[]
  ): Promise<T | null> {
    const rows = await this.query<T>(sql, values);
    return rows.length > 0 ? rows[0] : null;
  }

  public async insert<T = any>(
    table: string,
    data: Partial<T>
  ): Promise<number> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    
    try {
      const [result] = await this.getPool().execute(sql, values) as any;
      return result.insertId;
    } catch (error) {
      console.error('Error en INSERT:', error);
      throw error;
    }
  }

  public async update<T = any>(
    table: string,
    data: Partial<T>,
    where: string,
    whereValues: any[] = []
  ): Promise<number> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
    
    try {
      const [result] = await this.getPool().execute(sql, [...values, ...whereValues]) as any;
      return result.affectedRows;
    } catch (error) {
      console.error('Error en UPDATE:', error);
      throw error;
    }
  }

  public async delete(
    table: string,
    where: string,
    whereValues: any[] = []
  ): Promise<number> {
    const sql = `DELETE FROM ${table} WHERE ${where}`;
    
    try {
      const [result] = await this.getPool().execute(sql, whereValues) as any;
      return result.affectedRows;
    } catch (error) {
      console.error('Error en DELETE:', error);
      throw error;
    }
  }

  public async beginTransaction(): Promise<mysql.PoolConnection> {
    const connection = await this.getPool().getConnection();
    await connection.beginTransaction();
    return connection;
  }

  public async commitTransaction(connection: mysql.PoolConnection): Promise<void> {
    await connection.commit();
    connection.release();
  }

  public async rollbackTransaction(connection: mysql.PoolConnection): Promise<void> {
    await connection.rollback();
    connection.release();
  }

  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('🔐 Conexión a MySQL cerrada');
    }
  }
}