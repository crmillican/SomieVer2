import Foundation
import Combine

// MARK: - Business Data Manager
class BusinessDataManager: ObservableObject {
    // MARK: - Singleton
    static let shared = BusinessDataManager()
    
    // MARK: - Published Properties
    @Published var offers: [Offer] = []
    @Published var claims: [OfferClaim] = []
    @Published var notifications: [BusinessNotification] = []
    @Published var businessProfile: BusinessProfile?
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
    
    /// Fetches business profile for the current user
    func fetchBusinessProfile() async throws {
        isLoading = true
        defer { isLoading = false }
        
        guard let userId = TokenManager.shared.getUserId() else {
            throw APIError.authenticationRequired
        }
        
        do {
            let profile: BusinessProfile = try await APIClient.shared.request(endpoint: "api/business-profile/user/\(userId)")
            
            DispatchQueue.main.async {
                self.businessProfile = profile
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
    
    /// Creates or updates business profile
    func saveBusinessProfile(_ profile: BusinessProfile) async throws {
        isLoading = true
        defer { isLoading = false }
        
        do {
            if let existingProfile = businessProfile {
                // Update existing profile
                let updatedProfile: BusinessProfile = try await APIClient.shared.request(
                    endpoint: "api/business-profile/\(existingProfile.id)",
                    method: .put,
                    body: profile
                )
                
                DispatchQueue.main.async {
                    self.businessProfile = updatedProfile
                    self.error = nil
                }
                
                return updatedProfile
            } else {
                // Create new profile
                let newProfile: BusinessProfile = try await APIClient.shared.request(
                    endpoint: "api/business-profile",
                    method: .post,
                    body: profile
                )
                
                DispatchQueue.main.async {
                    self.businessProfile = newProfile
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
    
    // MARK: - Offer Methods
    
    /// Creates a new offer
    func createOffer(_ offer: Offer) async throws {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let newOffer: Offer = try await APIClient.shared.request(
                endpoint: "api/offers",
                method: .post,
                body: offer
            )
            
            DispatchQueue.main.async {
                self.offers.append(newOffer)
                self.error = nil
            }
            
            // Queue change for sync
            let offerData = try JSONSerialization.jsonObject(with: JSONEncoder().encode(newOffer)) as! [String: Any]
            let change = EntityChange(
                type: "offer",
                action: "create",
                entityId: newOffer.id,
                data: offerData.mapValues { AnyCodable($0) }
            )
            
            queueChange(change)
            
            return newOffer
        } catch {
            DispatchQueue.main.async {
                self.error = error
            }
            throw error
        }
    }
    
    /// Updates an existing offer
    func updateOffer(_ offer: Offer) async throws {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let updatedOffer: Offer = try await APIClient.shared.request(
                endpoint: "api/offers/\(offer.id)",
                method: .put,
                body: offer
            )
            
            DispatchQueue.main.async {
                if let index = self.offers.firstIndex(where: { $0.id == offer.id }) {
                    self.offers[index] = updatedOffer
                }
                self.error = nil
            }
            
            // Queue change for sync
            let offerData = try JSONSerialization.jsonObject(with: JSONEncoder().encode(updatedOffer)) as! [String: Any]
            let change = EntityChange(
                type: "offer",
                action: "update",
                entityId: updatedOffer.id,
                data: offerData.mapValues { AnyCodable($0) }
            )
            
            queueChange(change)
            
            return updatedOffer
        } catch {
            DispatchQueue.main.async {
                self.error = error
            }
            throw error
        }
    }
    
    // MARK: - Claim Methods
    
    /// Updates an offer claim status
    func updateClaimStatus(claimId: Int, status: String) async throws {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let updatedClaim: OfferClaim = try await APIClient.shared.request(
                endpoint: "api/claims/\(claimId)/status",
                method: .put,
                parameters: ["status": status]
            )
            
            DispatchQueue.main.async {
                if let index = self.claims.firstIndex(where: { $0.id == claimId }) {
                    self.claims[index] = updatedClaim
                }
                self.error = nil
            }
            
            // Queue change for sync
            let claimData = try JSONSerialization.jsonObject(with: JSONEncoder().encode(updatedClaim)) as! [String: Any]
            let change = EntityChange(
                type: "claim",
                action: "update",
                entityId: updatedClaim.id,
                data: claimData.mapValues { AnyCodable($0) }
            )
            
            queueChange(change)
            
            return updatedClaim
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
    
    // MARK: - Notification Methods
    
    /// Marks a notification as read
    func markNotificationAsRead(notificationId: Int) async throws {
        do {
            try await APIClient.shared.request(
                endpoint: "api/notifications/\(notificationId)/read",
                method: .put
            )
            
            DispatchQueue.main.async {
                if let index = self.notifications.firstIndex(where: { $0.id == notificationId }) {
                    var updatedNotification = self.notifications[index]
                    updatedNotification.isRead = true
                    self.notifications[index] = updatedNotification
                }
            }
        } catch {
            DispatchQueue.main.async {
                self.error = error
            }
            throw error
        }
    }
    
    // MARK: - Deliverable Methods
    
    /// Accepts or rejects a deliverable
    func reviewDeliverable(deliverableId: Int, status: String, feedback: String? = nil) async throws {
        isLoading = true
        defer { isLoading = false }
        
        var parameters: [String: Any] = ["status": status]
        if let feedback = feedback {
            parameters["feedback"] = feedback
        }
        
        do {
            let updatedDeliverable: Deliverable = try await APIClient.shared.request(
                endpoint: "api/deliverables/\(deliverableId)/status",
                method: .put,
                parameters: parameters
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
            
            return updatedDeliverable
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
extension BusinessDataManager: WebSocketManagerDelegate {
    func didReceiveData(_ data: SyncResponse) {
        // Update offers
        if let offers = data.offers {
            self.offers = offers
        }
        
        // Update claims
        if let claims = data.claims {
            self.claims = claims
        }
        
        // Update notifications
        if let notifications = data.notifications {
            self.notifications = notifications
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
                
            case "notification":
                let notification = try decoder.decode(BusinessNotification.self, from: jsonData)
                
                if action == "create" {
                    if !notifications.contains(where: { $0.id == notification.id }) {
                        notifications.append(notification)
                    }
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