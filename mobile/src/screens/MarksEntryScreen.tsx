import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { academicApi } from '../api/academics';
import { studentApi } from '../api/student';
import { RootStackParamList } from '../navigation/AppNavigator';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

type Route = RouteProp<RootStackParamList, 'MarksEntry'>;

interface StudentMark {
  studentId: number;
  studentName: string;
  rollNumber: string | null;
  isAbsent: boolean;
  marksObtained: string; // string for TextInput; convert to number on save
}

interface MarkRowProps {
  item: StudentMark;
  totalMarks: number;
  passingMarks: number;
  onUpdate: (studentId: number, field: 'marksObtained' | 'isAbsent', value: string | boolean) => void;
}

const MarkRow = React.memo(({ item, totalMarks, passingMarks, onUpdate }: MarkRowProps) => {
  const result: 'pass' | 'fail' | null = (() => {
    if (item.isAbsent || item.marksObtained === '') return null;
    const num = parseFloat(item.marksObtained);
    if (isNaN(num)) return null;
    return num >= passingMarks ? 'pass' : 'fail';
  })();

  return (
    <View style={styles.row}>
      <View style={styles.studentInfo}>
        {item.rollNumber && <Text style={styles.rollNumber}>#{item.rollNumber}</Text>}
        <Text style={styles.studentName}>{item.studentName}</Text>
      </View>
      <TouchableOpacity
        style={[styles.absentBtn, item.isAbsent && styles.absentBtnActive]}
        onPress={() => onUpdate(item.studentId, 'isAbsent', !item.isAbsent)}
      >
        <Text style={[styles.absentBtnText, item.isAbsent && styles.absentBtnTextActive]}>Absent</Text>
      </TouchableOpacity>
      {!item.isAbsent ? (
        <View style={styles.marksInputWrap}>
          <TextInput
            style={[
              styles.marksInput,
              result === 'pass' && styles.marksInputPass,
              result === 'fail' && styles.marksInputFail,
            ]}
            value={item.marksObtained}
            onChangeText={text => onUpdate(item.studentId, 'marksObtained', text)}
            keyboardType="decimal-pad"
            placeholder={`/ ${totalMarks}`}
            placeholderTextColor="#9ca3af"
            maxLength={6}
          />
          {result && (
            <Text style={result === 'pass' ? styles.resultPass : styles.resultFail}>
              {result === 'pass' ? 'P' : 'F'}
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.absentPlaceholder}>
          <Text style={styles.absentLabel}>—</Text>
        </View>
      )}
    </View>
  );
});

const MarksEntryScreen: React.FC = () => {
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const { examId, examName, totalMarks, passingMarks, classId, sectionId } = route.params;
  const { logout } = useAuth();

  const [marks, setMarks] = useState<StudentMark[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdate, setIsUpdate] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [students, existingMarks] = await Promise.all([
        studentApi.getBySection(classId, sectionId),
        academicApi.getMarksByExam(examId),
      ]);

      const markMap = new Map(existingMarks.map((m: any) => [m.studentId, m]));

      const merged: StudentMark[] = students.map((s: any) => {
        const existing = markMap.get(s.id) as any;
        return {
          studentId: s.id,
          studentName: `${s.firstName} ${s.lastName}`,
          rollNumber: s.rollNumber,
          isAbsent: existing?.isAbsent ?? false,
          marksObtained: existing && !existing.isAbsent && existing.marksObtained !== null
            ? String(existing.marksObtained)
            : '',
        };
      });

      setMarks(merged);
      setIsUpdate(existingMarks.length > 0);
      setIsDirty(false);
    } catch (err: any) {
      if (err.response?.status === 401) { await logout(); return; }
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const updateMark = useCallback((studentId: number, field: 'marksObtained' | 'isAbsent', value: string | boolean) => {
    setIsDirty(true);
    setMarks(prev => prev.map(m => {
      if (m.studentId !== studentId) return m;
      if (field === 'isAbsent') {
        return { ...m, isAbsent: value as boolean, marksObtained: value ? '' : m.marksObtained };
      }
      return { ...m, marksObtained: value as string };
    }));
  }, []);

  const getPassFail = (mark: StudentMark): 'pass' | 'fail' | null => {
    if (mark.isAbsent || mark.marksObtained === '') return null;
    const num = parseFloat(mark.marksObtained);
    if (isNaN(num)) return null;
    return num >= passingMarks ? 'pass' : 'fail';
  };

  const validate = (): boolean => {
    for (const m of marks) {
      if (!m.isAbsent) {
        if (m.marksObtained === '') {
          Alert.alert('Missing Marks', `Please enter marks for ${m.studentName} or mark them absent.`);
          return false;
        }
        const num = parseFloat(m.marksObtained);
        if (isNaN(num) || num < 0 || num > totalMarks) {
          Alert.alert('Invalid Marks', `Marks for ${m.studentName} must be between 0 and ${totalMarks}.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    Alert.alert(
      isUpdate ? 'Update Marks' : 'Save Marks',
      `${isUpdate ? 'Update' : 'Save'} marks for all ${marks.length} students?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async () => {
            try {
              setSaving(true);
              const payload = marks.map(m => ({
                studentId: m.studentId,
                isAbsent: m.isAbsent,
                marksObtained: m.isAbsent ? null : parseFloat(m.marksObtained),
              }));
              await academicApi.bulkSubmitMarks(examId, payload);
              setIsUpdate(true);
              setIsDirty(false);
              Alert.alert('Saved', 'Marks saved successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to save marks');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;

  const passed = marks.filter(m => getPassFail(m) === 'pass').length;
  const failed = marks.filter(m => getPassFail(m) === 'fail').length;
  const absent = marks.filter(m => m.isAbsent).length;

  return (
    <View style={styles.container}>
      <View style={styles.examHeader}>
        <Text style={styles.examName}>{examName}</Text>
        <Text style={styles.examMeta}>Total Marks: {totalMarks}  |  Passing: {passingMarks}</Text>
        <View style={styles.statRow}>
          <Text style={styles.statPass}>✓ Pass: {passed}</Text>
          <Text style={styles.statFail}>✗ Fail: {failed}</Text>
          <Text style={styles.statAbsent}>○ Absent: {absent}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="always"
        automaticallyAdjustKeyboardInsets={true}
      >
        {marks.map(item => (
          <MarkRow
            key={item.studentId}
            item={item}
            totalMarks={totalMarks}
            passingMarks={passingMarks}
            onUpdate={updateMark}
          />
        ))}
        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, (saving || (isUpdate && !isDirty)) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving || (isUpdate && !isDirty)}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>{isUpdate ? 'Update Marks' : 'Save Marks'} ({marks.length} students)</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },

  examHeader: {
    backgroundColor: '#fff', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  examName: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  examMeta: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  statRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  statPass: { fontSize: 13, color: '#16a34a', fontWeight: '600' },
  statFail: { fontSize: 13, color: '#dc2626', fontWeight: '600' },
  statAbsent: { fontSize: 13, color: '#6b7280', fontWeight: '600' },

  list: { padding: 12 },
  row: {
    backgroundColor: '#fff', borderRadius: 8, marginBottom: 8,
    padding: 12, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 2, elevation: 1,
  },
  studentInfo: { flex: 1 },
  rollNumber: { fontSize: 11, color: '#9ca3af', marginBottom: 2 },
  studentName: { fontSize: 14, fontWeight: '600', color: '#1f2937' },

  absentBtn: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6,
    borderWidth: 1, borderColor: '#d1d5db', marginRight: 8,
    backgroundColor: '#fff',
  },
  absentBtnActive: { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
  absentBtnText: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  absentBtnTextActive: { color: '#dc2626', fontWeight: '700' },

  marksInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  marksInput: {
    width: 72, height: 38, borderWidth: 1, borderColor: '#d1d5db',
    borderRadius: 6, paddingHorizontal: 8, fontSize: 15, fontWeight: '600',
    color: '#1f2937', backgroundColor: '#fff', textAlign: 'center',
  },
  marksInputPass: { borderColor: '#86efac', backgroundColor: '#f0fdf4' },
  marksInputFail: { borderColor: '#fca5a5', backgroundColor: '#fff1f2' },
  resultPass: { fontSize: 14, fontWeight: '700', color: '#16a34a', width: 16 },
  resultFail: { fontSize: 14, fontWeight: '700', color: '#dc2626', width: 16 },

  absentPlaceholder: {
    width: 72 + 4 + 16, justifyContent: 'center', alignItems: 'center',
  },
  absentLabel: { fontSize: 20, color: '#d1d5db' },

  footer: {
    padding: 16, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#e5e7eb',
  },
  saveBtn: {
    backgroundColor: '#3b82f6', paddingVertical: 14, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnDisabled: { backgroundColor: '#93c5fd' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default MarksEntryScreen;
