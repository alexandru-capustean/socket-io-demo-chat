import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import debug from 'debug';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    // Permitem conexiuni de la ambele porturi posibile ale Vite
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"]
  }
});

// Configurăm debug pentru server
const serverDebug = debug('socket.io:server');

// Interfață pentru mesaje
interface ChatMessage {
  userId: string;
  message: string;
  timestamp: number;
}

// Array cu răspunsuri posibile pentru simulare
const autoResponses = [
  "Salut! Cum pot să te ajut?",
  "Bună ziua! Mulțumesc pentru mesaj.",
  "Hey! Sunt bot-ul de test.",
  "Interesant mesaj! Continuă...",
  "Am primit mesajul tău și îl procesez...",
  "Bip bop! Sunt aici să ajut!",
];

// Funcție pentru a genera un răspuns random
function getRandomResponse(): string {
  const randomIndex = Math.floor(Math.random() * autoResponses.length);
  return autoResponses[randomIndex];
}

// Gestionarea conexiunilor Socket.IO
io.on('connection', (socket) => {
  serverDebug('Nou client conectat:', socket.id);
  console.log('Un utilizator s-a conectat:', socket.id);

  // Ascultă pentru mesaje noi
  socket.on('send_message', (data: ChatMessage) => {
    serverDebug('Mesaj primit:', data);
    console.log('Mesaj primit de la client:', data);
    io.emit('receive_message', data);

    // Simulăm un răspuns automat după 1 secundă
    setTimeout(() => {
      const botResponse: ChatMessage = {
        userId: 'SERVER_BOT',
        message: getRandomResponse(),
        timestamp: Date.now()
      };
      
      serverDebug('Trimit răspuns automat:', botResponse);
      io.emit('receive_message', botResponse);
    }, 1000);
  });

  // Gestionează deconectarea
  socket.on('disconnect', () => {
    serverDebug('Client deconectat:', socket.id);
    console.log('Un utilizator s-a deconectat:', socket.id);
  });

  socket.on('error', (error) => {
    serverDebug('Eroare socket:', error);
    console.error('Eroare socket:', error);
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server-ul rulează pe portul ${PORT}`);
}); 