import { Request, Response, NextFunction } from 'express';
import { reportsService } from './reports.service';
import { ApiResponse } from '../../utils/ApiResponse';

export class ReportsController {
  getInventoryValuation = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await reportsService.getInventoryValuation();
      res.status(200).json(ApiResponse.success(data));
    } catch (err) {
      next(err);
    }
  };

  getStockMovements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await reportsService.getStockMovementSummary(req.query);
      res.status(200).json(ApiResponse.success(data));
    } catch (err) {
      next(err);
    }
  };

  getLowStock = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await reportsService.getLowStock();
      res.status(200).json(ApiResponse.success(data));
    } catch (err) {
      next(err);
    }
  };

  getOrderSummary = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await reportsService.getOrderSummary();
      res.status(200).json(ApiResponse.success(data));
    } catch (err) {
      next(err);
    }
  };

  getDashboardStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await reportsService.getDashboardStats();
      res.status(200).json(ApiResponse.success(data));
    } catch (err) {
      next(err);
    }
  };
}

export const reportsController = new ReportsController();
export default reportsController;
