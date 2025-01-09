import express, {Request, Response} from 'express';
import verifyToken from '../middleware/auth'
import Class from '../models/Class';
import {check, validationResult} from 'express-validator'
import Section from '../models/Section';


// INVALID_INPUT: Indicates that the input data provided in the request is invalid or missing.
// NOT_FOUND: Indicates that the requested resource was not found.
// UNAUTHORIZED: Indicates that the request is unauthorized and requires authentication.
// FORBIDDEN: Indicates that the request is forbidden due to insufficient permissions.
// INTERNAL_SERVER_ERROR: Indicates that an unexpected server error occurred.

const router = express.Router();

router.get("/", verifyToken,  async(req: Request, res: Response) => {
    try{
        const classes = await Class.findAll({
            where: {
                schoolId: req.schoolId
            },
            include: Section
        })
        res.status(200).send({success: true, data: classes})
    } catch (error) {
        console.log(error)
        res.status(500).send({success: false, error: {code: 'INTERNAL_SERVER_ERROR', message: "Someting went wrong"}})
    }
    const classes = await Class.findAll({
        where:{
            schoolId: req.schoolId
        }
    })


    
})

router.post("/", verifyToken, 
[
    check("name", "Class Name is required")
],
 async(req: Request, res: Response) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({success: false, error: {code: 'INVALID_INPUT', message: errors.array() }});
    }
    try {
        let classRecord = await Class.findOne({
            where: {
                name: req.body.name,
                schoolId: req.schoolId
            }
        });
        
        if(classRecord){
            return res.status(400).json({success: false, error: {code: 'INVALID_INPUT',  message: "Duplicate class is not allowed"}})
        }

        classRecord = await Class.create({name: req.body.name, schoolId: req.schoolId});
        res.status(200).json({success: true})
    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, error: {code: 'INTERNAL_SERVER_ERROR', message: "Someting went wrong"}})
    }

})

export default router;
