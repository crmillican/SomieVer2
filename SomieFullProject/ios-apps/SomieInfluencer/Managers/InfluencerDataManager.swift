import Foundation
import Combine

// MARK: - Influencer Data Manager
class InfluencerDataManager: ObservableObject {
    // MARK: - Singleton
    static let shared = InfluencerDataManager()
    
    // MARK: - Published Properties
    @Published var offers: [Offer] = []
    @Published var claims: [OfferClaim] = []
    @Published var influencerProfile: InfluencerProfile?
    @Published var socialPlatforms: [SocialPlatform] = []
    @Published var messages: [Int: [Message]] = [:] // Organized by claimId
    @Published var deliverables: [Int: [Deliverable]] = [:] // Organized by claimId
    @Published var isLoading = false
    @Published var error: Error?
    
    // MARK: - Private Properties
    private let webSocketManager = WebSocketManager()
    private var syncInProgress = false
    private var pendingChanges: [EntityChange] = []
    private var offlineModeEnabled = false
    
    // MARK: - Initialization
    private init() {
        setupWebSocketManager()
    }
    
    // MARK: - WebSocket Setup
    private func setupWebSocketManager() {
        webSocketManager.delegate = self
        
        Task {
            await webSocketManager.connect()
        }
    }
    
    // MARK: - Profile Methods
    
    /// Fetches influencer profile for the current user
    func fetchInfluencerProfile() async throws {
        isLoading = true
        defer { isLoading = false }
        
        guard let userId = TokenManager.shared.getUserId() else {
            throw APIError.authenticationRequired
        }
        
        do {
            let profile: InfluencerProfile = try await APIClient.shared.request(endpoint: "api/influencer-profile/user/\(userId)")
            
            DispatchQueue.main.async {
                self.influencerProfile = profile
                self.error = nil
            }
            
            return profile
        } catch {
            DispatchQueue.main.async {
                self.error = error
            }
            throw error
        }
    }
    
    /// Creates or updates influencer profile
    func saveInfluencerProfile(_ profile: InfluencerProfile) async throws {
        isLoading = true
        defer { isLoading = false }
        
        do {
            if let existingProfile = influencerProfile {
                // Update existing profile
                let updatedProfile: InfluencerProfile = try await APIClient.shared.request(
                    endpoint: "api/influencer-profile/\(existingProfile.id)",
                    method: .put,
                    body: profile
                )
                
                DispatchQueue.main.async {
                    self.influencerProfile = updatedProfile
                    self.error = nil
                }
                
                return updatedProfile
            } else {
                // Create new profile
                let newProfile: InfluencerProfile = try await APIClient.shared.request(
                    endpoint: "api/influencer-profile",
                    method: .post,
                    body: profile
                )
                
                DispatchQueue.main.async {
                    self.influencerProfile = newProfile
                    self.error = nil
                }
                
                return newProfile
            }
        } catch {
            DispatchQueue.main.async {
                self.error = error
            }
            throw error
        }
    }
    
    // MARK: - Social Platform Methods
    
