import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { ApiResponse } from '../../utils/ApiResponse';

export class AuthController {
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await authService.register(req.body);
      res.status(201).json(ApiResponse.success(user, 'Registration successful'));
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.login(req.body);
      res.status(200).json(ApiResponse.success(result, 'Login successful'));
    } catch (err) {
      next(err);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const profile = await authService.getProfile(userId);
      res.status(200).json(ApiResponse.success(profile));
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : '';
      const result = await authService.logout(token);
      res.status(200).json(ApiResponse.success(result, 'Logout successful'));
    } catch (err) {
      next(err);
    }
  };
}

export const authController = new AuthController();
export default authController;
