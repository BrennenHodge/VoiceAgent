import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [agents, setAgents] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };

        // Fetch user data
        const userRes = await axios.get('/api/auth/me', config);
        setUser(userRes.data.data);

        // Fetch agents
        const agentsRes = await axios.get('/api/agents', config);
        setAgents(agentsRes.data.data);

        // Fetch documents
        const documentsRes = await axios.get('/api/documents', config);
        setDocuments(documentsRes.data.data);

        setLoading(false);
      } catch (err) {
        setError('Error fetching data. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <h2 className="text-3xl font-bold mb-6">Dashboard</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Account Overview</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Name:</span> {user?.name}</p>
            <p><span className="font-medium">Email:</span> {user?.email}</p>
            <p><span className="font-medium">Twilio Connected:</span> {user?.twilioPhoneNumber ? 'Yes' : 'No'}</p>
            <p><span className="font-medium">Google Calendar Connected:</span> {user?.googleCalendarConnected ? 'Yes' : 'No'}</p>
          </div>
        </div>
        
        {/* Voice Agents */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Voice Agents</h3>
          {agents.length === 0 ? (
            <p className="text-gray-500">No agents created yet.</p>
          ) : (
            <div className="space-y-3">
              {agents.slice(0, 3).map(agent => (
                <div key={agent._id} className="border-b pb-2">
                  <p className="font-medium">{agent.name}</p>
                  <p className="text-sm text-gray-600">{agent.isActive ? 'Active' : 'Not Deployed'}</p>
                </div>
              ))}
              {agents.length > 3 && (
                <p className="text-sm text-blue-500">+{agents.length - 3} more agents</p>
              )}
            </div>
          )}
          <div className="mt-4">
            <Link to="/agents" className="text-blue-500 hover:text-blue-700 font-medium">
              Manage Agents →
            </Link>
          </div>
        </div>
        
        {/* Knowledge Base */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Knowledge Base</h3>
          {documents.length === 0 ? (
            <p className="text-gray-500">No documents uploaded yet.</p>
          ) : (
            <div className="space-y-3">
              {documents.slice(0, 3).map(doc => (
                <div key={doc._id} className="border-b pb-2">
                  <p className="font-medium">{doc.title}</p>
                  <p className="text-sm text-gray-600">Type: {doc.type}</p>
                </div>
              ))}
              {documents.length > 3 && (
                <p className="text-sm text-blue-500">+{documents.length - 3} more documents</p>
              )}
            </div>
          )}
          <div className="mt-4">
            <Link to="/documents" className="text-blue-500 hover:text-blue-700 font-medium">
              Manage Documents →
            </Link>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link to="/documents" className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg text-center">
          Upload Document
        </Link>
        <Link to="/agents" className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg text-center">
          Create Voice Agent
        </Link>
        <Link to="/twilio" className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg text-center">
          Connect Twilio
        </Link>
        <Link to="/calendar" className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-lg text-center">
          Connect Google Calendar
        </Link>
      </div>
      
      {/* Getting Started Guide */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Getting Started</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Upload knowledge base documents (PDFs, text files, URLs)</li>
          <li>Configure your voice agent with a name and description</li>
          <li>Connect your Twilio account and phone number</li>
          <li>Connect your Google Calendar for scheduling capabilities</li>
          <li>Deploy your agent and start receiving calls!</li>
        </ol>
      </div>
    </div>
  );
};

export default Dashboard;