    /// Adds a new social platform
    func addSocialPlatform(_ platform: SocialPlatform) async throws {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let newPlatform: SocialPlatform = try await APIClient.shared.request(
                endpoint: "api/social-platforms",
                method: .post,
                body: platform
            )
            
            DispatchQueue.main.async {
                self.socialPlatforms.append(newPlatform)
                self.error = nil
            }
            
            // Queue change for sync
            let platformData = try JSONSerialization.jsonObject(with: JSONEncoder().encode(newPlatform)) as! [String: Any]
            let change = EntityChange(
                type: "socialPlatform",
                action: "create",
                entityId: newPlatform.id,
                data: platformData.mapValues { AnyCodable($0) }
            )
            
            queueChange(change)
            
            return newPlatform
        } catch {
            DispatchQueue.main.async {
                self.error = error
            }
            throw error
        }
    }
    
    /// Updates an existing social platform
    func updateSocialPlatform(_ platform: SocialPlatform) async throws {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let updatedPlatform: SocialPlatform = try await APIClient.shared.request(
                endpoint: "api/social-platforms/\(platform.id)",
                method: .put,
                body: platform
            )
            
            DispatchQueue.main.async {
                if let index = self.socialPlatforms.firstIndex(where: { $0.id == platform.id }) {
                    self.socialPlatforms[index] = updatedPlatform
                }
                self.error = nil
            }
            
            // Queue change for sync
            let platformData = try JSONSerialization.jsonObject(with: JSONEncoder().encode(updatedPlatform)) as! [String: Any]
            let change = EntityChange(
                type: "socialPlatform",
                action: "update",
                entityId: updatedPlatform.id,
                data: platformData.mapValues { AnyCodable($0) }
            )
            
            queueChange(change)
            
            return updatedPlatform
        } catch {
            DispatchQueue.main.async {
                self.error = error
            }
            throw error
        }
    }
    
    /// Deletes a social platform
    func deleteSocialPlatform(platformId: Int) async throws {
        isLoading = true
        defer { isLoading = false }
        
        do {
            try await APIClient.shared.request(
                endpoint: "api/social-platforms/\(platformId)",
                method: .delete
            )
            
            DispatchQueue.main.async {
                self.socialPlatforms.removeAll { $0.id == platformId }
                self.error = nil
            }
            
            // Queue change for sync
            let change = EntityChange(
                type: "socialPlatform",
                action: "delete",
                entityId: platformId,
                data: [:]
            )
            
            queueChange(change)
        } catch {
            DispatchQueue.main.async {
                self.error = error
            }
            throw error
        }
    }
    
    /// Sets a social platform as primary
    func setPrimaryPlatform(platformId: Int) async throws {
        isLoading = true
        defer { isLoading = false }
        
        guard let influencerId = influencerProfile?.id else {
            throw NSError(domain: "InfluencerDataManager", code: 400, userInfo: [NSLocalizedDescriptionKey: "Influencer profile not found"])
        }
        
        do {
            try await APIClient.shared.request(
                endpoint: "api/social-platforms/\(platformId)/set-primary",
                method: .put,
                parameters: ["influencerId": influencerId]
            )
            
            DispatchQueue.main.async {
                // Update local social platforms
                for i in 0..<self.socialPlatforms.count {
                    let isPrimary = self.socialPlatforms[i].id == platformId
                    if self.socialPlatforms[i].isPrimary != isPrimary {
                        // Create a new instance with the updated isPrimary value
                        var updatedPlatform = self.socialPlatforms[i]
                        self.socialPlatforms[i].isPrimary = isPrimary
                    }
                }
                self.error = nil
            }
        } catch {
            DispatchQueue.main.async {
                self.error = error
            }
            throw error
        }
    }
    
    // MARK: - Offer Methods
    
    /// Fetches available offers (matches)
    func fetchAvailableOffers() async throws {
        isLoading = true
        defer { isLoading = false }
        
        guard let profile = influencerProfile else {
            throw NSError(domain: "InfluencerDataManager", code: 400, userInfo: [NSLocalizedDescriptionKey: "Influencer profile not found"])
        }
        
        do {
            let matchedOffers: [Offer] = try await APIClient.shared.request(endpoint: "api/offers/matches")
            
            DispatchQueue.main.async {
                self.offers = matchedOffers
                self.error = nil
            }
            
            return matchedOffers
        } catch {
            DispatchQueue.main.async {
                self.error = error
            }
            throw error
        }
    }
    
    // MARK: - Claim Methods
    
    /// Claims an offer
    func claimOffer(offerId: Int) async throws {
        isLoading = true
        defer { isLoading = false }
        
        guard let influencerId = influencerProfile?.id else {
            throw NSError(domain: "InfluencerDataManager", code: 400, userInfo: [NSLocalizedDescriptionKey: "Influencer profile not found"])
        }
        
        let claimData: [String: Any] = [
            "offerId": offerId,
            "influencerId": influencerId
        ]
        
        do {
            let newClaim: OfferClaim = try await APIClient.shared.request(
                endpoint: "api/claims",
                method: .post,
                parameters: claimData
            )
            
            DispatchQueue.main.async {
                self.claims.append(newClaim)
                self.error = nil
            }
            
            return newClaim
        } catch {
            DispatchQueue.main.async {
                self.error = error
            }
            throw error
        }
    }
    
    // MARK: - Deliverable Methods
    
    /// Submits a deliverable
    func submitDeliverable(deliverableId: Int, submissionUrl: String) async throws {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let updatedDeliverable: Deliverable = try await APIClient.shared.request(
                endpoint: "api/deliverables/\(deliverableId)/submit",
                method: .put,
                parameters: ["submissionUrl": submissionUrl]
            )
            
            DispatchQueue.main.async {
                for (claimId, deliverableList) in self.deliverables {
                    if let index = deliverableList.firstIndex(where: { $0.id == deliverableId }) {
                        var updatedList = deliverableList
                        updatedList[index] = updatedDeliverable
                        self.deliverables[claimId] = updatedList
                    }
                }
                self.error = nil
            }
            
            // Queue change for sync
            let deliverableData = try JSONSerialization.jsonObject(with: JSONEncoder().encode(updatedDeliverable)) as! [String: Any]
            let change = EntityChange(
                type: "deliverable",
                action: "update",
                entityId: updatedDeliverable.id,
                data: deliverableData.mapValues { AnyCodable($0) }
            )
            
            queueChange(change)
            
            return updatedDeliverable
        } catch {
            DispatchQueue.main.async {
                self.error = error
            }
            throw error
        }
    }
    
    // MARK: - Message Methods
    
    /// Sends a message in a claim conversation
    func sendMessage(claimId: Int, content: String) async throws {
        isLoading = true
        defer { isLoading = false }
        
        guard let userId = TokenManager.shared.getUserId() else {
            throw APIError.authenticationRequired
        }
        
        let messageData: [String: Any] = [
            "claimId": claimId,
            "senderId": userId,
            "content": content
        ]
        
        do {
            let newMessage: Message = try await APIClient.shared.request(
                endpoint: "api/messages",
                method: .post,
                parameters: messageData
            )
            
            DispatchQueue.main.async {
                if var claimMessages = self.messages[claimId] {
                    claimMessages.append(newMessage)
                    self.messages[claimId] = claimMessages
                } else {
                    self.messages[claimId] = [newMessage]
                }
                self.error = nil
            }
            
            // Queue change for sync
            let messageJsonData = try JSONSerialization.jsonObject(with: JSONEncoder().encode(newMessage)) as! [String: Any]
            let change = EntityChange(
                type: "message",
                action: "create",
                entityId: newMessage.id,
                data: messageJsonData.mapValues { AnyCodable($0) }
            )
            
            queueChange(change)
            
            return newMessage
        } catch {
            DispatchQueue.main.async {
                self.error = error
            }
            throw error
        }
    }
    
    /// Fetches messages for a claim
    func fetchMessages(claimId: Int) async throws {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let claimMessages: [Message] = try await APIClient.shared.request(
                endpoint: "api/messages/claim/\(claimId)"
            )
            
            DispatchQueue.main.async {
                self.messages[claimId] = claimMessages
                self.error = nil
            }
            
            return claimMessages
        } catch {
            DispatchQueue.main.async {
                self.error = error
            }
            throw error
        }
    }
    
    // MARK: - Sync Methods
    
    /// Request synchronization from the server
    func requestSync() {
        if !syncInProgress {
            syncInProgress = true
            webSocketManager.requestSync()
        }
    }
    
    /// Queue a change to be sent to the server
    private func queueChange(_ change: EntityChange) {
        pendingChanges.append(change)
        sendPendingChanges()
    }
    
    /// Send pending changes to the server
    private func sendPendingChanges() {
        guard !pendingChanges.isEmpty && webSocketManager.state == .connected else {
            return
        }
        
        let changes = pendingChanges
        pendingChanges = []
        
        webSocketManager.sendChanges(changes)
    }
    
    // MARK: - Offline Mode Methods
    
    /// Enable or disable offline mode
    func setOfflineMode(enabled: Bool) {
        offlineModeEnabled = enabled
        
        if !enabled {
            // Reconnect and sync when going online
            if webSocketManager.state != .connected {
                Task {
                    await webSocketManager.connect()
                }
            } else {
                requestSync()
            }
        } else {
            // Disconnect when going offline
            webSocketManager.disconnect()
        }
    }
}

