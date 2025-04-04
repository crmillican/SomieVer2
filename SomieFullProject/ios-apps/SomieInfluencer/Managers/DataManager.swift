import Foundation
import Combine

class DataManager: ObservableObject {
    // Published properties for UI
    @Published var discoverOffers: [DiscoverOffer] = []
    @Published var myClaims: [InfluencerClaim] = []
    @Published var messages: [Int: [Message]] = [:] // ClaimId to messages mapping
    @Published var isLoading = false
    @Published var error: String?
    
    // The auth manager reference
    private var authManager: AuthManager?
    
    // Cancellables for managing network requests
    private var cancellables = Set<AnyCancellable>()
    
    // Base URL for API requests
    private let baseURL = "https://api.somie.com" // Replace with your actual API URL
    
    // MARK: - Initialization
    
    // Register the auth manager when available
    func register(authManager: AuthManager) {
        self.authManager = authManager
    }
    
    // MARK: - Discover Offers
    
    /// Fetch offers for discovery
    func fetchDiscoverOffers() {
        guard let token = authManager?.authToken,
              let influencerId = authManager?.influencerProfile?.id else {
            self.error = "Authentication required"
            return
        }
        
        isLoading = true
        error = nil
        
        let endpoint = "\(baseURL)/api/influencer/\(influencerId)/discover"
        var request = URLRequest(url: URL(string: endpoint)!)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTaskPublisher(for: request)
            .map { $0.data }
            .decode(type: [DiscoverOffer].self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { [weak self] completion in
                self?.isLoading = false
                if case .failure(let error) = completion {
                    self?.error = "Failed to load discover offers: \(error.localizedDescription)"
                }
            }, receiveValue: { [weak self] offers in
                self?.discoverOffers = offers
            })
            .store(in: &cancellables)
    }
    
    /// Claim an offer
    func claimOffer(offerId: Int, message: String?, completion: @escaping (Result<InfluencerClaim, Error>) -> Void) {
        guard let token = authManager?.authToken,
              let influencerId = authManager?.influencerProfile?.id else {
            completion(.failure(NSError(domain: "com.somie.influencer", code: 401, userInfo: [NSLocalizedDescriptionKey: "Authentication required"])))
            return
        }
        
        isLoading = true
        error = nil
        
        let endpoint = "\(baseURL)/api/influencer/\(influencerId)/claims"
        var request = URLRequest(url: URL(string: endpoint)!)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let claimRequest = ClaimOfferRequest(offerId: offerId, message: message)
        
        do {
            request.httpBody = try JSONEncoder().encode(claimRequest)
        } catch {
            completion(.failure(error))
            return
        }
        
        URLSession.shared.dataTaskPublisher(for: request)
            .map { $0.data }
            .decode(type: InfluencerClaim.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { [weak self] result in
                self?.isLoading = false
                if case .failure(let error) = result {
                    self?.error = "Failed to claim offer: \(error.localizedDescription)"
                    completion(.failure(error))
                }
            }, receiveValue: { [weak self] claim in
                // Add to my claims
                self?.myClaims.append(claim)
                
                // Mark the offer as claimed in discover view
                if let index = self?.discoverOffers.firstIndex(where: { $0.id == offerId }) {
                    self?.discoverOffers[index].hasClaimed = true
                }
                
                // Return the new claim
                completion(.success(claim))
            })
            .store(in: &cancellables)
    }
    
    // MARK: - My Claims
    
    /// Fetch claims for the influencer
    func fetchMyClaims() {
        guard let token = authManager?.authToken,
              let influencerId = authManager?.influencerProfile?.id else {
            self.error = "Authentication required"
            return
        }
        
        isLoading = true
        error = nil
        
        let endpoint = "\(baseURL)/api/influencer/\(influencerId)/claims"
        var request = URLRequest(url: URL(string: endpoint)!)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTaskPublisher(for: request)
            .map { $0.data }
            .decode(type: [InfluencerClaim].self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { [weak self] completion in
                self?.isLoading = false
                if case .failure(let error) = completion {
                    self?.error = "Failed to load claims: \(error.localizedDescription)"
                }
            }, receiveValue: { [weak self] claims in
                self?.myClaims = claims
            })
            .store(in: &cancellables)
    }
    
    /// Fetch a single claim with detailed information
    func fetchClaimDetail(claimId: Int, completion: @escaping (Result<InfluencerClaim, Error>) -> Void) {
        guard let token = authManager?.authToken else {
            completion(.failure(NSError(domain: "com.somie.influencer", code: 401, userInfo: [NSLocalizedDescriptionKey: "Authentication required"])))
            return
        }
        
        isLoading = true
        error = nil
        
        let endpoint = "\(baseURL)/api/claims/\(claimId)"
        var request = URLRequest(url: URL(string: endpoint)!)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTaskPublisher(for: request)
            .map { $0.data }
            .decode(type: InfluencerClaim.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { [weak self] result in
                self?.isLoading = false
                if case .failure(let error) = result {
                    self?.error = "Failed to fetch claim details: \(error.localizedDescription)"
                    completion(.failure(error))
                }
            }, receiveValue: { [weak self] claim in
                // Update in the claims list
                if let index = self?.myClaims.firstIndex(where: { $0.id == claimId }) {
                    self?.myClaims[index] = claim
                }
                
                // Return the updated claim
                completion(.success(claim))
            })
            .store(in: &cancellables)
    }
    
