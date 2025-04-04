import Foundation

// MARK: - WebSocket Message Models

struct WebSocketMessage: Codable {
    let type: String
    let timestamp: String?
    let data: [String: AnyCodable]?
}

struct SyncRequestMessage: Codable {
    let type = "sync_request"
}

struct PingMessage: Codable {
    let type = "ping"
    let timestamp: String
    
    init() {
        let formatter = ISO8601DateFormatter()
        self.timestamp = formatter.string(from: Date())
    }
}

struct EntityChange: Codable {
    let type: String // "offer", "claim", etc.
    let action: String // "create", "update", "delete"
    let entityId: Int?
    let data: [String: AnyCodable]
}

struct ChangesMessage: Codable {
    let changes: [EntityChange]
}

// MARK: - AnyCodable implementation for flexible JSON encoding/decoding

struct AnyCodable: Codable {
    let value: Any
    
    init(_ value: Any) {
        self.value = value
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        
        if container.decodeNil() {
            self.value = NSNull()
        } else if let bool = try? container.decode(Bool.self) {
            self.value = bool
        } else if let int = try? container.decode(Int.self) {
            self.value = int
        } else if let double = try? container.decode(Double.self) {
            self.value = double
        } else if let string = try? container.decode(String.self) {
            self.value = string
        } else if let array = try? container.decode([AnyCodable].self) {
            self.value = array.map { $0.value }
        } else if let dictionary = try? container.decode([String: AnyCodable].self) {
            self.value = dictionary.mapValues { $0.value }
        } else {
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Cannot decode AnyCodable"
            )
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        
        switch self.value {
        case is NSNull:
            try container.encodeNil()
        case let bool as Bool:
            try container.encode(bool)
        case let int as Int:
            try container.encode(int)
        case let double as Double:
            try container.encode(double)
        case let string as String:
            try container.encode(string)
        case let array as [Any]:
            try container.encode(array.map { AnyCodable($0) })
        case let dictionary as [String: Any]:
            try container.encode(dictionary.mapValues { AnyCodable($0) })
        default:
            let context = EncodingError.Context(
                codingPath: container.codingPath,
                debugDescription: "Cannot encode \(type(of: self.value))"
            )
            throw EncodingError.invalidValue(self.value, context)
        }
    }
}

// MARK: - WebSocket Manager Class

enum WebSocketState {
    case disconnected
    case connecting
    case connected
    case reconnecting
}

protocol WebSocketManagerDelegate: AnyObject {
    func didReceiveData(_ data: SyncResponse)
    func didUpdateConnectionState(_ state: WebSocketState)
    func didReceiveEntityUpdate(type: String, action: String, data: [String: Any])
    func didFailWithError(_ error: Error)
}

class WebSocketManager {
    // MARK: - Properties
    
    private var webSocketTask: URLSessionWebSocketTask?
    private var urlSession: URLSession!
    private var pingTimer: Timer?
    private var reconnectTimer: Timer?
    private var reconnectCount = 0
    private let maxReconnectCount = 5
    private let reconnectInterval: TimeInterval = 3.0
    private var state: WebSocketState = .disconnected {
        didSet {
            delegate?.didUpdateConnectionState(state)
        }
    }
    
    weak var delegate: WebSocketManagerDelegate?
    
    // MARK: - Initialization
    
    init() {
        let config = URLSessionConfiguration.default
        urlSession = URLSession(configuration: config)
    }
    
    // MARK: - Connection Management
    
    func connect() async {
        guard state != .connected && state != .connecting else {
            return
        }
        
        state = .connecting
        
        do {
            // Get authentication token
            guard let token = await TokenManager.shared.getToken() else {
                throw NSError(domain: "WebSocketError", code: 401, userInfo: [NSLocalizedDescriptionKey: "No auth token available"])
            }
            
            // Create WebSocket URL with token
            guard var urlComponents = URLComponents(string: AppConfig.WS_BASE_URL) else {
                throw NSError(domain: "WebSocketError", code: 400, userInfo: [NSLocalizedDescriptionKey: "Invalid WebSocket URL"])
            }
            
            // Add token as query parameter
            urlComponents.queryItems = [URLQueryItem(name: "token", value: token)]
            
            guard let url = urlComponents.url else {
                throw NSError(domain: "WebSocketError", code: 400, userInfo: [NSLocalizedDescriptionKey: "Failed to create WebSocket URL"])
            }
            
            // Create WebSocket task
            let task = urlSession.webSocketTask(with: url)
            self.webSocketTask = task
            
            // Start receiving messages
            task.resume()
            receiveMessage()
            
            // Start ping timer
            startPingTimer()
            
            // Update connection state
            state = .connected
            reconnectCount = 0
            
            // Request initial sync
            requestSync()
            
        } catch {
            print("Failed to connect to WebSocket: \(error)")
            state = .disconnected
            delegate?.didFailWithError(error)
            scheduleReconnect()
        }
    }
    
