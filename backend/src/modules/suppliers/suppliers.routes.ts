import { Router } from 'express';
import { suppliersController } from './suppliers.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createSupplierSchema, updateSupplierSchema } from './suppliers.schema';

const router = Router();

// Require authentication for all supplier endpoints
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Suppliers
 *   description: Supplier management
 */

/**
 * @swagger
 * /api/suppliers:
 *   get:
 *     summary: List all suppliers (Paginated)
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, contact, or email
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter active/inactive
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
 *         description: Paginated list of suppliers
 *       401:
 *         description: Unauthorized
 */
router.get('/', suppliersController.getAllSuppliers);

/**
 * @swagger
 * /api/suppliers:
 *   post:
 *     summary: Create a new supplier
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Tata Motors Ltd
 *               contactPerson:
 *                 type: string
 *                 example: Ratan Tata
 *               email:
 *                 type: string
 *                 format: email
 *                 example: contact@tata.com
 *               phone:
 *                 type: string
 *                 example: "+912266658282"
 *               address:
 *                 type: string
 *                 example: Mumbai, Maharashtra
 *               paymentTerms:
 *                 type: string
 *                 example: Net 30
 *               notes:
 *                 type: string
 *                 example: Key parts supplier
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Supplier created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin or Manager only)
 *       422:
 *         description: Validation failed
 */
router.post('/', authorize('ADMIN', 'MANAGER'), validate(createSupplierSchema), suppliersController.createSupplier);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   get:
 *     summary: Get supplier details by ID
 *     tags: [Suppliers]
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
 *         description: Supplier details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Supplier not found
 */
router.get('/:id', suppliersController.getSupplierById);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   put:
 *     summary: Update supplier details
 *     tags: [Suppliers]
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
 *               name:
 *                 type: string
 *               contactPerson:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               paymentTerms:
 *                 type: string
 *               notes:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Supplier updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin or Manager only)
 *       404:
 *         description: Supplier not found
 *       422:
 *         description: Validation failed
 */
router.put('/:id', authorize('ADMIN', 'MANAGER'), validate(updateSupplierSchema), suppliersController.updateSupplier);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   delete:
 *     summary: Soft delete a supplier
 *     tags: [Suppliers]
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
 *         description: Supplier soft-deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Supplier not found
 */
router.delete('/:id', authorize('ADMIN'), suppliersController.deleteSupplier);

/**
 * @swagger
 * /api/suppliers/{id}/products:
 *   get:
 *     summary: Get products associated with a supplier
 *     tags: [Suppliers]
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
 *         description: List of associated products
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Supplier not found
 */
router.get('/:id/products', suppliersController.getSupplierProducts);

/**
 * @swagger
 * /api/suppliers/{id}/orders:
 *   get:
 *     summary: Get purchase orders associated with a supplier
 *     tags: [Suppliers]
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
 *         description: List of purchase orders
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Supplier not found
 */
router.get('/:id/orders', suppliersController.getSupplierOrders);

export default router;
