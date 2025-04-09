const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  type: {
    type: String,
    required: [true, 'Please specify document type'],
    enum: ['pdf', 'text', 'dot', 'url']
  },
  content: {
    type: String,
    required: function() {
      return this.type === 'text' || this.type === 'url';
    }
  },
  filePath: {
    type: String,
    required: function() {
      return this.type === 'pdf' || this.type === 'dot';
    }
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  vapiToolId: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Document', DocumentSchema);
