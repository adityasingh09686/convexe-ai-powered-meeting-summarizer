import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Box, Button, Container, TextField, Typography, IconButton } from '@mui/material';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/700.css';

export default function HomeComponent() {
    const router = useNavigate();
    const { userData } = useContext(AuthContext);
    const [meetingCode, setMeetingCode] = useState('');

    const handleNewMeeting = () => {
        // Generate a random string (like Google Meet: xxx-xxxx-xxx)
        const generateSegment = (length) => Math.random().toString(36).substring(2, 2 + length);
        const newCode = `${generateSegment(3)}-${generateSegment(4)}-${generateSegment(3)}`;
        router(`/${newCode}?host=true`);
    };

    const handleJoinMeeting = () => {
        if (meetingCode.trim()) {
            router(`/${meetingCode.trim()}`);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        router("/auth");
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', fontFamily: "'Space Grotesk', sans-serif" }}>
            {/* Top Navigation Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, px: 4, borderBottom: '1px solid #e0e0e0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#292929', letterSpacing: '-0.5px' }}>
                        Convexe
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button 
                        startIcon={<HistoryIcon />} 
                        onClick={() => router('/history')}
                        sx={{ color: '#5f6368', textTransform: 'none', fontWeight: 600, fontSize: '15px' }}
                    >
                        History
                    </Button>
                    <Button 
                        startIcon={<LogoutIcon />} 
                        onClick={handleLogout}
                        sx={{ color: '#5f6368', textTransform: 'none', fontWeight: 600, fontSize: '15px' }}
                    >
                        Logout
                    </Button>
                </Box>
            </Box>

            {/* Main Content Area */}
            <Container maxWidth="lg" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 8 }}>
                {/* Left Side: Actions */}
                <Box sx={{ maxWidth: '500px' }}>
                    <Typography variant="h3" sx={{ fontWeight: 500, color: '#202124', mb: 2, fontSize: { xs: '2rem', md: '3rem' }, lineHeight: 1.2 }}>
                        Premium video meetings. Now free for everyone.
                    </Typography>
                    <Typography sx={{ fontSize: '18px', color: '#5f6368', mb: 4, lineHeight: 1.5 }}>
                        We re-engineered the service we built for secure business meetings, Convexe, to make it free and available for all.
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Button 
                            variant="contained" 
                            startIcon={<VideoCallIcon />}
                            onClick={handleNewMeeting}
                            sx={{ 
                                backgroundColor: '#1a73e8', 
                                '&:hover': { backgroundColor: '#1557b0' },
                                padding: '10px 24px',
                                fontSize: '16px',
                                textTransform: 'none',
                                fontWeight: 500,
                                borderRadius: '4px',
                                boxShadow: 'none'
                            }}
                        >
                            New meeting
                        </Button>

                        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, gap: 1 }}>
                            <TextField 
                                variant="outlined"
                                placeholder="Enter a code or link"
                                size="small"
                                value={meetingCode}
                                onChange={(e) => setMeetingCode(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <KeyboardIcon sx={{ color: '#5f6368', mr: 1 }} />
                                    ),
                                }}
                                sx={{
                                    flexGrow: 1,
                                    maxWidth: '250px',
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                            borderColor: '#dadce0',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: '#1a73e8',
                                        },
                                    }
                                }}
                            />
                            <Button 
                                onClick={handleJoinMeeting}
                                disabled={!meetingCode.trim()}
                                sx={{ 
                                    color: '#1a73e8', 
                                    textTransform: 'none', 
                                    fontWeight: 500, 
                                    fontSize: '16px',
                                    '&.Mui-disabled': {
                                        color: 'rgba(0, 0, 0, 0.26)'
                                    }
                                }}
                            >
                                Join
                            </Button>
                        </Box>
                    </Box>
                    <Box sx={{ mt: 3, height: '1px', width: '100%', backgroundColor: '#dadce0' }} />
                    <Typography sx={{ mt: 2, color: '#5f6368', fontSize: '14px' }}>
                        Welcome back, <span style={{ fontWeight: 600 }}>{userData?.name || 'User'}</span>!
                    </Typography>
                </Box>

                {/* Right Side: Illustration Placeholder */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: '500px' }}>
                    <Box 
                        sx={{ 
                            width: '400px', 
                            height: '400px', 
                            borderRadius: '50%', 
                            background: 'linear-gradient(135deg, #e8f0fe 0%, #ffffff 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 10px 30px rgba(26, 115, 232, 0.1)',
                            border: '1px solid #e8f0fe'
                        }}
                    >
                        {/* We use an oversized icon as a nice abstract illustration here since we don't have a specific asset */}
                        <VideoCallIcon sx={{ fontSize: '180px', color: '#1a73e8', opacity: 0.8 }} />
                    </Box>
                    <Typography sx={{ mt: 4, color: '#202124', fontSize: '18px', textAlign: 'center', fontWeight: 500 }}>
                        Get a link you can share
                    </Typography>
                    <Typography sx={{ mt: 1, color: '#5f6368', fontSize: '14px', textAlign: 'center', maxWidth: '300px' }}>
                        Click <b>New meeting</b> to get a link you can send to people you want to meet with
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
}
