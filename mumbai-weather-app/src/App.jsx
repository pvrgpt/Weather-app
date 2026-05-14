// src/App.jsx
import { Routes, Route, Link } from 'react-router-dom';
import ForecastDisplay from './components/ForecastDisplay';
import RainReportForm from './components/RainReportForm';   // <-- Add this
import RainReportList from './components/RainReportList';
import MapDisplayLeaflet from './components/MapDisplayLeaflet';
import AdminPage from './components/AdminPage';

function MainLayout() {
  return (
    <>
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-600">
          <Link to="/">Mumbai Weather Updates</Link> {/* <-- Make title a link to home */}
        </h1>
        <p className="text-md text-gray-600">Your hyperlocal weather source</p>
      </header>

      <main className="max-w-4xl mx-auto space-y-10 md:space-y-12 px-2 sm:px-4">
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
      <div className="relative z-10 pb-8 pt-4">
        <Routes>
          <Route path="/" element={<MainLayout />} />
          <Route path="/admin" element={<AdminPage />} /> {/* AdminPage will need its own styling updates */}
        </Routes>

        <footer className="text-center mt-12 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Parth_GPT Weather</p>
          <Link to="/admin" className="text-xs text-gray-400 hover:text-gray-600 ml-2">(Admin)</Link>
        </footer>
      </div>
    </div>
  );
}

export default App;