import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { classesApi } from '../api/classes';
import { academicApi } from '../api/academics';
import { Class } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

type Nav = StackNavigationProp<RootStackParamList, 'MarksClassSelection'>;

const MarksClassSelectionScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuth();

  const [classes, setClasses] = useState<Class[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user?.schoolId) {
      setError('School ID not found');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [session, data] = await Promise.all([
        academicApi.getActiveSession(),
        classesApi.getClasses(user.schoolId),
      ]);
      if (!session) {
        setError('No active academic session found. Please contact your administrator.');
        setLoading(false);
        return;
      }
      setSessionId(session.id);
      setClasses(data);
    } catch (err: any) {
      if (err.response?.status === 401) { await logout(); return; }
      setError(err.response?.data?.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={classes}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('MarksSectionSelection', {
              classId: item.id, className: item.name, sessionId: sessionId!,
            })}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No classes found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  list: { padding: 15 },
  item: {
    backgroundColor: '#fff', padding: 20, marginBottom: 10, borderRadius: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  name: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  arrow: { fontSize: 24, color: '#3b82f6' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#6b7280' },
});

export default MarksClassSelectionScreen;
