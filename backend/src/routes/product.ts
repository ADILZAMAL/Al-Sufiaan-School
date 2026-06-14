import express, {Request, Response} from 'express'
import verifyToken, { requireRole } from '../middleware/auth'
import Product from '../models/Product'
import StockIn from '../models/StockIn'
import User from '../models/User'
import {check, validationResult} from 'express-validator'
import { Op } from 'sequelize'
import logger from '../utils/logger'

const router = express.Router()

router.post("/", verifyToken, requireRole(['SUPER_ADMIN']), [
    check("name", "Product Name is required").isString(),
    check("qty", "Quantity is required"). isNumeric(),
    check("price", "Price is required").isDecimal(),
], async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({success: false, error: {code: 'INVALID_INPUT', message: errors.array() }});
    }
    try {
        let {name, qty, price } = req.body
        let product = await Product.create({name, price, qty, buyPrice: price, schoolId: req.schoolId});
        res.status(200).json({success: true})
    } catch (error) {
        logger.error('Error creating product', { error });
        res.status(500).json({success: false, error: {code: 'INTERNAL_SERVER_ERROR', message: "Someting went wrong"}})
    }
}
)

router.get("/", verifyToken,async (req: Request, res: Response) => {
    try {
        const where: any = {
            schoolId: req.schoolId,
        }
        if (req.query.includeOutOfStock !== 'true') {
            where.qty = { [Op.gt]: 0 }
        }
        let products = await Product.findAll({ where })
        res.status(200).send({success: true, data: products})
    } catch (error) {
        logger.error('Error fetching products', { error })
        res.status(500).json({success: false, error: {code: 'INTERNAL_SERVER_ERROR', message: "Someting went wrong"}})
    }
})

// POST add stock to an existing product
router.post('/stock-in', verifyToken, requireRole(['SUPER_ADMIN']), [
    check('productId', 'Product ID is required').isInt(),
    check('quantity', 'Quantity is required').isInt({ gt: 0 }),
    check('note', 'Note must be a string').optional().isString(),
], async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: errors.array() } })
    }

    const t = await Product.sequelize!.transaction()

    try {
        const { productId, quantity, note } = req.body

        const product = await Product.findOne({
            where: { id: productId, schoolId: req.schoolId },
            transaction: t
        })

        if (!product) {
            await t.rollback()
            return res.status(404).json({ success: false, error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' } })
        }

        product.qty += parseInt(quantity)
        await product.save({ transaction: t })

        await StockIn.create({
            productId,
            quantity,
            note: note || null,
            userId: req.userId,
            schoolId: req.schoolId,
        }, { transaction: t })

        await t.commit()
        res.status(200).json({ success: true, message: 'Stock added successfully' })
    } catch (error) {
        await t.rollback()
        logger.error('Error adding stock', { error })
        res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' } })
    }
})

// GET stock-in history
router.get('/stock-in', verifyToken, async (req: Request, res: Response) => {
    try {
        const { productId } = req.query
        const where: any = { schoolId: req.schoolId }

        if (productId) {
            where.productId = parseInt(productId as string)
        }

        const stockIns = await StockIn.findAll({
            where,
            include: [
                {
                    model: Product,
                    as: 'product',
                    attributes: ['name']
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['firstName', 'lastName']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: 50
        })

        const formatted = stockIns.map((si: any) => ({
            id: si.id,
            productId: si.productId,
            productName: si.product?.name || 'Unknown',
            quantity: si.quantity,
            note: si.note,
            addedBy: si.user ? `${si.user.firstName} ${si.user.lastName}` : 'Unknown',
            createdAt: si.createdAt,
        }))

        res.status(200).json({ success: true, data: formatted })
    } catch (error) {
        logger.error('Error fetching stock-ins', { error })
        res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' } })
    }
})

export default router
