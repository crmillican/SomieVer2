import Foundation
import Combine

enum SyncState {
    case idle
    case syncing
    case success
    case error(Error)
}

class SyncManager: ObservableObject {
    // MARK: - Singleton
    static let shared = SyncManager()
    
    // MARK: - Published Properties
    @Published var state: SyncState = .idle
    @Published var lastSyncTime: Date?
    @Published var pendingChangesCount: Int = 0
    
    // MARK: - Private Properties
    private var timer: Timer?
    private var localChanges: [EntityChange] = []
    private var subscriptions = Set<AnyCancellable>()
    private var dataManager: BusinessDataManager { BusinessDataManager.shared }
    
    // MARK: - Initialization
    private init() {
        setupAutomaticSync()
        subscribeToAppLifecycle()
    }
    
    // MARK: - Public Methods
    
    /// Triggers a manual sync
    func sync() {
        guard state != .syncing else { return }
        
        state = .syncing
        
        // Call the data manager to perform the sync
        dataManager.requestSync()
        
        // Update last sync time
        lastSyncTime = Date()
    }
    
    /// Queues a change to be synced
    func queueChange(_ change: EntityChange) {
        localChanges.append(change)
        pendingChangesCount = localChanges.count
    }
    
    /// Process and send queued changes
    func processPendingChanges() {
        guard !localChanges.isEmpty else { return }
        
        // Pass all pending changes to the data manager
        let changes = localChanges
        localChanges = []
        pendingChangesCount = 0
        
        // Send changes to the WebSocket
        if dataManager.webSocketManager.state == .connected {
            dataManager.webSocketManager.sendChanges(changes)
        }
    }
    
    // MARK: - Private Methods
    
    /// Sets up automatic sync timer (every 5 minutes)
    private func setupAutomaticSync() {
        timer = Timer.scheduledTimer(withTimeInterval: 300, repeats: true) { [weak self] _ in
            self?.sync()
        }
    }
    
    /// Subscribes to app lifecycle notifications
    private func subscribeToAppLifecycle() {
        // Handle app becoming active
        NotificationCenter.default.publisher(for: UIApplication.didBecomeActiveNotification)
            .sink { [weak self] _ in
                self?.handleAppDidBecomeActive()
            }
            .store(in: &subscriptions)
        
        // Handle app entering background
        NotificationCenter.default.publisher(for: UIApplication.didEnterBackgroundNotification)
            .sink { [weak self] _ in
                self?.handleAppDidEnterBackground()
            }
            .store(in: &subscriptions)
    }
    
    /// Handles app becoming active
    private func handleAppDidBecomeActive() {
        // Trigger a sync when app becomes active
        sync()
    }
    
    /// Handles app entering background
    private func handleAppDidEnterBackground() {
        // Process any pending changes before the app enters background
        processPendingChanges()
    }
}

// MARK: - UIKit Import for App Lifecycle

#if canImport(UIKit)
import UIKit
#endif