const express = require('express');
const router = express.Router();
const Chat = require('../models/chat.model');

// 1. Get all chats for a patient (Sidebar list)
router.get('/patient/:patientId', async (req, res) => {
  try {
    // Sort by newest first, but only return the titles to keep it fast
    const chats = await Chat.find({ patientId: req.params.patientId })
                            .select('title createdAt hasContext')
                            .sort({ updatedAt: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

// 2. Load a specific chat's history
router.get('/:chatId', async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: "Failed to load chat" });
  }
});

// 3. Save or Update a chat
router.post('/save', async (req, res) => {
  console.log("📥 RECEIVED SAVE REQUEST:", req.body); // Let's see exactly what React sent!
  
  const { chatId, patientId, title, messages, hasContext, activeFile } = req.body;
  
  try {
    let chat;
    if (chatId) {
      // Update existing chat
      chat = await Chat.findByIdAndUpdate(chatId, { messages, hasContext, activeFile }, { new: true });
    } else {
      // Create new chat
      chat = new Chat({ patientId, title, messages, hasContext, activeFile });
      await chat.save();
    }
    
    console.log("✅ CHAT SAVED SUCCESSFULLY. ID:", chat._id);
    res.json(chat);
    
  } catch (err) {
    console.error("❌ MONGODB SAVE ERROR:", err.message); // This will reveal the exact bug!
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;