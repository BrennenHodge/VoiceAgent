import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GoogleCalendarSettings = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedCalendar, setSelectedCalendar] = useState('');
  const [showEvents, setShowEvents] = useState(false);

  // Check if user has connected Google Calendar
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };

        const res = await axios.get('/api/auth/me', config);
        setIsConnected(res.data.data.googleCalendarConnected);
        
        // If connected, fetch calendars
        if (res.data.data.googleCalendarConnected) {
          fetchCalendars();
        }
      } catch (err) {
        console.error('Error checking connection:', err);
      }
    };

    checkConnection();
  }, []);

  const connectGoogleCalendar = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const res = await axios.get('/api/calendar/auth-url', config);
      window.location.href = res.data.url;
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error connecting to Google Calendar');
      setLoading(false);
    }
  };

  const fetchCalendars = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const res = await axios.get('/api/calendar/list', config);
      setCalendars(res.data.data);
      setLoading(false);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error fetching calendars');
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    if (!selectedCalendar) {
      setMessage('Please select a calendar');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const res = await axios.get(`/api/calendar/events?calendarId=${selectedCalendar}`, config);
      setEvents(res.data.data);
      setShowEvents(true);
      setLoading(false);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error fetching events');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleCalendarChange = (e) => {
    setSelectedCalendar(e.target.value);
    setShowEvents(false);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Google Calendar Integration</h2>
      
      {message && (
        <div className={`p-4 mb-6 rounded ${message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}
      
      {!isConnected ? (
        <div>
          <p className="mb-4">Connect your Google Calendar to enable scheduling capabilities for your voice agent.</p>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={connectGoogleCalendar}
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Connect Google Calendar'}
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-6 p-3 bg-green-100 text-green-700 rounded">
            ✓ Google Calendar is connected
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="calendar">
              Select Calendar
            </label>
            <div className="flex">
              <select
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="calendar"
                value={selectedCalendar}
                onChange={handleCalendarChange}
              >
                <option value="">Select a calendar</option>
                {calendars.map(calendar => (
                  <option key={calendar.id} value={calendar.id}>{calendar.summary}</option>
                ))}
              </select>
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ml-2"
                onClick={fetchEvents}
                disabled={loading || !selectedCalendar}
              >
                View Events
              </button>
            </div>
          </div>
          
          {showEvents && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Upcoming Events</h3>
              
              {events.length === 0 ? (
                <p className="text-gray-500">No upcoming events found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Start
                        </th>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          End
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event) => (
                        <tr key={event.id}>
                          <td className="py-2 px-4 border-b border-gray-200">
                            {event.summary}
                          </td>
                          <td className="py-2 px-4 border-b border-gray-200">
                            {formatDate(event.start?.dateTime || event.start?.date)}
                          </td>
                          <td className="py-2 px-4 border-b border-gray-200">
                            {formatDate(event.end?.dateTime || event.end?.date)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">How Google Calendar Integration Works</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Connect your Google Calendar account using the button above</li>
          <li>Your voice agent will be able to check your availability and schedule appointments</li>
          <li>When callers ask to schedule a meeting, the agent will check your calendar for free time slots</li>
          <li>The agent will suggest available times and create calendar events when confirmed</li>
          <li>You'll receive calendar invitations for all scheduled appointments</li>
        </ol>
      </div>
    </div>
  );
};

export default GoogleCalendarSettings;
