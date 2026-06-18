import { Request, Response, NextFunction } from 'express';
import { ordersService } from './orders.service';
import { ApiResponse } from '../../utils/ApiResponse';

export class OrdersController {
  getAllOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await ordersService.getAllOrders(req.query);
      res.status(200).json(ApiResponse.success(result.data, 'Orders retrieved successfully', result.meta));
    } catch (err) {
      next(err);
    }
  };

  getOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const order = await ordersService.getOrderById(id);
      res.status(200).json(ApiResponse.success(order));
    } catch (err) {
      next(err);
    }
  };

  createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const order = await ordersService.createOrder(req.body, userId);
      res.status(201).json(ApiResponse.success(order, 'Order created successfully'));
    } catch (err) {
      next(err);
    }
  };

  updateOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const order = await ordersService.updateOrder(id, req.body);
      res.status(200).json(ApiResponse.success(order, 'Order updated successfully'));
    } catch (err) {
      next(err);
    }
  };

  deleteOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await ordersService.deleteOrder(id);
      res.status(200).json(ApiResponse.success(null, 'Order deleted successfully'));
    } catch (err) {
      next(err);
    }
  };

  confirmOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const order = await ordersService.confirmOrder(id);
      res.status(200).json(ApiResponse.success(order, 'Order confirmed successfully'));
    } catch (err) {
      next(err);
    }
  };

  shipOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const order = await ordersService.shipOrder(id);
      res.status(200).json(ApiResponse.success(order, 'Order marked as shipped successfully'));
    } catch (err) {
      next(err);
    }
  };

  receiveOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const order = await ordersService.receiveOrder(id, userId);
      res.status(200).json(ApiResponse.success(order, 'Order marked as received successfully'));
    } catch (err) {
      next(err);
    }
  };

  packOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const order = await ordersService.packOrder(id);
      res.status(200).json(ApiResponse.success(order, 'Order marked as packed successfully'));
    } catch (err) {
      next(err);
    }
  };

  dispatchOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const order = await ordersService.dispatchOrder(id);
      res.status(200).json(ApiResponse.success(order, 'Order marked as dispatched successfully'));
    } catch (err) {
      next(err);
    }
  };

  fulfillOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const order = await ordersService.fulfillOrder(id, userId);
      res.status(200).json(ApiResponse.success(order, 'Order fulfilled successfully'));
    } catch (err) {
      next(err);
    }
  };

  cancelOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const order = await ordersService.cancelOrder(id);
      res.status(200).json(ApiResponse.success(order, 'Order cancelled successfully'));
    } catch (err) {
      next(err);
    }
  };
}

export const ordersController = new OrdersController();
export default ordersController;
