import jwt from 'jsonwebtoken'
import { PrismaClient } from '../generated/prisma/client';



const prisma = new PrismaClient()
export async function authMiddleware(req,res,next){
    const token = req.headers.authorization?.spilt(" ")[1];
    if(!token){
        return res.status(401).json({error : "No token provided"})
    }
    try {
        const decoded = jwt.verify(token,process.env.JWT_SECRET)
        const blacklisted = await prisma.blacklisted
    } catch (error) {
        
    }
}