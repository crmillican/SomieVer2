import * as http from 'http';
import { Express } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { validateAuthToken } from '../auth';
import { storage } from '../storage';

// Client connection tracking
interface Client {
  socket: WebSocket;
  userId: number;
  userType: string;
  lastPing: number;
}

export function registerWebSocketRoute(app: Express, server: http.Server) {
  // Create WebSocket server instance
  const wss = new WebSocketServer({ noServer: true });
  
  // Track connected clients
  const clients = new Map<number, Client>();
  
  // Track entity changes that need to be broadcast
  const changeQueue: {
    entityType: string;
    action: string;
    entityId: number;
    data: any;
    userId: number;
  }[] = [];
  
  // Process the change queue every second
  setInterval(async () => {
    if (changeQueue.length === 0) return;
    
    // Process changes in batches
    const changes = [...changeQueue];
    changeQueue.length = 0;
    
    // Process each change sequentially
    for (const change of changes) {
      try {
        await broadcastEntityUpdate(
          change.entityType,
          change.action,
          change.entityId,
          change.data,
          change.userId
        );
      } catch (err) {
        console.error(`Error processing change for ${change.entityType}:`, err);
      }
    }
  }, 1000);
  
  // Send message to a specific client
  function sendToClient(client: Client, message: any) {
    try {
      client.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending message to client:', error);
    }
  }
  
  // Send message to all clients of a specific user type
  function broadcastToUserType(userType: string, message: any) {
    for (const client of clients.values()) {
      if (client.userType === userType) {
        sendToClient(client, message);
      }
    }
  }
  
  // Broadcast entity updates to relevant clients
  async function broadcastEntityUpdate(
    entityType: string,
    action: string,
    entityId: number,
    data: any,
    sourceUserId?: number
  ) {
    const update = {
      type: 'update',
      data: {
        entityType,
        action,
        entityId,
        data
      },
      timestamp: new Date().toISOString()
    };
    
    try {
      // Determine which clients should receive this update
      switch (entityType) {
        case 'offer':
          // For offers, send to all influencers and the business owner
          if (data.businessId) {
            // Find the business owner's client asynchronously
            const businessId = data.businessId;
            for (const client of clients.values()) {
              if (client.userType === 'business') {
                const clientBizId = await getBizId(client.userId);
                if (clientBizId === businessId && client.userId !== sourceUserId) {
                  sendToClient(client, update);
                }
              }
            }
          }
          
          // Send to all influencers (they might be a match)
          for (const client of clients.values()) {
            if (client.userType === 'influencer') {
              sendToClient(client, update);
            }
          }
          break;
          
        case 'claim':
          // For claims, send to the business and the influencer
          if (data.influencerId) {
            // Find the influencer's client
            const influencerId = data.influencerId;
            for (const client of clients.values()) {
              if (client.userType === 'influencer') {
                const userId = await getInfluencerUserId(influencerId);
                if (client.userId === userId && client.userId !== sourceUserId) {
                  sendToClient(client, update);
                }
              }
            }
          }
          
          if (data.businessId) {
            // Find the business owner's client
            const businessId = data.businessId;
            for (const client of clients.values()) {
              if (client.userType === 'business') {
                const userId = await getBusinessUserId(businessId);
                if (client.userId === userId && client.userId !== sourceUserId) {
                  sendToClient(client, update);
                }
              }
            }
          }
          break;
          
        case 'message':
          // For messages, send to the claim participants
          if (data.claimId) {
            // Get the claim
            const claim = await storage.getOfferClaimById(data.claimId);
            if (!claim) return;
            
            // The OfferClaim might not have a businessId property directly
            // We need to get it from the offer
            const offer = claim.offerId ? await storage.getOfferById(claim.offerId) : null;
            const businessId = offer?.businessId;
            
            if (businessId) {
              // Find business clients
              for (const client of clients.values()) {
                if (client.userType === 'business') {
                  const userId = await getBusinessUserId(businessId);
                  if (client.userId === userId && client.userId !== sourceUserId) {
                    sendToClient(client, update);
                  }
                }
              }
            }
            
            // Find influencer clients
            if (claim.influencerId) {
              for (const client of clients.values()) {
                if (client.userType === 'influencer') {
                  const userId = await getInfluencerUserId(claim.influencerId);
                  if (client.userId === userId && client.userId !== sourceUserId) {
                    sendToClient(client, update);
                  }
                }
              }
            }
          }
          break;
          
        case 'notification':
          // For notifications, send to the target business
          if (data.businessId) {
            const businessId = data.businessId;
            for (const client of clients.values()) {
              if (client.userType === 'business') {
                const userId = await getBusinessUserId(businessId);
                if (client.userId === userId) {
                  sendToClient(client, update);
                }
              }
            }
          }
          break;
          
        default:
          console.log(`No broadcast rule for entity type: ${entityType}`);
      }
    } catch (error) {
      console.error(`Error in broadcastEntityUpdate for ${entityType}:`, error);
    }
  }
  
  // Queue an entity change for broadcasting
  function queueEntityUpdate(
    entityType: string,
    action: string,
    entityId: number,
    data: any,
    sourceUserId?: number
  ) {
    changeQueue.push({
      entityType,
      action,
      entityId,
      data,
      userId: sourceUserId || 0
    });
  }
  
  // Helper functions to get user IDs
  async function getBusinessUserId(businessId: number): Promise<number> {
    try {
      const profile = await storage.getBusinessProfileById(businessId);
      return profile?.userId || 0;
    } catch (err) {
      console.error('Error getting business user ID:', err);
      return 0;
    }
  }
  
  async function getInfluencerUserId(influencerId: number): Promise<number> {
    try {
      const profile = await storage.getInfluencerProfileById(influencerId);
      return profile?.userId || 0;
    } catch (err) {
      console.error('Error getting influencer user ID:', err);
      return 0;
    }
  }
  
  // Helper function to get business ID from user ID
  async function getBizId(userId: number): Promise<number> {
    try {
      const profile = await storage.getBusinessProfileByUserId(userId);
      return profile?.id || 0;
    } catch (err) {
      console.error('Error getting business ID:', err);
      return 0;
    }
  }
  
  // Handle WebSocket connection upgrade
  server.on('upgrade', (request, socket, head) => {
    // Extract token from URL query string
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const token = url.searchParams.get('token');
    
    // Verify the token
    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    
    const userId = validateAuthToken(token);
    if (!userId) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    
    // Upgrade the connection
    wss.handleUpgrade(request, socket, head, ws => {
      wss.emit('connection', ws, request, userId);
    });
  });
  
  // Handle WebSocket connection
  wss.on('connection', async (ws: WebSocket, request: http.IncomingMessage, userId: number) => {
    try {
      // Get user from database
      const user = await storage.getUser(userId);
      
      if (!user) {
        console.error(`WebSocket connection failed: User ${userId} not found`);
        ws.close(1008, 'User not found');
        return;
      }
      
      // Register client
      const client: Client = {
        socket: ws,
        userId: user.id,
        userType: user.userType,
        lastPing: Date.now()
      };
      
      clients.set(userId, client);
      
      console.log(`WebSocket client connected: ${user.username} (${user.userType})`);
      
      // Send connected confirmation
      sendToClient(client, { 
        type: 'connected',
        data: { userId: user.id, userType: user.userType },
        timestamp: new Date().toISOString()
      });
      
      // Setup ping interval
      const pingInterval = setInterval(() => {
        // Check if client is still active (last activity within 2 minutes)
        const now = Date.now();
        if (now - client.lastPing > 120000) {
          console.log(`Closing inactive connection for user ${userId}`);
          ws.terminate();
          clearInterval(pingInterval);
          return;
        }
        
        // Send ping if connection is still open
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      }, 30000);
      
      // Handle messages from client
      ws.on('message', async (message: string) => {
        try {
          client.lastPing = Date.now();
          const data = JSON.parse(message.toString());
          
          console.log(`Received message from ${user.username}: ${data.type}`);
          
          switch (data.type) {
            case 'ping':
              // Respond to ping
              sendToClient(client, { type: 'pong', timestamp: new Date().toISOString() });
              break;
              
            case 'sync_request':
              // Handle sync request
              // This is just like the HTTP sync endpoint
              const syncData: any = {
                success: true,
                timestamp: new Date().toISOString()
              };
              
              if (user.userType === 'business') {
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
              } else if (user.userType === 'influencer') {
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
              sendToClient(client, { 
                type: 'sync_response',
                data: syncData,
                timestamp: new Date().toISOString()
              });
              break;
              
            case 'changes':
              // Process entity changes from client
              if (!Array.isArray(data.data?.changes)) {
                sendToClient(client, { 
                  type: 'error', 
                  data: { message: 'Invalid changes format' },
                  timestamp: new Date().toISOString()
                });
                return;
              }
              
              for (const change of data.data.changes) {
                const { type, action, entityId, data: entityData } = change;
                
                // Process the change (update database, etc.)
                // This part would involve specific handling for each entity type
                // (not implemented in this example)
                
                // Queue for broadcast to other clients
                queueEntityUpdate(type, action, entityId, entityData, userId);
              }
              
              // Acknowledge changes
              sendToClient(client, { 
                type: 'changes_ack', 
                data: { count: data.data.changes.length },
                timestamp: new Date().toISOString()
              });
              break;
              
            default:
              console.log(`Unknown message type: ${data.type}`);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
          
          // Send error back to client
          if (ws.readyState === WebSocket.OPEN) {
            sendToClient(client, { 
              type: 'error', 
              data: { message: 'Failed to process message' },
              timestamp: new Date().toISOString()
            });
          }
        }
      });
      
      // Handle pong responses
      ws.on('pong', () => {
        client.lastPing = Date.now();
      });
      
      // Handle connection close
      ws.on('close', () => {
        console.log(`WebSocket client disconnected: ${user.username}`);
        clients.delete(userId);
        clearInterval(pingInterval);
      });
      
      // Handle connection errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for ${user.username}:`, error);
        clients.delete(userId);
        clearInterval(pingInterval);
      });
      
    } catch (error) {
      console.error('Error setting up WebSocket connection:', error);
      ws.close(1011, 'Internal server error');
    }
  });
  
  console.log('WebSocket server initialized');
  
  // Provide a simple endpoint to check WebSocket status
  app.get('/api/ws-status', (req, res) => {
    res.json({
      status: 'ok',
      connections: clients.size,
      timestamp: new Date().toISOString()
    });
  });
  
  return wss;
}