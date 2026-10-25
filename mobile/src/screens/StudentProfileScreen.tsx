import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useRootNavigation } from '../navigation/types';
import { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { studentApi } from '../api/student';
import { photoUploadApi } from '../api/photoUpload';
import { StudentDetail, StudentUpdatePayload, StudentEnrollment } from '../types';
import { RootStackParamList } from '../navigation/types';
import { LoadingState, ErrorState, Card, ListRow } from '../components/ui';
import DatePicker from '../components/DatePicker';
import { makeStyles, useTheme } from '../theme';

type StudentProfileScreenRouteProp = RouteProp<RootStackParamList, 'StudentProfile'>;

// ─── Constants ───────────────────────────────────────────────────────────────

const GENDER_OPTIONS = ['MALE', 'FEMALE', 'OTHER'];
const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'NA'];
const RELIGION_OPTIONS = ['Islam', 'Hinduism', 'Christianity', 'Sikhism', 'Buddhism', 'Jainism', 'Other'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const initForm = (s: StudentDetail): StudentUpdatePayload => ({
  firstName: s.firstName ?? '',
  lastName: s.lastName ?? '',
  dateOfBirth: s.dateOfBirth ? s.dateOfBirth.split('T')[0] : '',
  gender: s.gender,
  bloodGroup: s.bloodGroup,
  religion: s.religion,
  phone: s.phone ?? '',
  email: s.email ?? '',
  address: s.address ?? '',
  fatherName: s.fatherName ?? '',
  fatherPhone: s.fatherPhone ?? '',
  motherName: s.motherName ?? '',
  motherPhone: s.motherPhone ?? '',
  guardianName: s.guardianName ?? '',
  guardianRelation: s.guardianRelation ?? '',
  guardianPhone: s.guardianPhone ?? '',
  studentPhoto: s.studentPhoto,
});

const getActiveEnrollment = (s: StudentDetail): StudentEnrollment | null =>
  s.enrollments.find(e => e.session?.isActive) ?? s.enrollments[0] ?? null;

// ─── Sub-components ──────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ title: string }> = ({ title }) => {
  const styles = useStyles();
  return (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionHeaderText}>{title}</Text>
  </View>
  );
};

interface FieldProps {
  label: string;
  value: string | null | undefined;
  editable: boolean;
  onChangeText?: (text: string) => void;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  multiline?: boolean;
  isLast?: boolean;
  placeholder?: string;
}

const Field: React.FC<FieldProps> = ({
  label, value, editable, onChangeText,
  keyboardType = 'default', multiline = false, isLast = false, placeholder,
}) => {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
  <View style={[styles.fieldRow, !isLast && styles.fieldRowBorder]}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {editable ? (
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
        value={value ?? ''}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholder={placeholder ?? `Enter ${label.toLowerCase()}`}
        placeholderTextColor={colors.textSubtle}
        autoCorrect={false}
      />
    ) : (
      <Text style={styles.fieldValue}>{value || '—'}</Text>
    )}
  </View>
  );
};

interface PillSelectorProps {
  label: string;
  options: string[];
  value: string;
  editable: boolean;
  onSelect: (val: string) => void;
  isLast?: boolean;
}

