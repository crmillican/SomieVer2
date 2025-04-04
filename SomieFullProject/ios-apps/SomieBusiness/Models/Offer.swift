import Foundation

struct Offer: Codable, Identifiable {
    var id: Int
    var businessId: Int
    var title: String
    var description: String
    var reward: String
    var location: String?
    var status: String
    var tags: [String]?
    var platforms: [String]?
    var contentType: String?
    var contentGuidelines: String?
    var deliverables: [String]?
    var audienceRequirements: String?
    var rewardAmount: Double?
    var createdAt: Date?
    var expiresAt: Date?
    var isTest: Bool
    
    var claimCount: Int?
    var viewCount: Int?
    
    // Status values
    static let statusDraft = "draft"
    static let statusActive = "active"
    static let statusPaused = "paused"
    static let statusExpired = "expired"
    static let statusCompleted = "completed"
    
    // Computed properties
    var isActive: Bool {
        return status == Self.statusActive
    }
    
    var statusDisplayName: String {
        switch status {
        case Self.statusDraft: return "Draft"
        case Self.statusActive: return "Active"
        case Self.statusPaused: return "Paused"
        case Self.statusExpired: return "Expired"
        case Self.statusCompleted: return "Completed"
        default: return status.capitalized
        }
    }
    
    var platformsFormatted: String {
        guard let platforms = platforms, !platforms.isEmpty else {
            return "None"
        }
        return platforms.joined(separator: ", ")
    }
    
    var tagsFormatted: String {
        guard let tags = tags, !tags.isEmpty else {
            return "None"
        }
        return tags.joined(separator: ", ")
    }
}

// Model for creating a new offer
struct OfferCreationRequest: Codable {
    var title: String
    var description: String
    var reward: String
    var location: String?
    var tags: [String]?
    var platforms: [String]
    var contentType: String?
    var contentGuidelines: String?
    var deliverables: [String]
    var audienceRequirements: String?
    var rewardAmount: Double?
    var expiresAt: Date?
    var status: String = Offer.statusDraft
}

// Model for updating an offer
struct OfferUpdateRequest: Codable {
    var title: String?
    var description: String?
    var reward: String?
    var location: String?
    var tags: [String]?
    var platforms: [String]?
    var contentType: String?
    var contentGuidelines: String?
    var deliverables: [String]?
    var audienceRequirements: String?
    var rewardAmount: Double?
    var expiresAt: Date?
    var status: String?
}