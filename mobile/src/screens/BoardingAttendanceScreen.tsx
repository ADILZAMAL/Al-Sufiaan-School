import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { attendanceApi } from '../api/attendance';
import { holidayApi } from '../api/holiday';
import { BoardingStudent, AttendanceStatus, AttendanceType, BulkAttendanceRequest, Holiday } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useAuth } from '../context/AuthContext';

const BoardingAttendanceScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params as RootStackParamList['BoardingAttendance'];
  const { boardingType } = params;
  const { logout } = useAuth();

  const [students, setStudents] = useState<BoardingStudent[]>([]);
  const [attendanceState, setAttendanceState] = useState<Map<number, AttendanceStatus>>(new Map());
  const [baselineAttendanceState, setBaselineAttendanceState] = useState<Map<number, AttendanceStatus>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHoliday, setIsHoliday] = useState(false);
  const [holiday, setHoliday] = useState<Holiday | null>(null);

  useEffect(() => {
    loadStudentsWithAttendance();
  }, [boardingType]);

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadStudentsWithAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const today = new Date();
      const dateString = formatDate(today);

      // Check if today is a holiday
      try {
        const holidayCheck = await holidayApi.checkIsHoliday(dateString);
        if (holidayCheck.isHoliday && holidayCheck.holiday) {
          setIsHoliday(true);
          setHoliday(holidayCheck.holiday);
          setStudents([]);
          setAttendanceState(new Map());
          setBaselineAttendanceState(new Map());
          setLoading(false);
          return;
        }
      } catch (holidayErr: any) {
        console.warn('Error checking holiday:', holidayErr);
      }

      setIsHoliday(false);
      setHoliday(null);

      const data = await attendanceApi.getBoardingStudentsWithAttendance(boardingType, dateString);
      setStudents(data);

      // Initialize attendance state from loaded data
      const state = new Map<number, AttendanceStatus>();
      data.forEach((student) => {
        if (student.attendance?.status) {
          state.set(student.id, student.attendance.status);
        }
      });
      setAttendanceState(state);
      setBaselineAttendanceState(new Map(state));
      setCurrentIndex(0);
    } catch (err: any) {
      if (err.response?.status === 401) {
        await logout();
        return;
      }
      setError(err.response?.data?.message || 'Failed to load students');
      console.error('Error loading students:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateUnsavedCount = (): number => {
    let count = 0;

    baselineAttendanceState.forEach((baselineStatus, studentId) => {
      const currentStatus = attendanceState.get(studentId);
      if (currentStatus !== baselineStatus) {
        count++;
      }
    });

    attendanceState.forEach((_, studentId) => {
      if (!baselineAttendanceState.has(studentId)) {
        count++;
      }
    });

    return count;
  };

  const handleMarkAttendance = (studentId: number, status: AttendanceStatus) => {
    const newState = new Map(attendanceState);
    newState.set(studentId, status);
    setAttendanceState(newState);
  };

  const handlePresentButton = () => {
    if (currentIndex < students.length) {
      const student = students[currentIndex];
      handleMarkAttendance(student.id, AttendanceStatus.PRESENT);
      if (currentIndex < students.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }
  };

  const handleAbsentButton = () => {
    if (currentIndex < students.length) {
      const student = students[currentIndex];
      handleMarkAttendance(student.id, AttendanceStatus.ABSENT);
      if (currentIndex < students.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }
  };

  const handleToggleStatus = (studentId: number) => {
    const current = attendanceState.get(studentId);
    const newStatus = current === AttendanceStatus.PRESENT
      ? AttendanceStatus.ABSENT
      : AttendanceStatus.PRESENT;
    handleMarkAttendance(studentId, newStatus);
  };

  const handleSave = async () => {
    const unsavedChanges = calculateUnsavedCount();
    if (unsavedChanges === 0) {
      Alert.alert('No Changes', 'No changes to save.');
      return;
    }

    setSaving(true);
    try {
      const attendances: BulkAttendanceRequest['attendances'] = Array.from(attendanceState.entries()).map(
        ([studentId, status]) => ({
          studentId,
          status,
          remarks: null,
        })
      );

      const requestData: BulkAttendanceRequest = {
        attendanceType: boardingType === 'HOSTEL' ? AttendanceType.HOSTEL : AttendanceType.DAYBOARDING,
        attendances,
      };

      const response = await attendanceApi.bulkMarkAttendance(requestData);

      if (response.failed > 0) {
        Alert.alert(
          'Partial Success',
          `Attendance saved for ${response.success} student(s). ${response.failed} student(s) failed.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Success', `Attendance saved successfully for ${response.success} student(s).`, [
          {
            text: 'OK',
            onPress: () => {
              loadStudentsWithAttendance();
            },
          },
        ]);
      }

      setBaselineAttendanceState(new Map(attendanceState));
    } catch (err: any) {
      if (err.response?.status === 401) {
        await logout();
        return;
      }
      Alert.alert(
        'Save Failed',
        err.response?.data?.message || err.message || 'Failed to save attendance. Please try again.'
      );
      console.error('Error saving attendance:', err);
    } finally {
      setSaving(false);
    }
  };

  const unsavedCount = calculateUnsavedCount();
  const allMarked = students.length > 0 && students.every((student) => {
    const status = attendanceState.get(student.id);
    return status === AttendanceStatus.PRESENT || status === AttendanceStatus.ABSENT;
  });

  const currentStudent = students[currentIndex];
  const currentStatus = currentStudent
    ? (attendanceState.get(currentStudent.id) || currentStudent.attendance?.status || null)
    : null;
  const isPresent = currentStatus === AttendanceStatus.PRESENT;
  const isAbsent = currentStatus === AttendanceStatus.ABSENT;

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadStudentsWithAttendance} />;
  }

  if (isHoliday && holiday) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Today is a Holiday</Text>
          </View>
        </View>
        <View style={styles.holidayContainer}>
          <Text style={styles.holidayIcon}>🎉</Text>
          <Text style={styles.holidayTitle}>Holiday</Text>
          <Text style={styles.holidayName}>{holiday.name}</Text>
          {holiday.reason && (
            <Text style={styles.holidayReason}>{holiday.reason}</Text>
          )}
          <Text style={styles.holidayDate}>
            {new Date(holiday.startDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
            {holiday.startDate !== holiday.endDate && (
              <> - {new Date(holiday.endDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}</>
            )}
          </Text>
          <Text style={styles.holidayMessage}>
            Attendance cannot be marked on holidays.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        {students.length > 0 && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {allMarked ? 'All students marked' : `${currentIndex + 1} of ${students.length}`}
            </Text>
          </View>
        )}
        {unsavedCount > 0 && (
          <View style={styles.unsavedIndicator}>
            <Text style={styles.unsavedText}>
              {unsavedCount} unsaved change{unsavedCount !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Table view when all marked, otherwise card view */}
      {allMarked && students.length > 0 ? (
        <ScrollView style={styles.tableContainer} contentContainerStyle={styles.tableContent}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.tableCol1]}>Student</Text>
            <Text style={[styles.tableHeaderText, styles.tableCol2]}>Roll No</Text>
            <Text style={[styles.tableHeaderText, styles.tableCol3]}>Status</Text>
          </View>
          <Text style={styles.tableEditHint}>Tap a row to change status</Text>
          {students.map((student, index) => {
            const status = attendanceState.get(student.id) || student.attendance?.status || null;
            const present = status === AttendanceStatus.PRESENT;
            const absent = status === AttendanceStatus.ABSENT;
            return (
              <TouchableOpacity key={student.id} style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]} onPress={() => handleToggleStatus(student.id)} activeOpacity={0.7}>
                <View style={[styles.tableCol1]}>
                  <Text style={styles.tableCell}>
                    {student.firstName} {student.lastName}
                  </Text>
                  {student.class && student.section && (
                    <Text style={styles.tableCellSub}>
                      {student.class.name} - {student.section.name}
                    </Text>
                  )}
                </View>
                <Text style={[styles.tableCell, styles.tableCol2]}>
                  {student.rollNumber || '-'}
                </Text>
                <Text style={[styles.tableCell, styles.tableCol3, present && styles.statusPresent, absent && styles.statusAbsent, !present && !absent && styles.statusUnmarked]}>
                  {present ? '✓ Present' : absent ? '✗ Absent' : '-'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : students.length > 0 && currentStudent ? (
        <View style={styles.studentContainer}>
          <View style={styles.studentInfo}>
            {/* Student Photo */}
            <View style={styles.photoContainer}>
              {currentStudent.studentPhoto ? (
                <Image source={{ uri: currentStudent.studentPhoto }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>
                    {currentStudent.firstName.charAt(0)}{currentStudent.lastName.charAt(0)}
                  </Text>
                </View>
              )}
            </View>

            {/* Student Name */}
            <Text style={styles.studentName}>
              {currentStudent.firstName} {currentStudent.lastName}
            </Text>

            {/* Roll Number */}
            {currentStudent.rollNumber && (
              <Text style={styles.rollNumber}>Roll No: {currentStudent.rollNumber}</Text>
            )}

            {/* Class and Section */}
            {currentStudent.class && currentStudent.section && (
              <Text style={styles.classSection}>
                {currentStudent.class.name} - {currentStudent.section.name}
              </Text>
            )}

            {/* Status Indicator */}
            {isPresent && (
              <Text style={styles.statusText}>Status: Present</Text>
            )}
            {isAbsent && (
              <Text style={[styles.statusText, styles.statusTextAbsent]}>Status: Absent</Text>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No {boardingType === 'HOSTEL' ? 'hostel' : 'dayboarding'} students found
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      {!allMarked && students.length > 0 && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.absentButton]}
            onPress={handleAbsentButton}
          >
            <Text style={styles.actionButtonText}>✗</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.presentButton]}
            onPress={handlePresentButton}
          >
            <Text style={styles.actionButtonText}>✓</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Save Button */}
      {allMarked && unsavedCount > 0 && (
        <View style={styles.saveSection}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>
                Save Attendance ({unsavedCount})
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    padding: 15,
    paddingTop: 10,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  unsavedIndicator: {
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  unsavedText: {
    color: '#92400e',
    fontSize: 14,
    fontWeight: '600',
  },
  studentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 180,
  },
  studentInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  photoContainer: {
    marginBottom: 20,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  photoPlaceholderText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  studentName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  rollNumber: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  classSection: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
    textAlign: 'center',
  },
  statusTextAbsent: {
    color: '#ef4444',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 80,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  presentButton: {
    backgroundColor: '#10b981',
  },
  absentButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
  },
  saveSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  holidayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  holidayIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  holidayTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  holidayName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 10,
    textAlign: 'center',
  },
  holidayReason: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 15,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  holidayDate: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 20,
  },
  holidayMessage: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 10,
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tableContent: {
    paddingBottom: 100,
  },
  tableEditHint: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#d1d5db',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  tableRowEven: {
    backgroundColor: '#f9fafb',
  },
  tableCell: {
    fontSize: 14,
    color: '#374151',
  },
  tableCellSub: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  tableCol1: {
    flex: 2,
    paddingRight: 8,
  },
  tableCol2: {
    flex: 1,
    paddingRight: 8,
  },
  tableCol3: {
    flex: 1,
  },
  statusPresent: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: 14,
  },
  statusAbsent: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
  },
  statusUnmarked: {
    color: '#9ca3af',
    fontSize: 14,
  },
});

export default BoardingAttendanceScreen;
