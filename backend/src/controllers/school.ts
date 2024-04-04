import { Request, Response } from 'express';
import School from '../models/School';
import { validationResult } from 'express-validator'


export const onboardSchool = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array() });
    }
    try {
        // const { name, address, mobile, udiceCode, email, street, city, district, state, pinCode } = req.body
        const school = await School.create(req.body);
        res.status(201).json(school)
    } catch (error) {
        console.log(error)
        res.status(400).send({ message: 'Something went wrong' })
    }
}