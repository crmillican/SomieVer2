import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, primaryKey, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define enums
export const userRoleEnum = pgEnum('user_role', ['user', 'influencer', 'business', 'admin', 'super_admin']);

// Keep the base tables unchanged
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  userType: text("user_type").notNull(),
  role: userRoleEnum("role").default("user").notNull(),
  permissions: text("permissions").array(),
  createdAt: timestamp("created_at").defaultNow(),
  isTest: boolean("is_test").notNull().default(false),
});

// Simplify the insert schema to only include necessary fields
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  userType: true,
}).extend({
  userType: z.enum(["business", "influencer"])
});

export const businessProfiles = pgTable("business_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  businessName: text("business_name").notNull(),
  industry: text("industry").notNull(),
  location: text("location").notNull(),
  businessType: text("business_type").notNull().default("brand"),
  // For physical locations
  address: text("address"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  // For brand products
  productUrl: text("product_url"),
  productCategory: text("product_category"),
  // For all business types
  description: text("description"),
  website: text("website"),
  instagramUrl: text("instagram_url"),
  tiktokUrl: text("tiktok_url"),
  youtubeUrl: text("youtube_url"),
  logoUrl: text("logo_url"),
  tags: text("tags").array(),
  // Marketing preferences for better matching
  targetAudience: jsonb("target_audience"),
  marketingGoals: text("marketing_goals").array(),
  campaignPreferences: jsonb("campaign_preferences"),
  isTest: boolean("is_test").notNull().default(false),
});

export const influencerProfiles = pgTable("influencer_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  displayName: text("display_name").notNull(),
  followerCount: integer("follower_count").notNull(),
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }).notNull(),
  credibilityScore: integer("credibility_score").notNull().default(50),
  strikes: integer("strikes").notNull().default(0),
  // Social media URLs (not handles)
  instagramUrl: text("instagram_url"),
  tiktokUrl: text("tiktok_url"),
  youtubeUrl: text("youtube_url"),
  bio: text("bio"),
  // Main platform for the influencer
  platform: text("platform").notNull(),
  // Enhanced profile fields for better matching
  niche: text("niche"),
  location: text("location"),
  audienceData: jsonb("audience_data"), // Age, gender, geography distribution
  contentTypes: text("content_types").array(),
  performanceMetrics: jsonb("performance_metrics"), // Historical metrics
  isTest: boolean("is_test").notNull().default(false),
});

export const previewTokens = pgTable("preview_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isTest: boolean("is_test").notNull().default(true),
});

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  reward: text("reward").notNull(),
  rewardType: text("reward_type").notNull(),
  rewardAmount: integer("reward_amount"),
  minFollowers: integer("min_followers").notNull(),
  minEngagement: integer("min_engagement").notNull(),
  postsRequired: integer("posts_required").notNull(),
  timeframe: integer("timeframe").notNull(),
  status: text("status").notNull().default("active"),
  category: text("category").notNull().default("Uncategorized"),
  contentType: text("content_type"), // Type of content requested (image, video, story, etc.)
  location: text("location"), // Geographic targeting
  audienceRequirements: jsonb("audience_requirements"), // Desired audience characteristics
  tags: text("tags").array(),
  optimizationData: jsonb("optimization_data"), // Data from the metrics optimizer
  createdAt: timestamp("created_at").defaultNow(),
  isTest: boolean("is_test").notNull().default(false),
});

export const offerClaims = pgTable("offer_claims", {
  id: serial("id").primaryKey(),
  offerId: integer("offer_id").notNull(),
  influencerId: integer("influencer_id").notNull(),
  status: text("status").notNull().default("incomplete"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  isTest: boolean("is_test").notNull().default(false),
});

export const businessNotifications = pgTable("business_notifications", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  relatedOfferId: integer("related_offer_id"),
  relatedInfluencerId: integer("related_influencer_id"),
});

