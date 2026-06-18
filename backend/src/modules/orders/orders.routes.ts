import { Router } from 'express';
import { ordersController } from './orders.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createOrderSchema, updateOrderSchema } from './orders.schema';

const router = Router();

// All order endpoints require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management (Purchase and Sales)
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: List all orders (Paginated)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [PURCHASE, SALES]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, CONFIRMED, SHIPPED, RECEIVED, FULFILLED, CANCELLED]
 *       - in: query
 *         name: supplierId
 *         schema:
 *           type: string
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
 *         description: Paginated list of orders
 *       401:
 *         description: Unauthorized
 */
router.get('/', ordersController.getAllOrders);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order (Purchase or Sales)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - lineItems
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [PURCHASE, SALES]
 *                 example: PURCHASE
 *               supplierId:
 *                 type: string
 *                 format: uuid
 *                 description: Required for PURCHASE orders
 *                 example: Tata Motors Ltd UUID
 *               customerName:
 *                 type: string
 *                 description: Optional, used for SALES orders
 *               customerContact:
 *                 type: string
 *                 description: Optional, used for SALES orders
 *               expectedDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-06-01T00:00:00.000Z
 *               notes:
 *                 type: string
 *                 example: Urgent stock reorder
 *               lineItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                     - unitPrice
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: integer
 *                       example: 100
 *                     unitPrice:
 *                       type: number
 *                       example: 250.00
 *     responses:
 *       201:
 *         description: Order created successfully (DRAFT status)
 *       400:
 *         description: Bad Request (missing supplier for purchase, invalid items)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin or Manager only)
 *       422:
 *         description: Validation failed
 */
router.post('/', authorize('ADMIN', 'MANAGER'), validate(createOrderSchema), ordersController.createOrder);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order details by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details with line items and status history
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.get('/:id', ordersController.getOrderById);

/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     summary: Update an existing order (only if DRAFT)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               supplierId:
 *                 type: string
 *                 format: uuid
 *               customerName:
 *                 type: string
 *               customerContact:
 *                 type: string
 *               expectedDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *               lineItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: integer
 *                     unitPrice:
 *                       type: number
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       400:
 *         description: Cannot update non-draft orders
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin or Manager only)
 *       404:
 *         description: Order not found
 *       422:
 *         description: Validation failed
 */
router.put('/:id', authorize('ADMIN', 'MANAGER'), validate(updateOrderSchema), ordersController.updateOrder);

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Delete a DRAFT order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       400:
 *         description: Only DRAFT orders can be deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Order not found
 */
router.delete('/:id', authorize('ADMIN'), ordersController.deleteOrder);

/**
 * @swagger
 * /api/orders/{id}/confirm:
 *   post:
 *     summary: Confirm order (transitions from DRAFT to CONFIRMED)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order confirmed
 *       400:
 *         description: Invalid status transition
 */
router.post('/:id/confirm', authorize('ADMIN', 'MANAGER'), ordersController.confirmOrder);

/**
 * @swagger
 * /api/orders/{id}/ship:
 *   post:
 *     summary: Mark purchase order as shipped (transitions from CONFIRMED to SHIPPED)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order shipped
 *       400:
 *         description: Invalid status transition or order is not a PURCHASE order
 */
router.post('/:id/ship', authorize('ADMIN', 'MANAGER'), ordersController.shipOrder);

/**
 * @swagger
 * /api/orders/{id}/receive:
 *   post:
 *     summary: Mark purchase order as received (transitions to RECEIVED, triggers INBOUND stock movements)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order received, stock levels updated
 *       400:
 *         description: Invalid status transition or order is not a PURCHASE order
 */
router.post('/:id/receive', authorize('ADMIN', 'MANAGER'), ordersController.receiveOrder);

/**
 * @swagger
 * /api/orders/{id}/pack:
 *   post:
 *     summary: Mark sales order as packed
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order marked packed
 *       400:
 *         description: Invalid status transition or order is not a SALES order
 */
router.post('/:id/pack', authorize('ADMIN', 'MANAGER'), ordersController.packOrder);

/**
 * @swagger
 * /api/orders/{id}/dispatch:
 *   post:
 *     summary: Mark sales order as dispatched (transitions to SHIPPED)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order dispatched
 *       400:
 *         description: Invalid status transition or order is not a SALES order
 */
router.post('/:id/dispatch', authorize('ADMIN', 'MANAGER'), ordersController.dispatchOrder);

/**
 * @swagger
 * /api/orders/{id}/fulfill:
 *   post:
 *     summary: Fulfill sales order (transitions to FULFILLED, triggers OUTBOUND stock movements, checks stock level)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order fulfilled, stock levels deducted
 *       400:
 *         description: Insufficient stock or invalid status transition
 */
router.post('/:id/fulfill', authorize('ADMIN', 'MANAGER'), ordersController.fulfillOrder);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   post:
 *     summary: Cancel order (transitions to CANCELLED)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order cancelled
 *       400:
 *         description: Cannot cancel fulfilled or received orders
 */
router.post('/:id/cancel', authorize('ADMIN', 'MANAGER'), ordersController.cancelOrder);

export default router;
