const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

// Initialisation du client
const ai = new GoogleGenAI();

router.post('/chat', async (req, res) => {
  try {
    const { message, boardContext } = req.body;

    // On prépare un prompt qui intègre le contexte de Tasky et le message de l'utilisateur
    const prompt = `Tu es l'assistant virtuel intelligent de Tasky, un gestionnaire de tâches Kanban. 
    Voici le contexte des tâches actuelles de l'utilisateur : ${JSON.stringify(boardContext || 'Aucun contexte particulier')}
    
    Réponds de manière concise, claire et utile à la question suivante : ${message}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error('Erreur IA:', error);
    res.status(500).json({ error: "Erreur lors de la communication avec l'assistant." });
  }
});

module.exports = router;