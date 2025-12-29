# AI Receptionist App

A React Native mobile app built with Expo, TypeScript, and Supabase for tracking AI receptionist usage, costs, and performance.

## Tech Stack

- **Frontend**: React Native with TypeScript, Expo, and Expo Router
- **Backend/Database**: Supabase (PostgreSQL)
- **UI Framework**: React Native Paper
- **State Management**: TanStack React Query
- **AI Processing**: DeepSeek (integrated externally)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- A Supabase account and project

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd AIReceptionist
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   Get these values from your Supabase project dashboard (Settings → API).

4. **Set up the database**
   
   See `DATABASE_SETUP.md` for detailed instructions. Quick version:
   - Open your Supabase SQL Editor
   - Copy and run the contents of `database/setup.sql`

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Run on your device/emulator**
   - Press `a` for Android
   - Press `i` for iOS
   - Press `w` for web
   - Scan the QR code with Expo Go app on your phone

## Project Structure

```
AIReceptionist/
├── app/                  # Expo Router file-based routing
│   ├── (auth)/          # Authentication screens
│   ├── (tabs)/          # Main app tabs
│   └── calls/           # Call detail routes
├── components/          # Reusable UI components
├── lib/                 # Utilities and API layer
│   ├── supabase/        # Supabase client and auth
│   ├── api/             # API service functions
│   └── utils/           # Utility functions
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
├── constants/           # App constants
├── context/             # React Context providers
└── database/            # Database setup scripts
```

## Features

- ✅ User authentication (sign up, sign in, sign out)
- ✅ Dashboard with real-time metrics
- ✅ Call log with detailed view
- ✅ Call transcripts
- ✅ AI Receptionist overview
- ✅ Account management
- ✅ Real-time data updates

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator/device
- `npm run web` - Run in web browser

## Database Schema

The app uses the following main tables:
- `profiles` - User profile information
- `receptionists` - AI Receptionist instances
- `calls` - Call records with transcripts and metadata

See `DATABASE_SETUP.md` for complete schema details.

## Environment Variables

All environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the app.

Required:
- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Troubleshooting

### Metro bundler cache issues
```bash
npm start -- --clear
```

### TypeScript errors
Make sure all dependencies are installed and run:
```bash
npx tsc --noEmit
```

### Supabase connection issues
1. Verify your `.env` file has correct credentials
2. Check that your Supabase project is active
3. Verify the database schema is set up correctly (see `DATABASE_SETUP.md`)

## Documentation

- Full specification: `AI Receptionist/docs/CONTEXT.md`
- Database setup: `DATABASE_SETUP.md`

## License

Private project
