import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Student, AttendanceStatus } from '../types';

interface StudentCardProps {
  student: Student;
  status: AttendanceStatus | null;
  onToggle: (studentId: number, status: AttendanceStatus) => void;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, status, onToggle }) => {
  const isPresent = status === AttendanceStatus.PRESENT;
  const isAbsent = status === AttendanceStatus.ABSENT;

  const handleToggle = () => {
    const newStatus = isPresent ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT;
    onToggle(student.id, newStatus);
  };

  return (
    <View style={[styles.card, isPresent && styles.cardPresent, isAbsent && styles.cardAbsent]}>
      <View style={styles.studentInfo}>
        {student.studentPhoto ? (
          <Image source={{ uri: student.studentPhoto }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderText}>
              {student.firstName.charAt(0)}{student.lastName.charAt(0)}
            </Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name}>
            {student.firstName} {student.lastName}
          </Text>
          {student.rollNumber && (
            <Text style={styles.rollNumber}>Roll: {student.rollNumber}</Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.statusButton,
          isPresent && styles.statusButtonPresent,
          isAbsent && styles.statusButtonAbsent,
        ]}
        onPress={handleToggle}
      >
        <Text style={styles.statusButtonText}>
          {isPresent ? '✓ Present' : isAbsent ? '✗ Absent' : 'Mark'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  photo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  photoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3b82f6',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  rollNumber: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
  },
  statusButtonPresent: {
    backgroundColor: '#10b981',
  },
  statusButtonAbsent: {
    backgroundColor: '#ef4444',
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default StudentCard;
