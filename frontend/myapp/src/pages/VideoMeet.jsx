import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { io } from "socket.io-client";
import { Badge, TextField, Box, Container, Typography, Card, CardContent, Snackbar, Alert } from '@mui/material';
import { Button } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import CircularProgress from '@mui/material/CircularProgress';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import PanToolIcon from '@mui/icons-material/PanTool';
import PeopleIcon from '@mui/icons-material/People';
import BrushIcon from '@mui/icons-material/Brush';
import Whiteboard from './components/Whiteboard';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/700.css';
import "../styles/videoComponent.css";

// Backend Socket.io server is running at port 8000
// Use window.location.hostname to support testing across devices on the same local network
const server_url = `http://${window.location.hostname}:8000`;

// Connections object is used to store the connections between the peers
var connections = {};

// Queue for ICE candidates that arrive before the remote description is set
var iceCandidateQueue = {};

// It stores the ICE servers
const peerConfigConnections = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
    ]
};

export default function VideoMeetComponents() {
    const { addToUserHistory } = useContext(AuthContext);

    // socketRef is used to communicate with the backend
    var socketRef = useRef();

    // Stores your unique socket id
    let socketIdRef = useRef();

    // Displaying the video
    let localVideoRef = useRef();

    // Looking for camera availability
    let [videoAvailable, setVideoAvailable] = useState(false);

    // Looking for audio availability
    let [audioAvailable, setAudioAvailable] = useState(false);

    // Whether the user wants to share video
    let [video, setVideo] = useState(false);

    // Whether the user wants to share audio
    let [audio, setAudio] = useState(false);

    // Whether the user wants to share screen
    let [screen, setScreen] = useState(false);

    // Whether there is a popup available or not
    let [showModal, setModal] = useState(false);

    // Checking screen sharing availability
    let [screenAvailable, setScreenAvailable] = useState(false);

    // Chat messages
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [newMessages, setNewMessages] = useState(0);

    // Sidebar & People Tab
    const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'people'
    const [searchQuery, setSearchQuery] = useState('');

    // Reactions & Raise Hand
    const [showReactionMenu, setShowReactionMenu] = useState(false);
    const [handRaised, setHandRaised] = useState(false);
    const [raisedHands, setRaisedHands] = useState({});
    const [screenSharers, setScreenSharers] = useState({});
    const [flyingEmojis, setFlyingEmojis] = useState([]);
    const emojis = ['👍', '😂', '👏', '🎉', '💖'];

    const showFlyingEmoji = (senderSocketId, emoji) => {
        const id = Date.now() + Math.random();
        setFlyingEmojis(prev => [...prev, { id, emoji, socketId: senderSocketId }]);
        setTimeout(() => {
            setFlyingEmojis(prev => prev.filter(e => e.id !== id));
        }, 2000);
    };

    const handleReaction = (emoji) => {
        socketRef.current.emit('reaction', 'emoji', emoji);
        setShowReactionMenu(false);
        showFlyingEmoji(localSocketId, emoji);
    };

    const toggleHandRaise = () => {
        const newStatus = !handRaised;
        setHandRaised(newStatus);
        socketRef.current.emit('reaction', 'hand', newStatus);
        setRaisedHands(prev => ({ ...prev, [localSocketId]: newStatus }));
        setShowReactionMenu(false);
    };;

    // Show username page initially
    let [askForUsername, setAskForUsername] = useState(true);

    // Username
    let [username, setUsername] = useState("");

    // State to force re-render for local socket ID
    let [localSocketId, setLocalSocketId] = useState("");

    // Whiteboard state
    const [showWhiteboard, setShowWhiteboard] = useState(false);

    // Meeting Code and Host status
    const meetingCode = window.location.pathname.replace("/", "");
    const isHost = window.location.search.includes("host=true");
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(meetingCode);
        setCopied(true);
    };

    // Video elements for remote users
    const videoRef = useRef([]);

    // Stores all videos
    let [videos, setVideos] = useState([]);

    // Recording & Summary state
    const [isRecording, setIsRecording] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);

    const getPermissions = async () => {
        try {

            // Check video permission
            let videoPerm = false;
            try {
                const v = await navigator.mediaDevices.getUserMedia({ video: true });
                videoPerm = true;
                v.getTracks().forEach(track => track.stop()); // Stop test stream
            } catch (e) { }

            setVideoAvailable(videoPerm);

            // Check audio permission
            let audioPerm = false;
            try {
                const a = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioPerm = true;
                a.getTracks().forEach(track => track.stop()); // Stop test stream
            } catch (e) { }

            setAudioAvailable(audioPerm);

            // Check screen sharing availability
            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            }
            else {
                setScreenAvailable(false);
            }

            // Get ACTUAL media stream for the call
            if (videoPerm || audioPerm) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({
                    video: !!videoPerm,
                    audio: !!audioPerm
                });

                window.localStream = userMediaStream;

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = userMediaStream;
                }
            }
        }
        catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        getPermissions();
    }, []);

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prev) => prev + 1);
        }
    };

    let getPeerConnection = (id) => {
        if (connections[id] === undefined) {
            connections[id] = new RTCPeerConnection(peerConfigConnections);

            connections[id].onicecandidate = (event) => {
                if (event.candidate !== null) {
                    socketRef.current.emit("signal", id, JSON.stringify({
                        'ice': event.candidate
                    }));
                }
            };

            connections[id].ontrack = (event) => {
                const videoExists = videoRef.current.find(
                    video => video.socketId === id
                );

                if (videoExists) {
                    setVideos(videos => {
                        const updatedVideos = videos.map(video =>
                            video.socketId === id
                                ? { ...video, stream: event.streams[0] }
                                : video
                        );
                        videoRef.current = updatedVideos;
                        return updatedVideos;
                    });
                } else {
                    let newVideo = {
                        socketId: id,
                        stream: event.streams[0],
                        autoPlay: true,
                        playsInline: true
                    };

                    setVideos(videos => {
                        const updatedVideos = [...videos, newVideo];
                        videoRef.current = updatedVideos;
                        return updatedVideos;
                    });
                }
            };

            if (window.localStream !== undefined && window.localStream !== null) {
                window.localStream.getTracks().forEach(track => {
                    connections[id].addTrack(track, window.localStream);
                });
            }
        }
        return connections[id];
    };

    const gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message);

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                let peerConnection = getPeerConnection(fromId);
                peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp))
                    .then(() => {
                        if (signal.sdp.type === "offer") {
                            peerConnection.createAnswer().then((description) => {
                                peerConnection.setLocalDescription(description)
                                    .then(() => {
                                        socketRef.current.emit("signal", fromId, JSON.stringify({
                                            'sdp': peerConnection.localDescription
                                        }));
                                    })
                                    .catch((e) => console.log(e));
                            });
                        }

                        // Process any queued ICE candidates now that remote description is set
                        if (iceCandidateQueue[fromId]) {
                            iceCandidateQueue[fromId].forEach(ice => {
                                peerConnection.addIceCandidate(new RTCIceCandidate(ice))
                                    .catch(e => console.log(e));
                            });
                            iceCandidateQueue[fromId] = []; // clear the queue
                        }
                    })
                    .catch((e) => console.log(e));
            } else if (signal.ice) {
                let peerConnection = getPeerConnection(fromId);

                // If remote description is already set, add the candidate immediately
                if (peerConnection.remoteDescription) {
                    peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice))
                        .catch((e) => console.log(e));
                } else {
                    // Otherwise queue it!
                    if (!iceCandidateQueue[fromId]) {
                        iceCandidateQueue[fromId] = [];
                    }
                    iceCandidateQueue[fromId].push(signal.ice);
                }
            }
        }
    };

    let connectToSocketServer = () => {
        socketRef.current = io(server_url, {
            extraHeaders: {
                'ngrok-skip-browser-warning': 'true'
            }
        });

        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('reaction', (senderId, type, data) => {
            if (type === 'emoji') {
                showFlyingEmoji(senderId, data);
            } else if (type === 'hand') {
                setRaisedHands(prev => ({ ...prev, [senderId]: data }));
            } else if (type === 'screenshare') {
                setScreenSharers(prev => ({ ...prev, [senderId]: data }));
            }
        });

        socketRef.current.on('connect', () => {
            socketRef.current.on("whiteboard-toggle", (status) => {
                setShowWhiteboard(status);
            });

            // Use pathname to ignore query strings like ?host=true, ensuring all users join the same room
            socketRef.current.emit("join-call", window.location.pathname, username);
            socketIdRef.current = socketRef.current.id;
            setLocalSocketId(socketRef.current.id);
            socketRef.current.on("chat-message", addMessage);

            socketRef.current.on("name-sync", (roomNames) => {
                setVideos((videos) => {
                    let updated = [...videos];
                    for (let sid in roomNames) {
                        if (sid !== socketIdRef.current) {
                            let existing = updated.find(v => v.socketId === sid);
                            if (existing) {
                                existing.username = roomNames[sid];
                            } else {
                                updated.push({
                                    socketId: sid,
                                    stream: null,
                                    username: roomNames[sid],
                                    autoPlay: true,
                                    playsInline: true
                                });
                            }
                        }
                    }
                    videoRef.current = updated;
                    return updated;
                });
            });

            socketRef.current.on("user-left", (id) => {
                setVideos((videos) => {
                    const updated = videos.filter((video) => video.socketId !== id);
                    videoRef.current = updated;
                    return updated;
                });
            });

            socketRef.current.on("user-joined", (id) => {
                let peerConnection = getPeerConnection(id);
                peerConnection.createOffer().then((description) => {
                    peerConnection.setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit("signal", id, JSON.stringify({ "sdp": peerConnection.localDescription }));
                        })
                        .catch(e => console.log(e));
                });
            });
        });
    };


    useEffect(() => {
        if (localVideoRef.current && window.localStream) {
            localVideoRef.current.srcObject = window.localStream;
        }
    }, [askForUsername]);

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    }

    let connect = async () => {
        getMedia();
        setAskForUsername(false);
        try {
            const meetingCode = window.location.pathname.replace("/", "");
            await addToUserHistory(meetingCode);
        } catch (e) {
            console.log("Error adding to history:", e);
        }
    }

    let handleVideo = () => {
        setVideo(!video);
        if (window.localStream) {
            let videoTrack = window.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !video;
            }
        }
    }
    let handleAudio = () => {
        setAudio(!audio);
        if (window.localStream) {
            let audioTrack = window.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audio;
            }
        }
    }

    let handleScreen = () => {
        if (!screenAvailable) return;

        if (!screen) {
            navigator.mediaDevices.getDisplayMedia({ cursor: true })
                .then(screenStream => {
                    let screenTrack = screenStream.getTracks()[0];

                    if (window.localStream) {
                        window.localStream.getVideoTracks().forEach(track => {
                            window.localStream.removeTrack(track);
                            track.stop();
                        });
                        window.localStream.addTrack(screenTrack);
                    }

                    for (let id in connections) {
                        let sender = connections[id].getSenders().find(s => s.track && s.track.kind === 'video');
                        if (sender) {
                            sender.replaceTrack(screenTrack);
                        } else {
                            connections[id].addTrack(screenTrack, window.localStream);
                            connections[id].createOffer().then(description => {
                                connections[id].setLocalDescription(description).then(() => {
                                    socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }));
                                });
                            });
                        }
                    }

                    setScreen(true);
                    socketRef.current.emit('reaction', 'screenshare', true);
                    socketRef.current.emit('chat-message', "has started sharing their screen.", username || localSocketId);
                    setScreenSharers(prev => ({ ...prev, [localSocketId]: true }));

                    screenTrack.onended = () => {
                        handleScreen();
                    };
                })
                .catch(e => console.log("Failed to get screen sharing:", e));
        } else {
            const constraints = { video: videoAvailable ? video : false, audio: audioAvailable ? audio : false };

            const stopScreenShare = (videoTrack) => {
                if (window.localStream) {
                    window.localStream.getVideoTracks().forEach(track => {
                        window.localStream.removeTrack(track);
                        track.stop();
                    });
                    if (videoTrack) window.localStream.addTrack(videoTrack);
                }

                for (let id in connections) {
                    let sender = connections[id].getSenders().find(s => s.track && s.track.kind === 'video');
                    if (sender) {
                        if (videoTrack) {
                            sender.replaceTrack(videoTrack);
                        } else {
                            sender.replaceTrack(null).catch(e => console.log(e));
                        }
                    }
                }

                setScreen(false);
                socketRef.current.emit('reaction', 'screenshare', false);
                setScreenSharers(prev => ({ ...prev, [localSocketId]: false }));
            };

            if (constraints.video || constraints.audio) {
                navigator.mediaDevices.getUserMedia(constraints)
                    .then(userStream => stopScreenShare(userStream.getVideoTracks()[0]))
                    .catch(e => {
                        console.log("Failed to revert screen sharing:", e);
                        stopScreenShare(null);
                    });
            } else {
                stopScreenShare(null);
            }
        }
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            mediaRecorderRef.current = mediaRecorder;
            recordedChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                await uploadRecording(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start(1000); // 1 second chunks
            setIsRecording(true);
            
            // Listen for user stopping screen sharing natively
            stream.getVideoTracks()[0].onended = () => {
                stopRecording();
            };
        } catch (e) {
            console.error("Recording failed", e);
            alert("Could not start recording. You need to allow screen and audio sharing.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const uploadRecording = async (blob) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("video", blob, "meeting.webm");
        formData.append("meetingCode", meetingCode);

        try {
            const res = await fetch(`${server_url}/api/v1/users/summary`, {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                alert("Summary generated successfully! You can view it in the History tab.");
            } else {
                alert(`Error generating summary: ${data.message}`);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to upload recording.");
        } finally {
            setIsUploading(false);
        }
    };

    let sendMessage = () => {
        socketRef.current.emit('chat-message', message, username);
        setMessage("");
    }

    const toggleWhiteboard = () => {
        const newStatus = !showWhiteboard;
        setShowWhiteboard(newStatus);
        socketRef.current.emit("whiteboard-toggle", newStatus);
    };

    return (
        <div style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {
                askForUsername ?
                    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7f6', py: 4 }}>
                        <Container maxWidth="lg">
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: 'center', justifyContent: 'center' }}>
                                {/* Left Side: Camera Preview */}
                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '600px', width: '100%' }}>
                                    <Box sx={{ width: '100%', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#202124', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', position: 'relative', aspectRatio: '16/9' }}>
                                        <video
                                            ref={(ref) => {
                                                localVideoRef.current = ref;
                                                if (ref && window.localStream) {
                                                    ref.srcObject = window.localStream;
                                                }
                                            }}
                                            autoPlay
                                            muted
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                                        ></video>
                                        <Box sx={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 2 }}>
                                            <IconButton sx={{ backgroundColor: video ? 'rgba(60,64,67,0.8)' : '#ea4335', color: 'white', '&:hover': { backgroundColor: video ? '#4d5156' : '#d93025' } }} onClick={handleVideo}>
                                                {video ? <VideocamIcon /> : <VideocamOffIcon />}
                                            </IconButton>
                                            <IconButton sx={{ backgroundColor: audio ? 'rgba(60,64,67,0.8)' : '#ea4335', color: 'white', '&:hover': { backgroundColor: audio ? '#4d5156' : '#d93025' } }} onClick={handleAudio}>
                                                {audio ? <MicIcon /> : <MicOffIcon />}
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Right Side: Join Info */}
                                <Box sx={{ flex: 1, maxWidth: '400px', width: '100%' }}>
                                    <Typography variant="h3" sx={{ fontWeight: 500, color: '#202124', mb: 1, fontFamily: "'Space Grotesk', sans-serif" }}>
                                        Ready to join?
                                    </Typography>

                                    {isHost && (
                                        <Card elevation={0} sx={{ mt: 3, mb: 3, border: '1px solid #1a73e8', borderRadius: '12px', backgroundColor: '#e8f0fe' }}>
                                            <CardContent>
                                                <Typography sx={{ fontWeight: 600, color: '#1a73e8', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    You are the Host!
                                                </Typography>
                                                <Typography sx={{ color: '#202124', mb: 2, fontSize: '14px' }}>
                                                    Share this meeting code with others so they can join you.
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: 'white', p: 1, borderRadius: '8px', border: '1px solid #dadce0' }}>
                                                    <Typography sx={{ flexGrow: 1, fontWeight: 500, ml: 1, letterSpacing: '1px' }}>
                                                        {meetingCode}
                                                    </Typography>
                                                    <IconButton onClick={handleCopy} size="small">
                                                        <ContentCopyIcon fontSize="small" sx={{ color: '#5f6368' }} />
                                                    </IconButton>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {!isHost && (
                                        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography sx={{ color: '#5f6368' }}>Meeting Code:</Typography>
                                            <Typography sx={{ fontWeight: 600, color: '#202124' }}>{meetingCode}</Typography>
                                        </Box>
                                    )}

                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                                        <TextField
                                            label="Your Name"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            variant="outlined"
                                            fullWidth
                                        />
                                        <Button
                                            variant="contained"
                                            onClick={connect}
                                            disabled={!username.trim()}
                                            sx={{
                                                backgroundColor: '#1a73e8',
                                                padding: '12px',
                                                fontSize: '16px',
                                                textTransform: 'none',
                                                borderRadius: '24px',
                                                boxShadow: 'none',
                                                '&:hover': { backgroundColor: '#1557b0', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },
                                                '&.Mui-disabled': { backgroundColor: '#e8eaed', color: '#9aa0a6' }
                                            }}
                                        >
                                            Join Meeting
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                        </Container>

                        <Snackbar open={copied} autoHideDuration={3000} onClose={() => setCopied(false)}>
                            <Alert onClose={() => setCopied(false)} severity="success" sx={{ width: '100%' }}>
                                Meeting code copied to clipboard!
                            </Alert>
                        </Snackbar>
                    </Box>

                    :

                    <div>
                        <div className='meetVideoContainer' key={localSocketId}>

                            {/* Main Video Area */}
                            <div className="mainArea">
                                <div style={{ display: 'flex', flexGrow: 1, height: 'calc(100vh - 80px)', overflow: 'hidden' }}>

                                    {showWhiteboard && (
                                        <div style={{ flexGrow: 1, padding: '16px' }}>
                                            <Whiteboard socket={socketRef.current} />
                                        </div>
                                    )}

                                    <div className="conferenceView" style={{
                                        width: showWhiteboard ? '300px' : '100%',
                                        flexGrow: showWhiteboard ? 0 : 1,
                                        display: showWhiteboard ? 'flex' : 'grid',
                                        flexDirection: showWhiteboard ? 'column' : 'row',
                                        overflowY: 'auto'
                                    }}>
                                        {/* Local User Video */}
                                        <div className="videoCard local">
                                            <video
                                                ref={(ref) => {
                                                    localVideoRef.current = ref;
                                                    if (ref && window.localStream && ref.srcObject !== window.localStream) {
                                                        ref.srcObject = window.localStream;
                                                    }
                                                }}
                                                autoPlay
                                                muted
                                                playsInline
                                            ></video>
                                            <div className="participantName">You ({username || localSocketId})</div>
                                            {raisedHands[localSocketId] && <div className="handRaisedIndicator">✋</div>}
                                            {screenSharers[localSocketId] && <div className="screenShareIndicator"><ScreenShareIcon fontSize="small" /></div>}
                                            {flyingEmojis.filter(e => e.socketId === localSocketId).map(e => (
                                                <div key={e.id} className="flyingEmoji">{e.emoji}</div>
                                            ))}
                                        </div>

                                        {/* Remote User Videos */}
                                        {videos.map((video) => (
                                            <div className="videoCard" key={video.socketId}>
                                                <video
                                                    data-socket={video.socketId}
                                                    ref={(ref) => {
                                                        if (ref && video.stream && ref.srcObject !== video.stream) {
                                                            ref.srcObject = video.stream;
                                                        }
                                                    }}
                                                    autoPlay
                                                    playsInline
                                                    onLoadedMetadata={(e) => e.target.play().catch(console.error)}
                                                ></video>
                                                <div className="participantName">{video.username || video.socketId}</div>
                                                {raisedHands[video.socketId] && <div className="handRaisedIndicator">✋</div>}
                                                {screenSharers[video.socketId] && <div className="screenShareIndicator"><ScreenShareIcon fontSize="small" /></div>}
                                                {flyingEmojis.filter(e => e.socketId === video.socketId).map(e => (
                                                    <div key={e.id} className="flyingEmoji">{e.emoji}</div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Bottom Control Bar */}
                                <div className="buttonContainer">
                                    <IconButton className={video ? "" : "offState"} onClick={handleVideo}>
                                        {video ? <VideocamIcon /> : <VideocamOffIcon />}
                                    </IconButton>

                                    <IconButton className={audio ? "" : "offState"} onClick={handleAudio}>
                                        {audio ? <MicIcon /> : <MicOffIcon />}
                                    </IconButton>

                                    {screenAvailable && (
                                        <IconButton onClick={handleScreen}>
                                            {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                                        </IconButton>
                                    )}

                                    <div style={{ position: 'relative' }}>
                                        <IconButton
                                            className={`squareButton ${handRaised ? 'active' : ''}`}
                                            onClick={() => setShowReactionMenu(!showReactionMenu)}
                                        >
                                            <PanToolIcon />
                                        </IconButton>

                                        {showReactionMenu && (
                                            <div className="reactionMenu">
                                                <div
                                                    style={{ cursor: 'pointer', borderRight: '1px solid rgba(255,255,255,0.2)', paddingRight: '12px', marginRight: '4px', display: 'flex', alignItems: 'center', color: 'white', fontSize: '14px', fontWeight: '500' }}
                                                    onClick={toggleHandRaise}
                                                >
                                                    {handRaised ? '✋ Lower' : '✋ Raise'}
                                                </div>
                                                {emojis.map((emoji, idx) => (
                                                    <span key={idx} onClick={() => handleReaction(emoji)}>{emoji}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {isHost && (
                                        <IconButton
                                            className={`squareButton ${showWhiteboard ? 'active' : ''}`}
                                            onClick={toggleWhiteboard}
                                        >
                                            <BrushIcon />
                                        </IconButton>
                                    )}

                                    <Badge badgeContent={newMessages} max={999} color='error'>
                                        <IconButton onClick={() => {
                                            if (showModal && activeTab === 'chat') {
                                                setModal(false);
                                            } else {
                                                setModal(true);
                                                setActiveTab('chat');
                                                setNewMessages(0);
                                            }
                                        }}>
                                            <ChatIcon />
                                        </IconButton>
                                    </Badge>

                                    <IconButton onClick={() => {
                                        if (showModal && activeTab === 'people') {
                                            setModal(false);
                                        } else {
                                            setModal(true);
                                            setActiveTab('people');
                                        }
                                    }}>
                                        <PeopleIcon style={{ color: 'white' }} />
                                    </IconButton>

                                    {isHost && (
                                        <IconButton 
                                            onClick={isRecording ? stopRecording : startRecording}
                                            style={{ color: isRecording ? '#ea4335' : 'white' }}
                                        >
                                            {isUploading ? <CircularProgress size={24} style={{color: 'white'}}/> : (isRecording ? <StopCircleIcon /> : <RadioButtonCheckedIcon />)}
                                        </IconButton>
                                    )}

                                    <IconButton className="endCall" onClick={() => window.location.href = "/"}>
                                        <CallEndIcon />
                                    </IconButton>
                                </div>

                            </div>

                            {/* Sidebar Panel */}
                            {showModal && (
                                <div className="chatRoom">
                                    <div className="chatContainer">

                                        {/* Tabs */}
                                        <div className="sidebarTabs">
                                            <button
                                                className={`tabButton ${activeTab === 'chat' ? 'active' : ''}`}
                                                onClick={() => { setActiveTab('chat'); setNewMessages(0); }}
                                            >
                                                Chat
                                            </button>
                                            <button
                                                className={`tabButton ${activeTab === 'people' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('people')}
                                            >
                                                People
                                            </button>
                                        </div>

                                        {activeTab === 'chat' && (
                                            <>
                                                <div className="chattingDisplay">
                                                    {messages.length !== 0 ? messages.map((item, index) => {
                                                        const isMe = item.sender === username;
                                                        return (
                                                            <div className={`chatMessage ${isMe ? 'me' : ''}`} key={index}>
                                                                <span className="chatSender">{item.sender}</span>
                                                                <p className="chatData">{item.data}</p>
                                                            </div>
                                                        )
                                                    }) : <p style={{ color: "#757575", fontSize: "14px" }}>No messages yet. Say hi!</p>}
                                                </div>
                                                <div className="chattingArea">
                                                    <TextField
                                                        value={message}
                                                        onChange={(e) => setMessage(e.target.value)}
                                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                                        id="outlined-basic"
                                                        label="Message"
                                                        variant="outlined"
                                                        size="small"
                                                    />
                                                    <Button variant='contained' onClick={sendMessage} disableElevation>Send</Button>
                                                </div>
                                            </>
                                        )}

                                        {activeTab === 'people' && (
                                            <div className="participantListContainer">
                                                <TextField
                                                    className="searchBar"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    placeholder="Search for people"
                                                    variant="outlined"
                                                    size="small"
                                                />
                                                <div className="participantsList">
                                                    {
                                                        [{ username: username || localSocketId, socketId: localSocketId, isMe: true }, ...videos]
                                                            .filter(p => (p.username || p.socketId).toLowerCase().includes(searchQuery.toLowerCase()))
                                                            .map((p) => {
                                                                const isHandRaised = raisedHands[p.socketId];
                                                                const name = p.username || p.socketId;
                                                                return (
                                                                    <div className="participantItem" key={p.socketId}>
                                                                        <div className="participantAvatar">
                                                                            {name.charAt(0).toUpperCase()}
                                                                        </div>
                                                                        <div className="participantDetails">
                                                                            <span className="participantNameText">
                                                                                {name} {p.isMe ? '(You)' : ''}
                                                                            </span>
                                                                            <span className="participantStatus">
                                                                                {isHandRaised ? '✋ Hand raised' : 'In call'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                    }
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            )}

                        </div>

                    </div>
            }
        </div>
    );
}
