import Foundation

// MARK: - User Models

struct User: Codable, Identifiable {
    let id: Int
    let username: String
    let email: String
    let userType: String
    let createdAt: Date?
    let isActive: Bool
}

struct LoginRequest: Codable {
    let username: String
    let password: String
}

struct LoginResponse: Codable {
    let user: User
    let authToken: String
}

// MARK: - Business Models

struct BusinessProfile: Codable, Identifiable {
    let id: Int
    let userId: Int
    let companyName: String
    let industry: String
    let description: String
    let website: String?
    let contactEmail: String?
    let contactPhone: String?
    let location: String?
    let logoUrl: String?
    let subscriptionTier: String?
    let offersAvailable: Int?
    
    // Create a blank business profile with only required fields filled in
    static func blank(userId: Int) -> BusinessProfile {
        return BusinessProfile(
            id: 0,  // This would be replaced when saved to the server
            userId: userId,
            companyName: "",
            industry: "",
            description: "",
            website: nil,
            contactEmail: nil,
            contactPhone: nil,
            location: nil,
            logoUrl: nil,
            subscriptionTier: "basic",
            offersAvailable: 5
        )
    }
}

struct Offer: Codable, Identifiable {
    let id: Int
    let businessId: Int
    let title: String
    let description: String
    let requirements: String
    let compensation: String
    let targetAudience: String?
    let targetPlatforms: [String]
    let contentTypes: [String]
    let categories: [String]
    let minFollowers: Int?
    let maxFollowers: Int?
    let isActive: Bool
    let expiresAt: Date?
    let createdAt: Date?
    let updatedAt: Date?
    
    // Create a blank offer with only required fields filled in
    static func blank(businessId: Int) -> Offer {
        return Offer(
            id: 0,  // This would be replaced when saved to the server
            businessId: businessId,
            title: "",
            description: "",
            requirements: "",
            compensation: "",
            targetAudience: nil,
            targetPlatforms: [],
            contentTypes: [],
            categories: [],
            minFollowers: nil,
            maxFollowers: nil,
            isActive: true,
            expiresAt: nil,
            createdAt: nil,
            updatedAt: nil
        )
    }
}

struct BusinessNotification: Codable, Identifiable {
    let id: Int
    let businessId: Int
    let title: String
    let message: String
    let notificationType: String
    let isRead: Bool
    let relatedEntityId: Int?
    let relatedEntityType: String?
    let createdAt: Date?
}

// MARK: - Influencer Models

struct InfluencerProfile: Codable, Identifiable {
    let id: Int
    let userId: Int
    let displayName: String
    let bio: String
    let interests: [String]
    let contentTypes: [String]
    let location: String?
    let profilePictureUrl: String?
    let isVerified: Bool
    let followerCount: Int?
    let engagementRate: Double?
    let acceptedOffers: Int?
    let completedOffers: Int?
    
    // Create a blank influencer profile with only required fields filled in
    static func blank(userId: Int) -> InfluencerProfile {
        return InfluencerProfile(
            id: 0,  // This would be replaced when saved to the server
            userId: userId,
            displayName: "",
            bio: "",
            interests: [],
            contentTypes: [],
            location: nil,
            profilePictureUrl: nil,
            isVerified: false,
            followerCount: nil,
            engagementRate: nil,
            acceptedOffers: nil,
            completedOffers: nil
        )
    }
}

struct SocialPlatform: Codable, Identifiable {
    let id: Int
    let influencerId: Int
    let platformName: String
    let username: String
    let url: String
    let isPrimary: Bool
    let followerCount: Int?
    let profilePictureUrl: String?
    let engagementRate: Double?
    let verified: Bool
}

// MARK: - Shared Models

struct OfferClaim: Codable, Identifiable {
    let id: Int
    let offerId: Int
    let influencerId: Int
    let businessId: Int
    let status: String // pending, approved, rejected, completed
    let claimedAt: Date?
    let updatedAt: Date?
    
    // Relation fields
    let offer: Offer?
    let influencer: InfluencerProfile?
}

struct Deliverable: Codable, Identifiable {
    let id: Int
    let claimId: Int
    let title: String
    let description: String
    let platform: String
    let contentType: String
    let dueDate: Date?
    let status: String // pending, in_progress, submitted, approved, rejected
    let submissionUrl: String?
    let feedback: String?
    let createdAt: Date?
    let updatedAt: Date?
}

struct Message: Codable, Identifiable {
    let id: Int
    let claimId: Int
    let senderId: Int
    let senderType: String?
    let content: String
    let isRead: Bool
    let createdAt: Date?
}

struct PostSubmission: Codable, Identifiable {
    let id: Int
    let claimId: Int
    let platform: String
    let contentType: String
    let url: String
    let verified: Bool
    let verificationDetails: String?
    let submittedAt: Date?
}

struct SyncResponse: Codable {
    let type: String
    let offers: [Offer]?
    let claims: [OfferClaim]?
    let messages: [Message]?
    let influencerProfile: InfluencerProfile?
    let businessProfile: BusinessProfile?
    let notifications: [BusinessNotification]?
    let socialPlatforms: [SocialPlatform]?
    let deliverables: [Deliverable]?
    let success: Bool
    let timestamp: String?
}

// MARK: - Preview Token Model
struct PreviewToken: Codable, Identifiable {
    let id: Int
    let token: String
    let type: String // "business_profile", "influencer_profile", "offer"
    let entityId: Int
    let expiresAt: Date
    let createdAt: Date
}