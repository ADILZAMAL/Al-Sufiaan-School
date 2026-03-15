import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { academicApi } from '../api/academics';
import { AcademicExam } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

type Nav = StackNavigationProp<RootStackParamList, 'MarksExamSelection'>;
type Route = RouteProp<RootStackParamList, 'MarksExamSelection'>;

const MarksExamSelectionScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { chapterId, chapterName, subjectName, classId, sectionId } = route.params;
  const { logout } = useAuth();

  const [exams, setExams] = useState<AcademicExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadExams(); }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await academicApi.getExams(chapterId);
      setExams(data);
    } catch (err: any) {
      if (err.response?.status === 401) { await logout(); return; }
      setError(err.response?.data?.message || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadExams} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={exams}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('MarksEntry', {
              examId: item.id,
              examName: item.name,
              totalMarks: item.totalMarks,
              passingMarks: item.passingMarks,
              classId,
              sectionId,
            })}
          >
            <View style={styles.itemLeft}>
              <Text style={styles.examName}>{item.name}</Text>
              <Text style={styles.examMeta}>
                Total: {item.totalMarks} | Passing: {item.passingMarks}
                {item.examDate ? `  |  ${new Date(item.examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
              </Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>No Exams</Text>
            <Text style={styles.emptyText}>No exams have been created for this chapter yet.</Text>
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
  itemLeft: { flex: 1 },
  examName: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  examMeta: { fontSize: 13, color: '#6b7280' },
  arrow: { fontSize: 24, color: '#3b82f6', marginLeft: 8 },
  empty: { flex: 1, alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 50, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
});

export default MarksExamSelectionScreen;
