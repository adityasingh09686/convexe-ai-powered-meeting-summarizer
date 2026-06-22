import * as React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';

export default function Content() {
  return (
    <Stack
      sx={{ flexDirection: 'column', alignSelf: 'center', gap: 4, maxWidth: 450 }}
    >
      <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
        <VideocamRoundedIcon sx={{ fontSize: 50, color: 'primary.main', mr: 2 }} />
        <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif' }}>
          Convexe
        </Typography>
      </Box>
      <Typography variant="h5" sx={{ fontWeight: 400, opacity: 0.8 }}>
        "Where independent nodes connects into a singular, unbroken network."
      </Typography>
    </Stack>
  );
}
