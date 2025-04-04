import SwiftUI

@main
struct SomieBusinessApp: App {
    // Environment objects that will be used throughout the app
    @StateObject private var authManager = AuthManager()
    @StateObject private var dataManager = DataManager()
    @StateObject private var syncManager = SyncManager()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authManager)
                .environmentObject(dataManager)
                .environmentObject(syncManager)
                .onAppear {
                    // Register the managers with each other
                    dataManager.register(authManager: authManager)
                    syncManager.register(authManager: authManager)
                    
                    // Try to restore a previous session
                    authManager.restoreSession()
                }
        }
    }
}

struct ContentView: View {
    @EnvironmentObject var authManager: AuthManager
    
    var body: some View {
        Group {
            if authManager.isLoading {
                LoadingView()
            } else if !authManager.isAuthenticated {
                AuthenticationView()
            } else {
                MainTabView()
            }
        }
    }
}

struct LoadingView: View {
    var body: some View {
        VStack(spacing: 20) {
            ProgressView()
                .progressViewStyle(CircularProgressViewStyle(tint: .blue))
                .scaleEffect(1.5)
            
            Text("Loading...")
                .font(.headline)
                .foregroundColor(.secondary)
        }
    }
}

struct AuthenticationView: View {
    @State private var isShowingLogin = true
    
    var body: some View {
        VStack {
            // Logo and branding header
            VStack(spacing: 15) {
                Image(systemName: "arrow.triangle.2.circlepath.circle.fill")
                    .resizable()
                    .frame(width: 100, height: 100)
                    .foregroundColor(.blue)
                
                Text("SOMIE Business")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("Connect with creators to grow your brand")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }
            .padding(.vertical, 40)
            
            // Toggle between login and signup
            Picker("", selection: $isShowingLogin) {
                Text("Login").tag(true)
                Text("Sign Up").tag(false)
            }
            .pickerStyle(SegmentedPickerStyle())
            .padding(.horizontal)
            
            // Show appropriate form
            if isShowingLogin {
                LoginView()
            } else {
                SignUpView()
            }
            
            Spacer()
        }
    }
}

struct LoginView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var username = ""
    @State private var password = ""
    
    var body: some View {
        VStack(spacing: 20) {
            TextField("Username", text: $username)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .autocapitalization(.none)
                .disableAutocorrection(true)
            
            SecureField("Password", text: $password)
                .textFieldStyle(RoundedBorderTextFieldStyle())
            
            if let error = authManager.error {
                Text(error)
                    .foregroundColor(.red)
                    .font(.caption)
                    .multilineTextAlignment(.center)
            }
            
            Button(action: {
                authManager.login(username: username, password: password)
            }) {
                Text("Login")
                    .fontWeight(.semibold)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(8)
            }
            .disabled(username.isEmpty || password.isEmpty || authManager.isLoading)
            .opacity(username.isEmpty || password.isEmpty || authManager.isLoading ? 0.6 : 1)
            
            if authManager.isLoading {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle())
            }
            
            Button(action: {
                // Handle forgot password
            }) {
                Text("Forgot Password?")
                    .foregroundColor(.blue)
                    .font(.caption)
            }
            .padding(.top)
        }
        .padding()
    }
}

struct SignUpView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var username = ""
    @State private var password = ""
    @State private var companyName = ""
    @State private var email = ""
    
    var body: some View {
        VStack(spacing: 20) {
            TextField("Username", text: $username)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .autocapitalization(.none)
                .disableAutocorrection(true)
            
            SecureField("Password", text: $password)
                .textFieldStyle(RoundedBorderTextFieldStyle())
            
            TextField("Company Name", text: $companyName)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .disableAutocorrection(true)
            
            TextField("Email (Optional)", text: $email)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .autocapitalization(.none)
                .disableAutocorrection(true)
                .keyboardType(.emailAddress)
            
            if let error = authManager.error {
                Text(error)
                    .foregroundColor(.red)
                    .font(.caption)
                    .multilineTextAlignment(.center)
            }
            
            Button(action: {
                // Registration logic would go here
                // For now, we'll just display a message
                authManager.error = "Registration will be implemented in a future version."
            }) {
                Text("Create Account")
                    .fontWeight(.semibold)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(8)
            }
            .disabled(username.isEmpty || password.isEmpty || companyName.isEmpty || authManager.isLoading)
            .opacity(username.isEmpty || password.isEmpty || companyName.isEmpty || authManager.isLoading ? 0.6 : 1)
            
            if authManager.isLoading {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle())
            }
            
            Text("By creating an account, you agree to our Terms of Service and Privacy Policy.")
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.top)
        }
        .padding()
    }
}

