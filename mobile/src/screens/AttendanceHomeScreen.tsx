import React from 'react';
import { View } from 'react-native';
import { ListRow, Screen, SectionHeader, Card } from '../components/ui';
import { useRootNavigation } from '../navigation/types';
import { makeStyles } from '../theme';

const AttendanceHomeScreen: React.FC = () => {
  const styles = useStyles();
  const navigation = useRootNavigation();

  return (
    <Screen>
      <SectionHeader title="Mark attendance" />
      <Card padded={false} style={styles.group}>
        <ListRow
          icon="school-outline"
          title="Class attendance"
          subtitle="Pick a class and section"
          onPress={() => navigation.navigate('SectionPicker', { mode: 'attendance' })}
        />
        <View style={styles.divider} />
        <ListRow
          icon="bed-outline"
          title="Hostel"
          subtitle="All hostel students"
          onPress={() => navigation.navigate('BoardingAttendance', { boardingType: 'HOSTEL' })}
        />
        <View style={styles.divider} />
        <ListRow
          icon="sunny-outline"
          title="Dayboarding"
          subtitle="All dayboarding students"
          onPress={() => navigation.navigate('BoardingAttendance', { boardingType: 'DAYBOARDING' })}
        />
      </Card>

      <SectionHeader title="Reports" />
      <Card padded={false} style={styles.group}>
        <ListRow
          icon="calendar-outline"
          title="Attendance history"
          subtitle="Month view, missed days & students with low attendance"
          onPress={() => navigation.navigate('SectionPicker', { mode: 'history' })}
        />
        <View style={styles.divider} />
        <ListRow
          icon="sunny-outline"
          title="Holiday calendar"
          subtitle="School holidays by month"
          onPress={() => navigation.navigate('HolidayCalendar')}
        />
      </Card>
    </Screen>
  );
};

const useStyles = makeStyles(({ colors, spacing }) => ({
  group: { overflow: 'hidden' },
  divider: { height: 1, backgroundColor: colors.divider, marginLeft: spacing.lg + 38 + spacing.md },
}));

export default AttendanceHomeScreen;
