import Foundation

struct User: Codable, Identifiable {
    var id: Int
    var username: String
    var userType: String
    var role: String?
    var permissions: [String]?
    var createdAt: Date?
    var isTest: Bool
    
    // Computed properties
    var isBusiness: Bool {
        return userType == "business"
    }
    
    var isInfluencer: Bool {
        return userType == "influencer"
    }
    
    var isAdmin: Bool {
        return role == "admin" || role == "super_admin"
    }
}

struct AuthResponse: Codable {
    var id: Int
    var username: String
    var userType: String
    var authToken: String
    var role: String?
    var permissions: [String]?
    
    enum CodingKeys: String, CodingKey {
        case id, username, userType, authToken, role, permissions
    }
}

struct LoginRequest: Codable {
    var username: String
    var password: String
}

struct RegisterRequest: Codable {
    var username: String
    var password: String
    var userType: String
}

// Notification model
struct BusinessNotification: Codable, Identifiable {
    var id: Int
    var businessId: Int
    var title: String
    var message: String
    var type: String
    var isRead: Bool
    var createdAt: Date
    var relatedId: Int?
    var relatedType: String?
    
    // Notification types
    static let typeClaimRequest = "claim_request"
    static let typeDeliverableSubmission = "deliverable_submission"
    static let typePostSubmission = "post_submission"
    static let typeMessage = "message"
    static let typeSystem = "system"
    
    var formattedRelativeTime: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .short
        return formatter.localizedString(for: createdAt, relativeTo: Date())
    }
    
    var iconName: String {
        switch type {
        case Self.typeClaimRequest:
            return "person.crop.circle.badge.plus"
        case Self.typeDeliverableSubmission:
            return "checkmark.circle"
        case Self.typePostSubmission:
            return "photo.circle"
        case Self.typeMessage:
            return "bubble.left"
        case Self.typeSystem:
            return "bell"
        default:
            return "bell"
        }
    }
}