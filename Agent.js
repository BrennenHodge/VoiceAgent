const mongoose = require('mongoose');

const AgentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  vapiAssistantId: {
    type: String,
    default: ''
  },
  firstMessage: {
    type: String,
    default: 'Hello, I am your voice assistant. How can I help you today?'
  },
  firstMessageMode: {
    type: String,
    enum: ['assistant-speaks-first', 'assistant-waits-for-user'],
    default: 'assistant-speaks-first'
  },
  documents: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Document'
  }],
  isActive: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Agent', AgentSchema);
