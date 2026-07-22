import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  ActivityIndicator,
  RefreshControl,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiClient, Student } from '@/lib/api';
import { Colors } from '@/constants/theme';

const TOKEN_KEY = '@auth_token';
const USER_KEY = '@user_data';

interface Attendance {
  id: number;
  session_id: number;
  student_id: number;
  detected_at: string;
  confidence_score: number;
}

interface Session {
  id: number;
  class_id: number;
  start_time: string;
  end_time: string | null;
  status: string;
}

interface Class {
  id: number;
  name: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  color?: string;
}

function StatCard({ title, value, color }: StatCardProps) {
  const cardColor = color || Colors.light.tint;

  return (
    <ThemedView style={styles.statCard}>
      <ThemedText type="subtitle" style={styles.statTitle}>
        {title}
      </ThemedText>
      <ThemedText type="defaultSemiBold" style={[styles.statValue, { color: cardColor }]}>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

function AttendanceRecord({ record, sessionInfo }: { record: Attendance; sessionInfo: { session: Session; className: string } | null }) {
  return (
    <ThemedView style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <ThemedText type="defaultSemiBold" style={styles.recordTitle}>
          {sessionInfo?.className || `Session #${record.session_id}`}
        </ThemedText>
        <View style={styles.presentBadge}>
          <ThemedText style={styles.presentText}>Present</ThemedText>
        </View>
      </View>
      {sessionInfo?.session && (
        <ThemedText style={styles.recordDate}>
          Session Date: {new Date(sessionInfo.session.start_time).toLocaleDateString()}
        </ThemedText>
      )}
      <ThemedText style={styles.recordTime}>
        Detected: {new Date(record.detected_at).toLocaleString()}
      </ThemedText>
      <ThemedText style={styles.recordConfidence}>
        Confidence: {(record.confidence_score * 100).toFixed(1)}%
      </ThemedText>
    </ThemedView>
  );
}

export default function AttendanceScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        router.replace('/');
        return;
      }
      setToken(storedToken);

      try {
        const storedUser = await AsyncStorage.getItem(USER_KEY);
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUserEmail(userData.email);
        } else {
          const userResponse = await fetch(`${apiClient.baseUrl}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setUserEmail(userData.email);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
          }
        }
      } catch (err) {
        console.error('Failed to get user email:', err);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      router.replace('/');
    }
  };

  const fetchCurrentStudent = async () => {
    if (!token || !userEmail) return;
    
    try {
      const allStudents = await apiClient.getStudents(token);
      const student = allStudents.find((s: Student) => s.email === userEmail);
      if (student) {
        setCurrentStudent(student);
        await loadAttendanceData(student.id);
      } else {
        setError('No student record found for your account. Please contact your administrator.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to fetch student:', err);
      setError(err instanceof Error ? err.message : 'Failed to load student data');
      setLoading(false);
    }
  };

  const loadAttendanceData = async (studentId: number) => {
    if (!token) return;

    try {
      setError(null);

      // Load all sessions and classes
      const [sessionsRes, classesRes] = await Promise.all([
        fetch(`${apiClient.baseUrl}/api/sessions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch(`${apiClient.baseUrl}/api/classes`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
      ]);

      if (!sessionsRes.ok || !classesRes.ok) {
        throw new Error('Failed to load sessions or classes');
      }

      const sessionsData: Session[] = await sessionsRes.json();
      const classesData: Class[] = await classesRes.json();

      setSessions(sessionsData);
      setClasses(classesData);

      // Load attendance for all sessions and filter by current student
      const attendancePromises = sessionsData.map((session) =>
        fetch(`${apiClient.baseUrl}/api/attendance/session/${session.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      );

      const attendanceResults = await Promise.all(attendancePromises);
      const allAttendance: Attendance[] = [];

      for (const result of attendanceResults) {
        if (result.ok) {
          const attendanceData: Attendance[] = await result.json();
          allAttendance.push(...attendanceData.filter((a) => a.student_id === studentId));
        }
      }

      setAttendance(allAttendance);
    } catch (err) {
      console.error('Failed to load attendance:', err);
      setError(err instanceof Error ? err.message : 'Failed to load attendance data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token && userEmail) {
      const loadData = async () => {
        setLoading(true);
        await fetchCurrentStudent();
      };
      loadData();
    }
  }, [token, userEmail]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (currentStudent) {
      await loadAttendanceData(currentStudent.id);
    }
  };

  const getSessionInfo = (sessionId: number) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return null;
    const cls = classes.find((c) => c.id === session.class_id);
    return { session, className: cls?.name || 'Unknown Class' };
  };

  // Calculate statistics
  const presentCount = attendance.length;
  const studentSessions = sessions.filter((s) => s.status === 'completed');
  const totalSessions = studentSessions.length;
  const attendanceRate = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;

  if (loading && attendance.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">My Attendance</ThemedText>
        </ThemedView>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <ThemedText style={styles.loadingText}>Loading attendance data...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!token) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <ThemedText type="title">My Attendance</ThemedText>
            {currentStudent && (
              <ThemedText type="subtitle" style={styles.studentName}>
                {currentStudent.name}
              </ThemedText>
            )}
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: '#f1f5f9',
            }}
          >
            <ThemedText style={{ fontSize: 12, color: '#11181C' }}>Logout</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {error && (
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <ThemedText style={styles.errorHint}>
              {Platform.OS === 'android'
                ? 'For Android emulator, backend should be at http://10.0.2.2:8000'
                : Platform.OS === 'ios'
                ? 'For iOS simulator, backend should be at http://localhost:8000'
                : 'For web, backend should be at http://localhost:8000'}
            </ThemedText>
            <ThemedText style={styles.errorHint}>
              Make sure the backend server is running
            </ThemedText>
          </ThemedView>
        )}

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Total Sessions Attended"
            value={presentCount}
            color={Colors.light.tint}
          />
          <StatCard
            title="Total Sessions"
            value={totalSessions}
            color="#64748b"
          />
          <StatCard
            title="Attendance Rate"
            value={`${attendanceRate.toFixed(1)}%`}
            color="#10b981"
          />
        </View>

        {/* Attendance History */}
        <ThemedView style={styles.historyContainer}>
          <ThemedText type="defaultSemiBold" style={styles.historyTitle}>
            Attendance History
          </ThemedText>
          {attendance.length > 0 ? (
            <View style={styles.recordsList}>
              {attendance.map((record) => {
                const sessionInfo = getSessionInfo(record.session_id);
                return (
                  <AttendanceRecord
                    key={record.id}
                    record={record}
                    sessionInfo={sessionInfo}
                  />
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>No attendance records found</ThemedText>
            </View>
          )}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  studentName: {
    marginTop: 8,
    opacity: 0.7,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    marginTop: 8,
    color: '#687076',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statTitle: {
    fontSize: 12,
    marginBottom: 8,
    color: '#64748b',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#11181C',
  },
  historyContainer: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  historyTitle: {
    fontSize: 18,
    marginBottom: 16,
    color: '#11181C',
  },
  recordsList: {
    gap: 12,
  },
  recordCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordTitle: {
    fontSize: 16,
    color: '#11181C',
    flex: 1,
  },
  presentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#d1fae5',
  },
  presentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065f46',
  },
  recordDate: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  recordTime: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  recordConfidence: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  errorContainer: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#ffebee',
    marginBottom: 16,
  },
  errorText: {
    color: '#c62828',
    marginBottom: 8,
  },
  errorHint: {
    color: '#c62828',
    fontSize: 12,
    opacity: 0.7,
  },
});

