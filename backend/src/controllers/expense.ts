import { Request, Response } from 'express';
import { validationResult } from 'express-validator'
import Expense from '../models/Expense';
import User from '../models/User';

export const addExpense = async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({success: false, message: errors.array()})
    }
    try {
        const expense = await Expense.create({...req.body, userId: req.userId, schoolId: req.schoolId})
        res.status(201).json({success: true, data: expense})
    } catch (error) {
        console.log('Something went wrong', error)
        res.status(500).send({success: false, message: 'Something went wrong'})
    }
}

export const fetchExpense = async (req: Request, res: Response) => {
    try{
      const result = await Expense.findAll({
        where: {schoolId: req.schoolId},
        include: [{
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName']
        }]
      })
      return res.status(200).send({success: true, data: result})
    } catch (error) {
        console.log('Something went wrong', error)
        res.status(500).send({success: false, message: 'Something went wrong'})
    }
}
