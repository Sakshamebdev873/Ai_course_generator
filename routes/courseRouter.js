import {Router} from 'express'
import courseGeneration from '../controllers/courseControllers.js'


const router = Router()
router.post("/generate", courseGeneration);
export default router