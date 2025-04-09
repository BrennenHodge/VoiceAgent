const axios = require('axios');
const Agent = require('../models/Agent');
const Document = require('../models/Document');
const User = require('../models/User');

// Vapi API configuration
const VAPI_API_URL = 'https://api.vapi.ai';
const getVapiConfig = (apiKey) => {
  return {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  };
};

// @desc    Create a Vapi assistant
// @route   POST /api/agents
// @access  Private
exports.createAgent = async (req, res) => {
  try {
    const { name, description, firstMessage, firstMessageMode, documentIds } = req.body;
    
    // Validate input
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name and description'
      });
    }

    // Create agent in database first
    const agent = await Agent.create({
      name,
      description,
      firstMessage: firstMessage || 'Hello, I am your voice assistant. How can I help you today?',
      firstMessageMode: firstMessageMode || 'assistant-speaks-first',
      user: req.user.id
    });

    // Add documents to agent if provided
    if (documentIds && documentIds.length > 0) {
      // Verify all documents exist and belong to user
      const documents = await Document.find({
        _id: { $in: documentIds },
        user: req.user.id
      });

      if (documents.length !== documentIds.length) {
        return res.status(400).json({
          success: false,
          error: 'One or more documents not found or not owned by user'
        });
      }

      agent.documents = documentIds;
      await agent.save();
    }

    res.status(201).json({
      success: true,
      data: agent
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get all agents for a user
// @route   GET /api/agents
// @access  Private
exports.getAgents = async (req, res) => {
  try {
    const agents = await Agent.find({ user: req.user.id }).populate('documents');

    res.status(200).json({
      success: true,
      count: agents.length,
      data: agents
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get single agent
// @route   GET /api/agents/:id
// @access  Private
exports.getAgent = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id).populate('documents');

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    // Make sure user owns agent
    if (agent.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this agent'
      });
    }

    res.status(200).json({
      success: true,
      data: agent
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update agent
// @route   PUT /api/agents/:id
// @access  Private
exports.updateAgent = async (req, res) => {
  try {
    let agent = await Agent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    // Make sure user owns agent
    if (agent.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this agent'
      });
    }

    agent = await Agent.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: agent
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete agent
// @route   DELETE /api/agents/:id
// @access  Private
exports.deleteAgent = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    // Make sure user owns agent
    if (agent.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this agent'
      });
    }

    // If agent has a Vapi assistant ID, delete it from Vapi
    if (agent.vapiAssistantId) {
      try {
        const user = await User.findById(req.user.id);
        const vapiConfig = getVapiConfig(user.vapiApiKey);
        await axios.delete(`${VAPI_API_URL}/assistant/${agent.vapiAssistantId}`, vapiConfig);
      } catch (vapiError) {
        console.error('Error deleting Vapi assistant:', vapiError);
        // Continue with deletion even if Vapi deletion fails
      }
    }

    await agent.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Deploy agent to Vapi
// @route   POST /api/agents/:id/deploy
// @access  Private
exports.deployAgent = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id).populate('documents');

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    // Make sure user owns agent
    if (agent.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to deploy this agent'
      });
    }

    // Get user for Vapi API key
    const user = await User.findById(req.user.id);
    
    if (!user.vapiApiKey) {
      return res.status(400).json({
        success: false,
        error: 'Vapi API key not found. Please update your settings.'
      });
    }

    const vapiConfig = getVapiConfig(user.vapiApiKey);

    // Create or update Vapi assistant
    let vapiAssistantId = agent.vapiAssistantId;
    let vapiResponse;

    const assistantData = {
      name: agent.name,
      model: {
        provider: "anthropic",
        model: "claude-3-opus-20240229",
        temperature: 0.7,
        systemPrompt: `You are a voice assistant named ${agent.name}. ${agent.description}`
      },
      voice: {
        provider: "11labs",
        voiceId: "rachel"
      },
      firstMessage: agent.firstMessage,
      firstMessageMode: agent.firstMessageMode
    };

    if (vapiAssistantId) {
      // Update existing assistant
      vapiResponse = await axios.patch(
        `${VAPI_API_URL}/assistant/${vapiAssistantId}`,
        assistantData,
        vapiConfig
      );
    } else {
      // Create new assistant
      vapiResponse = await axios.post(
        `${VAPI_API_URL}/assistant`,
        assistantData,
        vapiConfig
      );
      vapiAssistantId = vapiResponse.data.id;
      
      // Update agent with Vapi assistant ID
      agent.vapiAssistantId = vapiAssistantId;
      await agent.save();
    }

    // Create tools for each document
    if (agent.documents && agent.documents.length > 0) {
      for (const document of agent.documents) {
        let toolData;
        
        if (document.type === 'text') {
          toolData = {
            type: 'dtmf',
            function: {
              name: `knowledge_${document._id}`,
              description: document.title,
              parameters: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "The query to search for in the knowledge base"
                  }
                },
                required: ["query"]
              }
            },
            messages: [
              {
                role: "function",
                content: document.content
              }
            ]
          };
        } else if (document.type === 'url') {
          toolData = {
            type: 'dtmf',
            function: {
              name: `knowledge_${document._id}`,
              description: document.title,
              parameters: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "The query to search for in the knowledge base"
                  }
                },
                required: ["query"]
              }
            },
            messages: [
              {
                role: "function",
                content: `URL: ${document.content}`
              }
            ]
          };
        }
        
        if (toolData) {
          if (document.vapiToolId) {
            // Update existing tool
            await axios.patch(
              `${VAPI_API_URL}/tool/${document.vapiToolId}`,
              toolData,
              vapiConfig
            );
          } else {
            // Create new tool
            const toolResponse = await axios.post(
              `${VAPI_API_URL}/tool`,
              toolData,
              vapiConfig
            );
            
            // Update document with Vapi tool ID
            document.vapiToolId = toolResponse.data.id;
            await document.save();
            
            // Connect tool to assistant
            await axios.post(
              `${VAPI_API_URL}/assistant/${vapiAssistantId}/tool`,
              { toolId: toolResponse.data.id },
              vapiConfig
            );
          }
        }
      }
    }

    // Mark agent as active
    agent.isActive = true;
    await agent.save();

    res.status(200).json({
      success: true,
      data: agent
    });
  } catch (error) {
    console.error('Error deploying agent:', error.response?.data || error.message);
    res.status(400).json({
      success: false,
      error: error.response?.data?.error || error.message
    });
  }
};
