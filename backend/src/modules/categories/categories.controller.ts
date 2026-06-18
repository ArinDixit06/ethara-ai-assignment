import { Request, Response, NextFunction } from 'express';
import { categoriesService } from './categories.service';
import { ApiResponse } from '../../utils/ApiResponse';

export class CategoriesController {
  getAllCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await categoriesService.getAllCategories();
      res.status(200).json(ApiResponse.success(categories));
    } catch (err) {
      next(err);
    }
  };

  createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await categoriesService.createCategory(req.body);
      res.status(201).json(ApiResponse.success(category, 'Category created successfully'));
    } catch (err) {
      next(err);
    }
  };

  updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const category = await categoriesService.updateCategory(id, req.body);
      res.status(200).json(ApiResponse.success(category, 'Category updated successfully'));
    } catch (err) {
      next(err);
    }
  };

  deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const category = await categoriesService.deleteCategory(id);
      res.status(200).json(ApiResponse.success(category, 'Category deleted successfully'));
    } catch (err) {
      next(err);
    }
  };
}

export const categoriesController = new CategoriesController();
export default categoriesController;
