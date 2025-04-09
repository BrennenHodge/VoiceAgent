const axios = require('axios');
const { google } = require('googleapis');
const User = require('../models/User');

// Google OAuth configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// @desc    Get Google OAuth URL
// @route   GET /api/calendar/auth-url
// @access  Private
exports.getAuthUrl = async (req, res) => {
  try {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: req.user.id // Pass user ID as state for verification
    });

    res.status(200).json({
      success: true,
      url
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Handle Google OAuth callback
// @route   POST /api/calendar/oauth-callback
// @access  Public
exports.handleOAuthCallback = async (req, res) => {
  try {
    const { code, state } = req.body;
    
    if (!code || !state) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code and state are required'
      });
    }

    // Get tokens from code
    const { tokens } = await oauth2Client.getToken(code);
    
    // Find user by ID (from state)
    const user = await User.findById(state);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Store tokens in user document
    user.googleCalendarConnected = true;
    user.googleRefreshToken = tokens.refresh_token;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Google Calendar connected successfully'
    });
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Helper function to get authenticated calendar client
const getCalendarClient = async (userId) => {
  const user = await User.findById(userId);
  
  if (!user || !user.googleRefreshToken) {
    throw new Error('Google Calendar not connected');
  }

  oauth2Client.setCredentials({
    refresh_token: user.googleRefreshToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
};

// @desc    List user's calendars
// @route   GET /api/calendar/list
// @access  Private
exports.listCalendars = async (req, res) => {
  try {
    const calendar = await getCalendarClient(req.user.id);
    
    const response = await calendar.calendarList.list();
    
    res.status(200).json({
      success: true,
      data: response.data.items
    });
  } catch (error) {
    console.error('Error listing calendars:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get calendar events
// @route   GET /api/calendar/events
// @access  Private
exports.getEvents = async (req, res) => {
  try {
    const { calendarId, timeMin, timeMax } = req.query;
    
    if (!calendarId) {
      return res.status(400).json({
        success: false,
        error: 'Calendar ID is required'
      });
    }

    const calendar = await getCalendarClient(req.user.id);
    
    const response = await calendar.events.list({
      calendarId,
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default to 30 days ahead
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    res.status(200).json({
      success: true,
      data: response.data.items
    });
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Create calendar event
// @route   POST /api/calendar/events
// @access  Private
exports.createEvent = async (req, res) => {
  try {
    const { calendarId, summary, description, start, end, attendees } = req.body;
    
    if (!calendarId || !summary || !start || !end) {
      return res.status(400).json({
        success: false,
        error: 'Calendar ID, summary, start, and end are required'
      });
    }

    const calendar = await getCalendarClient(req.user.id);
    
    const event = {
      summary,
      description,
      start: {
        dateTime: start,
        timeZone: 'UTC'
      },
      end: {
        dateTime: end,
        timeZone: 'UTC'
      }
    };

    if (attendees && Array.isArray(attendees)) {
      event.attendees = attendees.map(email => ({ email }));
    }

    const response = await calendar.events.insert({
      calendarId,
      resource: event
    });
    
    res.status(201).json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Check availability for a time slot
// @route   POST /api/calendar/check-availability
// @access  Private
exports.checkAvailability = async (req, res) => {
  try {
    const { calendarId, start, end } = req.body;
    
    if (!calendarId || !start || !end) {
      return res.status(400).json({
        success: false,
        error: 'Calendar ID, start, and end are required'
      });
    }

    const calendar = await getCalendarClient(req.user.id);
    
    // Get events during the requested time slot
    const response = await calendar.events.list({
      calendarId,
      timeMin: start,
      timeMax: end,
      singleEvents: true
    });
    
    // If there are no events, the time slot is available
    const isAvailable = response.data.items.length === 0;
    
    res.status(200).json({
      success: true,
      isAvailable,
      conflictingEvents: isAvailable ? [] : response.data.items
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