    // MARK: - Deliverables
    
    /// Submit a deliverable
    func submitDeliverable(deliverableId: Int, submissionUrl: String, completion: @escaping (Result<InfluencerDeliverable, Error>) -> Void) {
        guard let token = authManager?.authToken else {
            completion(.failure(NSError(domain: "com.somie.influencer", code: 401, userInfo: [NSLocalizedDescriptionKey: "Authentication required"])))
            return
        }
        
        isLoading = true
        error = nil
        
        let endpoint = "\(baseURL)/api/deliverables/\(deliverableId)/submit"
        var request = URLRequest(url: URL(string: endpoint)!)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let submission = ["submissionUrl": submissionUrl]
        
        do {
            request.httpBody = try JSONEncoder().encode(submission)
        } catch {
            completion(.failure(error))
            return
        }
        
        URLSession.shared.dataTaskPublisher(for: request)
            .map { $0.data }
            .decode(type: InfluencerDeliverable.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { [weak self] result in
                self?.isLoading = false
                if case .failure(let error) = result {
                    self?.error = "Failed to submit deliverable: \(error.localizedDescription)"
                    completion(.failure(error))
                }
            }, receiveValue: { deliverable in
                // Update the deliverable in the claims
                self.updateDeliverableInClaims(deliverable)
                
                // Return the updated deliverable
                completion(.success(deliverable))
            })
            .store(in: &cancellables)
    }
    
    private func updateDeliverableInClaims(_ deliverable: InfluencerDeliverable) {
        // Find the claim that contains this deliverable
        if let claimIndex = myClaims.firstIndex(where: { claim in
            claim.deliverables?.contains(where: { $0.id == deliverable.id }) ?? false
        }) {
            // Update the deliverable in the claim
            if let deliverableIndex = myClaims[claimIndex].deliverables?.firstIndex(where: { $0.id == deliverable.id }) {
                myClaims[claimIndex].deliverables?[deliverableIndex] = deliverable
            }
        }
    }
    
    // MARK: - Messages
    
    /// Fetch messages for a claim
    func fetchMessages(claimId: Int) {
        guard let token = authManager?.authToken else {
            self.error = "Authentication required"
            return
        }
        
        isLoading = true
        error = nil
        
        let endpoint = "\(baseURL)/api/claims/\(claimId)/messages"
        var request = URLRequest(url: URL(string: endpoint)!)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTaskPublisher(for: request)
            .map { $0.data }
            .decode(type: [Message].self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { [weak self] completion in
                self?.isLoading = false
                if case .failure(let error) = completion {
                    self?.error = "Failed to load messages: \(error.localizedDescription)"
                }
            }, receiveValue: { [weak self] messages in
                let influencerId = self?.authManager?.influencerProfile?.id
                
                // Mark which messages are from the business vs. from the influencer
                var processedMessages = messages.map { message in
                    var newMessage = message
                    newMessage.isFromBusiness = message.senderId != influencerId
                    return newMessage
                }
                
                // Sort by creation date
                processedMessages.sort(by: { $0.createdAt < $1.createdAt })
                
                // Store in the messages dictionary
                self?.messages[claimId] = processedMessages
            })
            .store(in: &cancellables)
    }
    
    /// Send a message for a claim
    func sendMessage(claimId: Int, content: String, completion: @escaping (Result<Message, Error>) -> Void) {
        guard let token = authManager?.authToken,
              let influencerId = authManager?.influencerProfile?.id else {
            completion(.failure(NSError(domain: "com.somie.influencer", code: 401, userInfo: [NSLocalizedDescriptionKey: "Authentication required"])))
            return
        }
        
        isLoading = true
        error = nil
        
        let endpoint = "\(baseURL)/api/claims/\(claimId)/messages"
        var request = URLRequest(url: URL(string: endpoint)!)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let messageRequest = ["content": content, "senderId": influencerId]
        
        do {
            request.httpBody = try JSONEncoder().encode(messageRequest)
        } catch {
            completion(.failure(error))
            return
        }
        
        URLSession.shared.dataTaskPublisher(for: request)
            .map { $0.data }
            .decode(type: Message.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { [weak self] result in
                self?.isLoading = false
                if case .failure(let error) = result {
                    self?.error = "Failed to send message: \(error.localizedDescription)"
                    completion(.failure(error))
                }
            }, receiveValue: { [weak self] message in
                // Add message to the conversation
                var newMessage = message
                newMessage.isFromBusiness = false // Since the influencer sent it
                
                if self?.messages[claimId] == nil {
                    self?.messages[claimId] = [newMessage]
                } else {
                    self?.messages[claimId]?.append(newMessage)
                }
                
                // Return the new message
                completion(.success(newMessage))
            })
            .store(in: &cancellables)
    }
}