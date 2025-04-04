import Foundation

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case delete = "DELETE"
}

enum APIError: Error {
    case invalidURL
    case requestFailed(Error)
    case invalidResponse
    case serverError(Int, String)
    case decodingFailed(Error)
    case authenticationRequired
    case networkUnavailable
    case unknown
}

class APIClient {
    // MARK: - Properties
    static let shared = APIClient()
    
    private let baseURL: String
    private let session: URLSession
    private let jsonDecoder: JSONDecoder
    private let jsonEncoder: JSONEncoder
    
    // MARK: - Initialization
    init(baseURL: String = AppConfig.API_BASE_URL) {
        self.baseURL = baseURL
        
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30.0
        self.session = URLSession(configuration: config)
        
        self.jsonDecoder = JSONDecoder()
        self.jsonDecoder.keyDecodingStrategy = .convertFromSnakeCase
        self.jsonDecoder.dateDecodingStrategy = .iso8601
        
        self.jsonEncoder = JSONEncoder()
        self.jsonEncoder.keyEncodingStrategy = .convertToSnakeCase
        self.jsonEncoder.dateEncodingStrategy = .iso8601
    }
    
    // MARK: - API Methods
    
    /// Performs a network request and parses the response
    func request<T: Decodable>(
        endpoint: String,
        method: HTTPMethod = .get,
        parameters: [String: Any]? = nil,
        body: Encodable? = nil,
        requiresAuth: Bool = true
    ) async throws -> T {
        // Construct URL
        guard let url = URL(string: "\(baseURL)/\(endpoint)") else {
            throw APIError.invalidURL
        }
        
        // Create request
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.addValue("application/json", forHTTPHeaderField: "Accept")
        
        // Add auth token if required
        if requiresAuth {
            let token = await TokenManager.shared.getToken()
            if let token = token {
                request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            } else if requiresAuth {
                throw APIError.authenticationRequired
            }
        }
        
        // Add query parameters for GET requests
        if method == .get, let parameters = parameters {
            var components = URLComponents(url: url, resolvingAgainstBaseURL: true)!
            components.queryItems = parameters.map { key, value in
                URLQueryItem(name: key, value: "\(value)")
            }
            
            if let queryURL = components.url {
                request.url = queryURL
            }
        }
        
        // Add body for POST/PUT/DELETE requests
        if method != .get, let body = body {
            request.httpBody = try jsonEncoder.encode(body)
        } else if method != .get, let parameters = parameters {
            request.httpBody = try JSONSerialization.data(withJSONObject: parameters)
        }
        
        // Log request for debugging
        #if DEBUG
        print("🌐 API Request: \(method.rawValue) \(url.absoluteString)")
        if let headers = request.allHTTPHeaderFields {
            print("Headers: \(headers)")
        }
        if let body = request.httpBody, let bodyString = String(data: body, encoding: .utf8) {
            print("Body: \(bodyString)")
        }
        #endif
        
        // Execute network request
        do {
            let (data, response) = try await session.data(for: request)
            
            // Log response for debugging
            #if DEBUG
            if let responseString = String(data: data, encoding: .utf8) {
                print("📥 API Response: \(responseString)")
            }
            #endif
            
            // Check for HTTP response
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }
            
            // Handle HTTP error status codes
            switch httpResponse.statusCode {
            case 200...299:
                // Success - continue processing
                break
            case 401:
                throw APIError.authenticationRequired
            case 400...499:
                // Client error
                let errorMessage = try? JSONDecoder().decode(ErrorResponse.self, from: data).message
                throw APIError.serverError(httpResponse.statusCode, errorMessage ?? "Client error")
            case 500...599:
                // Server error
                let errorMessage = try? JSONDecoder().decode(ErrorResponse.self, from: data).message
                throw APIError.serverError(httpResponse.statusCode, errorMessage ?? "Server error")
            default:
                throw APIError.serverError(httpResponse.statusCode, "Unknown error")
            }
            
            // Decode response
            do {
                return try jsonDecoder.decode(T.self, from: data)
            } catch {
                #if DEBUG
                print("❌ Decoding error: \(error)")
                #endif
                throw APIError.decodingFailed(error)
            }
        } catch let urlError as URLError {
            #if DEBUG
            print("❌ Network error: \(urlError)")
            #endif
            
            if urlError.code == .notConnectedToInternet {
                throw APIError.networkUnavailable
            }
            throw APIError.requestFailed(urlError)
        } catch {
            #if DEBUG
            print("❌ Unknown error: \(error)")
            #endif
            
            if let apiError = error as? APIError {
                throw apiError
            }
            throw APIError.unknown
        }
    }
}

