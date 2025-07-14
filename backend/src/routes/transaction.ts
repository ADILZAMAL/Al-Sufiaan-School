import expres, {Request, Response} from 'express'
import verifyToken from '../middleware/auth'
import {check, validationResult} from 'express-validator'
import Product from '../models/Product'
import sequelize from '../config/database'
import Transaction from '../models/Transaction'
import {ExpenseCateogy} from '../models/Expense'

const router = expres()

interface ProductT {
    productId: number;
    qty: number
}

router.post("/", [
    check("class", "Class is Required").isString(),
    check("discount", "Discount is Required"),
    check("products", "Products is Required").isArray(),
    check("paymentMode", "Mode of Payment is Required").isString(),
    check("parentName", "Parent's Name is Required").isString(),
    check("section", "Section is Required").isString(),
    check("studentName", "Student's Name is Required").isString()
],
 verifyToken, async(req: Request, res: Response) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({success: false, error: {code: 'INVALID_INPUT', message: errors.array() }});
    }
    //Start a transaction
    const transaction = await sequelize.transaction()
    try {
        let {discount, studentName, parentName, section, paymentMode} = req.body
        if(req.body.products.length < 1){
            return res.status(400).json({success: false, error: {code: 'INVALID_INPUT', message: "Invalid products"}})
        }
        // Check for valid productIds in req.body
        let productIds = req.body.products.reduce((acc: [Number], p: ProductT) => [...acc, p.productId], [])
        console.log(productIds)
        let products = await Product.findAll({where: {id: productIds}})
        if(productIds.length !== products.length)
            return res.status(400).json({success: false, error: {code: 'INVALID_INPUT', message: "Invalid products"}})

        //check for valid qty
        let validQty = true;
        let totalAmount = 0;
        for(let i = 0; i < req.body.products.length; i++){
            let pid = req.body.products[i].productId
            let qty = req.body.products[i].qty

            for(let k = 0; k < products.length; k++){
                if(pid === products[k].id){
                    totalAmount += qty * products[k].price
                }

                if(pid === products[k].id && products[k].qty < qty){
                    validQty=false;
                    break;
                }
            }
        }
        console.log(totalAmount)
        if(!validQty)
        return res.status(400).json({success: false, error: {code: 'INVALID_INPUT', message: "Invalid qty"}})
        //insert into txn table
        const txn = await Transaction.create({totalAmount, discount, studentName, parentName, status: 'SUCCESS', paymentMode, schoolId: req.schoolId, class: req.body.class, section, userId: req.userId})
        transaction.commit()
        //insert into txn-item table
        //update qty of product table
        //commit 

        console.log(products)
        res.status(200).json({success: true})
    } catch (error) {
        await transaction.rollback()
        console.log(error);
        res.status(500).json({success: false, error: {code: 'INTERNAL_SERVER_ERROR', message: "Someting went wrong"}})
    }

})

export default router