// src/App.jsx
import { Routes, Route, Link } from 'react-router-dom';
import ForecastDisplay from './components/ForecastDisplay';
import RainReportForm from './components/RainReportForm';
import RainReportList from './components/RainReportList';
import MapDisplayLeaflet from './components/MapDisplayLeaflet';
import AdminPage from './components/AdminPage';

// Import our new wrapper!
import WeatherBackground from './components/WeatherBackground';

function MainLayout() {
  return (
    <>
      <header className="text-center mb-8">
        {/* Added some text shadows for better visibility against backgrounds */}
        <h1 className="text-4xl font-bold text-blue-600 drop-shadow-md">
          <Link to="/">Mumbai Weather Updates</Link>
        </h1>
        <p className="text-md text-gray-800 font-medium drop-shadow-sm">Your hyperlocal weather source</p>
      </header>

      <main className="max-w-4xl mx-auto space-y-10 md:space-y-12 px-2 sm:px-4">
        {/* 
            Note for later: To make these components look modern, 
            we will add glassmorphism classes to them (bg-white/70 backdrop-blur-md) 
        */}
        <ForecastDisplay />
        <RainReportForm />
        <MapDisplayLeaflet />
        <RainReportList />
      </main>
    </>
  );
}

function App() {
  return (
    <div className="min-h-screen">
      {/* Our Animated Background Component goes here */}
      <WeatherBackground />

      <div className="relative z-10 pb-8 pt-4">
        <Routes>
          <Route path="/" element={<MainLayout />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>

        <footer className="text-center mt-12 text-sm font-semibold text-gray-800 drop-shadow-sm">
          <p>&copy; {new Date().getFullYear()} Parth_GPT Weather</p>
          <Link to="/admin" className="text-xs text-gray-600 hover:text-gray-900 ml-2">(Admin)</Link>
        </footer>
      </div>
    </div>
  );
}

export default App;