// MARK: - Support Types
struct ErrorResponse: Codable {
    let message: String
}

// MARK: - Configuration
struct AppConfig {
    static let API_BASE_URL = "https://somie-app.replit.app" // Replace with your actual API base URL
    static let WS_BASE_URL = "wss://somie-app.replit.app/ws" // Replace with your WebSocket base URL
}

// MARK: - Token Management
class TokenManager {
    static let shared = TokenManager()
    
    private let tokenKey = "somie_auth_token"
    private let expiryKey = "somie_token_expiry"
    private let userIdKey = "somie_user_id"
    private let userTypeKey = "somie_user_type"
    
    private var cachedToken: String?
    private var tokenExpiry: Date?
    
    func saveToken(token: String, userId: Int, userType: String) {
        // Extract expiry from token if it's a JWT
        var expiry = Date().addingTimeInterval(24 * 60 * 60) // Default 24 hours
        
        if let tokenData = parseJWT(token) {
            if let exp = tokenData["exp"] as? TimeInterval {
                expiry = Date(timeIntervalSince1970: exp)
            }
        }
        
        // Save to UserDefaults
        UserDefaults.standard.set(token, forKey: tokenKey)
        UserDefaults.standard.set(expiry.timeIntervalSince1970, forKey: expiryKey)
        UserDefaults.standard.set(userId, forKey: userIdKey)
        UserDefaults.standard.set(userType, forKey: userTypeKey)
        
        // Update cache
        self.cachedToken = token
        self.tokenExpiry = expiry
    }
    
    func clearToken() {
        UserDefaults.standard.removeObject(forKey: tokenKey)
        UserDefaults.standard.removeObject(forKey: expiryKey)
        UserDefaults.standard.removeObject(forKey: userIdKey)
        UserDefaults.standard.removeObject(forKey: userTypeKey)
        
        cachedToken = nil
        tokenExpiry = nil
    }
    
    func getToken() async -> String? {
        // Check cache first
        if let cachedToken = cachedToken, let expiry = tokenExpiry, expiry > Date() {
            return cachedToken
        }
        
        // Check UserDefaults
        if let storedToken = UserDefaults.standard.string(forKey: tokenKey),
           let expiryTimeInterval = UserDefaults.standard.object(forKey: expiryKey) as? TimeInterval {
            
            let expiryDate = Date(timeIntervalSince1970: expiryTimeInterval)
            
            // Check if token is still valid
            if expiryDate > Date() {
                cachedToken = storedToken
                tokenExpiry = expiryDate
                return storedToken
            }
        }
        
        // Token not found or expired, try to refresh
        return await refreshToken()
    }
    
    private func refreshToken() async -> String? {
        // Try to get userId from storage
        guard let userId = UserDefaults.standard.object(forKey: userIdKey) as? Int else {
            return nil
        }
        
        do {
            // Use refresh token endpoint
            let response: TokenResponse = try await APIClient.shared.request(
                endpoint: "api/auth/token-from-id?userId=\(userId)",
                requiresAuth: false
            )
            
            if let token = response.authToken {
                // Save the new token
                saveToken(token: token, userId: userId, userType: response.userType ?? "user")
                return token
            }
            return nil
        } catch {
            print("Failed to refresh token: \(error)")
            return nil
        }
    }
    
    private func parseJWT(_ token: String) -> [String: Any]? {
        let segments = token.components(separatedBy: ".")
        guard segments.count > 1 else { return nil }
        
        let base64 = segments[1]
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        
        let padded = base64.padding(toLength: ((base64.count + 3) / 4) * 4, withPad: "=", startingAt: 0)
        
        guard let data = Data(base64Encoded: padded) else { return nil }
        
        do {
            return try JSONSerialization.jsonObject(with: data) as? [String: Any]
        } catch {
            return nil
        }
    }
    
    func getUserId() -> Int? {
        return UserDefaults.standard.object(forKey: userIdKey) as? Int
    }
    
    func getUserType() -> String? {
        return UserDefaults.standard.string(forKey: userTypeKey)
    }
}

// Token response structure
struct TokenResponse: Codable {
    let authToken: String?
    let userType: String?
}