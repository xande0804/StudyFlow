import { ScrollView } from 'react-native';
import { SubjectsPanel } from '../../SubjectsPanel';
import { useSession } from '../../session';

export default function SubjectsScreen() {
  const { user } = useSession();
  if (!user) return null;

  return (
    <ScrollView style={{ backgroundColor: '#101422' }}
      contentContainerStyle={{ padding: 24, maxWidth: 560, width: '100%', alignSelf: 'center' }}
      keyboardShouldPersistTaps="handled">
      <SubjectsPanel key={user.uid} uid={user.uid} />
    </ScrollView>
  );
}
