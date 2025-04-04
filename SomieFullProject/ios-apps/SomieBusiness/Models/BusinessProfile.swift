import Foundation

struct BusinessProfile: Codable, Identifiable {
    var id: Int
    var userId: Int
    var companyName: String
    var industry: String?
    var website: String?
    var logo: String?
    var description: String?
    var contactEmail: String?
    var contactPhone: String?
    var location: String?
    var socialLinks: [String: String]?
    var createdAt: Date?
    var isTest: Bool
    
    // Subscription-related fields
    var subscriptionTier: String?
    var subscriptionStatus: String?
    var subscriptionExpiresAt: Date?
    var offerLimit: Int?
    var offerCount: Int?
    
    // Computed properties
    var initialsForAvatar: String {
        let components = companyName.components(separatedBy: " ")
        if components.count > 1, let first = components.first?.first, let last = components.last?.first {
            return String(first) + String(last)
        } else if let first = companyName.first {
            return String(first)
        }
        return "B"
    }
    
    var hasCompleteProfile: Bool {
        return description != nil && description!.count > 10 &&
               industry != nil && 
               (website != nil || socialLinks?.count ?? 0 > 0)
    }
    
    var offersRemaining: Int {
        guard let limit = offerLimit, let count = offerCount else {
            return -1  // Unlimited or unknown
        }
        return limit - count
    }
    
    var hasReachedOfferLimit: Bool {
        guard let limit = offerLimit, let count = offerCount else {
            return false  // Assume unlimited if not specified
        }
        return count >= limit
    }
    
    var subscriptionActive: Bool {
        guard let status = subscriptionStatus, let expiry = subscriptionExpiresAt else {
            return false
        }
        return status == "active" && expiry > Date()
    }
    
    var displaySubscriptionTier: String {
        guard let tier = subscriptionTier else {
            return "Free"
        }
        return tier.capitalized
    }
}

// Model for updating a business profile
struct BusinessProfileUpdateRequest: Codable {
    var companyName: String?
    var industry: String?
    var website: String?
    var description: String?
    var contactEmail: String?
    var contactPhone: String?
    var location: String?
    var socialLinks: [String: String]?
}

// Model for creating a business profile (when registering)
struct BusinessProfileCreationRequest: Codable {
    var companyName: String
    var industry: String?
    var website: String?
    var description: String?
    var contactEmail: String?
    var contactPhone: String?
    var location: String?
    var socialLinks: [String: String]?
}