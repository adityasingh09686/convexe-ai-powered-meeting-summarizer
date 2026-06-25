import httpStatus from "http-status";
import { Meeting } from "../models/meeting.model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import fs from "fs";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const aiFileManager = new GoogleAIFileManager(GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const generateSummary = async (req, res) => {
    try {
        const { meetingCode } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(httpStatus.BAD_REQUEST).json({ message: "No video file provided." });
        }

        console.log(`Received summary request for meeting: ${meetingCode}, file: ${file.path}`);

        // 1. Upload file to Gemini
        const uploadResult = await aiFileManager.uploadFile(file.path, {
            mimeType: file.mimetype,
            displayName: `Meeting_${meetingCode}`,
        });
        console.log(`Uploaded file as: ${uploadResult.file.uri}`);

        // 2. Wait for processing if necessary (Videos take time)
        let fileState = await aiFileManager.getFile(uploadResult.file.name);
        while (fileState.state === "PROCESSING") {
            console.log("Waiting for video processing...");
            await new Promise((resolve) => setTimeout(resolve, 5000));
            fileState = await aiFileManager.getFile(uploadResult.file.name);
        }

        if (fileState.state === "FAILED") {
            throw new Error("Video processing failed in Gemini API.");
        }

        console.log("Video processing complete. Generating summary...");

        // 3. Generate summary
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
        const result = await model.generateContent([
            {
                fileData: {
                    mimeType: uploadResult.file.mimeType,
                    fileUri: uploadResult.file.uri
                }
            },
            { text: "Watch this recorded video meeting and provide a detailed text summary of the discussion, key decisions, and action items. Format it clearly using markdown." }
        ]);

        const summaryText = result.response.text();
        console.log("Summary generated successfully!");

        // 4. Save to Meeting history
        // Update all Meeting documents that have this meetingCode
        await Meeting.updateMany(
            { meetingCode: meetingCode },
            { $set: { summary: summaryText } }
        );

        // 5. Cleanup local file
        fs.unlinkSync(file.path);

        // Optionally delete from Gemini to save space
        try {
            await aiFileManager.deleteFile(uploadResult.file.name);
        } catch (e) {
            console.log("Failed to delete remote gemini file:", e);
        }

        res.status(httpStatus.OK).json({ message: "Summary generated", summary: summaryText });

    } catch (error) {
        console.error("Summary generation error:", error);

        // Cleanup on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Failed to generate summary: ${error.message}` });
    }
};

export const getSummary = async (req, res) => {
    try {
        const { meetingCode } = req.params;
        const meeting = await Meeting.findOne({ meetingCode, summary: { $ne: null } });

        if (!meeting) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "Summary not found for this meeting." });
        }

        res.status(httpStatus.OK).json({ summary: meeting.summary });
    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch summary" });
    }
};
