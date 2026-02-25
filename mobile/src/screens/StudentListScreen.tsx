import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { studentApi } from '../api/student';
import { Student } from '../types';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

type StudentListScreenRouteProp = RouteProp<RootStackParamList, 'StudentList'>;
type StudentListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'StudentList'>;

const StudentListScreen: React.FC = () => {
  const route = useRoute<StudentListScreenRouteProp>();
  const navigation = useNavigation<StudentListScreenNavigationProp>();
  const { classId, sectionId } = route.params;
  const { logout } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadStudents();
  }, [classId, sectionId]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studentApi.getBySection(classId, sectionId);
      setStudents(data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        await logout();
        return;
      }
      setError(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    const query = search.trim().toLowerCase();
    return students.filter(s =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(query)
    );
  }, [students, search]);

  const handleStudentPress = (student: Student) => {
    navigation.navigate('StudentProfile', {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
    });
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadStudents} />;

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search students..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
          autoCorrect={false}
        />
      </View>

      {/* Count */}
      <Text style={styles.count}>
        {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'}
      </Text>

      {/* List */}
      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <StudentRow student={item} onPress={() => handleStudentPress(item)} />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {search.trim() ? 'No students match your search' : 'No students found'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

// ─── Student Row ─────────────────────────────────────────────────────────────

interface StudentRowProps {
  student: Student;
  onPress: () => void;
}

const StudentRow: React.FC<StudentRowProps> = ({ student, onPress }) => {
  const initials =
    `${student.firstName[0] ?? ''}${student.lastName[0] ?? ''}`.toUpperCase();

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      {/* Photo / Initials */}
      {student.studentPhoto ? (
        <Image source={{ uri: student.studentPhoto }} style={styles.photo} />
      ) : (
        <View style={styles.initialsCircle}>
          <Text style={styles.initialsText}>{initials}</Text>
        </View>
      )}

      {/* Name + Roll */}
      <View style={styles.rowInfo}>
        <Text style={styles.studentName}>
          {student.firstName} {student.lastName}
        </Text>
        <Text style={styles.rollNumber}>
          {student.rollNumber ? `Roll No: ${student.rollNumber}` : 'No roll number'}
        </Text>
      </View>

      <Text style={styles.arrow}>→</Text>
    </TouchableOpacity>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: '#1f2937',
  },
  count: {
    fontSize: 13,
    color: '#6b7280',
    marginHorizontal: 20,
    marginBottom: 8,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  separator: {
    height: 1,
    backgroundColor: '#f3f4f6',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  photo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#e5e7eb',
  },
  initialsCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  rowInfo: {
    flex: 1,
    marginLeft: 14,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 3,
  },
  rollNumber: {
    fontSize: 13,
    color: '#6b7280',
  },
  arrow: {
    fontSize: 20,
    color: '#3b82f6',
    marginLeft: 8,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
  },
});

export default StudentListScreen;
