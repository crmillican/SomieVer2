import SwiftUI

@main
struct SomieInfluencerApp: App {
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
                .progressViewStyle(CircularProgressViewStyle(tint: .purple))
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
                Image(systemName: "star.circle.fill")
                    .resizable()
                    .frame(width: 100, height: 100)
                    .foregroundColor(.purple)
                
                Text("SOMIE Creator")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("Discover brand opportunities and grow your influence")
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
                    .background(Color.purple)
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
                    .foregroundColor(.purple)
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
    @State private var displayName = ""
    @State private var email = ""
    
    var body: some View {
        VStack(spacing: 20) {
            TextField("Username", text: $username)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .autocapitalization(.none)
                .disableAutocorrection(true)
            
            SecureField("Password", text: $password)
                .textFieldStyle(RoundedBorderTextFieldStyle())
            
            TextField("Display Name", text: $displayName)
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
                    .background(Color.purple)
                    .foregroundColor(.white)
                    .cornerRadius(8)
            }
            .disabled(username.isEmpty || password.isEmpty || displayName.isEmpty || authManager.isLoading)
            .opacity(username.isEmpty || password.isEmpty || displayName.isEmpty || authManager.isLoading ? 0.6 : 1)
            
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
            // Discover Tab
            NavigationView {
                Text("Discover View - Coming Soon")
                    .navigationTitle("Discover")
            }
            .tabItem {
                Label("Discover", systemImage: "magnifyingglass")
            }
            
            // My Offers Tab
            NavigationView {
                Text("My Collaborations - Coming Soon")
                    .navigationTitle("My Collaborations")
            }
            .tabItem {
                Label("My Offers", systemImage: "briefcase.fill")
            }
            
            // Messages Tab
            NavigationView {
                Text("Messages View - Coming Soon")
                    .navigationTitle("Messages")
            }
            .tabItem {
                Label("Messages", systemImage: "message.fill")
            }
            
            // Profile Tab
            NavigationView {
                Text("Profile View - Coming Soon")
                    .navigationTitle("Profile")
            }
            .tabItem {
                Label("Profile", systemImage: "person.fill")
            }
        }
        .onAppear {
            // Load initial data when implemented
        }
    }
}

// Preview providers would go here in a real Xcode project