const express = require('express');
const router = express.Router();
const Chat = require('../models/chat.model');
const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

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
    const needsSmartTitle = !title || title === "New Chat" || title === "Medical Analysis" || title.includes("✅ Successfully");
    const firstUserMessage = Array.isArray(messages)
      ? messages.find((msg) => msg.role === 'user')?.content
      : null;

    let smartTitle = title || "Medical Analysis";
    if (needsSmartTitle) {
      if (firstUserMessage) {
        try {
          const titleResponse = await axios.post(`${AI_SERVICE_URL}/api/chat-title`, {
            first_user_message: firstUserMessage
          });
          smartTitle = titleResponse.data?.title || smartTitle;
        } catch (error) {
          console.error("⚠️ Smart title generation failed:", error.message);
          smartTitle = firstUserMessage.length > 25
            ? `${firstUserMessage.substring(0, 25)}...`
            : firstUserMessage;
        }
      } else {
        smartTitle = "Document Analysis";
      }
    }

    let chat;
    if (chatId) {
      // Update existing chat
      chat = await Chat.findByIdAndUpdate(chatId, { title: smartTitle, messages, hasContext, activeFile }, { new: true });
    } else {
      // Create new chat
      chat = new Chat({ patientId, title: smartTitle, messages, hasContext, activeFile });
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