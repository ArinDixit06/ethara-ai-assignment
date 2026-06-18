import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { stockAdjustmentSchema } from './inventory.schema';

const router = Router();

// All inventory endpoints require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Stock and movement management
 */

/**
 * @swagger
 * /api/inventory/valuation:
 *   get:
 *     summary: Get total inventory valuation (stock * cost)
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total valuation details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin or Manager only)
 */
router.get('/valuation', authorize('ADMIN', 'MANAGER'), inventoryController.getValuation);

/**
 * @swagger
 * /api/inventory/low-stock:
 *   get:
 *     summary: Get list of products below reorder threshold
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of low-stock products
 *       401:
 *         description: Unauthorized
 */
router.get('/low-stock', inventoryController.getLowStock);

/**
 * @swagger
 * /api/inventory/movements/export/csv:
 *   get:
 *     summary: Export stock movements as CSV
 *     tags: [Inventory]
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
 *         description: CSV file download containing movements
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin or Manager only)
 */
router.get('/movements/export/csv', authorize('ADMIN', 'MANAGER'), inventoryController.exportMovementsCSV);

/**
 * @swagger
 * /api/inventory/movements:
 *   get:
 *     summary: Get stock movement history (Paginated)
 *     tags: [Inventory]
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
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Paginated list of movements
 *       401:
 *         description: Unauthorized
 */
router.get('/movements', inventoryController.getMovements);

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     summary: Get current inventory stock levels per product (Paginated)
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search products by name or SKU
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           description: Filter by category ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated current stock levels
 *       401:
 *         description: Unauthorized
 */
router.get('/', inventoryController.getInventory);

/**
 * @swagger
 * /api/inventory/adjust:
 *   post:
 *     summary: Manually adjust stock of a product
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - type
 *               - quantity
 *               - reason
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 example: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
 *               type:
 *                 type: string
 *                 enum: [ADD, REMOVE, SET]
 *                 example: ADD
 *               quantity:
 *                 type: integer
 *                 example: 50
 *               reason:
 *                 type: string
 *                 example: Manual recount adjustment
 *               notes:
 *                 type: string
 *                 example: Recounting after annual audit
 *     responses:
 *       200:
 *         description: Stock adjusted successfully
 *       400:
 *         description: Insufficient stock or negative count values
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin or Manager only)
 *       422:
 *         description: Validation failed
 */
router.post('/adjust', authorize('ADMIN'), validate(stockAdjustmentSchema), inventoryController.adjustStock);

export default router;
