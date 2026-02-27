import express, {Request, Response} from 'express'
import verifyToken, { requireRole } from '../middleware/auth'
import Product from '../models/Product'
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
        let products = await Product.findAll({
            where: {
                schoolId: req.schoolId,
                qty: {
                    [Op.gt]: 0
                }
            }
        })
        res.status(200).send({success: true, data: products})
    } catch (error) {
        logger.error('Error fetching products', { error })
        res.status(500).json({success: false, error: {code: 'INTERNAL_SERVER_ERROR', message: "Someting went wrong"}})
    }
})

export default router
