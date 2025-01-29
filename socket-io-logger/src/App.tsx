import { useState, useEffect, FormEvent, useRef } from 'react'
import { io, Socket } from 'socket.io-client';
import { socketLogger, listDebugNamespaces } from './utils/debug';
import './App.css'

// Actualizăm tipul pentru mesaje să se potrivească cu serverul
type ChatMessage = {
  userId: string;
  message: string;
  timestamp: number;
  type: 'sent' | 'received';
}

function App() {
  const [connectionStatus, setConnectionStatus] = useState('deconectat');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Activăm debug-ul Socket.IO la nivel global
    socketLogger.enableDebug(true);
    socketLogger.info('Inițializare Socket.IO...');

    const socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      // Activăm toate opțiunile de debugging
      forceNew: true,
      autoConnect: true,
      debug: true
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      socketLogger.info('Conectat cu succes', {
        id: socket.id,
        transport: socket.io.engine.transport.name
      });
      setConnectionStatus('conectat');
    });

    socket.on('disconnect', (reason) => {
      socketLogger.warn('Deconectat', { reason });
      setConnectionStatus('deconectat');
    });

    socket.on('connect_error', (error) => {
      socketLogger.error('Eroare conectare', { error });
      setConnectionStatus('eroare de conectare');
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      socketLogger.warn('Încercare de reconectare', { attemptNumber });
    });

    socket.on('reconnect', (attemptNumber) => {
      socketLogger.info('Reconectat cu succes', { attemptNumber });
    });

    socket.on('receive_message', (data: ChatMessage) => {
      socketLogger.log('Mesaj primit', {
        from: data.userId,
        message: data.message,
        timestamp: new Date(data.timestamp).toISOString()
      });
      
      if (socket.id !== data.userId) {
        const receivedMessage: ChatMessage = {
          ...data,
          type: 'received'
        };
        setChatHistory(prev => [...prev, receivedMessage]);
      }
    });

    // Adăugăm listener pentru evenimente de transport
    socket.io.engine.on('upgrade', (transport) => {
      socketLogger.info('Transport upgraded:', transport.name);
    });

    socket.io.engine.on('packet', ({ type, data }) => {
      socketLogger.log('Raw packet:', { type, data });
    });

    // La final, listăm toate namespace-urile disponibile
    listDebugNamespaces();

    return () => {
      socketLogger.info('Curățare conexiune Socket.IO');
      socketLogger.enableDebug(false);
      socket.disconnect();
      socketRef.current = null;
    }
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !socketRef.current) return;

    const newMessage: ChatMessage = {
      userId: socketRef.current.id,
      message: message,
      timestamp: Date.now(),
      type: 'sent'
    };

    socketLogger.log('Trimitere mesaj', {
      message: newMessage.message,
      timestamp: new Date(newMessage.timestamp).toISOString()
    });

    setChatHistory(prev => [...prev, newMessage]);
    socketRef.current.emit('send_message', newMessage);
    setMessage('');
  };

  return (
    <div className="app-container">
      <div className="chat-container">
        <h2>Status Socket.IO: {connectionStatus}</h2>
        
        <div className="messages-container">
          {chatHistory.map((msg, index) => (
            <div 
              key={index} 
              className={`message ${msg.type === 'sent' ? 'sent' : 'received'}`}
            >
              <span className="message-text">{msg.message}</span>
              <span className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="message-form">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Scrie un mesaj..."
            className="message-input"
          />
          <button type="submit" className="send-button">
            Trimite
          </button>
        </form>
      </div>
    </div>
  )
}

export default App
