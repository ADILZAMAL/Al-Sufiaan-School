import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Linking,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../context/AuthContext';
import { academicApi } from '../api/academics';
import { AcademicChapter } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

type Nav = StackNavigationProp<RootStackParamList, 'MarksChapterSelection'>;
type Route = RouteProp<RootStackParamList, 'MarksChapterSelection'>;

const MarksChapterSelectionScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { subjectId, subjectName, sectionId, sessionId, classId, sectionName } = route.params;
  const { logout } = useAuth();

  const [chapters, setChapters] = useState<AcademicChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [pdfLoadingId, setPdfLoadingId] = useState<number | null>(null);

  useEffect(() => { loadChapters(); }, []);

  const loadChapters = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await academicApi.getChapters(subjectId);
      setChapters(data);
    } catch (err: any) {
      if (err.response?.status === 401) { await logout(); return; }
      setError(err.response?.data?.message || 'Failed to load chapters');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkTaught = (chapter: AcademicChapter) => {
    if (chapter.isTaught) {
      Alert.alert(
        'Mark as Not Taught?',
        `Remove taught status from "${chapter.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', style: 'destructive', onPress: () => toggleTaught(chapter, false) },
        ]
      );
    } else {
      Alert.alert(
        'Mark as Taught',
        `Mark "${chapter.name}" as taught today?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Mark Taught', onPress: () => toggleTaught(chapter, true) },
        ]
      );
    }
  };

  const handlePDFPress = async (chapter: AcademicChapter) => {
    if (chapter.pdfUrl) {
      Linking.openURL(chapter.pdfUrl);
    } else {
      try {
        const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
        if (result.canceled || !result.assets?.[0]) return;
        const asset = result.assets[0];
        setPdfLoadingId(chapter.id);
        const pdfUrl = await academicApi.uploadChapterPDF(chapter.id, asset.uri, asset.name);
        setChapters(prev => prev.map(c => c.id === chapter.id ? { ...c, pdfUrl } : c));
      } catch (err: any) {
        Alert.alert('Error', err.response?.data?.message || 'Failed to upload PDF');
      } finally {
        setPdfLoadingId(null);
      }
    }
  };

  const handlePDFDelete = (chapter: AcademicChapter) => {
    Alert.alert(
      'Delete PDF',
      `Remove PDF from "${chapter.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              setPdfLoadingId(chapter.id);
              await academicApi.deleteChapterPDF(chapter.id);
              setChapters(prev => prev.map(c => c.id === chapter.id ? { ...c, pdfUrl: null } : c));
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete PDF');
            } finally {
              setPdfLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const toggleTaught = async (chapter: AcademicChapter, isTaught: boolean) => {
    try {
      setMarkingId(chapter.id);
      const today = new Date().toISOString().split('T')[0];
      await academicApi.markChapterTaught(chapter.id, isTaught, isTaught ? today : undefined);
      setChapters(prev => prev.map(c =>
        c.id === chapter.id ? { ...c, isTaught, taughtOn: isTaught ? today : null } : c
      ));
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update chapter status');
    } finally {
      setMarkingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadChapters} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={chapters}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <TouchableOpacity
              style={styles.itemLeft}
              onPress={() => navigation.navigate('MarksExamSelection', {
                chapterId: item.id,
                chapterName: item.name,
                subjectName,
                classId,
                sectionId,
              })}
            >
              <View style={styles.orderBadge}>
                <Text style={styles.orderText}>{item.orderNumber}</Text>
              </View>
              <View style={styles.chapterInfo}>
                <Text style={styles.chapterName}>{item.name}</Text>
                {item.isTaught && item.taughtOn && (
                  <Text style={styles.taughtDate}>
                    Taught on {new Date(item.taughtOn).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short',
                    })}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pdfButton, item.pdfUrl ? styles.pdfButtonActive : styles.pdfButtonEmpty]}
              onPress={() => handlePDFPress(item)}
              onLongPress={() => item.pdfUrl && handlePDFDelete(item)}
              disabled={pdfLoadingId === item.id}
            >
              <Text style={[styles.pdfButtonText, item.pdfUrl ? styles.pdfButtonTextActive : styles.pdfButtonTextEmpty]}>
                {pdfLoadingId === item.id ? '...' : item.pdfUrl ? 'PDF' : '+ PDF'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.badge, item.isTaught ? styles.badgeTaught : styles.badgeNotTaught]}
              onPress={() => handleMarkTaught(item)}
              disabled={markingId === item.id}
            >
              <Text style={[styles.badgeText, item.isTaught ? styles.badgeTextTaught : styles.badgeTextNotTaught]}>
                {markingId === item.id ? '...' : item.isTaught ? '✓ Taught' : 'Not Taught'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No chapters found for this subject.</Text>
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
    backgroundColor: '#fff', padding: 16, marginBottom: 10, borderRadius: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },
  itemLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  orderBadge: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#eff6ff',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  orderText: { fontSize: 13, fontWeight: '700', color: '#3b82f6' },
  chapterInfo: { flex: 1 },
  chapterName: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  taughtDate: { fontSize: 12, color: '#10b981', marginTop: 2 },
  pdfButton: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginRight: 6 },
  pdfButtonActive: { backgroundColor: '#dbeafe' },
  pdfButtonEmpty: { backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#d1d5db' },
  pdfButtonText: { fontSize: 12, fontWeight: '600' },
  pdfButtonTextActive: { color: '#2563eb' },
  pdfButtonTextEmpty: { color: '#9ca3af' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeTaught: { backgroundColor: '#dcfce7' },
  badgeNotTaught: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeTextTaught: { color: '#16a34a' },
  badgeTextNotTaught: { color: '#dc2626' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#6b7280' },
});

export default MarksChapterSelectionScreen;
