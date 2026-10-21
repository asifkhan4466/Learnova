import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic health check / root route
app.get("/", (req, res) => {
  res.json({ status: "success", message: "Learnova LMS backend is running" });
});

app.listen(PORT, () => {
  console.log(`Learnova backend server running on port ${PORT}`);
});
