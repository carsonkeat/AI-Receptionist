# Migration Summary: Assistant ID from Receptionists to Profiles

## ✅ Completed Changes

### 1. TypeScript Types
- ✅ Updated `types/database.ts` to include `vapi_assistant_id` in Profile type
- ✅ Added to Row, Insert, and Update interfaces

### 2. API Functions
- ✅ Updated `lib/api/profiles.ts`:
  - Added `getCurrentUserAssistantId()` helper
  - Added `updateUserAssistantId()` helper
  - `updateProfile()` already supports updating `vapi_assistant_id`

### 3. Hooks
- ✅ Updated `hooks/useProfile.ts`:
  - Added `useUserAssistantId()` hook - returns current user's assistant ID
  - Added `useUpdateUserAssistantId()` mutation - updates assistant ID

### 4. UI Components Updated
- ✅ `app/(tabs)/receptionist/index.tsx` - Now uses `useUserAssistantId()`
- ✅ `app/(tabs)/receptionist/advanced.tsx` - Now uses `useUserAssistantId()`
- ✅ `app/(tabs)/receptionist/advanced/update-assistant.tsx` - Now uses `useUserAssistantId()`
- ✅ `app/(tabs)/receptionist/advanced/billing-costs.tsx` - Now uses `useUserAssistantId()`
- ✅ `app/(tabs)/receptionist/advanced/behavior-rules.tsx` - Now uses `useUserAssistantId()`
- ✅ `app/(tabs)/dashboard.tsx` - Now uses `useUserAssistantId()`
- ✅ `app/(tabs)/calls-test.tsx` - Now uses `useUserAssistantId()`

### 5. Webhook Handler
- ✅ Updated `supabase/functions/vapi-webhook/index.ts`:
  - Changed lookup from `receptionists.vapi_assistant_id` to `profiles.vapi_assistant_id`
  - Automatically creates receptionist record if it doesn't exist (for calls table compatibility)
  - Still uses `receptionist_id` for calls table (maintains existing structure)

## 🔄 How It Works Now

### Data Flow:
1. **User Login** → Profile loaded with `vapi_assistant_id`
2. **App Components** → Use `useUserAssistantId()` to get assistant ID
3. **VAPI API Calls** → Filtered by user's assistant ID
4. **Webhook** → Looks up user by `profiles.vapi_assistant_id`
5. **Calls Table** → Still uses `receptionist_id` (auto-created if needed)

### Key Changes:
- **Before**: `receptionist.vapi_assistant_id` (required receptionist record)
- **After**: `profile.vapi_assistant_id` (direct user-to-assistant link)

## 📝 Notes

- Receptionists table is still used for calls (maintains compatibility)
- Webhook automatically creates receptionist if missing
- Each user account now directly owns their assistant ID
- RLS policies ensure users can only see/update their own profile

## 🚀 Next Steps (Optional)

1. Create assistant assignment UI for new users
2. Add validation to ensure assistant ID exists in VAPI
3. Add migration script to move data from receptionists to profiles (if needed)

