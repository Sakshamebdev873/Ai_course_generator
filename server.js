import generateCourse from "./libs/generateCourse.js";
import * as dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import courseRouter from './routes/courseRouter.js'
// Load environment variables
dotenv.config();
const app = express();

app.use(express.json())
app.use(morgan('dev'))


app.use('/api/v1',courseRouter)













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

