import { Request, Response } from 'express';
import { OrderModel } from '../models/OrderModel';
import { BaseController } from './BaseController';
import { Order } from '../interfaces';

export class OrderController extends BaseController {
  private orderModel: OrderModel;

  constructor() {
    super();
    this.orderModel = new OrderModel();
  }

  public getAllOrders = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      const pagination = this.getPaginationParams(req);
      const orders = await this.orderModel.getAllOrders(pagination);
      
      this.sendSuccess(res, 'Órdenes obtenidas exitosamente', orders);
    });
  };

  public getOrderById = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      const { id } = req.params;
      
      if (!this.isValidId(id)) {
        this.sendError(res, 'ID de orden inválido');
        return;
      }

      const order = await this.orderModel.getOrderById(parseInt(id));
      
      if (!order) {
        this.sendNotFound(res, 'Orden no encontrada');
        return;
      }

      this.sendSuccess(res, 'Orden obtenida exitosamente', order);
    });
  };

  public getOrderWithItems = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      const { id } = req.params;
      
      if (!this.isValidId(id)) {
        this.sendError(res, 'ID de orden inválido');
        return;
      }

      const orderData = await this.orderModel.getOrderWithItems(parseInt(id));
      
      if (!orderData.order) {
        this.sendNotFound(res, 'Orden no encontrada');
        return;
      }

      this.sendSuccess(res, 'Orden con items obtenida exitosamente', orderData);
    });
  };

  public getOrdersByUser = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      const { userId } = req.params;
      
      if (!this.isValidId(userId)) {
        this.sendError(res, 'ID de usuario inválido');
        return;
      }

      const pagination = this.getPaginationParams(req);
      const orders = await this.orderModel.getOrdersByUser(parseInt(userId), pagination);
      
      this.sendSuccess(res, 'Órdenes del usuario obtenidas exitosamente', orders);
    });
  };

  public getMyOrders = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      const userId = this.extractUserIdFromToken(req);
      const pagination = this.getPaginationParams(req);
      const orders = await this.orderModel.getOrdersByUser(userId, pagination);
      
      this.sendSuccess(res, 'Mis órdenes obtenidas exitosamente', orders);
    });
  };

  public getOrdersByStatus = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      const { status } = req.params;
      
      const validStatuses: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      
      if (!validStatuses.includes(status as Order['status'])) {
        this.sendError(res, 'Estado de orden inválido');
        return;
      }

      const pagination = this.getPaginationParams(req);
      const orders = await this.orderModel.getOrdersByStatus(status as Order['status'], pagination);
      
      this.sendSuccess(res, `Órdenes con estado "${status}" obtenidas exitosamente`, orders);
    });
  };

  public createOrder = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      if (!this.validateRequest(req, res)) {
        return;
      }

      const userId = this.extractUserIdFromToken(req);
      const { items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        this.sendError(res, 'Items de la orden requeridos');
        return;
      }

      // Validar estructura de items
      for (const item of items) {
        if (!item.product_id || !item.quantity || item.quantity <= 0) {
          this.sendError(res, 'Cada item debe tener product_id y quantity válidos');
          return;
        }
      }

      const orderId = await this.orderModel.createOrder(userId, items);
      
      this.sendSuccess(
        res,
        'Orden creada exitosamente',
        { id: orderId },
        201
      );
    });
  };

  public createOrderForUser = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      if (!this.validateRequest(req, res)) {
        return;
      }

      const { userId } = req.params;
      const { items } = req.body;

      if (!this.isValidId(userId)) {
        this.sendError(res, 'ID de usuario inválido');
        return;
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        this.sendError(res, 'Items de la orden requeridos');
        return;
      }

      // Validar estructura de items
      for (const item of items) {
        if (!item.product_id || !item.quantity || item.quantity <= 0) {
          this.sendError(res, 'Cada item debe tener product_id y quantity válidos');
          return;
        }
      }

      const orderId = await this.orderModel.createOrder(parseInt(userId), items);
      
      this.sendSuccess(
        res,
        'Orden creada exitosamente',
        { id: orderId },
        201
      );
    });
  };

  public updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      const { id } = req.params;
      const { status } = req.body;

      if (!this.isValidId(id)) {
        this.sendError(res, 'ID de orden inválido');
        return;
      }

      if (!status) {
        this.sendError(res, 'Estado requerido');
        return;
      }

      const validStatuses: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      
      if (!validStatuses.includes(status)) {
        this.sendError(res, 'Estado de orden inválido');
        return;
      }

      const updated = await this.orderModel.updateOrderStatus(parseInt(id), status);
      
      if (!updated) {
        this.sendNotFound(res, 'Orden no encontrada');
        return;
      }

      this.sendSuccess(res, `Estado de orden actualizado a "${status}" exitosamente`);
    });
  };

  public cancelOrder = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      const { id } = req.params;
      
      if (!this.isValidId(id)) {
        this.sendError(res, 'ID de orden inválido');
        return;
      }

      const cancelled = await this.orderModel.cancelOrder(parseInt(id));
      
      if (!cancelled) {
        this.sendNotFound(res, 'Orden no encontrada');
        return;
      }

      this.sendSuccess(res, 'Orden cancelada exitosamente');
    });
  };

  public cancelMyOrder = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      const { id } = req.params;
      
      if (!this.isValidId(id)) {
        this.sendError(res, 'ID de orden inválido');
        return;
      }

      const userId = this.extractUserIdFromToken(req);
      const orderId = parseInt(id);

      // Verificar que la orden pertenece al usuario
      const order = await this.orderModel.getOrderById(orderId);
      if (!order) {
        this.sendNotFound(res, 'Orden no encontrada');
        return;
      }

      if (order.user_id !== userId) {
        this.sendForbidden(res, 'No tienes permiso para cancelar esta orden');
        return;
      }

      // Solo permitir cancelar órdenes pendientes o en proceso
      if (order.status !== 'pending' && order.status !== 'processing') {
        this.sendError(res, 'Solo se pueden cancelar órdenes pendientes o en proceso');
        return;
      }

      const cancelled = await this.orderModel.cancelOrder(orderId);
      
      if (!cancelled) {
        this.sendServerError(res, 'Error al cancelar la orden');
        return;
      }

      this.sendSuccess(res, 'Orden cancelada exitosamente');
    });
  };

  public getOrderStats = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      const stats = await this.orderModel.getOrderStats();
      this.sendSuccess(res, 'Estadísticas obtenidas exitosamente', stats);
    });
  };
}