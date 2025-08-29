import generateCourse from "../libs/generateCourse.js";



const courseGeneration = async (req,res) => {
  try {
    const { topic, weeks, difficulty } = req.body;
    const result = await generateCourse(topic, weeks, difficulty);
    if(!result){
      return res.status(400).json({msg :"Some fields are missing..."})
    }
    return res.status(200).json({ results: result });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Internal Server Error....." });
  }

}
export default courseGeneration