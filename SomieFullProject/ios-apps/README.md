# SOMIE iOS Applications

This directory contains the native iOS applications for the SOMIE platform. We are developing two separate applications:

1. **SomieBusiness** - For business users to manage their offers, view claims, and interact with influencers.
2. **SomieInfluencer** - For influencers to discover offers, submit content, and manage their collaborations.

## Project Structure

### SomieBusiness App

- **Models/** - Data models that match the backend schemas
  - `BusinessProfile.swift` - Business profile representation
  - `Offer.swift` - Offer model with CRUD operations
  - `OfferClaim.swift` - Representation of an influencer's claim on an offer
  - `User.swift` - User authentication model

- **Managers/** - Business logic and API communication
  - `AuthManager.swift` - Handles authentication, token management, and user sessions
  - `DataManager.swift` - Manages data fetching, caching, and persistence

- **Views/** - SwiftUI views (to be expanded)
  - Dashboard, Offers, Messages, and Account management

- **SomieBusinessModel.xcdatamodeld** - Core Data model for local caching

### SomieInfluencer App (Planned)

Will follow a similar structure to the SomieBusiness app but with influencer-specific features.

## Development Approach

1. **Backend Integration**
   - All iOS apps communicate with the same REST API backend
   - Authentication uses JWT tokens with secure storage
   - Models match the backend schema definitions

2. **Offline Support**
   - Core Data integration for local persistence
   - Background sync when connectivity is restored

3. **Native Experience Focus**
   - Utilizing platform-specific features like Push Notifications
   - Camera integration for content creation
   - Location services for nearby opportunities

## Getting Started (for Developers)

1. Open the project in Xcode 14.0 or later
2. Configure the development team in project settings
3. Set the API base URL in the respective manager files
4. Build and run on a simulator or device running iOS 16.0+

## Technical Requirements

- iOS 16.0+
- Swift 5.7+
- Xcode 14.0+

## Dependencies

- All dependencies are managed with Swift Package Manager:
  - Combine for reactive programming
  - Core Data for persistence
  - SwiftUI for UI components

## Future Enhancements

- Push notification integration
- Analytics and tracking
- Social media platform SDK integrations
- AR content creation tools
- Offline-first architecture improvements