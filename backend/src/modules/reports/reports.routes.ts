import { Router } from 'express';
import { reportsController } from './reports.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';

const router = Router();

// All report endpoints require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Analytical reports and dashboard statistics
 */

/**
 * @swagger
 * /api/reports/inventory-valuation:
 *   get:
 *     summary: Product-level inventory valuation breakdown
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product valuation list and total valuation sum
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin or Manager only)
 */
router.get('/inventory-valuation', authorize('ADMIN', 'MANAGER'), reportsController.getInventoryValuation);

/**
 * @swagger
 * /api/reports/stock-movements:
 *   get:
 *     summary: Movement summaries with metrics (total, inbound, outbound, adjustment counts)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INBOUND, OUTBOUND, ADJUSTMENT]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Stock movements log list and aggregations
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin or Manager only)
 */
router.get('/stock-movements', authorize('ADMIN', 'MANAGER'), reportsController.getStockMovements);

/**
 * @swagger
 * /api/reports/low-stock:
 *   get:
 *     summary: Get low stock alert products
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of low-stock products
 *       401:
 *         description: Unauthorized
 */
router.get('/low-stock', reportsController.getLowStock);

/**
 * @swagger
 * /api/reports/order-summary:
 *   get:
 *     summary: Orders grouped by status and total spends by suppliers
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary metrics of orders and supplier spends
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin or Manager only)
 */
router.get('/order-summary', authorize('ADMIN', 'MANAGER'), reportsController.getOrderSummary);

/**
 * @swagger
 * /api/reports/dashboard-stats:
 *   get:
 *     summary: Key metrics for dashboard display (products counts, low stock indicators, 7-day movement graphs, category-level values)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comprehensive dashboard statistics
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard-stats', reportsController.getDashboardStats);

export default router;