struct MainTabView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var dataManager: DataManager
    
    var body: some View {
        TabView {
            // Dashboard Tab
            NavigationView {
                DashboardView()
            }
            .tabItem {
                Label("Dashboard", systemImage: "house.fill")
            }
            
            // Offers Tab
            NavigationView {
                OffersView()
            }
            .tabItem {
                Label("Offers", systemImage: "tag.fill")
            }
            
            // Messages Tab
            NavigationView {
                MessagesView()
            }
            .tabItem {
                Label("Messages", systemImage: "message.fill")
            }
            
            // Account Tab
            NavigationView {
                AccountView()
            }
            .tabItem {
                Label("Account", systemImage: "person.fill")
            }
        }
        .onAppear {
            // Load initial data
            dataManager.fetchOffers()
            dataManager.fetchNotifications()
        }
    }
}

// Placeholder views for the main tabs
struct DashboardView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var dataManager: DataManager
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Welcome header
                HStack {
                    VStack(alignment: .leading) {
                        Text("Welcome back,")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        
                        if let business = authManager.businessProfile {
                            Text(business.companyName)
                                .font(.title)
                                .fontWeight(.bold)
                        } else {
                            Text("Business User")
                                .font(.title)
                                .fontWeight(.bold)
                        }
                    }
                    
                    Spacer()
                    
                    // Profile image or initials
                    if let business = authManager.businessProfile {
                        if business.logo != nil {
                            // Would load image here
                            Circle()
                                .fill(Color.blue)
                                .frame(width: 50, height: 50)
                        } else {
                            // Display initials
                            ZStack {
                                Circle()
                                    .fill(Color.blue)
                                    .frame(width: 50, height: 50)
                                
                                Text(business.initialsForAvatar)
                                    .font(.title2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                            }
                        }
                    }
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
                
                // Stats overview
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 15) {
                    // Active Offers
                    StatCard(
                        title: "Active Offers",
                        value: "\(dataManager.offers.filter { $0.isActive }.count)",
                        icon: "tag.circle.fill",
                        color: .green
                    )
                    
                    // Pending Claims
                    StatCard(
                        title: "Pending Claims",
                        value: "\(dataManager.claims.filter { $0.isPending }.count)",
                        icon: "person.crop.circle.badge.clock.fill",
                        color: .orange
                    )
                    
                    // In Progress
                    StatCard(
                        title: "In Progress",
                        value: "\(dataManager.claims.filter { $0.isInProgress }.count)",
                        icon: "clock.fill",
                        color: .blue
                    )
                    
                    // Completed
                    StatCard(
                        title: "Completed",
                        value: "\(dataManager.claims.filter { $0.isCompleted }.count)",
                        icon: "checkmark.circle.fill",
                        color: .purple
                    )
                }
                
                // Recent notifications
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("Recent Notifications")
                            .font(.headline)
                        
                        Spacer()
                        
                        Button(action: {
                            // View all notifications
                        }) {
                            Text("View All")
                                .font(.subheadline)
                                .foregroundColor(.blue)
                        }
                    }
                    
                    if dataManager.isLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle())
                            .frame(maxWidth: .infinity, alignment: .center)
                            .padding()
                    } else if dataManager.notifications.isEmpty {
                        Text("No notifications yet")
                            .foregroundColor(.secondary)
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .center)
                    } else {
                        ForEach(dataManager.notifications.prefix(3)) { notification in
                            NotificationRow(notification: notification)
                        }
                    }
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
            }
            .padding()
        }
        .navigationTitle("Dashboard")
        .refreshable {
            // Refresh data
            dataManager.fetchOffers()
            dataManager.fetchNotifications()
        }
    }
}

