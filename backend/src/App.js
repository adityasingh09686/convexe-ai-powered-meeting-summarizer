import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import dotenv from "dotenv";
import { dbConnect } from "./config/database.js";

dotenv.config();

import cors from "cors";
import { connectToSocket } from "./controllers/socketManager.js";
import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);



app.set("port", process.env.PORT || 8000)
app.use(cors())
app.use(express.json({ limit: "40kb" }))
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);




const start = async () => {
    dbConnect();
    server.listen(app.get("port"), () => {
        console.log(`Server Started on port ${app.get("port")}`)
    })
}

start();










