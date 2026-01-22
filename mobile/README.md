# Al-Sufiaan School Attendance Mobile App

React Native mobile application for marking student attendance, built with Expo.

## Features

- **Authentication**: Login with email and password
- **Class & Section Selection**: Navigate through classes and sections
- **Attendance Marking**: Mark students as present/absent with visual indicators
- **Bulk Operations**: Mark all students at once or save changes in bulk
- **Date Selection**: Select any date to mark attendance (cannot mark future dates)
- **Offline-Ready**: Local state management before saving to backend

## Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Installation

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Configure API endpoint:
   - Edit `src/api/client.ts`
   - Update `BASE_URL` to your backend API URL
   - For local development: `http://localhost:7000/api`
   - For production: `https://alsufiaanschool.in/api`

### Running the App

1. Start the Expo development server:
```bash
npm start
```

2. Run on iOS:
```bash
npm run ios
```

3. Run on Android:
```bash
npm run android
```

4. Or scan the QR code with Expo Go app on your mobile device

## Project Structure

```
mobile/
├── src/
│   ├── api/              # API client and endpoints
│   │   ├── client.ts     # Axios configuration
│   │   ├── auth.ts       # Authentication API
│   │   ├── attendance.ts # Attendance API
│   │   ├── classes.ts    # Classes API
│   │   └── sections.ts   # Sections API
│   ├── components/       # Reusable UI components
│   │   ├── DatePicker.tsx
│   │   ├── ErrorMessage.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── StudentCard.tsx
│   ├── context/          # Context providers
│   │   └── AuthContext.tsx
│   ├── navigation/       # Navigation setup
│   │   └── AppNavigator.tsx
│   ├── screens/          # Screen components
│   │   ├── AttendanceScreen.tsx
│   │   ├── ClassSelectionScreen.tsx
│   │   ├── LoadingScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   └── SectionSelectionScreen.tsx
│   └── types/            # TypeScript types
│       └── index.ts
├── App.tsx               # Root component
├── package.json
└── tsconfig.json
```

## Usage

1. **Login**: Enter your email and password to authenticate
2. **Select Class**: Choose a class from the list
3. **Select Section**: Choose a section within the selected class
4. **Mark Attendance**:
   - Select a date (default: today)
   - Toggle students between Present/Absent
   - Use "Mark All Present" or "Mark All Absent" for quick actions
   - Tap "Save Attendance" when done

## API Integration

The app communicates with the backend API at `/api/attendance`. The backend must be running for the app to function.

### Authentication

- The app uses JWT tokens stored in AsyncStorage
- Tokens are automatically attached to API requests via axios interceptors
- The backend supports both cookie-based (web) and Authorization header (mobile) authentication

## Development

### TypeScript

The project uses TypeScript for type safety. Run type checking:
```bash
npx tsc --noEmit
```

### Code Structure

- **API Layer**: All API calls are centralized in `src/api/`
- **State Management**: React Context for authentication, local state for attendance
- **Navigation**: React Navigation Stack Navigator
- **Styling**: StyleSheet API with consistent design system

## Troubleshooting

1. **API Connection Issues**:
   - Verify backend is running on the correct port
   - Check `BASE_URL` in `src/api/client.ts`
   - For Android emulator, use `10.0.2.2` instead of `localhost`

2. **Token Issues**:
   - Clear app data and re-login
   - Check if token is being stored in AsyncStorage

3. **Build Issues**:
   - Clear cache: `expo start -c`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

## Notes

- The app requires an active internet connection to save attendance
- Attendance cannot be marked for future dates
- Changes are saved locally before being sent to the backend in bulk
