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

export const getSchoolById = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if(isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid Id'})
    }
    if(!id) {
        return res.status(500).json({ success: false, message: 'Id is required'})
    }

    try {
        const school = await School.findByPk(id);
        if(!school){
            return res.status(500).json({success: false, message: 'School not found'});
        }
        return res.status(200).json({success: true, data: school})
    } catch (error) {
        console.log('Error fetching school', error)
        return {success: false, message: 'An error occurred while fetching the school'}
    }

}