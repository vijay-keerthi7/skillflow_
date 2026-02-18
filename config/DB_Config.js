import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();


export const DB_Connection=async()=>{
    mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to SkillFlow Database ✅"))
    .catch((err) => console.error("DB Connection Error: ", err));
};