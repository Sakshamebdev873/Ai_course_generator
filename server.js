import * as dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import courseRouter from "./routes/courseRouter.js";
import authRouter from "./routes/authRouter.js";
import authMiddleware from './middleware/authMiddleware.js'
// Load environment variables
dotenv.config();
const app = express();

app.use(express.json());
app.use(morgan("dev"));

app.use("/api/v1", authRouter);
app.use("/api/v1",authMiddleware,courseRouter);

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
