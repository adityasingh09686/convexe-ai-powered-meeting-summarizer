import { createContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios, { HttpStatusCode } from "axios";
import { toast } from "react-toastify";

export const AuthContext = createContext({});

const client = axios.create({
    baseURL: "http://localhost:8000/api/v1/users"
});

export const AuthProvider = ({ children }) => {
    const [userData, setUserData] = useState(null);
    const router = useNavigate();

    const handleRegister = async (name, username, password) => {
        try {
            let request = await client.post("/register", { name, username, password });
            let response = request.data;

            if (request.status === HttpStatusCode.Created) {
                return request.data.message;
            }

            if (!response?.success) {
                throw new Error("Something went wrong!");
            }
            return response.message || "Registration successful";
        } catch (error) {
            throw error;
        }
    };

    const handleLogin = async (username, password) => {
        try {
            let request = await client.post("/login", { username, password });
            let response = request.data;

            if (response.token) {
                localStorage.setItem("token", response.token);
                setUserData(response);
                router("/home");
                return response.message || "Login successful";
            }
            throw new Error(response.message || "Login failed");
        } catch (error) {
            throw error;
        }
    };

    const getUserHistoryOfUser = async () => {
        try {
            let request = await client.get("/get_all_activity", {
                params: {
                    token: localStorage.getItem("token")
                }
            });
            return request.data;
        } catch (error) {
            throw error;
        }
    };

    const addToUserHistory = async (meetingCode) => {
        try {
            let request = await client.post("/add_to_activity", {
                token: localStorage.getItem("token"),
                meeting_code: meetingCode
            });
            return request.data;
        } catch (error) {
            throw error;
        }
    };

    const data = {
        userData,
        setUserData,
        handleRegister,
        handleLogin,
        getUserHistoryOfUser,
        addToUserHistory
    };

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    );
};