import { Pressable, StyleSheet, Text, type ButtonProps } from 'react-native';

type Props = Omit<ButtonProps, 'color'> & {
  selected?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
};

export function Button({ title, selected, variant = 'secondary', disabled, onPress, accessibilityLabel, testID }: Props) {
  const highlighted = Boolean(selected) || variant === 'primary';
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: Boolean(disabled), selected }} aria-pressed={selected}
      disabled={disabled} onPress={onPress} testID={testID}
      style={({ pressed }) => [
        styles.button, highlighted && styles.primary, variant === 'danger' && styles.danger,
        disabled && !selected && styles.disabled, pressed && styles.pressed,
      ]}>
      <Text style={[styles.label, highlighted && styles.primaryLabel, variant === 'danger' && styles.dangerLabel]}>
        {selected ? '✓  ' : ''}{title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 44, paddingVertical: 12, paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center',
    borderRadius: 12, borderWidth: 1, borderColor: '#2d354c', backgroundColor: '#1b2235' },
  primary: { backgroundColor: '#b9a5ff', borderColor: '#b9a5ff' },
  danger: { backgroundColor: '#331f2e', borderColor: '#754252' },
  label: { color: '#d6d9e7', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  primaryLabel: { color: '#1b1533', fontWeight: '700' },
  dangerLabel: { color: '#ffa5b5' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },
});
