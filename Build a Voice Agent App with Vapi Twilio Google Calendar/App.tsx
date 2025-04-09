import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Components
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import DocumentUpload from './components/DocumentUpload';
import AgentConfiguration from './components/AgentConfiguration';
import TwilioSettings from './components/TwilioSettings';
import GoogleCalendarSettings from './components/GoogleCalendarSettings';

// Styles
import './styles/tailwind.css';

// Set base URL for axios
axios.defaults.baseURL = 'http://localhost:5000';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  const setAuth = (boolean) => {
    setIsAuthenticated(boolean);
  };

  // Protected route component
  const PrivateRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navbar isAuthenticated={isAuthenticated} setAuth={setAuth} />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/login" element={<Login setAuth={setAuth} />} />
            <Route path="/register" element={<Register setAuth={setAuth} />} />
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/documents" element={
              <PrivateRoute>
                <DocumentUpload />
              </PrivateRoute>
            } />
            <Route path="/agents" element={
              <PrivateRoute>
                <AgentConfiguration />
              </PrivateRoute>
            } />
            <Route path="/twilio" element={
              <PrivateRoute>
                <TwilioSettings />
              </PrivateRoute>
            } />
            <Route path="/calendar" element={
              <PrivateRoute>
                <GoogleCalendarSettings />
              </PrivateRoute>
            } />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
