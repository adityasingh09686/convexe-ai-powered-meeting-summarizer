import mongoose from "mongoose";
import "dotenv/config";

export const dbConnect = () => {
    mongoose.connect(process.env.DATABASE_URL)
        .then(() => {
            console.log("DB connection is Successfull")
        })
        .catch((err) => {
            console.error(err)
            process.exit(1)
        })
}