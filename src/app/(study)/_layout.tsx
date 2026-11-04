import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { useSession } from '../../session';

export default function StudyLayout() {
  const { user, loading } = useSession();
  if (loading) return <ActivityIndicator />;
  if (!user) return <Redirect href="/" />;

  return (
    <Tabs screenOptions={{
      headerStyle: { backgroundColor: '#101422' },
      headerTintColor: '#f4f5ff',
      tabBarStyle: { backgroundColor: '#101422' },
      tabBarActiveTintColor: '#b1b8ff',
      tabBarInactiveTintColor: '#bec6de',
    }}>
      <Tabs.Screen name="materias" options={{ title: 'Matérias' }} />
      <Tabs.Screen name="conta" options={{ title: 'Conta' }} />
    </Tabs>
  );
}
