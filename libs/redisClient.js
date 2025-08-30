import { createClient } from "redis";

const redisClient = createClient({
  url: "redis://localhost:5432",
});
redisClient.on("error", (error) => console.error("Redis Error : ", error));
await redisClient.connect();
export default redisClient;
