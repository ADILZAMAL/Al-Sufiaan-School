import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Student, AttendanceStatus } from '../types';

interface SwipeableStudentCardProps {
  student: Student;
  status: AttendanceStatus | null;
}

const SwipeableStudentCard: React.FC<SwipeableStudentCardProps> = ({ student, status }) => {
  const isPresent = status === AttendanceStatus.PRESENT;
  const isAbsent = status === AttendanceStatus.ABSENT;
  const daysAbsent = student.daysAbsentSinceLastPresent;

  return (
    <View style={[styles.card, isPresent && styles.cardPresent, isAbsent && styles.cardAbsent]}>
      {/* Student Photo */}
      <View style={styles.photoContainer}>
        {student.studentPhoto ? (
          <Image source={{ uri: student.studentPhoto }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderText}>
              {student.firstName.charAt(0)}{student.lastName.charAt(0)}
            </Text>
          </View>
        )}
      </View>

      {/* Student Name */}
      <Text style={styles.name}>
        {student.firstName} {student.lastName}
      </Text>

      {/* Roll Number */}
      {student.rollNumber && (
        <Text style={styles.rollNumber}>Roll No: {student.rollNumber}</Text>
      )}

      {/* Class and Section */}
      <View style={styles.classSectionContainer}>
        <Text style={styles.classSectionText}>
          {student.class?.name} - {student.section?.name}
        </Text>
      </View>

      {/* Days Absent Indicator */}
      {daysAbsent !== null && daysAbsent !== undefined && daysAbsent > 0 && (
        <View style={styles.absentBadge}>
          <Text style={styles.absentBadgeText}>
            Absent for {daysAbsent} {daysAbsent === 1 ? 'day' : 'days'}
          </Text>
        </View>
      )}

      {/* Status Indicator */}
      {isPresent && (
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>✓ Present</Text>
        </View>
      )}
      {isAbsent && (
        <View style={[styles.statusBadge, styles.statusBadgeAbsent]}>
          <Text style={styles.statusBadgeText}>✗ Absent</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    width: '85%',
    minHeight: 400,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardPresent: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  cardAbsent: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  photoContainer: {
    marginBottom: 20,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#e5e7eb',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#e5e7eb',
  },
  photoPlaceholderText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  name: {
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
  classSectionContainer: {
    marginBottom: 20,
  },
  classSectionText: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
  },
  absentBadge: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  absentBadgeText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusBadge: {
    marginTop: 20,
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  statusBadgeAbsent: {
    backgroundColor: '#ef4444',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SwipeableStudentCard;
