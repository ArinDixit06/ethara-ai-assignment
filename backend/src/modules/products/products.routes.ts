import { Router } from 'express';
import { productsController } from './products.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { upload } from '../../middleware/upload.middleware';
import { createProductSchema, updateProductSchema } from './products.schema';

const router = Router();

// All product routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: List products with pagination and filters
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product name or SKU
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter active/inactive products
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *         description: Filter products below reorder threshold
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
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
 *         description: Paginated list of products
 *       401:
 *         description: Unauthorized
 */
router.get('/', productsController.getAllProducts);

/**
 * @swagger
 * /api/products/export/csv:
 *   get:
 *     summary: Export all products as CSV
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file download containing all products
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin or Manager only)
 */
router.get('/export/csv', authorize('ADMIN', 'MANAGER'), productsController.exportCSV);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
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
 *               - unitPrice
 *               - costPrice
 *             properties:
 *               name:
 *                 type: string
 *                 example: iPhone 15 Pro
 *               sku:
 *                 type: string
 *                 example: ELE-IPH15-001
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               description:
 *                 type: string
 *               unitPrice:
 *                 type: number
 *                 example: 999.99
 *               costPrice:
 *                 type: number
 *                 example: 600.00
 *               unitOfMeasure:
 *                 type: string
 *                 default: pcs
 *               reorderThreshold:
 *                 type: integer
 *                 default: 10
 *               currentStock:
 *                 type: integer
 *                 default: 0
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               supplierIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       201:
 *         description: Product created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin or Manager only)
 *       409:
 *         description: SKU already exists
 *       422:
 *         description: Validation failed
 */
router.post('/', authorize('ADMIN', 'MANAGER'), validate(createProductSchema), productsController.createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product details by ID
 *     tags: [Products]
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
 *         description: Product details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */
router.get('/:id', productsController.getProductById);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product details
 *     tags: [Products]
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
 *               sku:
 *                 type: string
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               description:
 *                 type: string
 *               unitPrice:
 *                 type: number
 *               costPrice:
 *                 type: number
 *               unitOfMeasure:
 *                 type: string
 *               reorderThreshold:
 *                 type: integer
 *               currentStock:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *               supplierIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin or Manager only)
 *       404:
 *         description: Product not found
 *       409:
 *         description: SKU already exists
 *       422:
 *         description: Validation failed
 */
router.put('/:id', authorize('ADMIN', 'MANAGER'), validate(updateProductSchema), productsController.updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Soft delete a product
 *     tags: [Products]
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
 *         description: Product soft-deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Product not found
 */
router.delete('/:id', authorize('ADMIN'), productsController.deleteProduct);

/**
 * @swagger
 * /api/products/{id}/image:
 *   post:
 *     summary: Upload product image
 *     tags: [Products]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: Missing image or invalid file type
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin or Manager only)
 *       404:
 *         description: Product not found
 */
router.post('/:id/image', authorize('ADMIN', 'MANAGER'), upload.single('image'), productsController.uploadImage);

export default router;
