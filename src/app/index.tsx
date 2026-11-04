import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Home() {
  return (
    <SafeAreaView style={styles.screen}>
      <Text accessibilityRole="header" style={styles.title}>StudyFlow</Text>
      <Text style={styles.description}>Organize seus estudos e acompanhe seus prazos.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', padding: 24, gap: 12, backgroundColor: '#101422' },
  title: { color: '#f4f5ff', fontSize: 36, fontWeight: '700' },
  description: { color: '#bec6de', fontSize: 17 },
});
