import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, CircularProgress, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import server from '../environment.js';

export default function SummaryPage() {
    const { meetingCode } = useParams();
    const router = useNavigate();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const server_url = process.env.NODE_ENV === "production" ? server.prod : server.dev;

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
        <Box sx={{ minHeight: '100vh', backgroundColor: '#FFFFFF', pt: { xs: 4, md: 8 }, pb: 12 }}>
            <Container maxWidth="md" sx={{ maxWidth: '680px !important' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 6, gap: 1 }}>
                    <IconButton
                        onClick={() => router("/history")}
                        sx={{ 
                            color: 'rgba(0, 0, 0, 0.54)', 
                            '&:hover': { color: 'rgba(0, 0, 0, 0.84)', backgroundColor: 'transparent' },
                            ml: -1.5 
                        }}
                        aria-label="back"
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography 
                        sx={{ 
                            color: 'rgba(0, 0, 0, 0.54)', 
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                            fontSize: '15px',
                            fontWeight: 400
                        }}
                    >
                        Meeting Code: {meetingCode}
                    </Typography>
                </Box>

                <Typography 
                    variant="h1" 
                    sx={{ 
                        fontWeight: 700, 
                        color: 'rgba(0, 0, 0, 0.84)', 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                        fontSize: { xs: '32px', md: '42px' },
                        lineHeight: 1.2,
                        letterSpacing: '-0.02em',
                        mb: 5
                    }}
                >
                    AI Meeting Summary
                </Typography>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                        <CircularProgress sx={{ color: 'rgba(0,0,0,0.84)' }} />
                    </Box>
                ) : error ? (
                    <Typography sx={{ color: '#d93025', fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif', fontSize: '20px' }}>
                        {error}
                    </Typography>
                ) : summary ? (
                    <Box 
                        sx={{ 
                            whiteSpace: 'pre-wrap', 
                            lineHeight: 1.58, 
                            fontSize: '20px', 
                            color: 'rgba(0, 0, 0, 0.84)',
                            fontFamily: 'charter, Georgia, Cambria, "Times New Roman", Times, serif',
                            wordBreak: 'break-word',
                            letterSpacing: '-0.003em',
                            '& p': {
                                mb: '32px'
                            }
                        }}
                    >
                        {summary}
                    </Box>
                ) : (
                    <Typography sx={{ color: 'rgba(0, 0, 0, 0.54)', fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif', fontSize: '20px', fontStyle: 'italic' }}>
                        No summary is available for this meeting.
                    </Typography>
                )}
            </Container>
        </Box>
    );
}
