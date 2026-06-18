import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { ApiResponse } from '../../utils/ApiResponse';

export class UsersController {
  getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await usersService.getAllUsers(req.query);
      res.status(200).json(ApiResponse.success(result.data, 'Users retrieved successfully', result.meta));
    } catch (err) {
      next(err);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await usersService.getUserById(id);
      res.status(200).json(ApiResponse.success(user));
    } catch (err) {
      next(err);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await usersService.updateUser(id, req.body);
      res.status(200).json(ApiResponse.success(user, 'User updated successfully'));
    } catch (err) {
      next(err);
    }
  };

  deactivateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await usersService.deactivateUser(id);
      res.status(200).json(ApiResponse.success(user, 'User deactivated successfully'));
    } catch (err) {
      next(err);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUserId = req.user!.id;
      const currentUserRole = req.user!.role;
      const result = await usersService.changePassword(id, req.body, currentUserId, currentUserRole);
      res.status(200).json(ApiResponse.success(result));
    } catch (err) {
      next(err);
    }
  };
}

export const usersController = new UsersController();
export default usersController;
