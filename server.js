import generateCourse from "./libs/generateCourse.js";
import * as dotenv from "dotenv";
import express from "express";
// Load environment variables
dotenv.config();
const app = express()(
  // Example usage
  async () => {
    const topic = "Python Programming";
    const weeks = 12;
    const difficulty = "Beginner";

    console.log(
      `Generating a ${weeks}-week ${difficulty} course on "${topic}"...`
    );
    const course = await generateCourse(topic, weeks, difficulty);

    if (course.error) {
      console.error("Course generation failed:", course.error);
    } else {
      console.log("\nGenerated Course:");
      console.log(JSON.stringify(course, null, 2));
    }
  }
)();
const port = process.env.PORT || 5000;
const start = () => {
  try {
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}....`);
    });
  } catch (error) {
    console.log(error);
  }
};
start();
