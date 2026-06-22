import React, { useRef, useState, useEffect } from 'react';
import { Box, IconButton, Tooltip, Slider, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import StopIcon from '@mui/icons-material/Stop';

export default function Whiteboard({ socket }) {
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(5);
    const [isEraser, setIsEraser] = useState(false);

    // Initialize Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        // Make canvas fill the parent container natively
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        const context = canvas.getContext("2d");
        context.lineCap = "round";
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        contextRef.current = context;

        // Handle window resize
        const handleResize = () => {
            // Save current drawing
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            context.lineCap = "round";
            context.putImageData(imageData, 0, 0);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Listen for socket events
    useEffect(() => {
        if (!socket) return;

        const handleAction = (data) => {
            const context = contextRef.current;
            if (!context) return;

            if (data.type === 'clear') {
                context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                return;
            }

            if (data.type === 'draw') {
                context.beginPath();
                context.moveTo(data.prevX * canvasRef.current.width, data.prevY * canvasRef.current.height);
                context.lineTo(data.x * canvasRef.current.width, data.y * canvasRef.current.height);
                context.strokeStyle = data.color;
                context.lineWidth = data.lineWidth;
                context.stroke();
                context.closePath();
            }
        };

        socket.on("whiteboard-action", handleAction);
        return () => socket.off("whiteboard-action", handleAction);
    }, [socket]);

    const startDrawing = ({ nativeEvent }) => {
        const { offsetX, offsetY } = getCoordinates(nativeEvent);
        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const finishDrawing = () => {
        contextRef.current.closePath();
        setIsDrawing(false);
    };

    const draw = ({ nativeEvent }) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = getCoordinates(nativeEvent);
        
        // Use eraser or selected color
        const strokeColor = isEraser ? '#ffffff' : color;
        
        // Draw locally
        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.strokeStyle = strokeColor;
        contextRef.current.lineWidth = lineWidth;
        contextRef.current.stroke();

        // Calculate relative positions to broadcast
        const canvas = canvasRef.current;
        const x = offsetX / canvas.width;
        const y = offsetY / canvas.height;
        const prevX = contextRef.current.lastX !== undefined ? contextRef.current.lastX : x;
        const prevY = contextRef.current.lastY !== undefined ? contextRef.current.lastY : y;

        // Emit to others
        socket.emit("whiteboard-action", {
            type: 'draw',
            x, y, prevX, prevY,
            color: strokeColor,
            lineWidth
        });

        contextRef.current.lastX = x;
        contextRef.current.lastY = y;
    };

    const getCoordinates = (event) => {
        if (event.touches && event.touches.length > 0) {
            const rect = canvasRef.current.getBoundingClientRect();
            return {
                offsetX: event.touches[0].clientX - rect.left,
                offsetY: event.touches[0].clientY - rect.top
            };
        }
        return { offsetX: event.offsetX, offsetY: event.offsetY };
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
        socket.emit("whiteboard-action", { type: 'clear' });
    };

    // Keep track of last coordinates for smoother drawing paths
    const handleMove = (e) => {
        draw(e);
        const canvas = canvasRef.current;
        const { offsetX, offsetY } = getCoordinates(e.nativeEvent);
        contextRef.current.lastX = offsetX / canvas.width;
        contextRef.current.lastY = offsetY / canvas.height;
    };

    const colors = ['#000000', '#ea4335', '#34a853', '#4285f4', '#fbbc05', '#9c27b0'];

    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden' }}>
            {/* Toolbar */}
            <Box sx={{ display: 'flex', alignItems: 'center', p: 1, backgroundColor: '#f1f3f4', borderBottom: '1px solid #e0e0e0', gap: 2 }}>
                <Typography sx={{ fontWeight: 600, ml: 1, mr: 2, fontFamily: "'Space Grotesk', sans-serif" }}>Whiteboard</Typography>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {colors.map(c => (
                        <Box 
                            key={c}
                            onClick={() => { setColor(c); setIsEraser(false); }}
                            sx={{ 
                                width: 24, height: 24, borderRadius: '50%', backgroundColor: c, 
                                cursor: 'pointer', border: color === c && !isEraser ? '2px solid #202124' : '2px solid transparent',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                            }}
                        />
                    ))}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                    <Tooltip title="Eraser">
                        <IconButton 
                            onClick={() => setIsEraser(true)} 
                            sx={{ backgroundColor: isEraser ? '#d2e3fc' : 'transparent', color: '#5f6368' }}
                        >
                            <Box sx={{ width: 20, height: 20, border: '2px solid #5f6368', borderRadius: '4px' }} />
                        </IconButton>
                    </Tooltip>
                </Box>

                <Box sx={{ width: 100, ml: 2 }}>
                    <Slider 
                        size="small"
                        value={lineWidth} 
                        onChange={(e, val) => setLineWidth(val)} 
                        min={1} 
                        max={20}
                        sx={{ color: '#5f6368' }}
                    />
                </Box>

                <Box sx={{ flexGrow: 1 }} />

                <Tooltip title="Clear Canvas">
                    <IconButton onClick={handleClear} sx={{ color: '#ea4335' }}>
                        <DeleteIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Drawing Area */}
            <Box sx={{ flexGrow: 1, position: 'relative', cursor: isEraser ? 'cell' : 'crosshair' }}>
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseUp={finishDrawing}
                    onMouseMove={handleMove}
                    onMouseLeave={finishDrawing}
                    onTouchStart={startDrawing}
                    onTouchEnd={finishDrawing}
                    onTouchMove={handleMove}
                    style={{ width: '100%', height: '100%', touchAction: 'none' }}
                />
            </Box>
        </Box>
    );
}
