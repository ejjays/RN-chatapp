import { Stack } from 'expo-router';
import { AuthGuard } from '@/components/AuthGuard';

export default function ChatLayout() {
  return (
    <AuthGuard>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="[id]" />
        <Stack.Screen name="create-group" />
      </Stack>
    </AuthGuard>
  );
}