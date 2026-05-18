// src/App.jsx
import { Routes, Route, Link } from 'react-router-dom';
import ForecastDisplay from './components/ForecastDisplay';
import RainReportForm from './components/RainReportForm';
import RainReportList from './components/RainReportList';
import MapDisplayLeaflet from './components/MapDisplayLeaflet';
import AdminPage from './components/AdminPage';

// Import our Animated Background Wrapper
import WeatherBackground from './components/WeatherBackground';

// 1. Import Notification Manager
import NotificationManager from './components/NotificationManager';

function MainLayout() {
  return (
    <>
      <header className="text-center mb-10 mt-4 px-4">
        {/* iOS Premium Gradient Text */}
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 drop-shadow-2xl">
          <Link to="/" className="bg-gradient-to-br from-white via-sky-100 to-sky-400 text-transparent bg-clip-text hover:opacity-90 transition-opacity">
            Mumbai Weather Updates
          </Link>
        </h1>
        <p className="text-base md:text-lg text-slate-300 font-medium tracking-wide drop-shadow-md">
          Your hyperlocal weather source
        </p>
      </header>

      <main className="max-w-4xl mx-auto space-y-10 md:space-y-12 px-3 sm:px-4">
        {/* All our beautifully glassified components go here */}
        <NotificationManager />
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
    // Added a custom selection color so when users highlight text, it matches the theme!
    <div className="min-h-screen font-sans selection:bg-sky-500/30 selection:text-sky-200 text-slate-100">

      {/* Our Animated Background Component goes right at the back */}
      <WeatherBackground />

      <div className="relative z-10 pb-10 pt-4 md:pt-8 flex flex-col min-h-screen">
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<MainLayout />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </div>

        {/* Footer updated for dark theme visibility */}
        <footer className="text-center mt-16 text-sm font-medium text-slate-400 drop-shadow-md pb-6">
          <p>&copy; {new Date().getFullYear()} Parth_GPT Weather</p>
          <Link
            to="/admin"
            className="inline-block mt-2 text-xs text-white/30 hover:text-sky-400 transition-colors duration-300"
          >
            (Admin Access)
          </Link>
        </footer>
      </div>
    </div>
  );
}

export default App;