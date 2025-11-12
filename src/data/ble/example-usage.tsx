/**
 * Example usage of VitruvianBleManager in a React Native component
 * This file demonstrates best practices for integrating the BLE manager
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import {
  getBleManager,
  ConnectionStatus,
  HandleState,
  WorkoutMetric,
  RepNotification,
  ConnectionState,
} from './index';

/**
 * Example BLE component showing device connection and workout monitoring
 */
export const BleExample: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: ConnectionStatus.Disconnected,
  });
  const [handleState, setHandleState] = useState<HandleState>(HandleState.Released);
  const [currentMetric, setCurrentMetric] = useState<WorkoutMetric | null>(null);
  const [repCount, setRepCount] = useState(0);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);

  const bleManager = getBleManager();

  // Initialize BLE manager on mount
  useEffect(() => {
    const initBle = async () => {
      try {
        await bleManager.initialize();
        console.log('BLE Manager initialized');

        // Setup callbacks
        bleManager.setCallbacks({
          onConnectionStateChange: (state) => {
            console.log('Connection state changed:', state);
            setConnectionState(state);
          },
          onMonitorData: (metric) => {
            setCurrentMetric(metric);
          },
          onRepNotification: (notification) => {
            console.log('Rep notification:', notification);
            setRepCount(notification.completeCounter);
          },
          onHandleStateChange: (state) => {
            console.log('Handle state changed:', state);
            setHandleState(state);

            // Auto-start workout when handles are grabbed in Just Lift mode
            if (state === HandleState.Grabbed && !isWorkoutActive) {
              console.log('Handles grabbed! Starting workout...');
              handleStartWorkout();
            }
          },
          onError: (error) => {
            console.error('BLE error:', error);
            Alert.alert('BLE Error', error.message);
          },
        });
      } catch (error) {
        console.error('Failed to initialize BLE:', error);
        Alert.alert('Initialization Error', 'Failed to initialize Bluetooth');
      }
    };

    initBle();

    // Cleanup on unmount
    return () => {
      bleManager.stopPolling();
      bleManager.disconnect();
    };
  }, []);

  // Handle device scanning and connection
  const handleConnect = useCallback(async () => {
    try {
      // Check permissions first
      const permissions = await bleManager.checkAndRequestPermissions();
      if (!permissions.granted) {
        Alert.alert(
          'Permissions Required',
          'Bluetooth permissions are required to connect to your Vitruvian device.'
        );
        return;
      }

      if (!permissions.bluetoothEnabled) {
        Alert.alert('Bluetooth Off', 'Please enable Bluetooth to connect.');
        return;
      }

      // Scan for devices
      console.log('Scanning for Vitruvian devices...');
      const device = await bleManager.scanForDevices();

      console.log('Found device:', device.name);

      // Connect to device
      await bleManager.connect(device);

      Alert.alert('Connected', `Connected to ${device.name}`);
    } catch (error) {
      console.error('Connection failed:', error);
      Alert.alert('Connection Failed', (error as Error).message);
    }
  }, [bleManager]);

  // Handle disconnect
  const handleDisconnect = useCallback(async () => {
    try {
      await bleManager.disconnect();
      setIsWorkoutActive(false);
      setCurrentMetric(null);
      setRepCount(0);
    } catch (error) {
      console.error('Disconnect failed:', error);
      Alert.alert('Disconnect Failed', (error as Error).message);
    }
  }, [bleManager]);

  // Start workout monitoring
  const handleStartWorkout = useCallback(() => {
    console.log('Starting workout...');
    setIsWorkoutActive(true);
    setRepCount(0);
    bleManager.startMonitorPolling();
  }, [bleManager]);

  // Stop workout monitoring
  const handleStopWorkout = useCallback(() => {
    console.log('Stopping workout...');
    setIsWorkoutActive(false);
    bleManager.stopPolling();
    setCurrentMetric(null);
  }, [bleManager]);

  // Enable Just Lift mode
  const handleEnableJustLift = useCallback(() => {
    console.log('Enabling Just Lift mode...');
    bleManager.enableJustLiftWaitingMode();
    Alert.alert('Just Lift', 'Grab the handles to start your workout');
  }, [bleManager]);

  // Send a test command
  const handleSendTestCommand = useCallback(async () => {
    try {
      // Example: Send INIT command (0x0A 0x00 0x00 0x00)
      const command = new Uint8Array([0x0a, 0x00, 0x00, 0x00]);
      await bleManager.sendCommand(command);
      Alert.alert('Command Sent', 'Test command sent successfully');
    } catch (error) {
      console.error('Failed to send command:', error);
      Alert.alert('Command Failed', (error as Error).message);
    }
  }, [bleManager]);

  // Render connection status
  const renderConnectionStatus = () => {
    switch (connectionState.status) {
      case ConnectionStatus.Disconnected:
        return <Text style={styles.statusText}>Disconnected</Text>;
      case ConnectionStatus.Scanning:
        return <Text style={styles.statusText}>Scanning...</Text>;
      case ConnectionStatus.Connecting:
        return (
          <Text style={styles.statusText}>
            Connecting to {connectionState.deviceName}...
          </Text>
        );
      case ConnectionStatus.Ready:
        return (
          <Text style={[styles.statusText, styles.statusConnected]}>
            Connected to {connectionState.deviceName}
          </Text>
        );
      case ConnectionStatus.Error:
        return (
          <Text style={[styles.statusText, styles.statusError]}>
            Error: {connectionState.message}
          </Text>
        );
      default:
        return null;
    }
  };

  // Render handle state indicator
  const renderHandleState = () => {
    let color = '#666';
    let text = 'Released';

    switch (handleState) {
      case HandleState.Grabbed:
        color = '#4CAF50';
        text = 'Grabbed';
        break;
      case HandleState.Moving:
        color = '#FF9800';
        text = 'Moving';
        break;
      case HandleState.Released:
        color = '#666';
        text = 'Released';
        break;
    }

    return (
      <View style={styles.handleStateContainer}>
        <Text style={styles.label}>Handle State:</Text>
        <View style={[styles.handleStateIndicator, { backgroundColor: color }]} />
        <Text style={styles.handleStateText}>{text}</Text>
      </View>
    );
  };

  // Render workout metrics
  const renderMetrics = () => {
    if (!currentMetric) {
      return <Text style={styles.noDataText}>No data</Text>;
    }

    return (
      <View style={styles.metricsContainer}>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Total Load:</Text>
          <Text style={styles.metricValue}>{currentMetric.totalLoad.toFixed(1)} kg</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Load A:</Text>
          <Text style={styles.metricValue}>{currentMetric.loadA.toFixed(1)} kg</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Load B:</Text>
          <Text style={styles.metricValue}>{currentMetric.loadB.toFixed(1)} kg</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Position A:</Text>
          <Text style={styles.metricValue}>{currentMetric.positionA}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Position B:</Text>
          <Text style={styles.metricValue}>{currentMetric.positionB}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Velocity:</Text>
          <Text style={styles.metricValue}>{currentMetric.velocityA.toFixed(1)} u/s</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Reps:</Text>
          <Text style={styles.metricValue}>{repCount}</Text>
        </View>
      </View>
    );
  };

  const isConnected = connectionState.status === ConnectionStatus.Ready;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vitruvian BLE Manager</Text>

      {/* Connection Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connection</Text>
        {renderConnectionStatus()}
      </View>

      {/* Connection Controls */}
      <View style={styles.section}>
        {!isConnected ? (
          <Button
            title="Connect to Device"
            onPress={handleConnect}
            disabled={connectionState.status === ConnectionStatus.Scanning}
          />
        ) : (
          <Button title="Disconnect" onPress={handleDisconnect} color="#f44336" />
        )}
      </View>

      {/* Handle State */}
      {isConnected && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Handle Detection</Text>
          {renderHandleState()}
        </View>
      )}

      {/* Workout Controls */}
      {isConnected && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout Controls</Text>
          {!isWorkoutActive ? (
            <View style={styles.buttonRow}>
              <Button title="Start Workout" onPress={handleStartWorkout} />
              <Button title="Enable Just Lift" onPress={handleEnableJustLift} />
            </View>
          ) : (
            <Button title="Stop Workout" onPress={handleStopWorkout} color="#f44336" />
          )}
        </View>
      )}

      {/* Workout Metrics */}
      {isConnected && isWorkoutActive && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Real-Time Metrics</Text>
          {renderMetrics()}
        </View>
      )}

      {/* Debug Controls */}
      {isConnected && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug</Text>
          <Button title="Send Test Command" onPress={handleSendTestCommand} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  statusText: {
    fontSize: 16,
    color: '#666',
  },
  statusConnected: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  statusError: {
    color: '#f44336',
  },
  handleStateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  handleStateIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  handleStateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricsContainer: {
    gap: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
