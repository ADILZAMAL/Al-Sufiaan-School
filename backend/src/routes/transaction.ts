import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import verifyToken from '../middleware/auth';
import Transaction from '../models/Transaction';
import Product from '../models/Product';
import TransactionItem from '../models/TransactionItem';
import sequelize from '../config/database';

const router = express.Router();

router.post(
  '/',
  verifyToken,
  [
    check('studentsName', 'Student name is required').isString(),
    check('class', 'Class is required').isString(),
    check('modeOfPayment', 'Mode of payment is required').isString(),
    check('products', 'Products are required').isArray(),
    check('products.*.productId', 'Product ID is required').isInt(),
    check('products.*.qty', 'Quantity is required').isInt({ gt: 0 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: errors.array() } });
    }

    const t = await sequelize.transaction();

    try {
      const { studentsName, class: className, modeOfPayment, products } = req.body;

      const transaction = await Transaction.create(
        {
          studentName: studentsName,
          class: className,
          modeOfPayment,
          schoolId: req.schoolId,
        },
        { transaction: t }
      );

      for (const product of products) {
        const { productId, qty } = product;
        const productInstance = await Product.findByPk(productId, { transaction: t });

        if (!productInstance) {
          await t.rollback();
          return res.status(404).json({ success: false, error: { code: 'PRODUCT_NOT_FOUND', message: `Product with id ${productId} not found` } });
        }

        if (productInstance.qty < qty) {
          await t.rollback();
          return res.status(400).json({ success: false, error: { code: 'INSUFFICIENT_STOCK', message: `Insufficient stock for product ${productInstance.name}` } });
        }

        await TransactionItem.create(
          {
            transactionId: transaction.id,
            productId,
            quantity: qty,
          },
          { transaction: t }
        );
        productInstance.qty -= qty;
        await productInstance.save({ transaction: t });
      }

      await t.commit();
      res.status(201).json({ success: true, data: {} });
    } catch (error) {
      await t.rollback();
      console.log(error);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' } });
    }
  }
);

export default router;
