import type { Store } from "express-session";
import type {
  User,
  BusinessProfile,
  InfluencerProfile,
  Offer,
  OfferClaim,
  PostSubmission,
  InsertPostSubmission,
  BusinessNotification,
  Message,
  InsertMessage,
  Deliverable,
  InsertDeliverable,
} from "@shared/schema";

export interface IStorage {
  sessionStore: Store;

  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: Omit<User, "id">): Promise<User>;

  // Business Profile methods
  createBusinessProfile(profile: Omit<BusinessProfile, "id">): Promise<BusinessProfile>;
  getBusinessProfileByUserId(userId: number): Promise<BusinessProfile | undefined>;
  getBusinessProfileById(id: number): Promise<BusinessProfile | undefined>;

  // Influencer Profile methods
  createInfluencerProfile(profile: Omit<InfluencerProfile, "id">): Promise<InfluencerProfile>;
  getInfluencerProfileByUserId(userId: number): Promise<InfluencerProfile | undefined>;
  getInfluencerProfileById(id: number): Promise<InfluencerProfile | undefined>;

  // Offer methods
  createOffer(offer: Omit<Offer, "id">): Promise<Offer>;
  getOffersByBusinessId(businessId: number): Promise<Offer[]>;
  getMatchingOffers(influencerProfile: InfluencerProfile): Promise<Offer[]>;
  getOfferById(id: number): Promise<Offer | undefined>;

  // Offer Claims methods
  createOfferClaim(claim: Omit<OfferClaim, "id">): Promise<OfferClaim>;
  getClaimsByOfferId(offerId: number): Promise<OfferClaim[]>;
  getClaimsByInfluencerId(influencerId: number): Promise<OfferClaim[]>;
  updateOfferClaimStatus(id: number, status: string): Promise<OfferClaim | undefined>;
  getOfferClaimById(id: number): Promise<OfferClaim | undefined>;
  getOfferClaimByInfluencerAndOffer(influencerId: number, offerId: number): Promise<OfferClaim | undefined>;

  // Business Notification methods
  createNotification(notification: Omit<BusinessNotification, "id">): Promise<BusinessNotification>;
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
  updateDeliverableStatus(id: number, status: string, feedback?: string): Promise<Deliverable>;
}