struct StatCard: View {
    var title: String
    var value: String
    var icon: String
    var color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
            
            Text(value)
                .font(.title)
                .fontWeight(.bold)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}

struct NotificationRow: View {
    var notification: BusinessNotification
    
    var body: some View {
        HStack(spacing: 12) {
            // Icon
            Image(systemName: notification.iconName)
                .font(.title2)
                .foregroundColor(.blue)
                .frame(width: 40, height: 40)
                .background(Color.blue.opacity(0.1))
                .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 4) {
                Text(notification.title)
                    .font(.headline)
                
                Text(notification.message)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
                
                Text(notification.formattedRelativeTime)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            // Unread indicator
            if !notification.isRead {
                Circle()
                    .fill(Color.blue)
                    .frame(width: 8, height: 8)
            }
        }
        .padding(.vertical, 8)
    }
}

struct OffersView: View {
    @EnvironmentObject var dataManager: DataManager
    @State private var isShowingNewOffer = false
    
    var body: some View {
        VStack {
            if dataManager.isLoading {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle())
            } else if dataManager.offers.isEmpty {
                VStack(spacing: 20) {
                    Image(systemName: "tag.slash")
                        .font(.system(size: 70))
                        .foregroundColor(.gray)
                    
                    Text("No Offers Yet")
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    Text("Create your first offer to start finding influencers for your brand.")
                        .multilineTextAlignment(.center)
                        .foregroundColor(.secondary)
                        .padding(.horizontal)
                    
                    Button(action: {
                        isShowingNewOffer = true
                    }) {
                        Label("Create Your First Offer", systemImage: "plus")
                            .padding()
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(8)
                    }
                    .padding(.top)
                }
                .padding()
            } else {
                List {
                    ForEach(dataManager.offers) { offer in
                        NavigationLink(destination: OfferDetailView(offer: offer)) {
                            OfferRow(offer: offer)
                        }
                    }
                }
                .listStyle(InsetGroupedListStyle())
                .refreshable {
                    dataManager.fetchOffers()
                }
            }
        }
        .navigationTitle("Offers")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button(action: {
                    isShowingNewOffer = true
                }) {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(isPresented: $isShowingNewOffer) {
            NavigationView {
                NewOfferView()
                    .navigationTitle("New Offer")
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) {
                            Button("Cancel") {
                                isShowingNewOffer = false
                            }
                        }
                    }
            }
        }
    }
}

struct OfferRow: View {
    var offer: Offer
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(offer.title)
                    .font(.headline)
                
                Spacer()
                
                // Status pill
                Text(offer.statusDisplayName)
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(
                        statusColor(offer.status)
                            .opacity(0.2)
                    )
                    .foregroundColor(statusColor(offer.status))
                    .cornerRadius(4)
            }
            
            Text(offer.description)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .lineLimit(2)
            
            HStack {
                Label("\(offer.claimCount ?? 0) Claims", systemImage: "person.crop.circle")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                // Platforms
                if let platforms = offer.platforms, !platforms.isEmpty {
                    Text(platforms.joined(separator: ", "))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(.vertical, 4)
    }
    
    private func statusColor(_ status: String) -> Color {
        switch status {
        case Offer.statusActive:
            return .green
        case Offer.statusDraft:
            return .gray
        case Offer.statusPaused:
            return .orange
        case Offer.statusExpired:
            return .red
        case Offer.statusCompleted:
            return .purple
        default:
            return .gray
        }
    }
}

struct MessagesView: View {
    var body: some View {
        Text("Messages will be implemented in a future version.")
            .navigationTitle("Messages")
    }
}

struct AccountView: View {
    @EnvironmentObject var authManager: AuthManager
    
