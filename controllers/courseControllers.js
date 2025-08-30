import { PrismaClient } from "../generated/prisma/client.js";
import generateCourse from "../libs/generateCourse.js";

const prisma = new PrismaClient();

export const createCourse = async (req, res) => {
  try {
    const { topic, weeks, difficulty } = req.body;
    if (!topic || !weeks || !difficulty) {
      return res.status(400).json({ error: "Missing Fields" });
    }
    const generated = await generateCourse(topic, weeks, difficulty);
    const course = await prisma.course.create({
      data: {
        topic,
        weeks,
        difficulty,
        userId: req.user.id,
        weeksData: {
          create: generated.map((w) => ({
            weekNumber: w.week,
            topic: w.topic,
            description: w.description,
            exercise: e.exercise,
          })),
        },
      },
      include: { weeksData: true },
    });
    res.status(201).json({ message: "Course created", course });
  } catch (error) {
    console.error(error);
    res.status(500), json({ error: "Failed to create course" });
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
    const week = await prisma.week.update({
      where: { id: parseInt(weekId) },
      data: { isCompleted: true },
    });
    res.status(200).json({ message: "Week marked as completed", week });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update week" });
  }
};

export const courseProgress = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      where: { userId: req.user.id },
      include: { weeksData: true },
    });
    const courseWithProgress = courses.map((course) => {
      const total = course.weeksData.length;
      const completed = course.weeksData.filter((w) => w.isCompleted).length;
      const progress = total > 0 ? (completed / total) * 100 : 0;

      return { ...course, progress };
    });
    res.status(201).json(courseWithProgress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
};
