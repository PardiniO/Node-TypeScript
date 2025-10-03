import { Request, Response } from 'express';
import { ProductModel } from '../models/ProductModel';
import { BaseController } from './BaseController';
import { Product } from '../interfaces';

export class ProductController extends BaseController {
  private productModel: ProductModel;

  constructor() {
    super();
    this.productModel = new ProductModel();
  }

  public getAllProducts = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      const pagination = this.getPaginationParams(req);
      const products = await this.productModel.getAllProducts(pagination);
      
      this.sendSuccess(res, 'Productos obtenidos exitosamente', products);
    });
  };

  public getProductById = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      const { id } = req.params;
      
      if (!this.isValidId(id)) {
        this.sendError(res, 'ID de producto inválido');
        return;
      }

      const product = await this.productModel.getProductById(parseInt(id));
      
      if (!product) {
        this.sendNotFound(res, 'Producto no encontrado');
        return;
      }

      this.sendSuccess(res, 'Producto obtenido exitosamente', product);
    });
  };

  public createProduct = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      if (!this.validateRequest(req, res)) {
        return;
      }

      const { name, description, price, stock, category } = req.body;

      const productData: Omit<Product, 'id' | 'created_at' | 'updated_at'> = {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        category,
        is_active: true
      };

      const productId = await this.productModel.createProduct(productData);
      
      this.sendSuccess(
        res,
        'Producto creado exitosamente',
        { id: productId },
        201
      );
    });
  };

  public updateProduct = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      const { id } = req.params;
      
      if (!this.isValidId(id)) {
        this.sendError(res, 'ID de producto inválido');
        return;
      }

      if (!this.validateRequest(req, res)) {
        return;
      }

      const productId = parseInt(id);
      const updateData: Partial<Product> = req.body;

      // Convertir tipos si están presentes
      if (updateData.price !== undefined) {
        updateData.price = parseFloat(updateData.price as any);
      }
      if (updateData.stock !== undefined) {
        updateData.stock = parseInt(updateData.stock as any);
      }

      // Remover campos que no se deben actualizar directamente
      delete (updateData as any).id;
      delete (updateData as any).created_at;
      delete (updateData as any).updated_at;

      const updated = await this.productModel.updateProduct(productId, updateData);
      
      if (!updated) {
        this.sendNotFound(res, 'Producto no encontrado');
        return;
      }

      this.sendSuccess(res, 'Producto actualizado exitosamente');
    });
  };

  public deleteProduct = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      const { id } = req.params;
      
      if (!this.isValidId(id)) {
        this.sendError(res, 'ID de producto inválido');
        return;
      }

      const productId = parseInt(id);
      const deleted = await this.productModel.deleteProduct(productId);
      
      if (!deleted) {
        this.sendNotFound(res, 'Producto no encontrado');
        return;
      }

      this.sendSuccess(res, 'Producto eliminado exitosamente');
    });
  };

  public searchProducts = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      const { q: searchTerm } = req.query;
      
      if (!searchTerm || typeof searchTerm !== 'string') {
        this.sendError(res, 'Término de búsqueda requerido');
        return;
      }

      const pagination = this.getPaginationParams(req);
      const products = await this.productModel.searchProducts(searchTerm, pagination);
      
      this.sendSuccess(res, 'Búsqueda completada', products);
    });
  };

  public getProductsByCategory = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      const { category } = req.params;
      
      if (!category) {
        this.sendError(res, 'Categoría requerida');
        return;
      }

      const pagination = this.getPaginationParams(req);
      const products = await this.productModel.getProductsByCategory(category, pagination);
      
      this.sendSuccess(res, `Productos de la categoría "${category}" obtenidos exitosamente`, products);
    });
  };

  public getProductsByPriceRange = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      const { minPrice, maxPrice } = req.query;
      
      if (!minPrice || !maxPrice) {
        this.sendError(res, 'Rango de precios requerido (minPrice y maxPrice)');
        return;
      }

      const min = parseFloat(minPrice as string);
      const max = parseFloat(maxPrice as string);

      if (isNaN(min) || isNaN(max) || min < 0 || max < 0 || min > max) {
        this.sendError(res, 'Rango de precios inválido');
        return;
      }

      const pagination = this.getPaginationParams(req);
      const products = await this.productModel.getProductsByPriceRange(min, max, pagination);
      
      this.sendSuccess(res, `Productos en rango de precios $${min} - $${max} obtenidos exitosamente`, products);
    });
  };

  public getLowStockProducts = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      const { threshold } = req.query;
      const stockThreshold = threshold ? parseInt(threshold as string) : 5;

      if (isNaN(stockThreshold) || stockThreshold < 0) {
        this.sendError(res, 'Umbral de stock inválido');
        return;
      }

      const products = await this.productModel.getLowStockProducts(stockThreshold);
      
      this.sendSuccess(res, `Productos con stock bajo (≤${stockThreshold}) obtenidos exitosamente`, products);
    });
  };

  public updateStock = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      const { id } = req.params;
      const { quantity } = req.body;

      if (!this.isValidId(id)) {
        this.sendError(res, 'ID de producto inválido');
        return;
      }

      if (quantity === undefined || isNaN(quantity)) {
        this.sendError(res, 'Cantidad requerida y debe ser un número');
        return;
      }

      const productId = parseInt(id);
      const stockQuantity = parseInt(quantity);

      const updated = await this.productModel.updateStock(productId, stockQuantity);
      
      if (!updated) {
        this.sendNotFound(res, 'Producto no encontrado');
        return;
      }

      const action = stockQuantity > 0 ? 'incrementado' : 'decrementado';
      this.sendSuccess(res, `Stock ${action} exitosamente`);
    });
  };

  public getCategories = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      const categories = await this.productModel.getCategories();
      this.sendSuccess(res, 'Categorías obtenidas exitosamente', categories);
    });
  };

  public getProductStats = async (req: Request, res: Response): Promise<void> => {
    await this.handleAsyncRoute(req, res, async (req, res) => {
      const stats = await this.productModel.getProductStats();
      this.sendSuccess(res, 'Estadísticas obtenidas exitosamente', stats);
    });
  };
}