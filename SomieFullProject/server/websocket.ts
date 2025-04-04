import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import { validateAuthToken } from './auth';
import { storage } from './storage';
import { log } from './vite';

// Define the shape of WebSocket message
interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: string;
}

// Types of clients connected to the WebSocket server
interface ConnectedClient {
  ws: WebSocket;
  userId: number;
  userType: string;
}

// Track all connected clients
const clients: ConnectedClient[] = [];

// Rate limiting
const messageCounts: Record<number, { count: number; resetTime: number }> = {};
const MAX_MESSAGES_PER_MINUTE = 60;

// Setup WebSocket server
export function setupWebSocketServer(server: http.Server) {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws',
  });

  log('WebSocket server initialized', 'websocket');

  wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
    handleConnection(ws, req).catch(err => {
      log(`Error in connection handler: ${err}`, 'websocket');
      try {
        ws.close();
      } catch (e) {
        // Ignore close errors
      }
    });
  });

  // Ping all clients every 30 seconds to keep connections alive
  setInterval(() => {
    clients.forEach(client => {
      try {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }));
        }
      } catch (err) {
        log(`Error pinging client: ${err}`, 'websocket');
      }
    });
  }, 30000);

  return wss;
}

// Handle new WebSocket connections
async function handleConnection(ws: WebSocket, req: http.IncomingMessage) {
  try {
    // Extract token from query string
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    // Validate token
    if (!token) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        data: { message: 'Authentication required' },
        timestamp: new Date().toISOString()
      }));
      ws.close();
      return;
    }

    // Decode user ID from token
    const userId = validateAuthToken(token);
    if (!userId) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        data: { message: 'Invalid authentication token' },
        timestamp: new Date().toISOString()
      }));
      ws.close();
      return;
    }

    // Get user from database to determine type
    const user = await storage.getUser(userId);
    if (!user) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        data: { message: 'User not found' },
        timestamp: new Date().toISOString()
      }));
      ws.close();
      return;
    }

    // Add client to tracking list
    const client: ConnectedClient = {
      ws,
      userId,
      userType: user.userType
    };
    
    clients.push(client);
    
    log(`WebSocket client connected: userId=${userId}, userType=${user.userType}`, 'websocket');
    
    // Send confirmation message
    ws.send(JSON.stringify({ 
      type: 'connected', 
      data: { userId, userType: user.userType },
      timestamp: new Date().toISOString()
    }));

    // Handle messages from the client
    ws.on('message', (data) => {
      handleMessage(data, client).catch(err => {
        log(`Error in message handler: ${err}`, 'websocket');
      });
    });

    // Handle client disconnect
    ws.on('close', () => {
      const index = clients.findIndex(c => c.ws === ws);
      if (index !== -1) {
        const client = clients[index];
        log(`WebSocket client disconnected: userId=${client.userId}`, 'websocket');
        clients.splice(index, 1);
      }
    });

    // Handle errors
    ws.on('error', (err) => {
      log(`WebSocket error: ${err}`, 'websocket');
      
      const index = clients.findIndex(c => c.ws === ws);
      if (index !== -1) {
        clients.splice(index, 1);
      }
    });
  } catch (error) {
    log(`WebSocket connection error: ${error}`, 'websocket');
    ws.close();
  }
}

// Handle incoming WebSocket messages
async function handleMessage(data: any, client: ConnectedClient) {
  // Apply rate limiting
  if (!checkRateLimit(client.userId)) {
    client.ws.send(JSON.stringify({
      type: 'error',
      data: { message: 'Rate limit exceeded. Please slow down.' },
      timestamp: new Date().toISOString()
    }));
    return;
  }

  try {
    const message = JSON.parse(data.toString()) as WebSocketMessage;
    log(`Received WebSocket message: ${message.type} from userId=${client.userId}`, 'websocket');

    switch (message.type) {
      case 'ping':
        handlePing(client);
        break;
        
      case 'sync_request':
        await handleSyncRequest(client);
        break;
        
      case 'changes':
        await handleChanges(client, message.data?.changes || []);
        break;
        
      default:
        log(`Unknown message type: ${message.type}`, 'websocket');
    }
  } catch (error) {
    log(`Error processing WebSocket message: ${error}`, 'websocket');
    
    client.ws.send(JSON.stringify({
      type: 'error',
      data: { message: 'Failed to process message' },
      timestamp: new Date().toISOString()
    }));
  }
}

// Handle ping messages
function handlePing(client: ConnectedClient) {
  client.ws.send(JSON.stringify({
    type: 'pong',
    timestamp: new Date().toISOString()
  }));
}