// MARK: - WebSocket Delegate
extension InfluencerDataManager: WebSocketManagerDelegate {
    func didReceiveData(_ data: SyncResponse) {
        // Update offers
        if let offers = data.offers {
            self.offers = offers
        }
        
        // Update claims
        if let claims = data.claims {
            self.claims = claims
        }
        
        // Update influencer profile
        if let profile = data.influencerProfile {
            self.influencerProfile = profile
        }
        
        // Update social platforms
        if let platforms = data.socialPlatforms {
            self.socialPlatforms = platforms
        }
        
        // Update deliverables
        if let deliverables = data.deliverables {
            // Group deliverables by claim ID
            var deliverablesByClaimId: [Int: [Deliverable]] = [:]
            for deliverable in deliverables {
                var claimDeliverables = deliverablesByClaimId[deliverable.claimId] ?? []
                claimDeliverables.append(deliverable)
                deliverablesByClaimId[deliverable.claimId] = claimDeliverables
            }
            self.deliverables = deliverablesByClaimId
        }
        
        // Mark sync as complete
        syncInProgress = false
        
        // Send any pending changes
        if !pendingChanges.isEmpty {
            sendPendingChanges()
        }
    }
    
    func didUpdateConnectionState(_ state: WebSocketState) {
        // Request sync when connection is established
        if state == .connected && !syncInProgress {
            requestSync()
        }
    }
    
