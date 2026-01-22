# Troubleshooting Guide

## Common Issues and Solutions

### 1. Cannot Connect to Backend API

**Symptoms:** App shows network errors, login fails, API calls timeout

**Solutions:**

#### For Android Emulator:
- The API client automatically uses `http://10.0.2.2:7000/api` for Android
- Make sure your backend is running on `localhost:7000`
- Verify backend is accessible: `curl http://localhost:7000/api/test`

#### For iOS Simulator:
- Uses `http://localhost:7000/api`
- Make sure backend is running on `localhost:7000`

#### For Physical Device:
1. Find your computer's local IP address:
   - Mac: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - Windows: `ipconfig` (look for IPv4 Address)
   - Linux: `ip addr show` or `hostname -I`

2. Update `mobile/src/api/client.ts`:
   ```typescript
   // Replace localhost with your IP, e.g.:
   return 'http://192.168.1.100:7000/api';
   ```

3. Make sure your phone and computer are on the same WiFi network

#### Using Environment Variable:
Create a `.env` file in the `mobile/` directory:
```
EXPO_PUBLIC_API_URL=http://192.168.1.100:7000/api
```

### 2. Backend CORS Errors

**Symptoms:** "CORS policy violation" errors in console

**Solutions:**
- The backend already allows requests with no origin (mobile apps)
- If you see CORS errors, check `backend/src/index.ts` CORS configuration
- For physical devices, make sure requests include proper headers

### 3. Login Not Working

**Symptoms:** Login button does nothing, no errors shown

**Solutions:**
1. Check browser/Expo console for errors
2. Verify backend is running: `cd backend && npm run dev`
3. Check if token is being returned:
   - Open `backend/src/controllers/auth.ts`
   - Verify token is in response: `{ ...user, token }`
4. Check AsyncStorage permissions (should work by default with Expo)

### 4. Sections Not Loading

**Symptoms:** After selecting a class, sections screen is empty

**Solutions:**
1. Verify GET endpoint exists: `GET /api/sections?classId=X`
2. Check if sections exist in database for that class
3. Check backend logs for errors
4. Verify schoolId is being sent correctly

### 5. Expo Start Issues

**Symptoms:** `expo start` fails or shows errors

**Solutions:**
1. Clear Expo cache: `expo start -c`
2. Reinstall dependencies: `rm -rf node_modules && npm install --legacy-peer-deps`
3. Update Expo CLI: `npm install -g expo-cli@latest`

### 6. TypeScript Errors

**Symptoms:** Build fails with TypeScript errors

**Solutions:**
1. Check types in `mobile/src/types/index.ts`
2. Verify API response types match backend responses
3. Run: `npx tsc --noEmit` to check for errors

### 7. Token Not Persisting

**Symptoms:** Need to login every time app opens

**Solutions:**
1. Check AsyncStorage is imported correctly
2. Verify token is being saved: Add console.log in AuthContext
3. Check if app has storage permissions

### 8. Date Picker Not Showing (iOS)

**Symptoms:** Date picker doesn't appear on iOS

**Solutions:**
1. This is expected - iOS shows inline picker
2. Check DatePicker component handles iOS platform correctly
3. Test on Android to see different behavior

## Debugging Tips

1. **Enable Network Logging:**
   Add to `mobile/src/api/client.ts`:
   ```typescript
   apiClient.interceptors.request.use((config) => {
     console.log('API Request:', config.method, config.url);
     return config;
   });
   ```

2. **Check AsyncStorage:**
   Add debug logs in `mobile/src/context/AuthContext.tsx`:
   ```typescript
   console.log('Token stored:', await AsyncStorage.getItem(TOKEN_KEY));
   ```

3. **Backend Logging:**
   Check `backend/src/middleware/auth.ts` for auth logs
   Check `backend/src/controllers/attendance.ts` for attendance logs

4. **Test API Directly:**
   ```bash
   # Test login
   curl -X POST http://localhost:7000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password"}'
   ```

## Still Having Issues?

1. Check Expo/React Native version compatibility
2. Verify all dependencies are installed: `npm list`
3. Check backend is running and accessible
4. Review console logs for specific error messages
5. Test with a simple API call first (like `/api/test`)
