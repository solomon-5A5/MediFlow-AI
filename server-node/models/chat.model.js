// models/Chat.js
const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  // 🟢 CHANGED: Type is now String instead of ObjectId so "P_DEFAULT" works!
  patientId: { 
    type: String, 
    required: true 
  },
  title: { 
    type: String, 
    default: "New Chat" 
  },
  hasContext: { 
    type: Boolean, 
    default: false 
  },
  activeFile: { 
    type: String 
  },
  messages: [{
    role: { type: String, enum: ['user', 'ai', 'system'] },
    content: { type: String },
    time: { type: String },
    sources: { type: Array, default: [] }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);