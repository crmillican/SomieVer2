import Foundation
import Combine
import CoreData

class DataManager: ObservableObject {
    // Published properties for UI
    @Published var offers: [Offer] = []
    @Published var claims: [OfferClaim] = []
    @Published var notifications: [BusinessNotification] = []
    @Published var isLoading = false
    @Published var error: String?
    
    // The auth manager reference
    private var authManager: AuthManager?
    
    // Cancellables for managing network requests
    private var cancellables = Set<AnyCancellable>()
    
    // Base URL for API requests
    private let baseURL = "https://api.somie.com" // Replace with your actual API URL
    
    // CoreData context for local storage
    private let persistenceController = PersistenceController.shared
    
    // MARK: - Initialization
    
    // Register the auth manager when available
    func register(authManager: AuthManager) {
        self.authManager = authManager
    }
    
    // MARK: - Offers
    
    /// Fetch offers for the current business
    func fetchOffers() {
        guard let token = authManager?.authToken, 
              let businessId = authManager?.businessProfile?.id else {
            self.error = "Authentication required"
            return
        }
        
        isLoading = true
        error = nil
        
        let endpoint = "\(baseURL)/api/business/\(businessId)/offers"
        var request = URLRequest(url: URL(string: endpoint)!)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTaskPublisher(for: request)
            .map { $0.data }
            .decode(type: [Offer].self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { [weak self] completion in
                self?.isLoading = false
                if case .failure(let error) = completion {
                    self?.error = "Failed to load offers: \(error.localizedDescription)"
                }
            }, receiveValue: { [weak self] offers in
                self?.offers = offers
                
                // Save to local storage for offline access
                self?.saveOffersToLocalStorage(offers)
            })
            .store(in: &cancellables)
    }
    
    /// Create a new offer
    func createOffer(_ offer: OfferCreationRequest, completion: @escaping (Result<Offer, Error>) -> Void) {
        guard let token = authManager?.authToken,
              let businessId = authManager?.businessProfile?.id else {
            completion(.failure(NSError(domain: "com.somie.business", code: 401, userInfo: [NSLocalizedDescriptionKey: "Authentication required"])))
            return
        }
        
        isLoading = true
        error = nil
        
        let endpoint = "\(baseURL)/api/business/\(businessId)/offers"
        var request = URLRequest(url: URL(string: endpoint)!)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            request.httpBody = try JSONEncoder().encode(offer)
        } catch {
            completion(.failure(error))
            return
        }
        