export const postSubmissions = pgTable("post_submissions", {
  id: serial("id").primaryKey(),
  claimId: integer("claim_id").notNull(),
  postUrl: text("post_url").notNull(),
  platform: text("platform").notNull(),
  verificationStatus: text("verification_status").default("pending"),
  verificationDetails: text("verification_details"),
  lastVerified: timestamp("last_verified"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  claimId: integer("claim_id").notNull(),
  senderId: integer("sender_id").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const deliverables = pgTable("deliverables", {
  id: serial("id").primaryKey(),
  claimId: integer("claim_id").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"),
  submissionUrl: text("submission_url"),
  submittedAt: timestamp("submitted_at"),
  feedback: text("feedback"),
});

// New table for storing multiple social platforms per influencer
export const socialPlatforms = pgTable("social_platforms", {
  id: serial("id").primaryKey(),
  influencerId: integer("influencer_id").notNull(),
  platform: text("platform").notNull(), // "instagram", "tiktok", "youtube", etc.
  handle: text("handle").notNull(),
  profileUrl: text("profile_url").notNull(),
  followers: integer("followers"),
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }),
  isVerified: boolean("is_verified").notNull().default(false),
  isPrimary: boolean("is_primary").notNull().default(false),
  lastVerified: timestamp("last_verified"),
  createdAt: timestamp("created_at").defaultNow(),
  isTest: boolean("is_test").notNull().default(false),
});

export const insertBusinessProfileSchema = createInsertSchema(businessProfiles).pick({
  businessName: true,
  industry: true,
  location: true,
  businessType: true,
  address: true,
  city: true,
  state: true,
  postalCode: true,
  productUrl: true,
  productCategory: true,
  description: true,
  website: true,
  instagramUrl: true,
  tiktokUrl: true,
  youtubeUrl: true,
  logoUrl: true,
  tags: true,
}).extend({
  // Make most fields optional initially, but we'll validate based on business type
  businessType: z.enum(["physical_location", "brand", "service"]),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  productUrl: z.union([z.string().url(), z.string().max(0), z.null()]).optional(),
  productCategory: z.string().optional(),
  description: z.string().optional(),
  website: z.union([z.string().url(), z.string().max(0), z.null()]).optional(),
  instagramUrl: z.union([z.string().url(), z.string().max(0), z.null()]).optional(),
  tiktokUrl: z.union([z.string().url(), z.string().max(0), z.null()]).optional(),
  youtubeUrl: z.union([z.string().url(), z.string().max(0), z.null()]).optional(),
  logoUrl: z.union([z.string().url(), z.string().max(0), z.null()]).optional(),
  tags: z.array(z.string()).optional(),
}).transform((data) => {
  // Set default values and handle transformations
  const updatedData: any = {
    ...data,
    isTest: false,
    tags: data.tags || [],
    description: data.description || null,
    website: data.website === "" ? null : data.website || null,
    instagramUrl: data.instagramUrl === "" ? null : data.instagramUrl || null,
    tiktokUrl: data.tiktokUrl === "" ? null : data.tiktokUrl || null,
    youtubeUrl: data.youtubeUrl === "" ? null : data.youtubeUrl || null,
    logoUrl: data.logoUrl === "" ? null : data.logoUrl || null,
    productUrl: data.productUrl === "" ? null : data.productUrl || null,
  };
  
  return updatedData;
});

export const insertInfluencerProfileSchema = createInsertSchema(influencerProfiles).pick({
  displayName: true,
  followerCount: true,
  engagementRate: true,
  platform: true,
  instagramUrl: true,
  tiktokUrl: true,
  youtubeUrl: true,
  bio: true,
}).extend({
  // These fields are for form convenience only and will be transformed
  socialHandle: z.string().optional(),
  socialUrl: z.string().optional(),
  // Make metrics optional - they'll be auto-fetched or can be provided manually
  followerCount: z.number().int().positive().optional(),
  engagementRate: z.number().positive().optional(),
  bio: z.string().nullable().optional(),
}).transform((data) => {
  // Store the URL in the appropriate field based on platform
  const updatedData: any = {
    ...data,
    // Ensure these fields always have values (even if they'll be replaced by API later)
    followerCount: data.followerCount || 0,
    engagementRate: data.engagementRate || 0,
    isTest: false,
    bio: data.bio || null, // Ensure bio is either string or null, not undefined
  };
  
  // Set the URL in the appropriate field based on platform
  if (data.platform === "instagram") {
    if (data.socialUrl) {
      updatedData.instagramUrl = data.socialUrl;
    } else if (data.socialHandle) {
      updatedData.instagramUrl = `https://instagram.com/${data.socialHandle}`;
    } else {
      // Default URL to prevent validation errors
      updatedData.instagramUrl = "https://instagram.com/";
    }
  } else if (data.platform === "tiktok") {
    if (data.socialUrl) {
      updatedData.tiktokUrl = data.socialUrl;
    } else if (data.socialHandle) {
      updatedData.tiktokUrl = `https://tiktok.com/@${data.socialHandle}`;
    } else {
      // Default URL to prevent validation errors
      updatedData.tiktokUrl = "https://tiktok.com/";
    }
  } else if (data.platform === "youtube") {
    if (data.socialUrl) {
      updatedData.youtubeUrl = data.socialUrl;
    } else if (data.socialHandle) {
      updatedData.youtubeUrl = `https://youtube.com/@${data.socialHandle}`;
    } else {
      // Default URL to prevent validation errors
      updatedData.youtubeUrl = "https://youtube.com/";
    }
  }
  
  // Remove the temporary fields as they're not in the database schema
  delete updatedData.socialHandle;
  delete updatedData.socialUrl;
  
  return updatedData;
});

export const insertOfferSchema = createInsertSchema(offers, {
  // The minEngagement field is a decimal in the database schema
  minEngagement: z.number().positive(),
}).pick({
  title: true,
  description: true,
  reward: true,
  rewardType: true,
  rewardAmount: true,
  minFollowers: true,
  minEngagement: true,
  postsRequired: true,
  timeframe: true,
  category: true,
  contentType: true,
  location: true,
  tags: true,
});

export const insertNotificationSchema = createInsertSchema(businessNotifications).pick({
  businessId: true,
  title: true,
  message: true,
  type: true,
  relatedOfferId: true,
  relatedInfluencerId: true,
});

export const insertPostSubmissionSchema = createInsertSchema(postSubmissions).pick({
  claimId: true,
  postUrl: true,
  platform: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  claimId: true,
  senderId: true,
  content: true,
});

export const insertDeliverableSchema = createInsertSchema(deliverables).pick({
  claimId: true,
  description: true,
});

export const insertPreviewTokenSchema = createInsertSchema(previewTokens);

// Schema for inserting a new social platform
export const insertSocialPlatformSchema = createInsertSchema(socialPlatforms).pick({
  influencerId: true,
  platform: true,
  handle: true,
  profileUrl: true,
  followers: true,
  engagementRate: true,
  isVerified: true,
  isPrimary: true,
}).extend({
  // Make some fields optional with validation
  followers: z.number().int().optional(),
  engagementRate: z.number().optional(),
  isVerified: z.boolean().default(false),
  isPrimary: z.boolean().default(false),
  // Virtual fields for UI convenience
  id: z.string().optional(), // For client-side identification before DB insert
}).transform((data) => {
  // Remove virtual fields and ensure correct types
  const cleanData: any = { ...data };
  
  // Remove client-side-only fields
  if ('id' in cleanData && typeof cleanData.id === 'string' && cleanData.id.startsWith('temp_')) {
    delete cleanData.id;
  }
  
  // Set default values for optional fields
  cleanData.isTest = false;
  
  return cleanData;
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type BusinessProfile = typeof businessProfiles.$inferSelect;
export type InfluencerProfile = typeof influencerProfiles.$inferSelect;
export type Offer = typeof offers.$inferSelect;
export type OfferClaim = typeof offerClaims.$inferSelect;
export type BusinessNotification = typeof businessNotifications.$inferSelect;
export type PostSubmission = typeof postSubmissions.$inferSelect;
export type InsertPostSubmission = z.infer<typeof insertPostSubmissionSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Deliverable = typeof deliverables.$inferSelect;
export type InsertDeliverable = z.infer<typeof insertDeliverableSchema>;
// Admin Tables
export const adminLogs = pgTable("admin_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(), // user, offer, business, influencer, etc.
  entityId: integer("entity_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: jsonb("setting_value").notNull(),
  settingType: text("setting_type").notNull(), // boolean, number, string, json
  description: text("description"),
  category: text("category").notNull(),
  updatedBy: integer("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reportedContent = pgTable("reported_content", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").notNull(),
  entityType: text("entity_type").notNull(), // user, offer, message, review
  entityId: integer("entity_id").notNull(),
  reason: text("reason").notNull(),
  details: text("details"),
  status: text("status").notNull().default("pending"), // pending, reviewed, actioned, dismissed
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAdminLogSchema = createInsertSchema(adminLogs).pick({
  adminId: true,
  action: true,
  entityType: true,
  entityId: true,
  details: true,
  ipAddress: true,
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).pick({
  settingKey: true,
  settingValue: true,
  settingType: true,
  description: true,
  category: true,
  updatedBy: true,
});

export const insertReportedContentSchema = createInsertSchema(reportedContent).pick({
  reporterId: true,
  entityType: true,
  entityId: true,
  reason: true,
  details: true,
});

export type SocialPlatform = typeof socialPlatforms.$inferSelect;
export type InsertSocialPlatform = z.infer<typeof insertSocialPlatformSchema>;
export type PreviewToken = typeof previewTokens.$inferSelect;
export type InsertPreviewToken = z.infer<typeof insertPreviewTokenSchema>;
export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertAdminLog = z.infer<typeof insertAdminLogSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type ReportedContent = typeof reportedContent.$inferSelect;
export type InsertReportedContent = z.infer<typeof insertReportedContentSchema>;