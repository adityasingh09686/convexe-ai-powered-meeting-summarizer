import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import { IconButton, Container, Box, CircularProgress, Grid, Snackbar, Alert, Button, CardActions } from '@mui/material';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DeleteIcon from '@mui/icons-material/Delete';

export default function History() {
    const { getUserHistoryOfUser, deleteUserHistory } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useNavigate();

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const history = await getUserHistoryOfUser();
            if (Array.isArray(history)) {
                setMeetings(history);
            } else if (history && history.message) {
                setError(history.message);
            } else {
                setMeetings([]);
            }
        } catch (e) {
            console.log(e);
            setError('Failed to fetch history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [getUserHistoryOfUser]);

    const handleDelete = async (e, meetingCode) => {
        e.stopPropagation();
        try {
            await deleteUserHistory(meetingCode);
            await fetchHistory();
        } catch (error) {
            setError('Failed to delete history');
        }
    };

    let formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short'
            }).format(date);
        } catch (e) {
            return dateString;
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#f4f7f6', pt: 4, pb: 4, fontFamily: "'Space Grotesk', sans-serif" }}>
            <Container maxWidth="md">
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
                    <IconButton
                        onClick={() => router("/home")}
                        sx={{ backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', '&:hover': { backgroundColor: '#f0f0f0' } }}
                    >
                        <HomeIcon sx={{ color: '#1a73e8' }} />
                    </IconButton>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#292929', fontFamily: "'Space Grotesk', sans-serif" }}>
                        Meeting History
                    </Typography>
                </Box>

                {/* Content */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                        <CircularProgress />
                    </Box>
                ) : meetings.length > 0 ? (
                    <Grid container spacing={3}>
                        {meetings.map((meeting, i) => (
                            <Grid item xs={12} sm={6} key={i}>
                                <Card
                                    elevation={0}
                                    sx={{
                                        borderRadius: '16px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                        transition: 'transform 0.2s',
                                        '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' },
                                        cursor: 'pointer',
                                        position: 'relative'
                                    }}
                                    onClick={() => router(`/${meeting.meetingCode}`)}
                                >
                                    <IconButton 
                                        sx={{ position: 'absolute', top: 8, right: 8, color: '#f44336' }} 
                                        onClick={(e) => handleDelete(e, meeting.meetingCode)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                                            <EventAvailableIcon sx={{ color: '#1a73e8' }} />
                                            <Typography sx={{ fontWeight: 600, color: '#1a73e8', fontSize: '1.1rem', fontFamily: "'Space Grotesk', sans-serif" }}>
                                                Meeting Code
                                            </Typography>
                                        </Box>
                                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#292929', mb: 1, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '1px' }}>
                                            {meeting.meetingCode}
                                        </Typography>
                                        <Typography sx={{ color: '#757575', fontSize: '0.9rem' }}>
                                            Joined on: {formatDate(meeting.date)}
                                        </Typography>
                                    </CardContent>
                                    {meeting.summary && (
                                        <CardActions sx={{ p: 2, pt: 0 }}>
                                            <Button 
                                                variant="contained" 
                                                size="small" 
                                                startIcon={<AutoAwesomeIcon />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router(`/summary/${meeting.meetingCode}`);
                                                }}
                                                sx={{ 
                                                    backgroundColor: '#1a73e8', 
                                                    textTransform: 'none', 
                                                    borderRadius: '8px',
                                                    fontFamily: "'Space Grotesk', sans-serif"
                                                }}
                                            >
                                                View AI Summary
                                            </Button>
                                        </CardActions>
                                    )}
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Box sx={{ textAlign: 'center', mt: 10, backgroundColor: 'white', p: 6, borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: '#292929', mb: 2, fontFamily: "'Space Grotesk', sans-serif" }}>
                            No Meeting History
                        </Typography>
                        <Typography sx={{ color: '#757575' }}>
                            You haven't joined any meetings yet. Once you join a call, it will appear here!
                        </Typography>
                    </Box>
                )}
            </Container>

            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
                <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
}
