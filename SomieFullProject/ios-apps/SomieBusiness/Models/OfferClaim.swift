import Foundation

struct OfferClaim: Codable, Identifiable {
    var id: Int
    var offerId: Int
    var influencerId: Int
    var status: String
    var createdAt: Date?
    var completedAt: Date?
    var isTest: Bool
    
    // Relationships (optional, populated when needed)
    var offer: Offer?
    var influencer: InfluencerProfile?
    var messages: [Message]?
    var deliverables: [Deliverable]?
    var submissions: [PostSubmission]?
    
    // Status values
    static let statusPending = "pending"
    static let statusApproved = "approved"
    static let statusRejected = "rejected"
    static let statusInProgress = "in_progress"
    static let statusCompleted = "completed"
    static let statusCancelled = "cancelled"
    
    // Computed properties
    var statusDisplayName: String {
        switch status {
        case Self.statusPending: return "Pending"
        case Self.statusApproved: return "Approved"
        case Self.statusRejected: return "Rejected"
        case Self.statusInProgress: return "In Progress"
        case Self.statusCompleted: return "Completed"
        case Self.statusCancelled: return "Cancelled"
        default: return status.capitalized
        }
    }
    
    var isPending: Bool {
        return status == Self.statusPending
    }
    
    var isApproved: Bool {
        return status == Self.statusApproved
    }
    
    var isInProgress: Bool {
        return status == Self.statusInProgress
    }
    
    var isCompleted: Bool {
        return status == Self.statusCompleted
    }
    
    var isCancelled: Bool {
        return status == Self.statusCancelled || status == Self.statusRejected
    }
    
    var canMessage: Bool {
        return status != Self.statusCancelled && status != Self.statusRejected
    }
    
    var canReview: Bool {
        return status == Self.statusCompleted
    }
}

// Models for related entities
struct InfluencerProfile: Codable, Identifiable {
    var id: Int
    var userId: Int
    var displayName: String
    var followerCount: Int
    var bio: String?
    var location: String?
    var profileImage: String?
    var instagramUrl: String?
    var tiktokUrl: String?
    var youtubeUrl: String?
    var createdAt: Date?
    var isTest: Bool
    
    var platformsFormatted: String {
        var platforms = [String]()
        if instagramUrl != nil { platforms.append("Instagram") }
        if tiktokUrl != nil { platforms.append("TikTok") }
        if youtubeUrl != nil { platforms.append("YouTube") }
        
        return platforms.isEmpty ? "None" : platforms.joined(separator: ", ")
    }
    
    var initialsForAvatar: String {
        let components = displayName.components(separatedBy: " ")
        if components.count > 1, let first = components.first?.first, let last = components.last?.first {
            return String(first) + String(last)
        } else if let first = displayName.first {
            return String(first)
        }
        return "I"
    }
}

struct Message: Codable, Identifiable {
    var id: Int
    var claimId: Int
    var senderId: Int
    var content: String
    var createdAt: Date
    var isRead: Bool
    
    // In the app we'll compute sender type (business/influencer)
    var isFromBusiness: Bool?
}

struct Deliverable: Codable, Identifiable {
    var id: Int
    var claimId: Int
    var title: String
    var description: String
    var dueDate: Date?
    var platform: String
    var contentType: String
    var status: String
    var submissionUrl: String?
    var feedback: String?
    var createdAt: Date?
    
    // Status values
    static let statusPending = "pending"
    static let statusSubmitted = "submitted"
    static let statusApproved = "approved"
    static let statusRejected = "rejected"
    
    var statusDisplayName: String {
        switch status {
        case Self.statusPending: return "Pending"
        case Self.statusSubmitted: return "Submitted"
        case Self.statusApproved: return "Approved"
        case Self.statusRejected: return "Rejected"
        default: return status.capitalized
        }
    }
}

struct PostSubmission: Codable, Identifiable {
    var id: Int
    var claimId: Int
    var platform: String
    var postUrl: String
    var submittedAt: Date
    var verificationStatus: String
    var verificationDetails: String?
    
    // Status values
    static let statusPending = "pending"
    static let statusVerified = "verified"
    static let statusRejected = "rejected"
    
    var statusDisplayName: String {
        switch verificationStatus {
        case Self.statusPending: return "Pending"
        case Self.statusVerified: return "Verified"
        case Self.statusRejected: return "Rejected"
        default: return verificationStatus.capitalized
        }
    }
    
    var isVerified: Bool {
        return verificationStatus == Self.statusVerified
    }
}