// Handle sync requests
async function handleSyncRequest(client: ConnectedClient) {
  try {
    const { userId, userType } = client;
    
    // Prepare sync response based on user type
    const syncData: any = {
      type: 'sync_response',
      success: true,
      timestamp: new Date().toISOString()
    };

    if (userType === 'business') {
      // Get business profile
      const businessProfile = await storage.getBusinessProfileByUserId(userId);
      
      if (businessProfile) {
        syncData.businessProfile = businessProfile;
        
        // Get offers for the business
        syncData.offers = await storage.getOffersByBusinessId(businessProfile.id);
        
        // Get claims for the business's offers
        const allClaims: any[] = [];
        for (const offer of syncData.offers) {
          const claims = await storage.getClaimsByOfferId(offer.id);
          allClaims.push(...claims);
        }
        syncData.claims = allClaims;
        
        // Get unread notifications
        syncData.notifications = await storage.getUnreadNotifications(businessProfile.id);
      }
    } else if (userType === 'influencer') {
      // Get influencer profile
      const influencerProfile = await storage.getInfluencerProfileByUserId(userId);
      
      if (influencerProfile) {
        syncData.influencerProfile = influencerProfile;
        
        // Get social platforms
        syncData.socialPlatforms = await storage.getSocialPlatformsByInfluencerId(influencerProfile.id);
        
        // Get matching offers
        syncData.offers = await storage.getMatchingOffers(influencerProfile);
        
        // Get claims by this influencer
        syncData.claims = await storage.getClaimsByInfluencerId(influencerProfile.id);
        
        // Get deliverables for each claim
        const allDeliverables: any[] = [];
        for (const claim of syncData.claims) {
          const deliverables = await storage.getDeliverablesByClaimId(claim.id);
          allDeliverables.push(...deliverables);
        }
        syncData.deliverables = allDeliverables;
      }
    }
    
    // Send sync response
    client.ws.send(JSON.stringify(syncData));
    log(`Sync data sent to userId=${userId}`, 'websocket');
  } catch (error) {
    log(`Error handling sync request: ${error}`, 'websocket');
    
    client.ws.send(JSON.stringify({
      type: 'error',
      data: { message: 'Failed to process sync request' },
      timestamp: new Date().toISOString()
    }));
  }
}

// Handle change notifications from clients
async function handleChanges(client: ConnectedClient, changes: any[]) {
  try {
    // Process each change
    for (const change of changes) {
      const { type, action, entityId, data } = change;
      log(`Processing change: ${type} ${action} for ${entityId}`, 'websocket');
      
      // Broadcast change to relevant clients
      broadcastChange(client.userId, type, action, entityId, data);
    }
  } catch (error) {
    log(`Error handling changes: ${error}`, 'websocket');
    
    client.ws.send(JSON.stringify({
      type: 'error',
      data: { message: 'Failed to process changes' },
      timestamp: new Date().toISOString()
    }));
  }
}

// Broadcast changes to relevant clients
function broadcastChange(fromUserId: number, entityType: string, action: string, entityId: number, data: any) {
  const message = {
    type: 'update',
    data: {
      entityType,
      action,
      entityId,
      data
    },
    timestamp: new Date().toISOString()
  };

  const messageStr = JSON.stringify(message);
  
  // Determine which clients should receive this update
  clients.forEach(client => {
    // Don't send updates back to the originating client
    if (client.userId === fromUserId) {
      return;
    }
    
    let shouldSend = false;
    
    // Business should receive updates about their offers and related claims
    if (client.userType === 'business' && 
        (entityType === 'offer' || entityType === 'claim' || entityType === 'message')) {
      shouldSend = true;
    }
    
    // Influencers should receive updates about offers and their claims
    if (client.userType === 'influencer' && 
        (entityType === 'offer' || entityType === 'claim' || entityType === 'deliverable')) {
      shouldSend = true;
    }
    
    try {
      if (shouldSend && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    } catch (err) {
      log(`Error sending update to client: ${err}`, 'websocket');
    }
  });
}

// Helper function for rate limiting
function checkRateLimit(userId: number): boolean {
  const now = Date.now();
  
  // Initialize rate limit tracking for this user if it doesn't exist
  if (!messageCounts[userId]) {
    messageCounts[userId] = {
      count: 0,
      resetTime: now + 60000 // 1 minute from now
    };
  }
  
  // Reset counter if the minute has passed
  if (now > messageCounts[userId].resetTime) {
    messageCounts[userId] = {
      count: 0,
      resetTime: now + 60000
    };
  }
  
  // Increment counter
  messageCounts[userId].count++;
  
  // Check if limit exceeded
  return messageCounts[userId].count <= MAX_MESSAGES_PER_MINUTE;
}

// Send a notification to a specific user
export function sendNotificationToUser(userId: number, notification: any) {
  const client = clients.find(c => c.userId === userId);
  
  try {
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({
        type: 'notification',
        data: notification,
        timestamp: new Date().toISOString()
      }));
      return true;
    }
  } catch (err) {
    log(`Error sending notification to user ${userId}: ${err}`, 'websocket');
  }
  
  return false;
}

// Broadcast a message to all connected clients or clients of a specific type
export function broadcastMessage(message: any, userType?: string) {
  const messageStr = JSON.stringify({
    type: 'broadcast',
    data: message,
    timestamp: new Date().toISOString()
  });
  
  clients.forEach(client => {
    try {
      if ((!userType || client.userType === userType) && 
          client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    } catch (err) {
      log(`Error broadcasting to client: ${err}`, 'websocket');
    }
  });
}