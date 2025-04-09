import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AgentConfiguration = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [firstMessage, setFirstMessage] = useState('Hello, I am your voice assistant. How can I help you today?');
  const [firstMessageMode, setFirstMessageMode] = useState('assistant-speaks-first');
  const [documents, setDocuments] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);

  // Fetch user's documents on component mount
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };

        const res = await axios.get('/api/documents', config);
        setDocuments(res.data.data);
      } catch (err) {
        console.error('Error fetching documents:', err);
      }
    };

    const fetchAgents = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };

        const res = await axios.get('/api/agents', config);
        setAgents(res.data.data);
      } catch (err) {
        console.error('Error fetching agents:', err);
      }
    };

    fetchDocuments();
    fetchAgents();
  }, []);

  const handleDocumentSelect = (e) => {
    const options = e.target.options;
    const selectedValues = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    setSelectedDocuments(selectedValues);
  };

  const handleAgentSelect = (e) => {
    const agentId = e.target.value;
    if (agentId === '') {
      setSelectedAgent(null);
      resetForm();
      return;
    }

    const agent = agents.find(a => a._id === agentId);
    setSelectedAgent(agent);
    setName(agent.name);
    setDescription(agent.description);
    setFirstMessage(agent.firstMessage);
    setFirstMessageMode(agent.firstMessageMode);
    setSelectedDocuments(agent.documents.map(doc => doc._id));
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setFirstMessage('Hello, I am your voice assistant. How can I help you today?');
    setFirstMessageMode('assistant-speaks-first');
    setSelectedDocuments([]);
  };

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

      const agentData = {
        name,
        description,
        firstMessage,
        firstMessageMode,
        documentIds: selectedDocuments
      };

      let res;
      if (selectedAgent) {
        // Update existing agent
        res = await axios.put(`/api/agents/${selectedAgent._id}`, agentData, config);
        setMessage('Agent updated successfully');
      } else {
        // Create new agent
        res = await axios.post('/api/agents', agentData, config);
        setMessage('Agent created successfully');
        resetForm();
      }

      // Refresh agents list
      const agentsRes = await axios.get('/api/agents', config);
      setAgents(agentsRes.data.data);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error configuring agent');
    }
    setLoading(false);
  };

  const handleDeploy = async (agentId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      await axios.post(`/api/agents/${agentId}/deploy`, {}, config);
      setMessage('Agent deployed successfully');

      // Refresh agents list
      const agentsRes = await axios.get('/api/agents', config);
      setAgents(agentsRes.data.data);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error deploying agent');
    }
    setLoading(false);
  };

  const handleConnectTwilio = async (agentId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };

      await axios.post('/api/twilio/connect', { agentId }, config);
      setMessage('Twilio connected successfully');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error connecting Twilio');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6">Voice Agent Configuration</h2>
      
      {message && (
        <div className={`p-4 mb-6 rounded ${message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-semibold mb-4">Configure Agent</h3>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="agentSelect">
              Select Existing Agent (Optional)
            </label>
            <select
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="agentSelect"
              onChange={handleAgentSelect}
              value={selectedAgent ? selectedAgent._id : ''}
            >
              <option value="">Create New Agent</option>
              {agents.map(agent => (
                <option key={agent._id} value={agent._id}>{agent.name}</option>
              ))}
            </select>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                Agent Name
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="name"
                type="text"
                placeholder="Enter agent name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                Description
              </label>
              <textarea
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="description"
                placeholder="Enter agent description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
                required
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstMessage">
                First Message
              </label>
              <textarea
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="firstMessage"
                placeholder="Enter first message"
                value={firstMessage}
                onChange={(e) => setFirstMessage(e.target.value)}
                rows="2"
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstMessageMode">
                First Message Mode
              </label>
              <select
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="firstMessageMode"
                value={firstMessageMode}
                onChange={(e) => setFirstMessageMode(e.target.value)}
              >
                <option value="assistant-speaks-first">Assistant Speaks First</option>
                <option value="assistant-waits-for-user">Assistant Waits for User</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="documents">
                Knowledge Base Documents
              </label>
              <select
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="documents"
                multiple
                size="5"
                value={selectedDocuments}
                onChange={handleDocumentSelect}
              >
                {documents.map(doc => (
                  <option key={doc._id} value={doc._id}>{doc.title}</option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple documents</p>
            </div>
            
            <div className="flex items-center justify-between">
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Processing...' : selectedAgent ? 'Update Agent' : 'Create Agent'}
              </button>
              {selectedAgent && (
                <button
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ml-2"
                  type="button"
                  onClick={() => {
                    setSelectedAgent(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-4">Your Agents</h3>
          
          {agents.length === 0 ? (
            <p className="text-gray-500">No agents created yet.</p>
          ) : (
            <div className="space-y-4">
              {agents.map(agent => (
                <div key={agent._id} className="border rounded-lg p-4 bg-white shadow">
                  <h4 className="text-lg font-semibold">{agent.name}</h4>
                  <p className="text-gray-600 mb-2">{agent.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {agent.documents.map(doc => (
                      <span key={doc._id} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {doc.title}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-1 px-3 rounded"
                      onClick={() => setSelectedAgent(agent)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-3 rounded"
                      onClick={() => handleDeploy(agent._id)}
                      disabled={loading}
                    >
                      {agent.isActive ? 'Redeploy' : 'Deploy to Vapi'}
                    </button>
                    {agent.isActive && (
                      <button
                        className="bg-purple-500 hover:bg-purple-600 text-white text-sm py-1 px-3 rounded"
                        onClick={() => handleConnectTwilio(agent._id)}
                        disabled={loading}
                      >
                        Connect Twilio
                      </button>
                    )}
                  </div>
                  {agent.isActive && (
                    <div className="mt-2">
                      <span className="text-green-600 text-sm">✓ Deployed to Vapi</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentConfiguration;
