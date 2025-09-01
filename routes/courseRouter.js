import {Router} from 'express'
import { createCourse, getCourse, getCourseById, deleteCourse, completedWeek, courseProgress } from "../controllers/courseControllers.js";

const router = Router();

router.post("/", createCourse);
router.get('/progress',courseProgress)
router.get("/", getCourse);
router.get("/:id", getCourseById);
router.delete("/:id", deleteCourse);
router.patch("/week/:weekId/complete", completedWeek);
export default router;