        URLSession.shared.dataTaskPublisher(for: request)
            .map { $0.data }
            .decode(type: Offer.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { [weak self] result in
                self?.isLoading = false
                if case .failure(let error) = result {
                    self?.error = "Failed to create offer: \(error.localizedDescription)"
                    completion(.failure(error))
                }
            }, receiveValue: { [weak self] newOffer in
                // Add to the list of offers
                self?.offers.append(newOffer)
                
                // Save to local storage
                self?.saveOfferToLocalStorage(newOffer)
                
                // Return the new offer
                completion(.success(newOffer))
            })
            .store(in: &cancellables)
    }
    
    /// Update an existing offer
    func updateOffer(id: Int, with updates: OfferUpdateRequest, completion: @escaping (Result<Offer, Error>) -> Void) {
        guard let token = authManager?.authToken else {
            completion(.failure(NSError(domain: "com.somie.business", code: 401, userInfo: [NSLocalizedDescriptionKey: "Authentication required"])))
            return
        }
        
        isLoading = true
        error = nil
        
        let endpoint = "\(baseURL)/api/offers/\(id)"
        var request = URLRequest(url: URL(string: endpoint)!)
        request.httpMethod = "PATCH"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            request.httpBody = try JSONEncoder().encode(updates)
        } catch {
            completion(.failure(error))
            return
        }
        
        URLSession.shared.dataTaskPublisher(for: request)
            .map { $0.data }
            .decode(type: Offer.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { [weak self] result in
                self?.isLoading = false
                if case .failure(let error) = result {
                    self?.error = "Failed to update offer: \(error.localizedDescription)"
                    completion(.failure(error))
                }
            }, receiveValue: { [weak self] updatedOffer in
                // Update in the offers list
                if let index = self?.offers.firstIndex(where: { $0.id == id }) {
                    self?.offers[index] = updatedOffer
                }
                
                // Update in local storage
                self?.saveOfferToLocalStorage(updatedOffer)
                
                // Return the updated offer
                completion(.success(updatedOffer))
            })
            .store(in: &cancellables)
    }
    
    // MARK: - Claims
    
    /// Fetch claims for a specific offer
    func fetchClaims(forOfferId offerId: Int) {
        guard let token = authManager?.authToken else {
            self.error = "Authentication required"
            return
        }
        
        isLoading = true
        error = nil
        
        let endpoint = "\(baseURL)/api/offers/\(offerId)/claims"
        var request = URLRequest(url: URL(string: endpoint)!)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTaskPublisher(for: request)
            .map { $0.data }
            .decode(type: [OfferClaim].self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { [weak self] completion in
                self?.isLoading = false
                if case .failure(let error) = completion {
                    self?.error = "Failed to load claims: \(error.localizedDescription)"
                }
            }, receiveValue: { [weak self] claims in
                self?.claims = claims
            })
            .store(in: &cancellables)
    }
    
    /// Update the status of a claim
    func updateClaimStatus(id: Int, status: String, completion: @escaping (Result<OfferClaim, Error>) -> Void) {
        guard let token = authManager?.authToken else {
            completion(.failure(NSError(domain: "com.somie.business", code: 401, userInfo: [NSLocalizedDescriptionKey: "Authentication required"])))
            return
        }
        
        isLoading = true
        error = nil
        
        let endpoint = "\(baseURL)/api/claims/\(id)/status"
        var request = URLRequest(url: URL(string: endpoint)!)
        request.httpMethod = "PATCH"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let statusUpdate = ["status": status]
        
        do {
            request.httpBody = try JSONEncoder().encode(statusUpdate)
        } catch {
            completion(.failure(error))
            return
        }
        
        URLSession.shared.dataTaskPublisher(for: request)
            .map { $0.data }
            .decode(type: OfferClaim.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { [weak self] result in
                self?.isLoading = false
                if case .failure(let error) = result {
                    self?.error = "Failed to update claim status: \(error.localizedDescription)"
                    completion(.failure(error))
                }
            }, receiveValue: { [weak self] updatedClaim in
                // Update in the claims list
                if let index = self?.claims.firstIndex(where: { $0.id == id }) {
                    self?.claims[index] = updatedClaim
                }
                
                // Return the updated claim
                completion(.success(updatedClaim))
            })
            .store(in: &cancellables)
    }
    
    // MARK: - Notifications
    
    /// Fetch notifications for the business
    func fetchNotifications() {
        guard let token = authManager?.authToken,
              let businessId = authManager?.businessProfile?.id else {
            self.error = "Authentication required"
            return
        }
        
        isLoading = true
        error = nil
        
        let endpoint = "\(baseURL)/api/business/\(businessId)/notifications"
        var request = URLRequest(url: URL(string: endpoint)!)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTaskPublisher(for: request)
            .map { $0.data }
            .decode(type: [BusinessNotification].self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { [weak self] completion in
                self?.isLoading = false
                if case .failure(let error) = completion {
                    self?.error = "Failed to load notifications: \(error.localizedDescription)"
                }
            }, receiveValue: { [weak self] notifications in
                self?.notifications = notifications
            })
            .store(in: &cancellables)
    }
    
    /// Mark a notification as read
    func markNotificationAsRead(id: Int) {
        guard let token = authManager?.authToken else {
            self.error = "Authentication required"
            return
        }
        
        let endpoint = "\(baseURL)/api/notifications/\(id)/read"
        var request = URLRequest(url: URL(string: endpoint)!)
        request.httpMethod = "PATCH"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTaskPublisher(for: request)
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { [weak self] completion in
                if case .failure(let error) = completion {
                    self?.error = "Failed to mark notification as read: \(error.localizedDescription)"
                }
            }, receiveValue: { [weak self] _ in
                // Update the notification in the local list
                if let index = self?.notifications.firstIndex(where: { $0.id == id }) {
                    self?.notifications[index].isRead = true
                }
            })
            .store(in: &cancellables)
    }
    
    // MARK: - Local Storage Methods
    
    private func saveOffersToLocalStorage(_ offers: [Offer]) {
        let context = persistenceController.container.viewContext
        
        // Remove existing offers in local storage
        let fetchRequest: NSFetchRequest<NSFetchRequestResult> = NSFetchRequest(entityName: "LocalOffer")
        let deleteRequest = NSBatchDeleteRequest(fetchRequest: fetchRequest)
        
        do {
            try context.execute(deleteRequest)
            
            // Save the new offers
            for offer in offers {
                let localOffer = LocalOffer(context: context)
                localOffer.id = Int32(offer.id)
                localOffer.businessId = Int32(offer.businessId)
                localOffer.title = offer.title
                localOffer.desc = offer.description
                localOffer.reward = offer.reward
                localOffer.location = offer.location
                localOffer.status = offer.status
                localOffer.tags = offer.tags as NSArray?
                localOffer.platforms = offer.platforms as NSArray?
                localOffer.contentType = offer.contentType
                localOffer.createdAt = offer.createdAt
            }
            
            try context.save()
        } catch {
            print("Failed to save offers to local storage: \(error)")
        }
    }
    
    private func saveOfferToLocalStorage(_ offer: Offer) {
        let context = persistenceController.container.viewContext
        
        // Check if offer already exists
        let fetchRequest: NSFetchRequest<LocalOffer> = LocalOffer.fetchRequest()
        fetchRequest.predicate = NSPredicate(format: "id == %d", offer.id)
        
        do {
            let results = try context.fetch(fetchRequest)
            
            let localOffer: LocalOffer
            if let existingOffer = results.first {
                // Update existing offer
                localOffer = existingOffer
            } else {
                // Create new offer
                localOffer = LocalOffer(context: context)
                localOffer.id = Int32(offer.id)
            }
            
            // Update properties
            localOffer.businessId = Int32(offer.businessId)
            localOffer.title = offer.title
            localOffer.desc = offer.description
            localOffer.reward = offer.reward
            localOffer.location = offer.location
            localOffer.status = offer.status
            localOffer.tags = offer.tags as NSArray?
            localOffer.platforms = offer.platforms as NSArray?
            localOffer.contentType = offer.contentType
            localOffer.createdAt = offer.createdAt
            
            try context.save()
        } catch {
            print("Failed to save offer to local storage: \(error)")
        }
    }
    
    /// Load offers from local storage when offline
    func loadOffersFromLocalStorage() {
        let context = persistenceController.container.viewContext
        let fetchRequest: NSFetchRequest<LocalOffer> = LocalOffer.fetchRequest()
        
        do {
            let localOffers = try context.fetch(fetchRequest)
            
            // Convert LocalOffer objects to Offer models
            self.offers = localOffers.map { localOffer in
                Offer(
                    id: Int(localOffer.id),
                    businessId: Int(localOffer.businessId),
                    title: localOffer.title ?? "",
                    description: localOffer.desc ?? "",
                    reward: localOffer.reward ?? "",
                    location: localOffer.location,
                    status: localOffer.status ?? "",
                    tags: localOffer.tags as? [String],
                    platforms: localOffer.platforms as? [String],
                    contentType: localOffer.contentType,
                    contentGuidelines: nil,
                    deliverables: nil,
                    audienceRequirements: nil,
                    rewardAmount: nil,
                    createdAt: localOffer.createdAt,
                    expiresAt: nil,
                    isTest: false
                )
            }
        } catch {
            self.error = "Failed to load offers from local storage: \(error.localizedDescription)"
        }
    }
}

// MARK: - Core Data Model Classes for local storage

/// Persistence controller for managing Core Data
class PersistenceController {
    static let shared = PersistenceController()
    
    let container: NSPersistentContainer
    
    init() {
        container = NSPersistentContainer(name: "SomieBusinessModel")
        
        container.loadPersistentStores { description, error in
            if let error = error {
                fatalError("Failed to load Core Data stack: \(error)")
            }
        }
    }
}

// Core Data entity classes would be generated by Xcode
// Here's a placeholder for the LocalOffer entity
class LocalOffer: NSManagedObject {
    @NSManaged var id: Int32
    @NSManaged var businessId: Int32
    @NSManaged var title: String?
    @NSManaged var desc: String?  // 'description' is reserved so we use 'desc'
    @NSManaged var reward: String?
    @NSManaged var location: String?
    @NSManaged var status: String?
    @NSManaged var tags: NSArray?
    @NSManaged var platforms: NSArray?
    @NSManaged var contentType: String?
    @NSManaged var createdAt: Date?
    
    static func fetchRequest() -> NSFetchRequest<LocalOffer> {
        return NSFetchRequest<LocalOffer>(entityName: "LocalOffer")
    }
}