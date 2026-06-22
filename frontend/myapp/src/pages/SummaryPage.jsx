import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, CircularProgress, IconButton, Paper, Divider } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function SummaryPage() {
    const { meetingCode } = useParams();
    const router = useNavigate();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const server_url = `http://${window.location.hostname}:8000`;

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await fetch(`${server_url}/api/v1/users/summary/${meetingCode}`);
                if (res.ok) {
                    const data = await res.json();
                    setSummary(data.summary);
                } else {
                    const errData = await res.json();
                    setError(errData.message || "Failed to load summary.");
                }
            } catch (e) {
                console.error(e);
                setError("An error occurred while fetching the summary.");
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [meetingCode, server_url]);

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#f4f7f6', pt: 4, pb: 8, fontFamily: "'Space Grotesk', sans-serif" }}>
            <Container maxWidth="md">
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
                    <IconButton
                        onClick={() => router("/history")}
                        sx={{ backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', '&:hover': { backgroundColor: '#f0f0f0' } }}
                    >
                        <ArrowBackIcon sx={{ color: '#1a73e8' }} />
                    </IconButton>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#292929', fontFamily: "'Space Grotesk', sans-serif" }}>
                        AI Meeting Summary
                    </Typography>
                </Box>

                <Paper elevation={0} sx={{ p: 4, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    <Typography variant="h6" sx={{ color: '#1a73e8', fontWeight: 600, mb: 1 }}>
                        Meeting Code: {meetingCode}
                    </Typography>
                    <Divider sx={{ mb: 4 }} />

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                            <CircularProgress />
                        </Box>
                    ) : error ? (
                        <Typography sx={{ color: 'red', textAlign: 'center' }}>
                            {error}
                        </Typography>
                    ) : summary ? (
                        <Box sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '1.1rem', color: '#444' }}>
                            {/* Simple rendering for markdown-like text */}
                            {summary}
                        </Box>
                    ) : (
                        <Typography sx={{ textAlign: 'center', color: '#757575' }}>
                            No summary is available for this meeting.
                        </Typography>
                    )}
                </Paper>
            </Container>
        </Box>
    );
}
