import Foundation

struct DiscoverOffer: Codable, Identifiable {
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
    
    // Business relationship (when available)
    var business: BusinessSummary?
    
    // Status values
    static let statusActive = "active"
    
    // Computed properties
    var isActive: Bool {
        return status == Self.statusActive
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
    
    var isExpired: Bool {
        guard let expiry = expiresAt else {
            return false
        }
        return expiry < Date()
    }
    
    var hasClaimed: Bool = false
}

struct BusinessSummary: Codable, Identifiable {
    var id: Int
    var companyName: String
    var industry: String?
    var logo: String?
    var location: String?
    var isVerified: Bool?
    
    var initialsForAvatar: String {
        let components = companyName.components(separatedBy: " ")
        if components.count > 1, let first = components.first?.first, let last = components.last?.first {
            return String(first) + String(last)
        } else if let first = companyName.first {
            return String(first)
        }
        return "B"
    }
}

struct InfluencerClaim: Codable, Identifiable {
    var id: Int
    var offerId: Int
    var influencerId: Int
    var status: String
    var createdAt: Date?
    var completedAt: Date?
    
    // Relationships (optional, populated when needed)
    var offer: DiscoverOffer?
    var deliverables: [InfluencerDeliverable]?
    var messages: [Message]?
    
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
        case Self.statusPending: return "Pending Approval"
        case Self.statusApproved: return "Approved"
        case Self.statusRejected: return "Rejected"
        case Self.statusInProgress: return "In Progress"
        case Self.statusCompleted: return "Completed"
        case Self.statusCancelled: return "Cancelled"
        default: return status.capitalized
        }
    }
    
    var statusColor: String {
        switch status {
        case Self.statusPending: return "orange"
        case Self.statusApproved: return "blue"
        case Self.statusRejected: return "red"
        case Self.statusInProgress: return "purple"
        case Self.statusCompleted: return "green"
        case Self.statusCancelled: return "gray"
        default: return "gray"
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
    
    var pendingDeliverables: Int {
        return deliverables?.filter { $0.status == InfluencerDeliverable.statusPending }.count ?? 0
    }
    
    var submittedDeliverables: Int {
        return deliverables?.filter { $0.status == InfluencerDeliverable.statusSubmitted }.count ?? 0
    }
    
    var approvedDeliverables: Int {
        return deliverables?.filter { $0.status == InfluencerDeliverable.statusApproved }.count ?? 0
    }
}

struct InfluencerDeliverable: Codable, Identifiable {
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
        case Self.statusPending: return "To Do"
        case Self.statusSubmitted: return "Submitted"
        case Self.statusApproved: return "Approved"
        case Self.statusRejected: return "Rejected"
        default: return status.capitalized
        }
    }
    
    var isOverdue: Bool {
        guard let due = dueDate, status == Self.statusPending else {
            return false
        }
        return due < Date()
    }
    
    var isDone: Bool {
        return status == Self.statusApproved || status == Self.statusRejected
    }
    
    var iconForPlatform: String {
        switch platform.lowercased() {
        case "instagram":
            return "camera.circle.fill"
        case "tiktok":
            return "music.note.tv.fill"
        case "youtube":
            return "play.rectangle.fill"
        case "twitter":
            return "message.fill"
        case "facebook":
            return "person.2.fill"
        default:
            return "link.circle.fill"
        }
    }
}

struct Message: Codable, Identifiable {
    var id: Int
    var claimId: Int
    var senderId: Int
    var content: String
    var createdAt: Date
    var isRead: Bool
    
    // Computed property
    var isFromBusiness: Bool = false
    
    var formattedTime: String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: createdAt)
    }
    
    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: createdAt)
    }
}

// Request to claim an offer
struct ClaimOfferRequest: Codable {
    var offerId: Int
    var message: String?
}