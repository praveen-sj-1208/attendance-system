/**
 * AI-powered attendance analysis engine
 * Provides trend analysis, status computation, and smart messaging
 */

export interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  subject: string;
  status: 'present' | 'absent';
}

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  percentage: number;
  status: 'Perfect' | 'Good' | 'At Risk' | 'No Data';
  trend: 'improving' | 'declining' | 'stable' | 'no-data';
  message: string;
}

export function computeAttendanceStats(
  records: AttendanceRecord[],
  studentName: string = 'Student'
): AttendanceStats {
  if (!records || records.length === 0) {
    return {
      total: 0,
      present: 0,
      absent: 0,
      percentage: 0,
      status: 'No Data',
      trend: 'no-data',
      message: `No attendance records found for ${studentName}.`,
    };
  }

  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent = total - present;
  const percentage = Math.round((present / total) * 1000) / 10; // 1 decimal

  // Status
  const status: AttendanceStats['status'] =
    percentage === 100 ? 'Perfect' :
    percentage >= 70 ? 'Good' : 'At Risk';

  // Trend analysis (need at least 4 records)
  let trend: AttendanceStats['trend'] = 'no-data';
  if (records.length >= 4) {
    const sorted = [...records].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const half = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, half);
    const secondHalf = sorted.slice(half);
    const firstPct = firstHalf.filter(r => r.status === 'present').length / firstHalf.length;
    const secondPct = secondHalf.filter(r => r.status === 'present').length / secondHalf.length;
    trend = secondPct > firstPct + 0.05
      ? 'improving'
      : secondPct < firstPct - 0.05
        ? 'declining'
        : 'stable';
  }

  // Smart AI message
  let message: string;
  if (percentage === 100) {
    message = `Excellent ${studentName}! You maintained 100% attendance. Keep it up! 🌟`;
  } else if (percentage < 70) {
    message = `Hi ${studentName}, your attendance is ${percentage}%. Please improve to avoid issues. ⚠️`;
  } else if (trend === 'improving') {
    message = `Good progress ${studentName}! Your attendance is trending upward at ${percentage}%. Keep pushing! 📈`;
  } else if (trend === 'declining') {
    message = `${studentName}, your attendance has been declining (${percentage}%). Try to attend more classes. 📉`;
  } else {
    message = `${studentName}, your attendance is ${percentage}%. ${percentage >= 85 ? 'Great job!' : 'Keep it up!'}`;
  }

  return { total, present, absent, percentage, status, trend, message };
}

export function getStatusColor(status: AttendanceStats['status']): string {
  switch (status) {
    case 'Perfect': return 'text-success';
    case 'Good': return 'text-primary';
    case 'At Risk': return 'text-destructive';
    default: return 'text-muted-foreground';
  }
}

export function getTrendIcon(trend: AttendanceStats['trend']): string {
  switch (trend) {
    case 'improving': return '📈';
    case 'declining': return '📉';
    case 'stable': return '➡️';
    default: return '—';
  }
}
