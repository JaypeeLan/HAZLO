import express from "express";
import cors from "cors";
import helmet from "helmet";
import { ENV } from "../config/ENV";
import connectDB from "./db";
import logger from "../middlewares/logger";

const app = express();

app.use(cors());
app.use(helmet());
app.use(logger)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/", (req, res) => {
    res.send("Hello World")
})



const PORT = ENV.PORT || 3000;
connectDB()


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})