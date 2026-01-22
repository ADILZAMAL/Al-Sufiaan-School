import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
// @ts-ignore - react-native-deck-swiper types may not be available until npm install
import Deck from 'react-native-deck-swiper';
import { attendanceApi } from '../api/attendance';
import { Student, AttendanceStatus, BulkAttendanceRequest } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';
import SwipeableStudentCard from '../components/SwipeableStudentCard';
import DatePicker from '../components/DatePicker';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AttendanceScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params as RootStackParamList['Attendance'];
  const { classId, sectionId } = params || {};

  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceState, setAttendanceState] = useState<Map<number, AttendanceStatus>>(new Map());
  const [baselineAttendanceState, setBaselineAttendanceState] = useState<Map<number, AttendanceStatus>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentIndex, setCurrentIndex] = useState(0);
  const swipeRef = useRef<Deck<any>>(null);

  useEffect(() => {
    loadStudentsWithAttendance();
  }, [classId, sectionId, selectedDate]);

  const loadStudentsWithAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const dateString = formatDate(selectedDate);
      const data = await attendanceApi.getStudentsWithAttendance(classId, sectionId, dateString);
      setStudents(data);

      // Initialize attendance state from loaded data
      const state = new Map<number, AttendanceStatus>();
      data.forEach((student) => {
        if (student.attendance?.status) {
          state.set(student.id, student.attendance.status);
        }
      });
      setAttendanceState(state);
      // Set baseline to track what was loaded from API (saved state)
      setBaselineAttendanceState(new Map(state));
      setCurrentIndex(0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load students');
      console.error('Error loading students:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const calculateUnsavedCount = (): number => {
    let count = 0;
    
    // Check for changes in existing baseline entries
    baselineAttendanceState.forEach((baselineStatus, studentId) => {
      const currentStatus = attendanceState.get(studentId);
      if (currentStatus !== baselineStatus) {
        count++;
      }
    });
    
    // Check for new entries not in baseline
    attendanceState.forEach((currentStatus, studentId) => {
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

  const onSwipedRight = (index: number) => {
    const student = students[index];
    if (student) {
      handleMarkAttendance(student.id, AttendanceStatus.PRESENT);
    }
    setCurrentIndex(index + 1);
  };

  const onSwipedLeft = (index: number) => {
    const student = students[index];
    if (student) {
      handleMarkAttendance(student.id, AttendanceStatus.ABSENT);
    }
    setCurrentIndex(index + 1);
  };

  const handlePresentButton = () => {
    if (currentIndex < students.length && swipeRef.current) {
      const student = students[currentIndex];
      handleMarkAttendance(student.id, AttendanceStatus.PRESENT);
      swipeRef.current.swipeRight();
    }
  };

  const handleAbsentButton = () => {
    if (currentIndex < students.length && swipeRef.current) {
      const student = students[currentIndex];
      handleMarkAttendance(student.id, AttendanceStatus.ABSENT);
      swipeRef.current.swipeLeft();
    }
  };

  const handleSave = async () => {
    const unsavedChanges = calculateUnsavedCount();
    if (unsavedChanges === 0) {
      Alert.alert('No Changes', 'No changes to save.');
      return;
    }

    setSaving(true);
    try {
      const dateString = formatDate(selectedDate);
      const attendances: BulkAttendanceRequest['attendances'] = Array.from(attendanceState.entries()).map(
        ([studentId, status]) => ({
          studentId,
          status,
          remarks: null,
        })
      );

      const requestData: BulkAttendanceRequest = {
        date: dateString,
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
              // Reload to show updated attendance
              loadStudentsWithAttendance();
            },
          },
        ]);
      }

      // Update baseline to match current state after successful save
      setBaselineAttendanceState(new Map(attendanceState));
    } catch (err: any) {
      Alert.alert(
        'Save Failed',
        err.response?.data?.message || err.message || 'Failed to save attendance. Please try again.'
      );
      console.error('Error saving attendance:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDateChange = (date: Date) => {
    // Check if there are unsaved changes
    const unsavedChanges = calculateUnsavedCount();
    if (unsavedChanges > 0) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to discard them and switch date?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setAttendanceState(new Map());
              setBaselineAttendanceState(new Map());
              setSelectedDate(date);
            },
          },
        ]
      );
    } else {
      setSelectedDate(date);
    }
  };

  const unsavedCount = calculateUnsavedCount();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDateOnly = new Date(selectedDate);
  selectedDateOnly.setHours(0, 0, 0, 0);
  const isToday = selectedDateOnly.getTime() === today.getTime();
  const isFuture = selectedDateOnly > today;
  const remainingCount = students.length - currentIndex;
  const allMarked = currentIndex >= students.length;

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadStudentsWithAttendance} />;
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        {/* Date Picker */}
        <View style={styles.dateSection}>
          <Text style={styles.sectionLabel}>Select Date</Text>
          <DatePicker
            date={selectedDate}
            onDateChange={handleDateChange}
            maximumDate={today}
          />
          {isFuture && (
            <Text style={styles.warningText}>Cannot mark attendance for future dates</Text>
          )}
        </View>

        {/* Progress Indicator */}
        {students.length > 0 && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {allMarked ? 'All students marked' : `${currentIndex + 1} of ${students.length}`}
            </Text>
          </View>
        )}

        {/* Unsaved Changes Indicator */}
        {unsavedCount > 0 && (
          <View style={styles.unsavedIndicator}>
            <Text style={styles.unsavedText}>
              {unsavedCount} unsaved change{unsavedCount !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Swipeable Cards */}
      {students.length > 0 ? (
        <View style={styles.deckContainer}>
          <Deck
            ref={swipeRef}
            cards={students}
            renderCard={(student: Student) => {
              if (!student) return null;
              const status = attendanceState.get(student.id) || student.attendance?.status || null;
              return <SwipeableStudentCard student={student} status={status} />;
            }}
            onSwipedRight={onSwipedRight}
            onSwipedLeft={onSwipedLeft}
            cardIndex={currentIndex}
            stackSize={3}
            stackSeparation={15}
            animateCardOpacity
            animateOverlayLabelsOpacity
            disableTopSwipe
            disableBottomSwipe
            backgroundColor="transparent"
            cardVerticalMargin={0}
            marginTop={20}
            marginBottom={80}
          />
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No students found</Text>
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
      {unsavedCount > 0 && !isFuture && (
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
  dateSection: {
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 10,
  },
  warningText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 5,
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
  deckContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: 40,
    paddingHorizontal: 20,
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
});

export default AttendanceScreen;
