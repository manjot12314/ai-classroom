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
import { apiClient, PerformanceResponse, Student } from '@/lib/api';
import { Colors } from '@/constants/theme';

const TOKEN_KEY = '@auth_token';
const USER_KEY = '@user_data';

interface PerformanceCardProps {
  title: string;
  value: number;
  maxValue?: number;
  unit?: string;
  color?: string;
}

function PerformanceCard({ title, value, maxValue = 100, unit = '%', color }: PerformanceCardProps) {
  // Force light theme
  const percentage = Math.min((value / maxValue) * 100, 100);
  const cardColor = color || Colors.light.tint;

  return (
    <ThemedView style={styles.card}>
      <ThemedText type="subtitle" style={styles.cardTitle}>
        {title}
      </ThemedText>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${percentage}%`,
                backgroundColor: cardColor,
              },
            ]}
          />
        </View>
        <ThemedText type="defaultSemiBold" style={styles.cardValue}>
          {value.toFixed(1)}{unit}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

export default function PerformanceScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [performance, setPerformance] = useState<PerformanceResponse | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  // Force light theme
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        // No token, redirect to login
        router.replace('/');
        return;
      }
      setToken(storedToken);

      // Get user email from stored user data or fetch it
      try {
        const storedUser = await AsyncStorage.getItem(USER_KEY);
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUserEmail(userData.email);
        } else {
          // Fetch user data if not stored
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
      // Find student with matching email
      const student = allStudents.find((s: Student) => s.email === userEmail);
      if (student) {
        setCurrentStudent(student);
        // Fetch performance for this student
        await fetchPerformance(student.id);
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

  const fetchPerformance = async (studentId: number) => {
    try {
      setError(null);
      const data = await apiClient.getStudentPerformance(studentId);
      setPerformance(data);
    } catch (err) {
      console.error('Failed to fetch performance:', err);
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
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
      await fetchPerformance(currentStudent.id);
    }
  };

  if (loading && !performance) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Student Performance</ThemedText>
        </ThemedView>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <ThemedText style={styles.loadingText}>Loading performance data...</ThemedText>
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
            <ThemedText type="title">My Performance</ThemedText>
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


        {performance && (
          <>
            <PerformanceCard
              title="Overall Score"
              value={performance.overall_score}
              maxValue={100}
              unit="%"
            />
            <PerformanceCard
              title="Attendance Rate"
              value={performance.attendance_rate * 100}
              maxValue={100}
              unit="%"
            />
            <PerformanceCard
              title="Average Attentiveness"
              value={performance.avg_attentiveness}
              maxValue={100}
              unit="%"
            />

            <ThemedView style={styles.infoContainer}>
              <ThemedText type="defaultSemiBold" style={styles.infoTitle}>
                Performance Period
              </ThemedText>
              <ThemedText style={styles.infoText}>
                Start: {new Date(performance.period_start).toLocaleDateString()}
              </ThemedText>
              <ThemedText style={styles.infoText}>
                End: {new Date(performance.period_end).toLocaleDateString()}
              </ThemedText>
            </ThemedView>
          </>
        )}
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
  card: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
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
  cardTitle: {
    marginBottom: 12,
    color: '#11181C',
  },
  cardValue: {
    fontSize: 24,
    marginLeft: 12,
    color: '#11181C',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  infoContainer: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    marginTop: 8,
  },
  infoTitle: {
    marginBottom: 8,
    color: '#11181C',
  },
  infoText: {
    marginBottom: 4,
    opacity: 0.7,
    color: '#11181C',
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

