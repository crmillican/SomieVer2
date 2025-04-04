import { Request, Response, Router } from 'express';
import { storage } from '../storage';
import { ensureAuthenticated } from '../auth';

// Create a router to handle sync routes
const router = Router();

// Sync endpoint for initial data load or when WebSocket isn't available
router.get('/', ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const userType = (req.user as any).userType;

    // Prepare response based on user type
    const syncData: any = {
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

    return res.json(syncData);
  } catch (error) {
    console.error('Error in sync endpoint:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to sync data' 
    });
  }
});

// Endpoint to receive changes from clients (for clients without WebSocket support)
router.post('/changes', ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    const changes = req.body.changes;
    
    if (!Array.isArray(changes)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid changes format' 
      });
    }

    // Process changes (this would normally be done in WebSocket handler)
    for (const change of changes) {
      const { type, action, entityId, data } = change;
      
      console.log(`Processing change via HTTP: ${type} ${action} for ${entityId}`);
      
      // Here you would process the change, possibly dispatching it via WebSocket
      // For simplicity, we're just acknowledging receipt
    }

    return res.json({ 
      success: true, 
      message: `Processed ${changes.length} changes` 
    });
  } catch (error) {
    console.error('Error processing changes:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to process changes' 
    });
  }
});

// Export the router as default
export default router;