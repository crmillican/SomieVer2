// Using our local IStorage interface definition
import connectPg from "connect-pg-simple";
import session from "express-session";
import memorystore from "memorystore";
import { db } from "./db";
import { eq, and, lte, gte } from "drizzle-orm";
import {
  users,
  businessProfiles,
  influencerProfiles,
  offers,
  offerClaims,
  postSubmissions,
  businessNotifications,
  type User,
  type BusinessProfile,
  type InfluencerProfile,
  type Offer,
  type OfferClaim,
  type PostSubmission,
  type InsertPostSubmission,
  type BusinessNotification,
  messages,
  deliverables,
  type Message,
  type InsertMessage,
  type Deliverable,
  type InsertDeliverable,
  previewTokens,
  type PreviewToken,
  type InsertPreviewToken,
  socialPlatforms, // Added import for socialPlatforms table
  type SocialPlatform, // Added import for SocialPlatform type
  type InsertSocialPlatform // Added import for InsertSocialPlatform type
} from "@shared/schema";
import { pool } from "./db";
import { sql } from 'drizzle-orm';


const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods with improved error handling
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: Omit<User, "id">): Promise<User>;

  // Business Profile methods with enhanced error handling and logging
  createBusinessProfile(
    profile: Omit<BusinessProfile, "id">
  ): Promise<BusinessProfile>;
  getBusinessProfileByUserId(userId: number): Promise<BusinessProfile | undefined>;
  getBusinessProfileById(id: number): Promise<BusinessProfile | undefined>;

  // Influencer Profile methods
  createInfluencerProfile(
    profile: Omit<InfluencerProfile, "id">
  ): Promise<InfluencerProfile>;
  getInfluencerProfileByUserId(
    userId: number
  ): Promise<InfluencerProfile | undefined>;
  getInfluencerProfileById(id: number): Promise<InfluencerProfile | undefined>;
  updateInfluencerProfile(
    id: number,
    profile: Omit<InfluencerProfile, "id">
  ): Promise<InfluencerProfile>;
  getInfluencerProfiles(limit?: number, offset?: number): Promise<InfluencerProfile[]>;

  // Offer methods
  createOffer(offer: Omit<Offer, "id">): Promise<Offer>;
  getOffersByBusinessId(
    businessId: number,
    limit?: number,
    offset?: number
  ): Promise<Offer[]>;
  getOffersCount(businessId: number): Promise<number>;
  getOfferById(id: number): Promise<Offer | undefined>;
  getMatchingOffers(influencerProfile: InfluencerProfile): Promise<Offer[]>;

  // Offer Claims methods
  createOfferClaim(claim: Omit<OfferClaim, "id">): Promise<OfferClaim>;
  getClaimsByOfferId(offerId: number): Promise<OfferClaim[]>;
  getClaimsByInfluencerId(influencerId: number): Promise<OfferClaim[]>;
  getOfferClaimByInfluencerAndOffer(
    influencerId: number,
    offerId: number
  ): Promise<OfferClaim | undefined>;
  updateOfferClaimStatus(
    id: number,
    status: string
  ): Promise<OfferClaim | undefined>;
  getOfferClaimById(id: number): Promise<OfferClaim | undefined>;

  // Business Notification methods
  createNotification(
    notification: Omit<BusinessNotification, "id">
  ): Promise<BusinessNotification>;
  getUnreadNotifications(businessId: number): Promise<BusinessNotification[]>;
  markNotificationAsRead(id: number): Promise<void>;

  // Post Submission methods
  createPostSubmission(submission: InsertPostSubmission): Promise<PostSubmission>;
  getPostSubmissionsByClaim(claimId: number): Promise<PostSubmission[]>;
  updatePostSubmissionVerification(
    id: number,
    status: string,
    details: string
  ): Promise<PostSubmission>;

  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByClaimId(claimId: number): Promise<Message[]>;

  // Deliverable methods
  createDeliverable(deliverable: InsertDeliverable): Promise<Deliverable>;
  getDeliverablesByClaimId(claimId: number): Promise<Deliverable[]>;
  submitDeliverable(id: number, submissionUrl: string): Promise<Deliverable>;
  updateDeliverableStatus(
    id: number,
    status: string,
    feedback?: string
  ): Promise<Deliverable>;

  // Preview Token methods
  createPreviewToken(token: InsertPreviewToken): Promise<PreviewToken>;
  getPreviewByToken(token: string): Promise<PreviewToken | undefined>;
  
  // Social Platform methods
  createSocialPlatform(platform: InsertSocialPlatform): Promise<SocialPlatform>;
  getSocialPlatformsByInfluencerId(influencerId: number): Promise<SocialPlatform[]>;
  getSocialPlatformById(id: number): Promise<SocialPlatform | undefined>;
  updateSocialPlatform(id: number, platform: Partial<SocialPlatform>): Promise<SocialPlatform | undefined>;
  deleteSocialPlatform(id: number): Promise<void>;
  setPrimaryPlatform(id: number, influencerId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    try {
      // Use PostgreSQL for more reliable session storage
      this.sessionStore = new PostgresSessionStore({
        pool, // Use the existing database pool
        tableName: 'session',
        createTableIfMissing: true, // Auto-create table if it doesn't exist
        schemaName: 'public', // Use public schema
        pruneSessionInterval: 60 * 15, // prune every 15 mins
        errorLog: console.error
      });
      console.log('PostgreSQL session store initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PostgreSQL session store, falling back to memory store:', error);
      // Fallback to memory store if PostgreSQL setup fails
      const MemoryStore = memorystore(session);
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      });
    }
  }

  // User methods with improved error handling
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error('Failed to fetch user');
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error('Error fetching user by username:', error);
      throw new Error('Failed to fetch user by username');
    }
  }

  async createUser(insertUser: Omit<User, "id">): Promise<User> {
    try {
      const [user] = await db.insert(users).values(insertUser).returning();
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  // Business Profile methods with enhanced error handling and logging
  async createBusinessProfile(
    profile: Omit<BusinessProfile, "id">
  ): Promise<BusinessProfile> {
    try {
      console.log('Creating business profile:', profile);
      const [businessProfile] = await db
        .insert(businessProfiles)
        .values(profile)
        .returning();
      console.log('Created business profile:', businessProfile);
      return businessProfile;
    } catch (error) {
      console.error('Error creating business profile:', error);
      throw new Error('Failed to create business profile');
    }
  }

  async getBusinessProfileByUserId(userId: number): Promise<BusinessProfile | undefined> {
    try {
      console.log('Fetching business profile for user:', userId);
      const [profile] = await db
        .select()
        .from(businessProfiles)
        .where(eq(businessProfiles.userId, userId));

      if (!profile) {
        console.log('Business profile not found for user:', userId);
        return undefined;
      }

      console.log('Found business profile:', profile);
      return profile;
    } catch (error) {
      console.error('Error fetching business profile:', error);
      throw new Error('Failed to fetch business profile');
    }
  }

  async getBusinessProfileById(id: number): Promise<BusinessProfile | undefined> {
    try {
      const [profile] = await db
        .select()
        .from(businessProfiles)
        .where(eq(businessProfiles.id, id));
      return profile;
    } catch (error) {
      console.error('Error fetching business profile by id:', error);
      throw new Error('Failed to fetch business profile by id');
    }
  }

  // Influencer Profile methods
  async createInfluencerProfile(
    profile: Omit<InfluencerProfile, "id">
  ): Promise<InfluencerProfile> {
    try {
      console.log('Creating influencer profile:', profile);
      
      // Insert minimal required fields and let DB handle defaults
      const [influencerProfile] = await db
        .insert(influencerProfiles)
        .values({
          userId: profile.userId,
          displayName: profile.displayName,
          followerCount: profile.followerCount || 0,
          engagementRate: profile.engagementRate || 0,
          credibilityScore: profile.credibilityScore || 50,
          strikes: profile.strikes || 0,
          platform: profile.platform || 'instagram',
          instagramUrl: profile.instagramUrl,
          tiktokUrl: profile.tiktokUrl,
          youtubeUrl: profile.youtubeUrl,
          bio: profile.bio,
          location: profile.location,
          isTest: profile.isTest || false
        })
        .returning();
      
      console.log('Influencer profile created:', influencerProfile);
      return influencerProfile;
    } catch (error) {
      console.error('Error creating influencer profile:', error);
      throw new Error('Failed to create influencer profile');
    }
  }

  async getInfluencerProfileByUserId(
    userId: number
  ): Promise<InfluencerProfile | undefined> {
    const [profile] = await db
      .select()
      .from(influencerProfiles)
      .where(eq(influencerProfiles.userId, userId));
    return profile;
  }

  async getInfluencerProfileById(id: number): Promise<InfluencerProfile | undefined> {
    const [profile] = await db
      .select()
      .from(influencerProfiles)
      .where(eq(influencerProfiles.id, id));
    return profile;
  }

  async updateInfluencerProfile(
    id: number,
    profile: Omit<InfluencerProfile, "id">
  ): Promise<InfluencerProfile> {
    try {
      console.log('Updating influencer profile:', id, profile);
      
      const [updatedProfile] = await db
        .update(influencerProfiles)
        .set(profile)
        .where(eq(influencerProfiles.id, id))
        .returning();
      
      console.log('Influencer profile updated:', updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Error updating influencer profile:', error);
      throw new Error('Failed to update influencer profile');
    }
  }
  
  async getInfluencerProfiles(limit: number = 20, offset: number = 0): Promise<InfluencerProfile[]> {
    try {
      console.log(`Fetching influencer profiles (limit: ${limit}, offset: ${offset})`);
      
      const profiles = await db
        .select()
        .from(influencerProfiles)
        .limit(limit)
        .offset(offset);
      
      console.log(`Fetched ${profiles.length} influencer profiles`);
      return profiles;
    } catch (error) {
      console.error('Error fetching influencer profiles:', error);
      throw new Error('Failed to fetch influencer profiles');
    }
  }

  // Offer methods
  async createOffer(offer: Omit<Offer, "id">): Promise<Offer> {
    const [newOffer] = await db.insert(offers).values(offer).returning();
    return newOffer;
  }

  async getOffersByBusinessId(
    businessId: number,
    limit: number = 10,
    offset: number = 0
  ): Promise<Offer[]> {
    const offerResults = await db
      .select()
      .from(offers)
      .where(eq(offers.businessId, businessId))
      .limit(limit)
      .offset(offset);
    
    // Convert stored integer minEngagement back to decimal for display
    return offerResults.map(offer => ({
      ...offer,
      minEngagement: offer.minEngagement / 10 // Convert from integer stored as 42 back to 4.2
    }));
  }

  async getOffersCount(businessId: number): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(offers)
      .where(eq(offers.businessId, businessId));
    return result?.count || 0;
  }

  async getOfferById(id: number): Promise<Offer | undefined> {
    const [offer] = await db
      .select()
      .from(offers)
      .where(eq(offers.id, id));
    
    if (offer) {
      // Convert stored integer minEngagement back to decimal for display
      return {
        ...offer,
        minEngagement: offer.minEngagement / 10 // Convert from integer stored as 42 back to 4.2
      };
    }
    
    return offer;
  }

  async getMatchingOffers(influencerProfile: InfluencerProfile): Promise<Offer[]> {
    try {
      console.log('Finding matches for influencer using advanced algorithm:', {
        id: influencerProfile.id,
        followerCount: influencerProfile.followerCount,
        engagementRate: influencerProfile.engagementRate,
        platform: influencerProfile.platform,
        niche: influencerProfile.niche
      });

      // Check for test offers first - these should always be shown regardless of criteria
      const testOffers = await db
        .select()
        .from(offers)
        .where(
          and(
            eq(offers.status, "active"),
            eq(offers.isTest, true)
          )
        );
      
      console.log('Found test offers:', testOffers.length);
      
      // Also get regular offers that meet the basic criteria
      const activeOffers = await db
        .select()
        .from(offers)
        .where(
          and(
            eq(offers.status, "active"),
            lte(offers.minFollowers, influencerProfile.followerCount),
            eq(offers.isTest, false)
          )
        );
        
      // Filter for engagement rate manually, comparing the stored integer value with 10x the profile rate
      // For example: stored minEngagement of 42 (representing 4.2%) compared with influencer rate of 5.1% (stored as 51)
      const filteredOffers = activeOffers.filter(offer => 
        Number(offer.minEngagement) <= Number(influencerProfile.engagementRate * 10)
      );
      
      // Combine test offers with regular filtered offers
      let allOffers = [...testOffers, ...filteredOffers];

      console.log('Found active offers meeting follower criteria:', activeOffers.length);
      console.log('After filtering for engagement rate and adding test offers:', allOffers.length);

      // If no offers are found, get all test offers regardless of criteria
      // This ensures users always see content during development
      if (allOffers.length === 0) {
        console.log('No matching offers found, fetching all test offers for development purposes');
        const fallbackTestOffers = await db
          .select()
          .from(offers)
          .where(eq(offers.isTest, true))
          .limit(5);

        allOffers = fallbackTestOffers;
        console.log('Added fallback test offers:', fallbackTestOffers.length);
      }

      // Filter out offers that the influencer has already claimed
      const claims = await this.getClaimsByInfluencerId(influencerProfile.id);
      const claimedOfferIds = new Set(claims.map(claim => claim.offerId));
      const availableOffers = allOffers.filter(offer => !claimedOfferIds.has(offer.id));
      
      // Import the matching service dynamically to avoid circular import issues
      const { matchingService } = await import('./services/matching');
      
      // Enhance offers with related business data for better matching and convert engagement rates
      const enhancedOffers = await Promise.all(availableOffers.map(async (offer) => {
        const business = await this.getBusinessProfileById(offer.businessId);
        return {
          ...offer,
          minEngagement: offer.minEngagement / 10, // Convert from integer stored as 42 back to 4.2
          business: business || undefined
        };
      }));
      
      // Use the intelligent matching algorithm to rank offers by compatibility
      const { offers: rankedOffers } = matchingService.rankOffersForInfluencer(
        influencerProfile, 
        enhancedOffers
      );

      console.log('Ranked offers using intelligent matching:', rankedOffers.length);
      
      // Add random match scores for test offers if we're using fallback test data
      if (allOffers.length > 0 && filteredOffers.length === 0) {
        console.log('Adding simulated match scores to test offers for UI display');
        return rankedOffers.map(offer => ({
          ...offer,
          matchScore: Math.floor(Math.random() * 30) + 70 // Random score between 70-100 for testing
        }));
      }
      
      return rankedOffers;
    } catch (error) {
      console.error('Error getting matching offers:', error);
      throw new Error('Failed to get matching offers');
    }
  }

  // Offer Claims methods
  async createOfferClaim(claim: Omit<OfferClaim, "id">): Promise<OfferClaim> {
    try {
      console.log('Creating offer claim:', claim);
      
      // Make sure to include all required fields
      const [newClaim] = await db
        .insert(offerClaims)
        .values({
          offerId: claim.offerId,
          influencerId: claim.influencerId,
          status: claim.status || "pending",
          completedAt: claim.completedAt || null,
          createdAt: new Date(),
          isTest: claim.isTest || false
        })
        .returning();
        
      console.log('Offer claim created:', newClaim);
      return newClaim;
    } catch (error) {
      console.error('Error creating offer claim:', error);
      throw new Error('Failed to create offer claim');
    }
  }

  async getClaimsByOfferId(offerId: number): Promise<OfferClaim[]> {
    return await db
      .select()
      .from(offerClaims)
      .where(eq(offerClaims.offerId, offerId));
  }

  async getClaimsByInfluencerId(influencerId: number): Promise<OfferClaim[]> {
    return await db
      .select()
      .from(offerClaims)
      .where(eq(offerClaims.influencerId, influencerId));
  }

  async getOfferClaimByInfluencerAndOffer(
    influencerId: number,
    offerId: number
  ): Promise<OfferClaim | undefined> {
    const [claim] = await db
      .select()
      .from(offerClaims)
      .where(
        and(
          eq(offerClaims.influencerId, influencerId),
          eq(offerClaims.offerId, offerId)
        )
      );
    return claim;
  }

  async updateOfferClaimStatus(
    id: number,
    status: string
  ): Promise<OfferClaim | undefined> {
    const [claim] = await db
      .update(offerClaims)
      .set({
        status,
        completedAt: status === "completed" ? new Date() : null
      })
      .where(eq(offerClaims.id, id))
      .returning();
    return claim;
  }

  async getOfferClaimById(id: number): Promise<OfferClaim | undefined> {
    const [claim] = await db
      .select()
      .from(offerClaims)
      .where(eq(offerClaims.id, id));
    return claim;
  }

  // Business Notification methods
  async createNotification(
    notification: Omit<BusinessNotification, "id">
  ): Promise<BusinessNotification> {
    const [newNotification] = await db
      .insert(businessNotifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getUnreadNotifications(businessId: number): Promise<BusinessNotification[]> {
    return await db
      .select()
      .from(businessNotifications)
      .where(
        and(
          eq(businessNotifications.businessId, businessId),
          eq(businessNotifications.read, false)
        )
      );
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(businessNotifications)
      .set({ read: true })
      .where(eq(businessNotifications.id, id));
  }

  // Post Submission methods
  async createPostSubmission(submission: InsertPostSubmission): Promise<PostSubmission> {
    const [newSubmission] = await db
      .insert(postSubmissions)
      .values({
        ...submission,
        verificationStatus: "pending",
        verificationDetails: null,
        lastVerified: null,
      })
      .returning();
    return newSubmission;
  }

  async getPostSubmissionsByClaim(claimId: number): Promise<PostSubmission[]> {
    return await db
      .select()
      .from(postSubmissions)
      .where(eq(postSubmissions.claimId, claimId));
  }

  async updatePostSubmissionVerification(
    id: number,
    status: string,
    details: string
  ): Promise<PostSubmission> {
    const [submission] = await db
      .update(postSubmissions)
      .set({
        verificationStatus: status,
        verificationDetails: details,
        lastVerified: new Date(),
      })
      .where(eq(postSubmissions.id, id))
      .returning();
    return submission;
  }

  // Message methods
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values({
        ...message,
        timestamp: new Date(),
      })
      .returning();
    return newMessage;
  }

  async getMessagesByClaimId(claimId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.claimId, claimId))
      .orderBy(messages.timestamp);
  }

  // Deliverable methods
  async createDeliverable(deliverable: InsertDeliverable): Promise<Deliverable> {
    const [newDeliverable] = await db
      .insert(deliverables)
      .values(deliverable)
      .returning();
    return newDeliverable;
  }

  async getDeliverablesByClaimId(claimId: number): Promise<Deliverable[]> {
    return await db
      .select()
      .from(deliverables)
      .where(eq(deliverables.claimId, claimId))
      .orderBy(deliverables.id);
  }

  async submitDeliverable(id: number, submissionUrl: string): Promise<Deliverable> {
    const [deliverable] = await db
      .update(deliverables)
      .set({
        submissionUrl,
        status: "submitted",
        submittedAt: new Date(),
      })
      .where(eq(deliverables.id, id))
      .returning();
    return deliverable;
  }

  async updateDeliverableStatus(
    id: number,
    status: string,
    feedback?: string
  ): Promise<Deliverable> {
    const [deliverable] = await db
      .update(deliverables)
      .set({
        status,
        feedback,
      })
      .where(eq(deliverables.id, id))
      .returning();
    return deliverable;
  }

  // Preview Token methods
  async createPreviewToken(token: InsertPreviewToken): Promise<PreviewToken> {
    const [previewToken] = await db
      .insert(previewTokens)
      .values(token)
      .returning();
    return previewToken;
  }

  async getPreviewByToken(token: string): Promise<PreviewToken | undefined> {
    const [preview] = await db
      .select()
      .from(previewTokens)
      .where(eq(previewTokens.token, token));
    return preview;
  }
  
  // Social Platform methods
  async createSocialPlatform(platform: InsertSocialPlatform): Promise<SocialPlatform> {
    try {
      console.log('Creating social platform:', platform);
      
      // If this is the first platform for this influencer, make it primary
      const existingPlatforms = await this.getSocialPlatformsByInfluencerId(platform.influencerId);
      const shouldBePrimary = existingPlatforms.length === 0 || platform.isPrimary;
      
      // If making this platform primary, ensure no other platforms are primary
      if (shouldBePrimary) {
        await db
          .update(socialPlatforms)
          .set({ isPrimary: false })
          .where(eq(socialPlatforms.influencerId, platform.influencerId));
      }
      
      const [newPlatform] = await db
        .insert(socialPlatforms)
        .values({
          ...platform,
          isPrimary: shouldBePrimary,
          lastVerified: platform.isVerified ? new Date() : null,
          createdAt: new Date(),
          isTest: platform.isTest || false
        })
        .returning();
        
      console.log('Social platform created:', newPlatform);
      return newPlatform;
    } catch (error) {
      console.error('Error creating social platform:', error);
      throw new Error('Failed to create social platform');
    }
  }

  async getSocialPlatformsByInfluencerId(influencerId: number): Promise<SocialPlatform[]> {
    try {
      const platforms = await db
        .select()
        .from(socialPlatforms)
        .where(eq(socialPlatforms.influencerId, influencerId))
        .orderBy(socialPlatforms.isPrimary, socialPlatforms.createdAt);
        
      return platforms;
    } catch (error) {
      console.error('Error fetching social platforms:', error);
      throw new Error('Failed to fetch social platforms');
    }
  }

  async getSocialPlatformById(id: number): Promise<SocialPlatform | undefined> {
    try {
      const [platform] = await db
        .select()
        .from(socialPlatforms)
        .where(eq(socialPlatforms.id, id));
        
      return platform;
    } catch (error) {
      console.error('Error fetching social platform:', error);
      throw new Error('Failed to fetch social platform');
    }
  }

  async updateSocialPlatform(id: number, platform: Partial<SocialPlatform>): Promise<SocialPlatform | undefined> {
    try {
      console.log('Updating social platform:', id, platform);
      
      // If making this platform primary, ensure no other platforms are primary
      if (platform.isPrimary) {
        const [currentPlatform] = await db
          .select()
          .from(socialPlatforms)
          .where(eq(socialPlatforms.id, id));
          
        if (currentPlatform) {
          await db
            .update(socialPlatforms)
            .set({ isPrimary: false })
            .where(eq(socialPlatforms.influencerId, currentPlatform.influencerId));
        }
      }
      
      // Update verification timestamp if verified status changes to true
      const updateData: any = { ...platform };
      if (platform.isVerified) {
        updateData.lastVerified = new Date();
      }
      
      const [updatedPlatform] = await db
        .update(socialPlatforms)
        .set(updateData)
        .where(eq(socialPlatforms.id, id))
        .returning();
        
      console.log('Social platform updated:', updatedPlatform);
      return updatedPlatform;
    } catch (error) {
      console.error('Error updating social platform:', error);
      throw new Error('Failed to update social platform');
    }
  }

  async deleteSocialPlatform(id: number): Promise<void> {
    try {
      console.log('Deleting social platform:', id);
      
      // Check if platform is primary before deleting
      const [platform] = await db
        .select()
        .from(socialPlatforms)
        .where(eq(socialPlatforms.id, id));
        
      await db
        .delete(socialPlatforms)
        .where(eq(socialPlatforms.id, id));
        
      // If deleted platform was primary, make another platform primary
      if (platform && platform.isPrimary) {
        const [nextPlatform] = await db
          .select()
          .from(socialPlatforms)
          .where(eq(socialPlatforms.influencerId, platform.influencerId))
          .limit(1);
          
        if (nextPlatform) {
          await this.setPrimaryPlatform(nextPlatform.id, platform.influencerId);
        }
      }
      
      console.log('Social platform deleted');
    } catch (error) {
      console.error('Error deleting social platform:', error);
      throw new Error('Failed to delete social platform');
    }
  }

  async setPrimaryPlatform(id: number, influencerId: number): Promise<void> {
    try {
      console.log('Setting primary platform:', id, 'for influencer:', influencerId);
      
      // Clear primary flag on all platforms for this influencer
      await db
        .update(socialPlatforms)
        .set({ isPrimary: false })
        .where(eq(socialPlatforms.influencerId, influencerId));
        
      // Set primary flag on specified platform
      await db
        .update(socialPlatforms)
        .set({ isPrimary: true })
        .where(eq(socialPlatforms.id, id));
        
      console.log('Primary platform updated');
    } catch (error) {
      console.error('Error setting primary platform:', error);
      throw new Error('Failed to set primary platform');
    }
  }
}

export const storage = new DatabaseStorage();