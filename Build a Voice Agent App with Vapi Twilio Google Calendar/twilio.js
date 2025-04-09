const axios = require('axios');
const Agent = require('../models/Agent');
const User = require('../models/User');

// @desc    Connect Twilio phone number to Vapi agent
// @route   POST /api/twilio/connect
// @access  Private
exports.connectTwilioToVapi = async (req, res) => {
  try {
    const { agentId } = req.body;
    
    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an agent ID'
      });
    }

    // Get the agent
    const agent = await Agent.findById(agentId);
    
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
        error: 'Not authorized to connect this agent'
      });
    }

    // Check if agent has been deployed to Vapi
    if (!agent.vapiAssistantId) {
      return res.status(400).json({
        success: false,
        error: 'Agent must be deployed to Vapi first'
      });
    }

    // Get user for Twilio credentials
    const user = await User.findById(req.user.id);
    
    if (!user.twilioApiKey || !user.twilioApiSecret || !user.twilioPhoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Twilio credentials not found. Please update your settings.'
      });
    }

    // Configure Twilio client
    const accountSid = user.twilioApiKey;
    const authToken = user.twilioApiSecret;
    const twilioClient = require('twilio')(accountSid, authToken);

    // Get Vapi webhook URL for the assistant
    const vapiWebhookUrl = `https://api.vapi.ai/phone/call/${agent.vapiAssistantId}`;

    // Update Twilio phone number with Vapi webhook
    await twilioClient.incomingPhoneNumbers
      .list({ phoneNumber: user.twilioPhoneNumber })
      .then(async (incomingPhoneNumbers) => {
        if (incomingPhoneNumbers.length === 0) {
          throw new Error('Phone number not found in your Twilio account');
        }
        
        // Update the first matching phone number
        await twilioClient.incomingPhoneNumbers(incomingPhoneNumbers[0].sid)
          .update({
            voiceUrl: vapiWebhookUrl,
            voiceMethod: 'POST'
          });
      });

    res.status(200).json({
      success: true,
      message: 'Twilio phone number connected to Vapi agent successfully',
      data: {
        phoneNumber: user.twilioPhoneNumber,
        vapiWebhookUrl
      }
    });
  } catch (error) {
    console.error('Error connecting Twilio to Vapi:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get Twilio call logs
// @route   GET /api/twilio/calls
// @access  Private
exports.getTwilioCalls = async (req, res) => {
  try {
    // Get user for Twilio credentials
    const user = await User.findById(req.user.id);
    
    if (!user.twilioApiKey || !user.twilioApiSecret) {
      return res.status(400).json({
        success: false,
        error: 'Twilio credentials not found. Please update your settings.'
      });
    }

    // Configure Twilio client
    const accountSid = user.twilioApiKey;
    const authToken = user.twilioApiSecret;
    const twilioClient = require('twilio')(accountSid, authToken);

    // Get call logs
    const calls = await twilioClient.calls.list({
      limit: 20
    });

    res.status(200).json({
      success: true,
      count: calls.length,
      data: calls
    });
  } catch (error) {
    console.error('Error getting Twilio calls:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