    var body: some View {
        List {
            // Profile section
            Section(header: Text("Profile")) {
                if let business = authManager.businessProfile {
                    HStack {
                        // Profile image or initials
                        ZStack {
                            Circle()
                                .fill(Color.blue)
                                .frame(width: 60, height: 60)
                            
                            Text(business.initialsForAvatar)
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                        }
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text(business.companyName)
                                .font(.headline)
                            
                            if let industry = business.industry {
                                Text(industry)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                            
                            Text(business.displaySubscriptionTier)
                                .font(.caption)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(Color.blue.opacity(0.2))
                                .foregroundColor(.blue)
                                .cornerRadius(4)
                        }
                        
                        Spacer()
                        
                        Image(systemName: "chevron.right")
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 4)
                    
                    NavigationLink(destination: Text("Edit Profile")) {
                        Label("Edit Profile", systemImage: "pencil")
                    }
                }
            }
            
            // Settings section
            Section(header: Text("Settings")) {
                NavigationLink(destination: Text("Notification Settings")) {
                    Label("Notifications", systemImage: "bell")
                }
                
                NavigationLink(destination: Text("Subscription Settings")) {
                    Label("Subscription", systemImage: "creditcard")
                }
                
                NavigationLink(destination: Text("Account Settings")) {
                    Label("Account", systemImage: "person.circle")
                }
                
                NavigationLink(destination: Text("Privacy Settings")) {
                    Label("Privacy", systemImage: "lock.shield")
                }
            }
            
            // Support section
            Section(header: Text("Support")) {
                NavigationLink(destination: Text("Help & Support")) {
                    Label("Help & Support", systemImage: "questionmark.circle")
                }
                
                NavigationLink(destination: Text("Terms of Service")) {
                    Label("Terms of Service", systemImage: "doc.text")
                }
                
                NavigationLink(destination: Text("Privacy Policy")) {
                    Label("Privacy Policy", systemImage: "hand.raised")
                }
            }
            
            // Logout section
            Section {
                Button(action: {
                    authManager.logout()
                }) {
                    HStack {
                        Spacer()
                        Text("Logout")
                            .foregroundColor(.red)
                        Spacer()
                    }
                }
            }
        }
        .listStyle(InsetGroupedListStyle())
        .navigationTitle("Account")
    }
}

// Placeholder for OfferDetailView
struct OfferDetailView: View {
    var offer: Offer
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Status indicator
                HStack {
                    Text(offer.statusDisplayName)
                        .font(.headline)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(
                            statusColor(offer.status)
                                .opacity(0.2)
                        )
                        .foregroundColor(statusColor(offer.status))
                        .cornerRadius(8)
                    
                    Spacer()
                    
                    Menu {
                        Button("Edit", action: {})
                        Button("Pause", action: {})
                        Button("Mark as Completed", action: {})
                    } label: {
                        Image(systemName: "ellipsis.circle")
                            .font(.title3)
                    }
                }
                
                // Offer details
                Group {
                    Text(offer.title)
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    Text(offer.description)
                        .foregroundColor(.secondary)
                }
                
                // Divider
                Divider()
                
                // Reward
                VStack(alignment: .leading, spacing: 8) {
                    Label("Reward", systemImage: "gift")
                        .font(.headline)
                    
                    Text(offer.reward)
                        .foregroundColor(.secondary)
                }
                
                // Additional details in sections
                if let location = offer.location {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Location", systemImage: "mappin.and.ellipse")
                            .font(.headline)
                        
                        Text(location)
                            .foregroundColor(.secondary)
                    }
                }
                
                // Platforms
                VStack(alignment: .leading, spacing: 8) {
                    Label("Platforms", systemImage: "network")
                        .font(.headline)
                    
                    Text(offer.platformsFormatted)
                        .foregroundColor(.secondary)
                }
                
                // Tags
                if let tags = offer.tags, !tags.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Tags", systemImage: "tag")
                            .font(.headline)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(tags, id: \.self) { tag in
                                    Text(tag)
                                        .font(.caption)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 6)
                                        .background(Color.gray.opacity(0.2))
                                        .cornerRadius(16)
                                }
                            }
                        }
                    }
                }
                
                // Claims section
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Label("Claims", systemImage: "person.crop.circle")
                            .font(.headline)
                        
                        Spacer()
                        
                        Text("\(offer.claimCount ?? 0) claim(s)")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    
                    Button(action: {
                        // Navigate to claims
                    }) {
                        Text("View All Claims")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(8)
                    }
                }
            }
            .padding()
        }
        .navigationTitle("Offer Details")
    }
    
    private func statusColor(_ status: String) -> Color {
        switch status {
        case Offer.statusActive:
            return .green
        case Offer.statusDraft:
            return .gray
        case Offer.statusPaused:
            return .orange
        case Offer.statusExpired:
            return .red
        case Offer.statusCompleted:
            return .purple
        default:
            return .gray
        }
    }
}

