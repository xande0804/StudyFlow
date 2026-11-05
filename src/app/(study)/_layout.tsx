import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useActivityNotices } from '../../useActivityNotices';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { useSession } from '../../session';

const icons: Record<string, SymbolViewProps['name']> = {
  painel: { ios: 'square.grid.2x2', android: 'space_dashboard', web: 'space_dashboard' },
  materias: { ios: 'books.vertical', android: 'menu_book', web: 'menu_book' },
  atividades: { ios: 'checklist', android: 'checklist', web: 'checklist' },
  pomodoro: { ios: 'timer', android: 'timer', web: 'timer' },
  conta: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
};

export default function StudyLayout() {
  const { user, loading } = useSession();
  useActivityNotices(user?.uid);
  if (loading) return <ActivityIndicator />;
  if (!user) return <Redirect href="/" />;

  return (
    <Tabs screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => <SymbolView name={icons[route.name]} tintColor={color} size={size} />,
      headerTitleStyle: { fontWeight: '600', fontSize: 19 },
      headerShadowVisible: false,
      tabBarLabelStyle: { fontSize: 11, marginBottom: 3, fontWeight: '600' },
      tabBarItemStyle: { paddingTop: 6, paddingBottom: 2 },
      headerStyle: { backgroundColor: '#0e1220' },
      headerTintColor: '#f4f5ff',
      tabBarStyle: { backgroundColor: '#111726', borderTopColor: '#283149', minHeight: 72 },
      tabBarActiveTintColor: '#c5b6ff',
      tabBarInactiveTintColor: '#8390aa',
    })}>
      <Tabs.Screen name="painel" options={{ title: 'Painel' }} />
      <Tabs.Screen name="materias" options={{ title: 'Matérias' }} />
      <Tabs.Screen name="atividades" options={{ title: 'Atividades' }} />
      <Tabs.Screen name="pomodoro" options={{ title: 'Pomodoro' }} />
      <Tabs.Screen name="conta" options={{ title: 'Conta' }} />
    </Tabs>
  );
}
