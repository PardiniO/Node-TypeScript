import { Order, OrderItem, PaginationParams, PaginatedResponse } from '../interfaces';
import { BaseModel } from './BaseModel';
import { ProductModel } from './ProductModel';
import { UserModel } from './UserModel';

export class OrderModel extends BaseModel {
  private productModel: ProductModel;
  private userModel: UserModel;

  constructor() {
    super('orders');
    this.productModel = new ProductModel();
    this.userModel = new UserModel();
  }

  public async getAllOrders(pagination?: PaginationParams): Promise<Order[] | PaginatedResponse<Order>> {
    const sql = `
      SELECT o.*, u.first_name, u.last_name, u.email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `;

    if (pagination) {
      const sqlWithPagination = `${sql} LIMIT ${pagination.limit} OFFSET ${pagination.offset}`;
      const [orders, total] = await Promise.all([
        this.db.query<Order>(sqlWithPagination),
        this.count()
      ]);
      
      return this.buildPaginatedResponse(orders, pagination, total);
    }
    
    return await this.db.query<Order>(sql);
  }

  public async getOrderById(id: number): Promise<Order | null> {
    const sql = `
      SELECT o.*, u.first_name, u.last_name, u.email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `;
    return await this.db.queryOne<Order>(sql, [id]);
  }

  public async getOrdersByUser(
    userId: number,
    pagination?: PaginationParams
  ): Promise<Order[] | PaginatedResponse<Order>> {
    const conditions = 'user_id = ?';
    const values = [userId];

    if (pagination) {
      const [orders, total] = await Promise.all([
        this.findAll<Order>(conditions, values, pagination),
        this.count(conditions, values)
      ]);
      
      return this.buildPaginatedResponse(orders, pagination, total);
    }
    
    return await this.findAll<Order>(conditions, values);
  }

  public async getOrdersByStatus(
    status: Order['status'],
    pagination?: PaginationParams
  ): Promise<Order[] | PaginatedResponse<Order>> {
    const conditions = 'status = ?';
    const values = [status];

    if (pagination) {
      const [orders, total] = await Promise.all([
        this.findAll<Order>(conditions, values, pagination),
        this.count(conditions, values)
      ]);
      
      return this.buildPaginatedResponse(orders, pagination, total);
    }
    
    return await this.findAll<Order>(conditions, values);
  }

  public async createOrder(
    userId: number,
    items: Array<{ product_id: number; quantity: number }>
  ): Promise<number> {
    // Verificar que el usuario existe
    const user = await this.userModel.getUserById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (!items || items.length === 0) {
      throw new Error('La orden debe tener al menos un producto');
    }

    // Iniciar transacción
    const connection = await this.db.beginTransaction();

    try {
      let total = 0;

      // Verificar productos y calcular total
      for (const item of items) {
        const product = await this.productModel.getProductById(item.product_id);
        if (!product) {
          throw new Error(`Producto con ID ${item.product_id} no encontrado`);
        }

        if (!product.is_active) {
          throw new Error(`Producto "${product.name}" no está disponible`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para "${product.name}". Disponible: ${product.stock}`);
        }

        if (item.quantity <= 0) {
          throw new Error('La cantidad debe ser mayor a 0');
        }

        total += product.price * item.quantity;
      }

      // Crear la orden
      const orderData = {
        user_id: userId,
        total: total,
        status: 'pending' as const
      };

      const orderId = await this.create<Order>(orderData);

      // Crear los items de la orden y actualizar stock
      for (const item of items) {
        const product = await this.productModel.getProductById(item.product_id);
        
        // Crear el item de la orden
        await this.createOrderItem({
          order_id: orderId,
          product_id: item.product_id,
          quantity: item.quantity,
          price: product!.price
        });

        // Actualizar stock del producto
        await this.productModel.updateStock(item.product_id, -item.quantity);
      }

      await this.db.commitTransaction(connection);
      return orderId;

    } catch (error) {
      await this.db.rollbackTransaction(connection);
      throw error;
    }
  }

  public async updateOrderStatus(id: number, status: Order['status']): Promise<boolean> {
    const validStatuses: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      throw new Error('Estado de orden inválido');
    }

    const order = await this.getOrderById(id);
    if (!order) {
      throw new Error('Orden no encontrada');
    }

    // Si se cancela una orden pendiente o en proceso, devolver stock
    if (status === 'cancelled' && (order.status === 'pending' || order.status === 'processing')) {
      await this.restoreOrderStock(id);
    }

    const affectedRows = await this.updateById<Order>(id, { status });
    return affectedRows > 0;
  }

  public async cancelOrder(id: number): Promise<boolean> {
    return await this.updateOrderStatus(id, 'cancelled');
  }

  public async getOrderItems(orderId: number): Promise<OrderItem[]> {
    const sql = `
      SELECT oi.*, p.name as product_name, p.description as product_description
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `;
    return await this.db.query<OrderItem>(sql, [orderId]);
  }

  public async getOrderWithItems(orderId: number): Promise<{
    order: Order | null;
    items: OrderItem[];
  }> {
    const [order, items] = await Promise.all([
      this.getOrderById(orderId),
      this.getOrderItems(orderId)
    ]);

    return { order, items };
  }

  public async getOrderStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    totalRevenue: number;
    averageOrderValue: number;
  }> {
    const [
      total,
      pending,
      processing,
      shipped,
      delivered,
      cancelled,
      revenueResult,
      avgOrderResult
    ] = await Promise.all([
      this.count(),
      this.count('status = ?', ['pending']),
      this.count('status = ?', ['processing']),
      this.count('status = ?', ['shipped']),
      this.count('status = ?', ['delivered']),
      this.count('status = ?', ['cancelled']),
      this.db.queryOne<{ total_revenue: number }>(`
        SELECT SUM(total) as total_revenue 
        FROM ${this.tableName} 
        WHERE status IN ('delivered', 'shipped', 'processing')
      `),
      this.db.queryOne<{ avg_order: number }>(`
        SELECT AVG(total) as avg_order 
        FROM ${this.tableName} 
        WHERE status IN ('delivered', 'shipped', 'processing')
      `)
    ]);

    return {
      total,
      pending,
      processing,
      shipped,
      delivered,
      cancelled,
      totalRevenue: Math.round((revenueResult?.total_revenue || 0) * 100) / 100,
      averageOrderValue: Math.round((avgOrderResult?.avg_order || 0) * 100) / 100
    };
  }

  private async createOrderItem(itemData: OrderItem): Promise<number> {
    return await this.db.insert<OrderItem>('order_items', itemData);
  }

  private async restoreOrderStock(orderId: number): Promise<void> {
    const items = await this.getOrderItems(orderId);
    
    for (const item of items) {
      await this.productModel.updateStock(item.product_id, item.quantity);
    }
  }
}