const PillSelector: React.FC<PillSelectorProps> = ({ label, options, value, editable, onSelect, isLast = false }) => {
  const styles = useStyles();
  return (
  <View style={[styles.pillFieldRow, !isLast && styles.fieldRowBorder]}>
    <Text style={[styles.fieldLabel, styles.pillLabel]}>{label}</Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.pillRow}
    >
      {options.map(opt => (
        <TouchableOpacity
          key={opt}
          style={[styles.pill, value === opt && styles.pillActive]}
          onPress={() => editable && onSelect(opt)}
          activeOpacity={editable ? 0.7 : 1}
        >
          <Text style={[styles.pillText, value === opt && styles.pillTextActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

const StudentProfileScreen: React.FC = () => {
  const styles = useStyles();
  const { colors } = useTheme();
  const route = useRoute<StudentProfileScreenRouteProp>();
  const { studentId } = route.params;
  const navigation = useRootNavigation();

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form, setForm] = useState<StudentUpdatePayload>({});
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [rollNumber, setRollNumber] = useState('');

  const activeEnrollment = useMemo(
    () => (student ? getActiveEnrollment(student) : null),
    [student],
  );

  useEffect(() => {
    loadStudent();
  }, [studentId]);

  const loadStudent = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studentApi.getById(studentId);
      setStudent(data);
      setForm(initForm(data));
      setRollNumber(getActiveEnrollment(data)?.rollNumber ?? '');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load student');
    } finally {
      setLoading(false);
    }
  };

  const updateForm = <K extends keyof StudentUpdatePayload>(key: K, value: StudentUpdatePayload[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // ── Photo handlers ────────────────────────────────────────────────────────

  const handlePhotoPress = () => {
    if (!isEditMode) return;
    Alert.alert('Change Student Photo', '', [
      { text: 'Take Photo', onPress: launchCamera },
      { text: 'Choose from Library', onPress: launchLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const launchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setPendingPhotoUri(result.assets[0].uri);
  };

  const launchLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library permission is needed.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setPendingPhotoUri(result.assets[0].uri);
  };

  // ── Save / Cancel ─────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!student || !activeEnrollment) return;

    try {
      setSaving(true);
      let photoUrl = form.studentPhoto ?? null;

      // 1. Upload photo if a new one was picked
      if (pendingPhotoUri) {
        setUploadingPhoto(true);
        try {
          photoUrl = await photoUploadApi.uploadStudentPhoto(pendingPhotoUri);
        } finally {
          setUploadingPhoto(false);
        }
      }

      // 2. Update student fields — convert empty strings to null for optional fields
      const OPTIONAL_NULLABLE = ['email', 'fatherPhone', 'motherPhone', 'guardianName', 'guardianRelation', 'guardianPhone'] as const;
      const payload = { ...form, studentPhoto: photoUrl };
      for (const field of OPTIONAL_NULLABLE) {
        if (payload[field] === '') payload[field] = null;
      }
      await studentApi.update(student.id, payload);

      // 3. Update roll number only if changed
      const originalRoll = activeEnrollment.rollNumber ?? '';
      if (rollNumber !== originalRoll) {
        await studentApi.updateEnrollment(activeEnrollment.id, rollNumber || null);
      }

      // 4. Refetch and reset state
      const updated = await studentApi.getById(student.id);
      setStudent(updated);
      setForm(initForm(updated));
      setRollNumber(getActiveEnrollment(updated)?.rollNumber ?? '');
      setPendingPhotoUri(null);
      setIsEditMode(false);
      Alert.alert('Saved', 'Student profile updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!student) return;
    setForm(initForm(student));
    setRollNumber(activeEnrollment?.rollNumber ?? '');
    setPendingPhotoUri(null);
    setIsEditMode(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return <LoadingState />;
  if (error || !student) return <ErrorState message={error ?? 'Student not found'} onRetry={loadStudent} />;

  const photoUri = pendingPhotoUri ?? student.studentPhoto;
  const initials = `${student.firstName[0] ?? ''}${student.lastName[0] ?? ''}`.toUpperCase();

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Photo ── */}
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={handlePhotoPress} activeOpacity={isEditMode ? 0.75 : 1}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.initialsCircle]}>
                <Text style={styles.initialsText}>{initials}</Text>
              </View>
            )}
            {isEditMode && (
              <View style={styles.photoEditBadge}>
                <Text style={styles.photoEditIcon}>✏️</Text>
              </View>
            )}
          </TouchableOpacity>
          {isEditMode && <Text style={styles.photoHint}>Tap to change photo</Text>}
        </View>

        {/* ── Read-only banner ── */}
        <View style={styles.banner}>
          <View style={styles.bannerItem}>
            <Text style={styles.bannerLabel}>Adm No</Text>
            <Text style={styles.bannerValue}>{student.admissionNumber}</Text>
          </View>
          <View style={styles.bannerDivider} />
          <View style={styles.bannerItem}>
            <Text style={styles.bannerLabel}>Class</Text>
            <Text style={styles.bannerValue}>{activeEnrollment?.class?.name ?? '—'}</Text>
          </View>
          <View style={styles.bannerDivider} />
          <View style={styles.bannerItem}>
            <Text style={styles.bannerLabel}>Section</Text>
            <Text style={styles.bannerValue}>{activeEnrollment?.section?.name ?? '—'}</Text>
          </View>
        </View>

        {/* ── Quick links ── */}
        {!isEditMode && (
          <Card padded={false} style={styles.links}>
            <ListRow
              icon="calendar-outline"
              title="Attendance"
              subtitle="Calendar, absences & percentage"
              onPress={() => navigation.navigate('StudentAttendance', { studentId, studentName: `${student.firstName} ${student.lastName}`.trim() })}
            />
            <ListRow
              icon="trending-up-outline"
              title="Performance"
              subtitle="Class tests & exam results this session"
              onPress={() => navigation.navigate('StudentPerformance', { studentId, studentName: `${student.firstName} ${student.lastName}`.trim() })}
            />
          </Card>
        )}

        {/* ── Roll Number ── */}
        <View style={styles.rollRow}>
          <Text style={styles.rollLabel}>Roll No</Text>
          {isEditMode ? (
            <TextInput
              style={styles.rollInput}
              value={rollNumber}
              onChangeText={setRollNumber}
              keyboardType="numeric"
              placeholder="Roll number"
              placeholderTextColor={colors.textSubtle}
            />
          ) : (
            <Text style={styles.rollValue}>{rollNumber || '—'}</Text>
          )}
        </View>

        {/* ── Action buttons ── */}
        {isEditMode ? (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <Text style={styles.saveButtonText}>
                  {uploadingPhoto ? 'Uploading…' : 'Save'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditMode(true)}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}

        {/* ── Personal ── */}
        <SectionHeader title="Personal" />
        <View style={styles.card}>
          <Field label="First Name" value={form.firstName} editable={isEditMode} onChangeText={v => updateForm('firstName', v)} />
          <Field label="Last Name" value={form.lastName} editable={isEditMode} onChangeText={v => updateForm('lastName', v)} />
          <View style={[styles.fieldRow, styles.fieldRowBorder]}>
            <Text style={styles.fieldLabel}>Date of Birth</Text>
            {isEditMode ? (
              <DatePicker
                date={form.dateOfBirth ? new Date(form.dateOfBirth) : new Date()}
                onDateChange={date => {
                  const yyyy = date.getFullYear();
                  const mm = String(date.getMonth() + 1).padStart(2, '0');
                  const dd = String(date.getDate()).padStart(2, '0');
                  updateForm('dateOfBirth', `${yyyy}-${mm}-${dd}`);
                }}
                maximumDate={new Date()}
              />
            ) : (
              <Text style={styles.fieldValue}>{form.dateOfBirth || '—'}</Text>
            )}
          </View>
          <PillSelector label="Gender" options={GENDER_OPTIONS} value={form.gender ?? ''} editable={isEditMode} onSelect={v => updateForm('gender', v as StudentUpdatePayload['gender'])} />
          <PillSelector label="Blood Group" options={BLOOD_GROUP_OPTIONS} value={form.bloodGroup ?? ''} editable={isEditMode} onSelect={v => updateForm('bloodGroup', v as StudentUpdatePayload['bloodGroup'])} />
          <PillSelector label="Religion" options={RELIGION_OPTIONS} value={form.religion ?? ''} editable={isEditMode} onSelect={v => updateForm('religion', v as StudentUpdatePayload['religion'])} isLast />
        </View>

        {/* ── Contact ── */}
        <SectionHeader title="Contact" />
        <View style={styles.card}>
          <Field label="Phone" value={form.phone} editable={isEditMode} onChangeText={v => updateForm('phone', v)} keyboardType="phone-pad" />
          <Field label="Email" value={form.email} editable={isEditMode} onChangeText={v => updateForm('email', v)} keyboardType="email-address" />
          <Field label="Address" value={form.address} editable={isEditMode} onChangeText={v => updateForm('address', v)} multiline isLast />
        </View>

        {/* ── Family ── */}
        <SectionHeader title="Family" />
        <View style={styles.card}>
          <Field label="Father Name" value={form.fatherName} editable={isEditMode} onChangeText={v => updateForm('fatherName', v)} />
          <Field label="Father Phone" value={form.fatherPhone} editable={isEditMode} onChangeText={v => updateForm('fatherPhone', v)} keyboardType="phone-pad" />
          <Field label="Mother Name" value={form.motherName} editable={isEditMode} onChangeText={v => updateForm('motherName', v)} />
          <Field label="Mother Phone" value={form.motherPhone} editable={isEditMode} onChangeText={v => updateForm('motherPhone', v)} keyboardType="phone-pad" />
          <Field label="Guardian Name" value={form.guardianName} editable={isEditMode} onChangeText={v => updateForm('guardianName', v)} />
          <Field label="Guardian Relation" value={form.guardianRelation} editable={isEditMode} onChangeText={v => updateForm('guardianRelation', v)} />
          <Field label="Guardian Phone" value={form.guardianPhone} editable={isEditMode} onChangeText={v => updateForm('guardianPhone', v)} keyboardType="phone-pad" isLast />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = makeStyles(({ colors }) => ({
  keyboardView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },

  // Photo
  photoSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  photo: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.border,
  },
  initialsCircle: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: colors.onPrimary,
    fontSize: 36,
    fontWeight: '700',
  },
  photoEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  photoEditIcon: {
    fontSize: 14,
  },
  photoHint: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textMuted,
  },

  // Read-only banner
  banner: {
    flexDirection: 'row',
    backgroundColor: colors.primarySoft,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  bannerItem: {
    flex: 1,
    alignItems: 'center',
  },
  bannerLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bannerValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  bannerDivider: {
    width: 1,
    backgroundColor: colors.border,
  },

  // Roll Number
  rollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  rollLabel: {
    width: 110,
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  rollInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 2,
  },
  rollValue: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },

  // Action buttons
  editButton: {
    alignSelf: 'center',
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 40,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  editButtonText: {
    color: colors.onPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 14,
    marginHorizontal: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.onPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
  buttonDisabled: {
    backgroundColor: colors.primarySoft,
  },

  // Section header
  sectionHeader: {
    marginTop: 20,
    marginBottom: 6,
    marginHorizontal: 16,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: 10,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  // Field row
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  fieldRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  fieldLabel: {
    width: 110,
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
    flexShrink: 0,
  },
  fieldValue: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 2,
  },
  fieldInputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },

  // Pill selector
  pillFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  pillLabel: {
    marginBottom: 0,
  },
  pillRow: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.background,
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  pillTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },

  bottomSpacer: {
    height: 40,
  },
  links: {
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
}));

export default StudentProfileScreen;
