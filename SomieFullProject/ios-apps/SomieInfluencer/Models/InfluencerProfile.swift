import Foundation

struct InfluencerProfile: Codable, Identifiable {
    var id: Int
    var userId: Int
    var displayName: String
    var bio: String?
    var location: String?
    var followerCount: Int
    var profileImage: String?
    var tags: [String]?
    var createdAt: Date?
    var isTest: Bool
    
    // Social media profiles
    var socialPlatforms: [SocialPlatform]?
    
    // Computed properties
    var initialsForAvatar: String {
        let components = displayName.components(separatedBy: " ")
        if components.count > 1, let first = components.first?.first, let last = components.last?.first {
            return String(first) + String(last)
        } else if let first = displayName.first {
            return String(first)
        }
        return "I"
    }
    
    var primaryPlatform: SocialPlatform? {
        return socialPlatforms?.first(where: { $0.isPrimary }) ?? socialPlatforms?.first
    }
    
    var hasCompletedProfile: Bool {
        return bio != nil && bio!.count > 10 &&
               location != nil &&
               socialPlatforms != nil && !socialPlatforms!.isEmpty
    }
    
    var platformsFormatted: String {
        guard let platforms = socialPlatforms, !platforms.isEmpty else {
            return "None"
        }
        return platforms.map { $0.platform }.joined(separator: ", ")
    }
    
    var followerCountFormatted: String {
        if followerCount >= 1_000_000 {
            let millions = Double(followerCount) / 1_000_000.0
            return String(format: "%.1fM", millions)
        } else if followerCount >= 1_000 {
            let thousands = Double(followerCount) / 1_000.0
            return String(format: "%.1fK", thousands)
        } else {
            return "\(followerCount)"
        }
    }
}

struct SocialPlatform: Codable, Identifiable {
    var id: Int
    var influencerId: Int
    var platform: String
    var username: String
    var url: String
    var followerCount: Int?
    var engagementRate: Double?
    var isPrimary: Bool
    var isVerified: Bool
    var createdAt: Date?
    
    // Platform types
    static let platformInstagram = "instagram"
    static let platformTikTok = "tiktok"
    static let platformYouTube = "youtube"
    static let platformTwitter = "twitter"
    static let platformFacebook = "facebook"
    
    // Computed properties
    var iconName: String {
        switch platform.lowercased() {
        case Self.platformInstagram:
            return "camera.circle.fill"
        case Self.platformTikTok:
            return "music.note.tv.fill"
        case Self.platformYouTube:
            return "play.rectangle.fill"
        case Self.platformTwitter:
            return "message.fill"
        case Self.platformFacebook:
            return "person.2.fill"
        default:
            return "link.circle.fill"
        }
    }
    
    var followerCountFormatted: String {
        guard let count = followerCount else {
            return "Unknown"
        }
        
        if count >= 1_000_000 {
            let millions = Double(count) / 1_000_000.0
            return String(format: "%.1fM", millions)
        } else if count >= 1_000 {
            let thousands = Double(count) / 1_000.0
            return String(format: "%.1fK", thousands)
        } else {
            return "\(count)"
        }
    }
    
    var engagementRateFormatted: String {
        guard let rate = engagementRate else {
            return "Unknown"
        }
        return String(format: "%.1f%%", rate)
    }
}

// Model for updating an influencer profile
struct InfluencerProfileUpdateRequest: Codable {
    var displayName: String?
    var bio: String?
    var location: String?
    var tags: [String]?
}

// Model for creating an influencer profile (when registering)
struct InfluencerProfileCreationRequest: Codable {
    var displayName: String
    var bio: String?
    var location: String?
    var tags: [String]?
    var instagramUsername: String?
    var tiktokUsername: String?
    var youtubeUsername: String?
}

// Model for creating/updating a social platform
struct SocialPlatformRequest: Codable {
    var platform: String
    var username: String
    var url: String
    var followerCount: Int?
    var isPrimary: Bool?
}