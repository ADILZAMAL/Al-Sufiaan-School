import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { academicApi } from '../api/academics';
import { AcademicSubject } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

type Nav = StackNavigationProp<RootStackParamList, 'MarksSubjectSelection'>;
type Route = RouteProp<RootStackParamList, 'MarksSubjectSelection'>;

const MarksSubjectSelectionScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { classId, className, sectionId, sectionName, sessionId } = route.params;
  const { user, logout } = useAuth();

  const [subjects, setSubjects] = useState<AcademicSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadSubjects(); }, []);

  const loadSubjects = async () => {
    if (!user?.staffId) {
      setError('Staff ID not found. Please log in again.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await academicApi.getAssignedSubjects(sessionId, sectionId, user.staffId);
      setSubjects(data);
    } catch (err: any) {
      if (err.response?.status === 401) { await logout(); return; }
      setError(err.response?.data?.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadSubjects} />;

  return (
    <View style={styles.container}>
      {subjects.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyTitle}>No Subjects Assigned</Text>
          <Text style={styles.emptyText}>
            You have no subjects assigned for {className} — {sectionName} this session.
          </Text>
        </View>
      ) : (
        <FlatList
          data={subjects}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => navigation.navigate('MarksChapterSelection', {
                subjectId: item.id,
                subjectName: item.name,
                sectionId,
                sessionId,
                classId,
                sectionName,
              })}
            >
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          )}
        />
      )}
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
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
});

export default MarksSubjectSelectionScreen;
