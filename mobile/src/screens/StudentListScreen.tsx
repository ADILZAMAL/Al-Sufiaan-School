import React, { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { RootStackParamList, useRootNavigation } from '../navigation/types';
import { studentApi } from '../api/student';
import { queryKeys } from '../lib/queryKeys';
import { getErrorMessage } from '../lib/errors';
import { fullName, sortByRoll } from '../lib/rollNumber';
import { usePullToRefresh, useRefetchOnFocus } from '../hooks/useRefresh';
import { Avatar, EmptyState, ErrorState, ListRow, SkeletonList, TextField } from '../components/ui';
import { makeStyles } from '../theme';

const StudentListScreen: React.FC = () => {
  const styles = useStyles();
  const navigation = useRootNavigation();
  const { classId, sectionId } = useRoute<RouteProp<RootStackParamList, 'StudentList'>>().params;
  const [search, setSearch] = useState('');

  const query = useQuery({
    queryKey: queryKeys.sectionStudents(classId, sectionId),
    queryFn: () => studentApi.getBySection(classId, sectionId),
    select: sortByRoll,
    meta: { persist: true },
  });
  const { refreshing, onRefresh } = usePullToRefresh(query.refetch);
  // Pick up name/photo/roll edits made on the profile screen
  useRefetchOnFocus(query.refetch);

  const students = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return query.data ?? [];
    return (query.data ?? []).filter(s => fullName(s).toLowerCase().includes(q) || s.rollNumber?.toLowerCase() === q);
  }, [query.data, search]);

  if (query.isPending) return <SkeletonList />;
  if (query.isError && !query.data) {
    return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} retrying={query.isFetching} />;
  }

  return (
    <FlatList
      style={styles.root}
      data={students}
      keyExtractor={s => String(s.id)}
      refreshing={refreshing}
      onRefresh={onRefresh}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.header}>
          <TextField
            icon="search"
            placeholder="Search by name or roll number"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
          <Text style={styles.count}>
            {students.length} {students.length === 1 ? 'student' : 'students'}
          </Text>
        </View>
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        <EmptyState
          icon={search ? 'search-outline' : 'people-outline'}
          title={search ? 'No matches' : 'No students'}
          message={search ? `Nobody matches "${search}".` : 'No active students are enrolled in this section.'}
        />
      }
      renderItem={({ item }) => (
        <ListRow
          left={<Avatar firstName={item.firstName} lastName={item.lastName} photo={item.studentPhoto} />}
          title={fullName(item)}
          subtitle={item.rollNumber ? `Roll ${item.rollNumber}` : 'No roll number'}
          onPress={() => navigation.navigate('StudentProfile', { studentId: item.id, studentName: fullName(item) })}
        />
      )}
    />
  );
};

const useStyles = makeStyles(({ colors, spacing, typography }) => ({
  root: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.xxl, flexGrow: 1 },
  header: { padding: spacing.lg, gap: spacing.sm },
  count: { ...typography.caption, color: colors.textMuted },
  separator: { height: 1, backgroundColor: colors.divider, marginLeft: spacing.lg + 40 + spacing.md },
}));

export default StudentListScreen;
