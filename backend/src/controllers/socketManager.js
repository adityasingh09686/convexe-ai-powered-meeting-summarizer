import { Server } from "socket.io";

// State (Note: Use Redis for these in production, or this will not scale)
const messages = {};
const timeOnline = {};
const userNames = {};

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"]
        }
    });

    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on("join-call", (path, username) => {
            // Native socket.io room join
            socket.join(path);
            timeOnline[socket.id] = Date.now();
            userNames[socket.id] = username;

            // Notify others in the room
            socket.to(path).emit("user-joined", socket.id);

            // Sync all names in the room
            const roomSockets = io.sockets.adapter.rooms.get(path);
            const roomNames = {};
            if (roomSockets) {
                roomSockets.forEach(sid => {
                    roomNames[sid] = userNames[sid] || sid;
                });
            }
            io.in(path).emit("name-sync", roomNames);

            // Send previous messages to the new user
            if (messages[path]) {
                messages[path].forEach(msg => {
                    io.to(socket.id).emit("chat-message", msg.data, msg.sender, msg.socketId);
                });
            }
        });

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", (data, sender) => {
            // A socket can be in multiple rooms; assuming the 2nd room is the call room 
            // (1st is always their own socket.id room)
            const rooms = Array.from(socket.rooms);
            const callRoom = rooms.find(room => room !== socket.id);

            if (callRoom) {
                if (!messages[callRoom]) messages[callRoom] = [];

                messages[callRoom].push({
                    sender: sender,
                    data: data,
                    socketId: socket.id
                });

                // Emit to everyone in the room natively
                io.in(callRoom).emit("chat-message", data, sender, socket.id);
            }
        });

        socket.on("reaction", (type, data) => {
            const rooms = Array.from(socket.rooms);
            const callRoom = rooms.find(room => room !== socket.id);
            if (callRoom) {
                socket.to(callRoom).emit("reaction", socket.id, type, data);
            }
        });

        socket.on("whiteboard-action", (actionData) => {
            const rooms = Array.from(socket.rooms);
            const callRoom = rooms.find(room => room !== socket.id);
            if (callRoom) {
                socket.to(callRoom).emit("whiteboard-action", actionData);
            }
        });

        socket.on("whiteboard-toggle", (status) => {
            const rooms = Array.from(socket.rooms);
            const callRoom = rooms.find(room => room !== socket.id);
            if (callRoom) {
                socket.to(callRoom).emit("whiteboard-toggle", status);
            }
        });

        socket.on("disconnecting", () => {
            // 'disconnecting' fires before the socket leaves its rooms
            const duration = Date.now() - (timeOnline[socket.id] || Date.now());
            console.log(`User ${socket.id} was online for ${duration}ms`);

            // Notify rooms that user is leaving
            socket.rooms.forEach(room => {
                if (room !== socket.id) {
                    socket.to(room).emit("user-left", socket.id);
                }
            });
        });

        socket.on("disconnect", () => {
            // Clean up memory to prevent leaks
            delete timeOnline[socket.id];
            delete userNames[socket.id];
        });
    });

    return io;
};