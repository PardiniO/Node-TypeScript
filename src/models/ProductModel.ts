import { Product, PaginationParams, PaginatedResponse } from '../interfaces';
import { BaseModel } from './BaseModel';

export class ProductModel extends BaseModel {
  constructor() {
    super('products');
  }

  public async getAllProducts(pagination?: PaginationParams): Promise<Product[] | PaginatedResponse<Product>> {
    if (pagination) {
      const [products, total] = await Promise.all([
        this.findAll<Product>('is_active = 1', [], pagination),
        this.count('is_active = 1')
      ]);
      
      return this.buildPaginatedResponse(products, pagination, total);
    }
    
    return await this.findAll<Product>('is_active = 1');
  }

  public async getProductById(id: number): Promise<Product | null> {
    return await this.findById<Product>(id);
  }

  public async getProductsByCategory(
    category: string,
    pagination?: PaginationParams
  ): Promise<Product[] | PaginatedResponse<Product>> {
    const conditions = 'category = ? AND is_active = 1';
    const values = [category];

    if (pagination) {
      const [products, total] = await Promise.all([
        this.findAll<Product>(conditions, values, pagination),
        this.count(conditions, values)
      ]);
      
      return this.buildPaginatedResponse(products, pagination, total);
    }
    
    return await this.findAll<Product>(conditions, values);
  }

  public async createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    // Verificar que el nombre no esté duplicado
    const existingProduct = await this.findOne<Product>('name = ? AND is_active = 1', [productData.name]);
    if (existingProduct) {
      throw new Error('Ya existe un producto con ese nombre');
    }

    // Validar precio
    if (productData.price <= 0) {
      throw new Error('El precio debe ser mayor a 0');
    }

    // Validar stock
    if (productData.stock < 0) {
      throw new Error('El stock no puede ser negativo');
    }

    const productToCreate = {
      ...productData,
      is_active: true
    };

    return await this.create<Product>(productToCreate);
  }

  public async updateProduct(id: number, productData: Partial<Product>): Promise<boolean> {
    // Verificar que el producto existe
    const existingProduct = await this.getProductById(id);
    if (!existingProduct) {
      throw new Error('Producto no encontrado');
    }

    // Si se va a actualizar el nombre, verificar que no esté duplicado
    if (productData.name) {
      const duplicateProduct = await this.findOne<Product>(
        'name = ? AND id != ? AND is_active = 1',
        [productData.name, id]
      );
      if (duplicateProduct) {
        throw new Error('Ya existe otro producto con ese nombre');
      }
    }

    // Validar precio si se proporciona
    if (productData.price !== undefined && productData.price <= 0) {
      throw new Error('El precio debe ser mayor a 0');
    }

    // Validar stock si se proporciona
    if (productData.stock !== undefined && productData.stock < 0) {
      throw new Error('El stock no puede ser negativo');
    }

    const affectedRows = await this.updateById<Product>(id, productData);
    return affectedRows > 0;
  }

  public async deleteProduct(id: number): Promise<boolean> {
    // Soft delete - marcar como inactivo
    const affectedRows = await this.updateById<Product>(id, { is_active: false });
    return affectedRows > 0;
  }

  public async hardDeleteProduct(id: number): Promise<boolean> {
    // Hard delete - eliminar completamente
    const affectedRows = await this.deleteById(id);
    return affectedRows > 0;
  }

  public async searchProducts(
    searchTerm: string,
    pagination?: PaginationParams
  ): Promise<Product[] | PaginatedResponse<Product>> {
    const conditions = `
      (name LIKE ? OR description LIKE ? OR category LIKE ?) 
      AND is_active = 1
    `;
    const searchValue = `%${searchTerm}%`;
    const values = [searchValue, searchValue, searchValue];

    if (pagination) {
      const [products, total] = await Promise.all([
        this.findAll<Product>(conditions, values, pagination),
        this.count(conditions, values)
      ]);
      
      return this.buildPaginatedResponse(products, pagination, total);
    }
    
    return await this.findAll<Product>(conditions, values);
  }

  public async getProductsByPriceRange(
    minPrice: number,
    maxPrice: number,
    pagination?: PaginationParams
  ): Promise<Product[] | PaginatedResponse<Product>> {
    const conditions = 'price BETWEEN ? AND ? AND is_active = 1';
    const values = [minPrice, maxPrice];

    if (pagination) {
      const [products, total] = await Promise.all([
        this.findAll<Product>(conditions, values, pagination),
        this.count(conditions, values)
      ]);
      
      return this.buildPaginatedResponse(products, pagination, total);
    }
    
    return await this.findAll<Product>(conditions, values);
  }

  public async getLowStockProducts(threshold: number = 5): Promise<Product[]> {
    return await this.findAll<Product>(
      'stock <= ? AND is_active = 1 ORDER BY stock ASC',
      [threshold]
    );
  }

  public async updateStock(id: number, quantity: number): Promise<boolean> {
    const product = await this.getProductById(id);
    if (!product) {
      throw new Error('Producto no encontrado');
    }

    const newStock = product.stock + quantity;
    if (newStock < 0) {
      throw new Error('Stock insuficiente');
    }

    return await this.updateProduct(id, { stock: newStock });
  }

  public async getCategories(): Promise<string[]> {
    const sql = `
      SELECT DISTINCT category 
      FROM ${this.tableName} 
      WHERE category IS NOT NULL AND category != '' AND is_active = 1
      ORDER BY category
    `;
    const results = await this.db.query<{ category: string }>(sql);
    return results.map(row => row.category);
  }

  public async getProductStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    lowStock: number;
    categories: number;
    averagePrice: number;
  }> {
    const [
      total,
      active,
      inactive,
      lowStock,
      categories,
      avgPriceResult
    ] = await Promise.all([
      this.count(),
      this.count('is_active = 1'),
      this.count('is_active = 0'),
      this.count('stock <= 5 AND is_active = 1'),
      this.db.queryOne<{ count: number }>(`
        SELECT COUNT(DISTINCT category) as count 
        FROM ${this.tableName} 
        WHERE category IS NOT NULL AND category != '' AND is_active = 1
      `),
      this.db.queryOne<{ avg_price: number }>(`
        SELECT AVG(price) as avg_price 
        FROM ${this.tableName} 
        WHERE is_active = 1
      `)
    ]);

    return {
      total,
      active,
      inactive,
      lowStock,
      categories: categories?.count || 0,
      averagePrice: Math.round((avgPriceResult?.avg_price || 0) * 100) / 100
    };
  }
}