    func didReceiveEntityUpdate(type: String, action: String, data: [String: Any]) {
        do {
            // Convert data to JSON
            let jsonData = try JSONSerialization.data(withJSONObject: data)
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            decoder.dateDecodingStrategy = .iso8601
            
            switch type {
            case "offer":
                let offer = try decoder.decode(Offer.self, from: jsonData)
                
                switch action {
                case "create":
                    if !offers.contains(where: { $0.id == offer.id }) {
                        offers.append(offer)
                    }
                case "update":
                    if let index = offers.firstIndex(where: { $0.id == offer.id }) {
                        offers[index] = offer
                    }
                case "delete":
                    offers.removeAll { $0.id == offer.id }
                default:
                    break
                }
                
            case "claim":
                let claim = try decoder.decode(OfferClaim.self, from: jsonData)
                
                switch action {
                case "create":
                    if !claims.contains(where: { $0.id == claim.id }) {
                        claims.append(claim)
                    }
                case "update":
                    if let index = claims.firstIndex(where: { $0.id == claim.id }) {
                        claims[index] = claim
                    }
                default:
                    break
                }
                
            case "message":
                let message = try decoder.decode(Message.self, from: jsonData)
                let claimId = message.claimId
                
                if action == "create" {
                    if var claimMessages = messages[claimId] {
                        if !claimMessages.contains(where: { $0.id == message.id }) {
                            claimMessages.append(message)
                            messages[claimId] = claimMessages
                        }
                    } else {
                        messages[claimId] = [message]
                    }
                }
                
            case "deliverable":
                let deliverable = try decoder.decode(Deliverable.self, from: jsonData)
                let claimId = deliverable.claimId
                
                switch action {
                case "create":
                    if var claimDeliverables = deliverables[claimId] {
                        if !claimDeliverables.contains(where: { $0.id == deliverable.id }) {
                            claimDeliverables.append(deliverable)
                            deliverables[claimId] = claimDeliverables
                        }
                    } else {
                        deliverables[claimId] = [deliverable]
                    }
                case "update":
                    if var claimDeliverables = deliverables[claimId] {
                        if let index = claimDeliverables.firstIndex(where: { $0.id == deliverable.id }) {
                            claimDeliverables[index] = deliverable
                            deliverables[claimId] = claimDeliverables
                        }
                    }
                default:
                    break
                }
                
            case "socialPlatform":
                let platform = try decoder.decode(SocialPlatform.self, from: jsonData)
                
                switch action {
                case "create":
                    if !socialPlatforms.contains(where: { $0.id == platform.id }) {
                        socialPlatforms.append(platform)
                    }
                case "update":
                    if let index = socialPlatforms.firstIndex(where: { $0.id == platform.id }) {
                        socialPlatforms[index] = platform
                    }
                case "delete":
                    socialPlatforms.removeAll { $0.id == platform.id }
                default:
                    break
                }
                
            default:
                break
            }
        } catch {
            print("Error processing entity update: \(error)")
        }
    }
    
    func didFailWithError(_ error: Error) {
        DispatchQueue.main.async {
            self.error = error
        }
    }
}