// Placeholder for NewOfferView
struct NewOfferView: View {
    @EnvironmentObject var dataManager: DataManager
    @State private var title = ""
    @State private var description = ""
    @State private var reward = ""
    @State private var location = ""
    @State private var selectedPlatforms: [String] = []
    @State private var isSubmitting = false
    @Environment(\.presentationMode) var presentationMode
    
    // Available platforms
    let availablePlatforms = ["Instagram", "TikTok", "YouTube", "Twitter", "Facebook"]
    
    var body: some View {
        Form {
            Section(header: Text("Basic Information")) {
                TextField("Title", text: $title)
                
                TextEditor(text: $description)
                    .frame(height: 100)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.secondary.opacity(0.3), lineWidth: 1)
                    )
                    .overlay(
                        Group {
                            if description.isEmpty {
                                Text("Describe your offer...")
                                    .foregroundColor(.secondary)
                                    .padding(.leading, 5)
                                    .padding(.top, 8)
                                    .allowsHitTesting(false)
                                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                            }
                        }
                    )
                
                TextField("Reward (e.g. Product, Discount Code)", text: $reward)
                
                TextField("Location (Optional)", text: $location)
            }
            
            Section(header: Text("Platforms")) {
                ForEach(availablePlatforms, id: \.self) { platform in
                    Button(action: {
                        if selectedPlatforms.contains(platform) {
                            selectedPlatforms.removeAll { $0 == platform }
                        } else {
                            selectedPlatforms.append(platform)
                        }
                    }) {
                        HStack {
                            Text(platform)
                            Spacer()
                            if selectedPlatforms.contains(platform) {
                                Image(systemName: "checkmark")
                                    .foregroundColor(.blue)
                            }
                        }
                    }
                    .foregroundColor(.primary)
                }
            }
            
            Section {
                Button(action: submitOffer) {
                    if isSubmitting {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle())
                            .frame(maxWidth: .infinity, alignment: .center)
                    } else {
                        Text("Create Offer")
                            .frame(maxWidth: .infinity, alignment: .center)
                            .foregroundColor(.white)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(isFormValid ? Color.blue : Color.gray)
                .cornerRadius(8)
                .disabled(!isFormValid || isSubmitting)
            }
        }
    }
    
    private var isFormValid: Bool {
        !title.isEmpty && !description.isEmpty && !reward.isEmpty && !selectedPlatforms.isEmpty
    }
    
    private func submitOffer() {
        isSubmitting = true
        
        // Create an example deliverable for each platform
        let deliverables = selectedPlatforms.map { platform -> String in
            switch platform {
            case "Instagram":
                return "1 Instagram post featuring our product"
            case "TikTok":
                return "1 TikTok video featuring our product"
            case "YouTube":
                return "1 YouTube video or Story featuring our product"
            case "Twitter":
                return "1 Tweet featuring our product"
            case "Facebook":
                return "1 Facebook post featuring our product"
            default:
                return "1 post featuring our product"
            }
        }
        
        // Create the offer request
        let offerRequest = OfferCreationRequest(
            title: title,
            description: description,
            reward: reward,
            location: location.isEmpty ? nil : location,
            platforms: selectedPlatforms,
            contentType: "product_review", // Default type
            contentGuidelines: "Please showcase our product in a natural and authentic way.",
            deliverables: deliverables
        )
        
        // Submit the offer
        dataManager.createOffer(offerRequest) { result in
            isSubmitting = false
            
            switch result {
            case .success(_):
                // Close the form
                presentationMode.wrappedValue.dismiss()
            case .failure(let error):
                // Show error (in a real app, we'd display this in the UI)
                print("Failed to create offer: \(error.localizedDescription)")
            }
        }
    }
}

// Preview providers would go here in a real Xcode project