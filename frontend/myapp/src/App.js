import './App.css';
import { Route, Routes } from 'react-router-dom';
import LandingPage from './pages/landingPage';
import Authentication from './pages/authentication';
import { AuthProvider } from './context/AuthContext';
import VideoMeetComponents from './pages/VideoMeet';
import History from './pages/history';
import HomeComponent from './pages/home';
import SummaryPage from './pages/SummaryPage';

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path='/auth' element={<Authentication />} />
          <Route path='/history' element={<History />} />
          <Route path='/home' element={<HomeComponent />} />
          <Route path='/summary/:meetingCode' element={<SummaryPage />} />
          <Route path='/:url' element={<VideoMeetComponents />} />
        </Routes>
      </AuthProvider>
    </div>
  );
}

export default App;
