const DEBUG = true;

// Configurare pentru debug-ul nativ Socket.IO
if (typeof window !== 'undefined') {
  // Activăm toate logurile Socket.IO
  (window as any).localStorage.debug = '*';
  
  // Sau pentru loguri specifice:
  // localStorage.debug = 'socket.io-client:socket,socket.io-client:manager,socket.io-client:transport';
}

export const socketLogger = {
  log: (...args: any[]) => {
    if (DEBUG) {
      console.log('%c[Socket.IO]', 'color: #3498db', ...args);
    }
  },
  error: (...args: any[]) => {
    if (DEBUG) {
      console.error('%c[Socket.IO Error]', 'color: #e74c3c', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (DEBUG) {
      console.warn('%c[Socket.IO Warning]', 'color: #f1c40f', ...args);
    }
  },
  info: (...args: any[]) => {
    if (DEBUG) {
      console.info('%c[Socket.IO Info]', 'color: #2ecc71', ...args);
    }
  },
  enableDebug: (enable: boolean) => {
    if (typeof window !== 'undefined') {
      if (enable) {
        (window as any).localStorage.debug = '*';
      } else {
        (window as any).localStorage.removeItem('debug');
      }
    }
  }
};

// Adăugăm și o funcție de utilitate pentru a vedea toate namespace-urile disponibile
export const listDebugNamespaces = () => {
  if (typeof window !== 'undefined') {
    const socket = (window as any).io;
    if (socket && socket.managers) {
      Object.values(socket.managers).forEach((manager: any) => {
        console.group('Socket.IO Debug Namespaces:');
        console.log('Available namespaces:', Object.keys(manager.nsps));
        console.log('Current transport:', manager.engine?.transport?.name);
        console.log('Protocol:', manager.engine?.protocol);
        console.groupEnd();
      });
    }
  }
}; 