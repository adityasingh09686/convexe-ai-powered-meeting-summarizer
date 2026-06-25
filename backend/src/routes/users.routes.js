import { Router } from "express";
import { login, register, getUserHistory, addToHistory, deleteFromHistory } from "../controllers/user.controller.js";
import { generateSummary, getSummary } from "../controllers/summary.controller.js";
import multer from "multer";

const upload = multer({ dest: "uploads/" });

const router = Router();

router.post("/login", login);
router.post("/register", register);
router.get("/get_all_activity", getUserHistory);
router.post("/add_to_activity", addToHistory);
router.delete("/delete_activity", deleteFromHistory);

router.post("/summary", upload.single("video"), generateSummary);
router.get("/summary/:meetingCode", getSummary);
export default router;
