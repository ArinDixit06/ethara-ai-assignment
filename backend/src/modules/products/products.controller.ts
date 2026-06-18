import { Request, Response, NextFunction } from 'express';
import { productsService } from './products.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';

export class ProductsController {
  getAllProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await productsService.getAllProducts(req.query as any);
      res.status(200).json(ApiResponse.success(result.data, 'Products retrieved successfully', result.meta));
    } catch (err) {
      next(err);
    }
  };

  getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const product = await productsService.getProductById(id);
      res.status(200).json(ApiResponse.success(product));
    } catch (err) {
      next(err);
    }
  };

  createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const product = await productsService.createProduct(req.body, userId);
      res.status(201).json(ApiResponse.success(product, 'Product created successfully'));
    } catch (err) {
      next(err);
    }
  };

  updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const product = await productsService.updateProduct(id, req.body);
      res.status(200).json(ApiResponse.success(product, 'Product updated successfully'));
    } catch (err) {
      next(err);
    }
  };

  deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const product = await productsService.deleteProduct(id);
      res.status(200).json(ApiResponse.success(product, 'Product deactivated successfully'));
    } catch (err) {
      next(err);
    }
  };

  uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!req.file) {
        throw new ApiError(400, 'Please upload an image file');
      }

      // Generate local relative path
      const imageUrl = `/uploads/${req.file.filename}`;
      const product = await productsService.uploadImage(id, imageUrl);

      res.status(200).json(ApiResponse.success(product, 'Image uploaded successfully'));
    } catch (err) {
      next(err);
    }
  };

  exportCSV = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const csv = await productsService.exportProductsCSV();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  };
}

export const productsController = new ProductsController();
export default productsController;
