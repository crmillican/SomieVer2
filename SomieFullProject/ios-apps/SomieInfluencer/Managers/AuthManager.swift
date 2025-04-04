import Foundation
import Combine

class AuthManager: ObservableObject {
    // Published properties that the UI can observe
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var influencerProfile: InfluencerProfile?
    @Published var authToken: String?
    @Published var isLoading = false
    @Published var error: String?
    
    // Constants
    private let baseURL = "https://api.somie.com" // Replace with your actual API URL
    private let tokenKey = "somie_auth_token"
    private let userIdKey = "somie_user_id"
    
    // UserDefaults for persistence
    private let defaults = UserDefaults.standard
    
    // For cancellation of network requests
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Public Methods
    
    /// Try to restore a previous session
    func restoreSession() {
        guard !isAuthenticated, 
              let token = defaults.string(forKey: tokenKey),
              let userId = defaults.integer(forKey: userIdKey) as Int?, userId > 0 else {
            return
        }
        
        self.authToken = token
        self.isLoading = true
        
        // Attempt to refresh the user profile with the token
        refreshUserProfile()
    }
    
    /// Login with username and password
    func login(username: String, password: String) {
        isLoading = true
        error = nil
        
        // Create the request
        let loginRequest = LoginRequest(username: username, password: password)
        
        // Convert to JSON data
        guard let requestData = try? JSONEncoder().encode(loginRequest) else {
            self.error = "Failed to encode login request"
            self.isLoading = false
            return
        }
        
        // Create URL request
        var request = URLRequest(url: URL(string: "\(baseURL)/api/auth/login")!)
        request.httpMethod = "POST"
        request.httpBody = requestData
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Make the request
        URLSession.shared.dataTaskPublisher(for: request)
            .map { $0.data }
            .decode(type: AuthResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { [weak self] completion in
                self?.isLoading = false
                if case .failure(let error) = completion {
                    self?.error = error.localizedDescription
                }
            }, receiveValue: { [weak self] response in
                self?.handleAuthResponse(response)
            })
            .store(in: &cancellables)
    }
    
    /// Logout the current user
    func logout() {
        // Clear all auth data
        isAuthenticated = false
        currentUser = nil
        influencerProfile = nil
        authToken = nil
        
        // Clear from persistence
        defaults.removeObject(forKey: tokenKey)
        defaults.removeObject(forKey: userIdKey)
        
        // Cancel any pending network requests
        cancellables.forEach { $0.cancel() }
        cancellables.removeAll()
    }
    
    /// Fetch the influencer profile after authentication
    func fetchInfluencerProfile() {
        guard let userId = currentUser?.id, let token = authToken else {
            return
        }
        
        var request = URLRequest(url: URL(string: "\(baseURL)/api/influencer/profile/\(userId)")!)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTaskPublisher(for: request)
            .map { $0.data }
            .decode(type: InfluencerProfile.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { [weak self] completion in
                if case .failure(let error) = completion {
                    self?.error = "Failed to fetch influencer profile: \(error.localizedDescription)"
                }
            }, receiveValue: { [weak self] profile in
                self?.influencerProfile = profile
            })
            .store(in: &cancellables)
    }
    
    // MARK: - Private Methods
    
    private func refreshUserProfile() {
        guard let token = authToken else {
            isLoading = false
            return
        }
        
        var request = URLRequest(url: URL(string: "\(baseURL)/api/user")!)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTaskPublisher(for: request)
            .map { $0.data }
            .decode(type: User.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { [weak self] completion in
                self?.isLoading = false
                if case .failure(_) = completion {
                    // Token likely expired, clear auth state
                    self?.logout()
                }
            }, receiveValue: { [weak self] user in
                self?.currentUser = user
                self?.isAuthenticated = true
                
                // If it's an influencer user, fetch the influencer profile
                if user.isInfluencer {
                    self?.fetchInfluencerProfile()
                }
            })
            .store(in: &cancellables)
    }
    
    private func handleAuthResponse(_ response: AuthResponse) {
        // Save the auth token
        self.authToken = response.authToken
        
        // Create a User object from the response
        self.currentUser = User(
            id: response.id,
            username: response.username,
            userType: response.userType,
            role: response.role,
            permissions: response.permissions,
            createdAt: nil,
            isTest: false // Assuming this is a real user logging in
        )
        
        // Save to persistence
        defaults.set(response.authToken, forKey: tokenKey)
        defaults.set(response.id, forKey: userIdKey)
        
        // Update authentication state
        self.isAuthenticated = true
        
        // Fetch additional data if needed
        if response.userType == "influencer" {
            fetchInfluencerProfile()
        }
    }
}

// User models
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