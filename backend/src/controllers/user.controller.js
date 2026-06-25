import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import { Meeting } from "../models/meeting.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        if (!username || !password) {
            return res.status(400).json({ message: "Please provide username and password" });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid credentials" });
        }

        const token = crypto.randomBytes(20).toString("hex");
        user.token = token;
        await user.save();

        res.status(httpStatus.OK).json({ message: "Login successful", token: token });
    } catch (error) {
        return res.status(500).json({ message: `Something went wrong: ${error}` });
    }
}




const register = async (req, res) => {
    const { name, username, password } = req.body

    try {
        if (!name || !username || !password) {
            return res.status(httpStatus.BAD_REQUEST).json({ message: "Please provide name, username, and password" });
        }

        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(httpStatus.BAD_REQUEST)
                .json({
                    success: false,
                    message: "User Already Exist"
                })
        }

        // encrypt the passwword
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User(
            {
                name: name,
                username: username,
                password: hashedPassword
            }
        )

        await newUser.save();

        res.status(httpStatus.CREATED)
            .json({
                success: true,
                message: "User Registered Successfully"
            })

    } catch (error) {
        console.error(error);
        res.status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                success: false,
                message: `Failed to register user : ${error}`
            })
    }
}


const getUserHistory = async (req, res) => {
    const { token } = req.query;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }
        const meetings = await Meeting.find({ user_id: user.username });
        res.json(meetings);
    } catch (e) {
        res.json({ message: `Something went wrong ${e}` });
    }
}

const addToHistory = async (req, res) => {
    const { token, meeting_code } = req.body;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }

        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code
        });

        await newMeeting.save();

        res.status(httpStatus.CREATED).json({ message: "Added code to history" });
    } catch (e) {
        res.json({ message: `Something went wrong ${e}` });
    }
}

const deleteFromHistory = async (req, res) => {
    const { token, meeting_code } = req.query;

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }

        await Meeting.deleteOne({ user_id: user.username, meetingCode: meeting_code });

        res.status(httpStatus.OK).json({ message: "Deleted from history" });
    } catch (e) {
        res.json({ message: `Something went wrong ${e}` });
    }
}

export { login, register, getUserHistory, addToHistory, deleteFromHistory };
