import {Router} from 'express'
import { createCourse, getCourses, getCourseById, deleteCourse, completeWeek, courseProgress } from "../controllers/courseControllers.js";

const router = Router();

router.post("/", createCourse);
router.get("/", getCourses);
router.get("/:id", getCourseById);
router.delete("/:id", deleteCourse);
router.patch("/week/:weekId/complete", completeWeek);
router.get('/progress',courseProgress)
export default router;