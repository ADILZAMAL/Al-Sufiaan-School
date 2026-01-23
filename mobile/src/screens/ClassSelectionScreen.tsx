import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { classesApi } from '../api/classes';
import { holidayApi } from '../api/holiday';
import { Class, Holiday } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

type ClassSelectionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ClassSelection'>;

const ClassSelectionScreen: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHoliday, setIsHoliday] = useState(false);
  const [holiday, setHoliday] = useState<Holiday | null>(null);
  const { user, logout } = useAuth();
  const navigation = useNavigation<ClassSelectionScreenNavigationProp>();

  useEffect(() => {
    checkHolidayAndLoadClasses();
  }, []);

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const checkHolidayAndLoadClasses = async () => {
    if (!user?.schoolId) {
      setError('School ID not found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Check if today is a holiday
      const today = new Date();
      const todayString = formatDate(today);
      const holidayCheck = await holidayApi.checkIsHoliday(todayString);
      
      if (holidayCheck.isHoliday && holidayCheck.holiday) {
        setIsHoliday(true);
        setHoliday(holidayCheck.holiday);
        setLoading(false);
        return;
      }

      // If not a holiday, load classes
      setIsHoliday(false);
      setHoliday(null);
      const data = await classesApi.getClasses(user.schoolId);
      setClasses(data);
    } catch (err: any) {
      // Check if error is unauthorized (401)
      if (err.response?.status === 401) {
        // Logout and redirect to login (AppNavigator will handle navigation)
        await logout();
        return;
      }
      setError(err.response?.data?.message || 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };


  const handleClassSelect = (classItem: Class) => {
    navigation.navigate('SectionSelection', {
      classId: classItem.id,
      className: classItem.name,
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={checkHolidayAndLoadClasses} />;
  }

  // Show holiday message if today is a holiday
  if (isHoliday && holiday) {
    return (
      <View style={styles.container}>
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
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={classes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.classItem}
            onPress={() => handleClassSelect(item)}
          >
            <Text style={styles.className}>{item.name}</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No classes found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  list: {
    padding: 15,
  },
  classItem: {
    backgroundColor: '#fff',
    padding: 20,
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
  },
  className: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  arrow: {
    fontSize: 24,
    color: '#3b82f6',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
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
  },
});

export default ClassSelectionScreen;
