import { PrismaClient } from "../generated/prisma/client.js";
import generateCourse from "../libs/generateCourse.js";

const prisma = new PrismaClient();

export const createCourse = async (req, res) => {
  try {
    let { topic, weeks, difficulty } = req.body;
    if (!topic || !weeks || !difficulty) {
      return res.status(400).json({ error: "Missing Fields" });
    }
    weeks = parseInt(weeks, 10);
    if (isNaN(weeks)) {
      return res.status(400).json({ error: "Weeks must be a number" });
    }

    const generated = await generateCourse(topic, weeks, difficulty);
    const course = await prisma.course.create({
      data: {
        topic,
        weeks,
        difficulty,
        userId: req.user.id,
        weeksData: {
          create: generated?.map((w) => ({
            weekNumber: parseInt(w.week),
            topic: w.topic,
            description: w.description,
            exercise: w.exercise,
          })),
        },
      },
      include: { weeksData: true },
    });
    res.status(201).json({ message: "Course created", course });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create course" });
  }
};

export const getCourse = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      where: { userId: req.user.id },
      include: { weeksData: true },
    });
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch courses" });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) },
      include: { weeksData: true },
    });
    if (!course || course.userId !== req.user.id) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.status(200).json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch course" });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) },
    });
    if (!course || course.userId !== req.user.id) {
      return res.status(404).json({ error: "Course not found" });
    }
    await prisma.course.delete({ where: { id: parseInt(id) } });
    res.status(201).json({ message: "Course Deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete course" });
  }
};

export const completedWeek = async (req, res) => {
  try {
    const { weekId } = req.params;

    const week = await prisma.week.findUnique({
      where: { id: parseInt(weekId) },
      include: { course: true }, // 👈 ensure course relation is loaded
    });

    if (!week) {
      return res.status(404).json({ error: "Week not found" });
    }

    // check ownership
    if (week.course.userId !== req.user.id) {
      return res.status(403).json({ error: "Not allowed to update this week" });
    }

    const updatedWeek = await prisma.week.update({
      where: { id: parseInt(weekId) },
      data: { isCompleted: true },
    });

    res.status(200).json({ message: "Week marked as completed", week: updatedWeek });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update week" });
  }
};


export const courseProgress = async (req, res) => {
  try {
    // Make sure req.user.id exists (authMiddleware should run before this)
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
console.log(userId);

    // Fetch all courses for this user, including their weeks
    const courses = await prisma.course.findMany({
      where: { userId : userId },
      include: { weeksData: true },
    });

    // Calculate progress per course
    const coursesWithProgress = courses.map((course) => {
      const totalWeeks = course.weeksData.length;
      const completedWeeks = course.weeksData.filter((w) => w.isCompleted).length;
      const progress = totalWeeks > 0 ? (completedWeeks / totalWeeks) * 100 : 0;

      return {
        id: course.id,
        topic: course.topic,
        difficulty: course.difficulty,
        totalWeeks,
        completedWeeks,
        progress, // percentage
        weeksData: course.weeksData, // optional: send detailed weeks
      };
    });

    res.status(200).json({ courses: coursesWithProgress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch course progress" });
  }
};

