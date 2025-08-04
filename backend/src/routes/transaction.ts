import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import verifyToken from '../middleware/auth';
import Transaction from '../models/Transaction';
import Product from '../models/Product';
import TransactionItem from '../models/TransactionItem';
import Class from '../models/Class';
import Section from '../models/Section';
import User from '../models/User';
import sequelize from '../config/database';

const router = express.Router();

// GET recent transactions (last 20)
router.get('/recent', verifyToken, async (req: Request, res: Response) => {
  try {
    const transactions = await Transaction.findAll({
      where: { schoolId: req.schoolId },
      include: [
        {
          model: TransactionItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['name', 'price']
            }
          ]
        },
        {
          model: Class,
          as: 'transactionClass',
          attributes: ['name']
        },
        {
          model: Section,
          as: 'transactionSection',
          attributes: ['name']
        },
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    const formattedTransactions = transactions.map((transaction: any) => {
      const totalAmount = transaction.items.reduce((sum: number, item: any) => {
        return sum + (item.quantity * item.product.price);
      }, 0);

      return {
        id: transaction.id,
        studentName: transaction.studentName,
        className: transaction.transactionClass?.name || transaction.class,
        sectionName: transaction.transactionSection?.name || '',
        modeOfPayment: transaction.modeOfPayment,
        totalAmount: totalAmount,
        soldBy: transaction.user ? `${transaction.user.firstName} ${transaction.user.lastName}` : 'Unknown',
        userId: transaction.userId,
        createdAt: transaction.createdAt,
        transactionItems: transaction.items.map((item: any) => ({
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.price,
          totalPrice: item.quantity * item.product.price
        }))
      };
    });

    res.status(200).json({ success: true, data: formattedTransactions });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' } });
  }
});

// GET all transactions with pagination
router.get('/', verifyToken, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where: { schoolId: req.schoolId },
      include: [
        {
          model: TransactionItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['name', 'price']
            }
          ]
        },
        {
          model: Class,
          as: 'transactionClass',
          attributes: ['name']
        },
        {
          model: Section,
          as: 'transactionSection',
          attributes: ['name']
        },
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const formattedTransactions = transactions.map((transaction: any) => {
      const totalAmount = transaction.items.reduce((sum: number, item: any) => {
        return sum + (item.quantity * item.product.price);
      }, 0);

      return {
        id: transaction.id,
        studentName: transaction.studentName,
        className: transaction.transactionClass?.name || transaction.class,
        sectionName: transaction.transactionSection?.name || '',
        modeOfPayment: transaction.modeOfPayment,
        totalAmount: totalAmount,
        soldBy: transaction.user ? `${transaction.user.firstName} ${transaction.user.lastName}` : 'Unknown',
        userId: transaction.userId,
        createdAt: transaction.createdAt,
        transactionItems: transaction.items.map((item: any) => ({
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.price,
          totalPrice: item.quantity * item.product.price
        }))
      };
    });

    res.status(200).json({ 
      success: true, 
      data: {
        transactions: formattedTransactions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: limit
        }
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' } });
  }
});

router.post(
  '/',
  verifyToken,
  [
    check('studentsName', 'Student name is required').isString(),
    check('classId', 'Class ID is required').isInt(),
    check('sectionId', 'Section ID is required').isInt(),
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
      const { studentsName, classId, sectionId, modeOfPayment, products } = req.body;

      // Verify class and section exist and belong to the school
      const classInstance = await Class.findOne({
        where: { id: classId, schoolId: req.schoolId },
        transaction: t
      });

      if (!classInstance) {
        await t.rollback();
        return res.status(404).json({ success: false, error: { code: 'CLASS_NOT_FOUND', message: 'Class not found' } });
      }

      const sectionInstance = await Section.findOne({
        where: { id: sectionId, classId: classId, schoolId: req.schoolId },
        transaction: t
      });

      if (!sectionInstance) {
        await t.rollback();
        return res.status(404).json({ success: false, error: { code: 'SECTION_NOT_FOUND', message: 'Section not found' } });
      }

      const transaction = await Transaction.create(
        {
          studentName: studentsName,
          class: (classInstance as any).name, // Keep the class name for backward compatibility
          classId: classId,
          sectionId: sectionId,
          modeOfPayment,
          userId: req.userId,
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
