import {Request, Response} from 'express';
import {validationResult} from 'express-validator'
import School from '../models/School';
import User from '../models/User';
import bcrypt from 'bcryptjs';

export const registerNewUser = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).send({message: errors.array()});
    }
    try {
        const school = await School.findOne({
            where: {
                sid: req.body.sid
            }
        })
        console.log("School", school?.toJSON())
        if(!school){
            return res.status(400).send({message: "Invalid Sid"});
        }
        let user = await User.findOne({
            where: {
                email: req.body.email
            }
        })
        if(user){
            return res.status(400).send({message: "User already exists"});
        }
        user = await User.create({...req.body, schoolId: school.id, password: await bcrypt.hash(req.body.password, 8)})
        return res.status(200).send({message: "User registered OK"})

    } catch (error) {
        console.log(error);
        return res.status(500).send({message: "Something went wrong"})
    }
}