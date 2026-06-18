import { Request, Response, NextFunction } from 'express';
import { suppliersService } from './suppliers.service';
import { ApiResponse } from '../../utils/ApiResponse';

export class SuppliersController {
  getAllSuppliers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await suppliersService.getAllSuppliers(req.query);
      res.status(200).json(ApiResponse.success(result.data, 'Suppliers retrieved successfully', result.meta));
    } catch (err) {
      next(err);
    }
  };

  getSupplierById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const supplier = await suppliersService.getSupplierById(id);
      res.status(200).json(ApiResponse.success(supplier));
    } catch (err) {
      next(err);
    }
  };

  createSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const supplier = await suppliersService.createSupplier(req.body);
      res.status(201).json(ApiResponse.success(supplier, 'Supplier created successfully'));
    } catch (err) {
      next(err);
    }
  };

  updateSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const supplier = await suppliersService.updateSupplier(id, req.body);
      res.status(200).json(ApiResponse.success(supplier, 'Supplier updated successfully'));
    } catch (err) {
      next(err);
    }
  };

  deleteSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const supplier = await suppliersService.deleteSupplier(id);
      res.status(200).json(ApiResponse.success(supplier, 'Supplier deactivated successfully'));
    } catch (err) {
      next(err);
    }
  };

  getSupplierProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const products = await suppliersService.getSupplierProducts(id);
      res.status(200).json(ApiResponse.success(products));
    } catch (err) {
      next(err);
    }
  };

  getSupplierOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const orders = await suppliersService.getSupplierOrders(id);
      res.status(200).json(ApiResponse.success(orders));
    } catch (err) {
      next(err);
    }
  };
}

export const suppliersController = new SuppliersController();
export default suppliersController;
