import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import { AuthContext } from '../../context/AuthContext';

export default function SignInCard() {
  const { handleLogin, handleRegister } = React.useContext(AuthContext);

  // 0 = Sign In, 1 = Sign Up
  const [form, setForm] = React.useState(0);
  const [name, setName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");

  // Notification states
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState(""); // "success" | "error"

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  const showNotification = (msg, severity) => {
    setMessage(msg);
    setError(severity);
    setOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form === 0) {
      try {
        await handleLogin(username, password);
        showNotification("Login successful!", "success");
      } catch (err) {
        showNotification(err.response?.data?.message || err.message || "Login failed", "error");
      }
    } else {
      try {
        await handleRegister(name, username, password);
        showNotification("Registration successful! Please sign in.", "success");
        setForm(0); // Switch to Sign In form
        setPassword(""); // Clear password
      } catch (err) {
        showNotification(err.response?.data?.message || err.message || "Registration failed", "error");
      }
    }
  };

  return (
    <Card variant="outlined" sx={{ width: '100%', maxWidth: 400, p: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography component="h1" variant="h4" sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}>
        {form === 0 ? "Sign in" : "Sign up"}
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          gap: 2,
        }}
      >
        {form === 1 && (
          <FormControl>
            <FormLabel htmlFor="full_name">Full Name</FormLabel>
            <TextField
              id="full_name"
              name="full_name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
              fullWidth
              variant="outlined"
            />
          </FormControl>
        )}

        <FormControl>
          <FormLabel htmlFor="username">Username</FormLabel>
          <TextField
            id="username"
            name="username"
            placeholder="your_username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus={form === 0}
            required
            fullWidth
            variant="outlined"
          />
        </FormControl>

        <FormControl>
          <FormLabel htmlFor="password">Password</FormLabel>
          <TextField
            name="password"
            placeholder="••••••"
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            fullWidth
            variant="outlined"
          />
        </FormControl>

        {form === 0 && (
          <FormControlLabel
            control={<Checkbox value="remember" color="primary" />}
            label="Remember me"
          />
        )}

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 2 }}
        >
          {form === 0 ? "Sign in" : "Sign up"}
        </Button>

        <Typography sx={{ textAlign: 'center' }}>
          {form === 0 ? "Don't have an account? " : "Already have an account? "}
          <Link
            component="button"
            type="button"
            onClick={() => {
              setForm(form === 0 ? 1 : 0);
              setError(""); // Clear errors on switch
            }}
            variant="body2"
            sx={{ alignSelf: 'center' }}
          >
            {form === 0 ? "Sign up" : "Sign in"}
          </Link>
        </Typography>
      </Box>

      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleClose} severity={error || 'info'} variant="filled" sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </Card>
  );
}
