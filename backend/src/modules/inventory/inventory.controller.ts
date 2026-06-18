import { Request, Response, NextFunction } from 'express';
import { inventoryService } from './inventory.service';
import { ApiResponse } from '../../utils/ApiResponse';

export class InventoryController {
  getInventory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await inventoryService.getInventory(req.query);
      res.status(200).json(ApiResponse.success(result.data, 'Inventory retrieved successfully', result.meta));
    } catch (err) {
      next(err);
    }
  };

  adjustStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const result = await inventoryService.adjustStock(req.body, userId);
      res.status(200).json(ApiResponse.success(result, 'Stock adjusted successfully'));
    } catch (err) {
      next(err);
    }
  };

  getMovements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await inventoryService.getMovements(req.query);
      res.status(200).json(ApiResponse.success(result.data, 'Stock movements retrieved successfully', result.meta));
    } catch (err) {
      next(err);
    }
  };

  getLowStock = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await inventoryService.getLowStock();
      res.status(200).json(ApiResponse.success(result));
    } catch (err) {
      next(err);
    }
  };

  getValuation = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await inventoryService.getValuation();
      res.status(200).json(ApiResponse.success(result));
    } catch (err) {
      next(err);
    }
  };

  exportMovementsCSV = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const csv = await inventoryService.exportMovementsCSV(req.query);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=stock_movements.csv');
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  };
}

export const inventoryController = new InventoryController();
export default inventoryController;
