import React, { useState } from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, FlatList, Linking, Platform, Pressable, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { academicApi } from '../../api/academics';
import { AcademicChapter } from '../../types';
import { queryKeys } from '../../lib/queryKeys';
import { getErrorMessage } from '../../lib/errors';
import { formatDate, todayISO } from '../../lib/date';
import { haptics, toast } from '../../lib/feedback';
import { usePullToRefresh } from '../../hooks/useRefresh';
import { EmptyState, ErrorState, Icon, SkeletonList } from '../../components/ui';
import { HIT_SIZE, makeStyles, useTheme } from '../../theme';

/** Syllabus for a subject: mark chapters taught and attach chapter PDFs. */
export const ChaptersTab: React.FC<{ subjectId: number; header?: React.ReactElement }> = ({ subjectId, header }) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<number | null>(null);

  const query = useQuery({
    queryKey: queryKeys.chapters(subjectId),
    queryFn: () => academicApi.getChapters(subjectId),
    meta: { persist: true },
  });
  const { refreshing, onRefresh } = usePullToRefresh(query.refetch);

  const patch = (id: number, changes: Partial<AcademicChapter>) =>
    queryClient.setQueryData<AcademicChapter[]>(queryKeys.chapters(subjectId), prev =>
      prev?.map(c => (c.id === id ? { ...c, ...changes } : c))
    );

  const run = async (chapterId: number, action: () => Promise<void>) => {
    setBusyId(chapterId);
    try {
      await action();
    } catch (error) {
      toast.error('Something went wrong', getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const toggleTaught = (chapter: AcademicChapter) => {
    const apply = (isTaught: boolean) =>
      run(chapter.id, async () => {
        const taughtOn = isTaught ? todayISO() : null;
        await academicApi.markChapterTaught(chapter.id, isTaught, taughtOn ?? undefined);
        patch(chapter.id, { isTaught, taughtOn });
        haptics.success();
      });
    if (!chapter.isTaught) return apply(true);
    Alert.alert('Mark as not taught?', `"${chapter.name}" will no longer show as taught.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark not taught', style: 'destructive', onPress: () => apply(false) },
    ]);
  };

  const uploadPdf = (chapter: AcademicChapter) =>
    run(chapter.id, async () => {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const pdfUrl = await academicApi.uploadChapterPDF(chapter.id, asset.uri, asset.name);
      patch(chapter.id, { pdfUrl });
      toast.success('PDF uploaded');
    });

  const removePdf = (chapter: AcademicChapter) =>
    Alert.alert('Remove PDF?', `Remove the PDF from "${chapter.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          run(chapter.id, async () => {
            await academicApi.deleteChapterPDF(chapter.id);
            patch(chapter.id, { pdfUrl: null });
          }),
      },
    ]);

  const pdfActions = (chapter: AcademicChapter) => {
    if (!chapter.pdfUrl) return uploadPdf(chapter);
    const open = () => Linking.openURL(chapter.pdfUrl!).catch(() => toast.error("Couldn't open the PDF"));
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Open PDF', 'Replace PDF', 'Remove PDF', 'Cancel'], destructiveButtonIndex: 2, cancelButtonIndex: 3, title: chapter.name },
        i => [open, () => uploadPdf(chapter), () => removePdf(chapter)][i]?.()
      );
    } else {
      Alert.alert(chapter.name, undefined, [
        { text: 'Open', onPress: open },
        { text: 'Replace', onPress: () => uploadPdf(chapter) },
        { text: 'Remove', style: 'destructive', onPress: () => removePdf(chapter) },
      ], { cancelable: true });
    }
  };

  if (query.isPending) return <SkeletonList />;
  if (query.isError && !query.data) {
    return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} retrying={query.isFetching} />;
  }

  const taught = query.data.filter(c => c.isTaught).length;

  return (
    <FlatList
      style={styles.root}
      data={query.data}
      keyExtractor={c => String(c.id)}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View>
          {header}
          {query.data.length > 0 && (
            <View style={styles.progressWrap}>
              <Text style={styles.progressText}>
                {taught} of {query.data.length} chapters taught
              </Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${(taught / query.data.length) * 100}%` }]} />
              </View>
            </View>
          )}
        </View>
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={<EmptyState icon="list-outline" title="No chapters yet" message="The school office adds chapters for each subject." />}
      renderItem={({ item }) => {
        const busy = busyId === item.id;
        return (
          <View style={styles.row}>
            <View style={styles.order}>
              <Text style={styles.orderText}>{item.orderNumber}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              {item.isTaught && item.taughtOn && <Text style={styles.taughtOn}>Taught {formatDate(item.taughtOn)}</Text>}
            </View>
            {busy ? (
              <ActivityIndicator color={colors.primary} style={styles.busy} />
            ) : (
              <>
                <Pressable
                  onPress={() => pdfActions(item)}
                  accessibilityRole="button"
                  accessibilityLabel={item.pdfUrl ? `${item.name} PDF options` : `Upload PDF for ${item.name}`}
                  style={[styles.action, item.pdfUrl ? styles.actionOn : null]}
                >
                  <Icon name={item.pdfUrl ? 'document-text' : 'cloud-upload-outline'} size={18} color={item.pdfUrl ? colors.primary : colors.textMuted} />
                </Pressable>
                <Pressable
                  onPress={() => toggleTaught(item)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: item.isTaught }}
                  accessibilityLabel={`${item.name} taught`}
                  style={[styles.action, item.isTaught && { backgroundColor: colors.successSoft, borderColor: colors.success }]}
                >
                  <Icon name={item.isTaught ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={item.isTaught ? colors.success : colors.textSubtle} />
                </Pressable>
              </>
            )}
          </View>
        );
      }}
    />
  );
};

const useStyles = makeStyles(({ colors, spacing, typography, radius }) => ({
  root: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.xxl, flexGrow: 1 },
  progressWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.xs },
  progressText: { ...typography.caption, color: colors.textMuted },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: colors.success },
  separator: { height: 1, backgroundColor: colors.divider },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface },
  order: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  orderText: { ...typography.small, color: colors.primaryDark },
  info: { flex: 1 },
  name: { ...typography.bodyStrong, color: colors.text },
  taughtOn: { ...typography.small, color: colors.success, marginTop: 2 },
  action: {
    width: HIT_SIZE - 4,
    height: HIT_SIZE - 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionOn: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  busy: { width: (HIT_SIZE - 4) * 2 + spacing.md },
}));