    func disconnect() {
        stopPingTimer()
        stopReconnectTimer()
        
        webSocketTask?.cancel(with: .normalClosure, reason: nil)
        webSocketTask = nil
        state = .disconnected
    }
    
    // MARK: - Message Handling
    
    private func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            guard let self = self else { return }
            
            switch result {
            case .success(let message):
                switch message {
                case .data(let data):
                    self.handleMessage(data: data)
                case .string(let string):
                    if let data = string.data(using: .utf8) {
                        self.handleMessage(data: data)
                    }
                @unknown default:
                    break
                }
                
                // Continue receiving messages
                if self.state == .connected {
                    self.receiveMessage()
                }
                
            case .failure(let error):
                print("WebSocket receive error: \(error)")
                self.handleDisconnect(error: error)
            }
        }
    }
    
    private func handleMessage(data: Data) {
        do {
            // Try to decode as WebSocketMessage first to check the type
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            decoder.dateDecodingStrategy = .iso8601
            
            let message = try decoder.decode(WebSocketMessage.self, from: data)
            
            switch message.type {
            case "connected":
                print("WebSocket connected confirmation received")
                
            case "pong":
                print("Received pong response")
                
            case "sync_response":
                if let syncData = try? decoder.decode(SyncResponse.self, from: data) {
                    DispatchQueue.main.async {
                        self.delegate?.didReceiveData(syncData)
                    }
                }
                
            case "update":
                if let entityType = message.data?["entityType"]?.value as? String,
                   let action = message.data?["action"]?.value as? String,
                   let updateData = message.data?["data"]?.value as? [String: Any] {
                    
                    DispatchQueue.main.async {
                        self.delegate?.didReceiveEntityUpdate(
                            type: entityType,
                            action: action,
                            data: updateData
                        )
                    }
                }
                
            case "error":
                if let errorMessage = message.data?["message"]?.value as? String {
                    print("WebSocket error: \(errorMessage)")
                    let error = NSError(domain: "WebSocketError", code: 400, userInfo: [NSLocalizedDescriptionKey: errorMessage])
                    DispatchQueue.main.async {
                        self.delegate?.didFailWithError(error)
                    }
                }
                
            default:
                print("Unknown message type: \(message.type)")
            }
            
        } catch {
            print("Failed to decode WebSocket message: \(error)")
        }
    }
    
    // MARK: - Message Sending
    
    func requestSync() {
        let message = SyncRequestMessage()
        sendMessage(message)
    }
    
    func sendChanges(_ changes: [EntityChange]) {
        let message = ChangesMessage(changes: changes)
        sendMessage(message)
    }
    
    private func sendPing() {
        let ping = PingMessage()
        sendMessage(ping)
    }
    
    private func sendMessage<T: Encodable>(_ message: T) {
        guard state == .connected, let webSocketTask = webSocketTask else {
            return
        }
        
        do {
            let encoder = JSONEncoder()
            encoder.keyEncodingStrategy = .convertToSnakeCase
            encoder.dateEncodingStrategy = .iso8601
            
            let data = try encoder.encode(message)
            if let string = String(data: data, encoding: .utf8) {
                let message = URLSessionWebSocketTask.Message.string(string)
                webSocketTask.send(message) { error in
                    if let error = error {
                        print("WebSocket send error: \(error)")
                    }
                }
            }
        } catch {
            print("Failed to encode message: \(error)")
        }
    }
    
    // MARK: - Reconnection Logic
    
    private func handleDisconnect(error: Error) {
        if state != .disconnected {
            state = .disconnected
            delegate?.didFailWithError(error)
            scheduleReconnect()
        }
    }
    
    private func scheduleReconnect() {
        guard reconnectCount < maxReconnectCount else {
            print("Max reconnect attempts reached")
            return
        }
        
        stopReconnectTimer()
        stopPingTimer()
        
        // Calculate backoff delay with exponential increase
        let delay = reconnectInterval * pow(1.5, Double(reconnectCount))
        reconnectCount += 1
        
        state = .reconnecting
        
        reconnectTimer = Timer.scheduledTimer(withTimeInterval: delay, repeats: false) { [weak self] _ in
            guard let self = self else { return }
            Task {
                await self.connect()
            }
        }
    }
    
    // MARK: - Timer Management
    
    private func startPingTimer() {
        stopPingTimer()
        
        pingTimer = Timer.scheduledTimer(withTimeInterval: 30.0, repeats: true) { [weak self] _ in
            self?.sendPing()
        }
    }
    
    private func stopPingTimer() {
        pingTimer?.invalidate()
        pingTimer = nil
    }
    
    private func stopReconnectTimer() {
        reconnectTimer?.invalidate()
        reconnectTimer = nil
    }
    
    // MARK: - Lifecycle
    
    deinit {
        disconnect()
    }
}