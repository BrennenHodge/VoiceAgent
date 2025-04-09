import React, { useState } from 'react';
import axios from 'axios';

const TwilioSettings = () => {
  const [twilioApiKey, setTwilioApiKey] = useState('');
  const [twilioApiSecret, setTwilioApiSecret] = useState('');
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [callLogs, setCallLogs] = useState([]);
  const [showCallLogs, setShowCallLogs] = useState(false);

  // Fetch user's Twilio settings on component mount
  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };

        const res = await axios.get('/api/auth/me', config);
        if (res.data.data.twilioApiKey) {
          setTwilioApiKey(res.data.data.twilioApiKey);
        }
        if (res.data.data.twilioApiSecret) {
          setTwilioApiSecret(res.data.data.twilioApiSecret);
        }
        if (res.data.data.twilioPhoneNumber) {
          setTwilioPhoneNumber(res.data.data.twilioPhoneNumber);
        }
      } catch (err) {
        console.error('Error fetching user settings:', err);
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };

      const body = {
        twilioApiKey,
        twilioApiSecret,
        twilioPhoneNumber
      };

      await axios.put('/api/auth/updatetwilio', body, config);
      setMessage('Twilio settings updated successfully');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error updating Twilio settings');
    }
    setLoading(false);
  };

  const fetchCallLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const res = await axios.get('/api/twilio/calls', config);
      setCallLogs(res.data.data);
      setShowCallLogs(true);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error fetching call logs');
    }
    setLoading(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Twilio Settings</h2>
      
      {message && (
        <div className={`p-4 mb-6 rounded ${message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="twilioApiKey">
            Twilio Account SID
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="twilioApiKey"
            type="text"
            placeholder="Enter your Twilio Account SID"
            value={twilioApiKey}
            onChange={(e) => setTwilioApiKey(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="twilioApiSecret">
            Twilio Auth Token
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="twilioApiSecret"
            type="password"
            placeholder="Enter your Twilio Auth Token"
            value={twilioApiSecret}
            onChange={(e) => setTwilioApiSecret(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="twilioPhoneNumber">
            Twilio Phone Number
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="twilioPhoneNumber"
            type="text"
            placeholder="Enter your Twilio Phone Number (e.g., +15551234567)"
            value={twilioPhoneNumber}
            onChange={(e) => setTwilioPhoneNumber(e.target.value)}
            required
          />
          <p className="text-sm text-gray-500 mt-1">Include country code (e.g., +1 for US)</p>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Settings'}
          </button>
          
          <button
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="button"
            onClick={fetchCallLogs}
            disabled={loading || !twilioApiKey || !twilioApiSecret}
          >
            View Call Logs
          </button>
        </div>
      </form>
      
      {showCallLogs && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Recent Call Logs</h3>
          
          {callLogs.length === 0 ? (
            <p className="text-gray-500">No call logs found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      From
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      To
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {callLogs.map((call) => (
                    <tr key={call.sid}>
                      <td className="py-2 px-4 border-b border-gray-200">
                        {formatDate(call.dateCreated)}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200">
                        {call.from}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200">
                        {call.to}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200">
                        {call.status}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200">
                        {call.duration} sec
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">How to Get Twilio Credentials</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Sign up for a Twilio account at <a href="https://www.twilio.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">www.twilio.com</a></li>
          <li>Purchase a phone number from the Twilio console</li>
          <li>Find your Account SID and Auth Token on the Twilio dashboard</li>
          <li>Enter these credentials here to connect your Twilio account</li>
          <li>After updating your settings, go to the Agent Configuration page to connect your agent to your Twilio phone number</li>
        </ol>
      </div>
    </div>
  );
};

export default TwilioSettings;
