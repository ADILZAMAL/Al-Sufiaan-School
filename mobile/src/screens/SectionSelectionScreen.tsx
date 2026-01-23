import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp, RouteProp } from '@react-navigation/stack';
import { sectionsApi } from '../api/sections';
import { Section } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useAuth } from '../context/AuthContext';

type SectionSelectionScreenRouteProp = RouteProp<RootStackParamList, 'SectionSelection'>;
type SectionSelectionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SectionSelection'>;

const SectionSelectionScreen: React.FC = () => {
  const route = useRoute<SectionSelectionScreenRouteProp>();
  const navigation = useNavigation<SectionSelectionScreenNavigationProp>();
  const { classId, className } = route.params;
  const { logout } = useAuth();

  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSections();
  }, [classId]);

  const loadSections = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sectionsApi.getSectionsByClass(classId);
      setSections(data);
    } catch (err: any) {
      // Check if error is unauthorized (401)
      if (err.response?.status === 401) {
        // Logout and redirect to login (AppNavigator will handle navigation)
        await logout();
        return;
      }
      setError(err.response?.data?.message || 'Failed to load sections');
      console.error('Error loading sections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionSelect = (section: Section) => {
    navigation.navigate('Attendance', {
      classId,
      sectionId: section.id,
      className,
      sectionName: section.name,
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadSections} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sections}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.sectionItem}
            onPress={() => handleSectionSelect(item)}
          >
            <Text style={styles.sectionName}>{item.name}</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No sections found</Text>
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
  sectionItem: {
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
  sectionName: {
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
});

export default SectionSelectionScreen;
