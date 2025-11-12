# Vitruvian BLE Manager - React Native Migration

This module provides BLE communication with the Vitruvian fitness device using the `react-native-ble-plx` library. It has been migrated from the Android Nordic BLE implementation.

## Overview

The BLE Manager handles all Bluetooth Low Energy communication with the Vitruvian device, including:

- Device scanning and connection management
- Characteristic read/write/notify operations
- Real-time workout data monitoring (100ms polling)
- Keep-alive property polling (500ms)
- Handle state detection for Just Lift mode
- Rep counting notifications
- Protocol frame sending/receiving

## Migration Notes

### From Nordic BLE (Android) to react-native-ble-plx

| Android Nordic BLE | React Native BLE PLX | Notes |
|-------------------|---------------------|-------|
| `BleManager.connect()` | `device.connect()` | Similar API |
| `readCharacteristic()` | `characteristic.read()` | Returns Promise |
| `writeCharacteristic()` | `characteristic.writeWithoutResponse()` | Base64 encoding required |
| `setNotificationCallback()` | `characteristic.monitor()` | Returns Subscription |
| `requestMtu()` | `device.requestMTU()` | Similar API |
| Kotlin Flow | EventEmitter / Callbacks | Flow → Events pattern |
| Coroutines + delay() | setInterval() | Timer-based polling |
| ByteBuffer | DataView + Uint8Array | JavaScript native types |

### Key Differences

1. **Data Encoding**: react-native-ble-plx uses base64 encoding for all data transfers, while Nordic BLE uses raw byte arrays.

2. **Asynchronous Patterns**:
   - Android: Kotlin coroutines with Flow
   - React Native: Promises with EventEmitter pattern

3. **Polling Mechanism**:
   - Android: `launch { while(isActive) { delay(100) } }`
   - React Native: `setInterval(() => { ... }, 100)`

4. **Permissions**:
   - iOS: Handled via Info.plist
   - Android: Runtime permissions required (BLUETOOTH_SCAN, BLUETOOTH_CONNECT, ACCESS_FINE_LOCATION)

## Installation

```bash
npm install react-native-ble-plx
# or
yarn add react-native-ble-plx
```

### iOS Setup

Add to `Info.plist`:

```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>This app needs Bluetooth to connect to your Vitruvian device.</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>This app needs Bluetooth to connect to your Vitruvian device.</string>
```

### Android Setup

Add to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

<!-- Android 12+ -->
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
```

## Usage

### Basic Setup

```typescript
import { getBleManager, ConnectionStatus, HandleState } from './data/ble';

// Get singleton instance
const bleManager = getBleManager();

// Initialize
await bleManager.initialize();

// Check permissions
const permissions = await bleManager.checkAndRequestPermissions();
if (!permissions.granted) {
  console.error('BLE permissions not granted');
  return;
}

// Setup callbacks
bleManager.setCallbacks({
  onConnectionStateChange: (state) => {
    console.log('Connection state:', state);
  },
  onMonitorData: (metric) => {
    console.log('Load:', metric.totalLoad, 'kg');
  },
  onRepNotification: (rep) => {
    console.log('Rep completed:', rep.completeCounter);
  },
  onHandleStateChange: (state) => {
    console.log('Handle state:', state);
  },
  onError: (error) => {
    console.error('BLE error:', error);
  },
});
```

### Scanning and Connecting

```typescript
// Scan for Vitruvian devices
try {
  const device = await bleManager.scanForDevices();
  console.log('Found device:', device.name);

  // Connect
  await bleManager.connect(device);
  console.log('Connected!');
} catch (error) {
  console.error('Failed to connect:', error);
}
```

### Workout Control

```typescript
// Start workout monitoring
bleManager.startMonitorPolling();

// Monitor data will be received via onMonitorData callback
// at 100ms intervals

// Stop monitoring
bleManager.stopPolling();

// Enable Just Lift mode
bleManager.enableJustLiftWaitingMode();
```

### Sending Commands

```typescript
// Send a protocol frame to the device
const commandData = new Uint8Array([0x0A, 0x00, 0x00, 0x00]); // Example INIT command
await bleManager.sendCommand(commandData);
```

### Cleanup

```typescript
// Disconnect from device
await bleManager.disconnect();

// Cleanup all resources
await bleManager.cleanup();
```

## Event Emitter Pattern

The BLE Manager extends EventEmitter and emits the following events:

```typescript
bleManager.on('connectionStateChange', (state: ConnectionState) => {
  // Handle connection state changes
});

bleManager.on('monitorData', (metric: WorkoutMetric) => {
  // Handle real-time workout data
});

bleManager.on('repNotification', (notification: RepNotification) => {
  // Handle rep count notifications
});

bleManager.on('handleStateChange', (state: HandleState) => {
  // Handle grab/release detection
});
```

## Protocol Details

### Monitor Data Format

The device sends monitor data as 16-byte packets:

```
Offset | Type  | Description
-------|-------|-------------
0-1    | u16   | Tick counter (low 16 bits)
2-3    | u16   | Tick counter (high 16 bits)
4-5    | u16   | Position A (raw encoder value)
6-7    | u16   | (unused)
8-9    | u16   | Load A * 100 (kg)
10-11  | u16   | Position B (raw encoder value)
12-13  | u16   | (unused)
14-15  | u16   | Load B * 100 (kg)
```

All values are little-endian.

### Rep Notification Format

```
Offset | Type  | Description
-------|-------|-------------
0-1    | u16   | Top counter (reached top of range)
2-3    | u16   | (unused)
4-5    | u16   | Complete counter (rep complete at bottom)
```

### Handle Detection

The manager uses a simple position-based hysteresis algorithm with velocity confirmation:

- **Grabbed**: Position > 8.0 AND velocity > 100 units/s
- **Released**: Position < 2.5
- **Moving**: Position > 8.0 BUT velocity < 100 (transitional state)

These thresholds can be tuned based on the position range logs output after each workout.

## Architecture

```
VitruvianBleManager
├── Connection Management
│   ├── scanForDevices()
│   ├── connect()
│   └── disconnect()
├── Characteristic Setup
│   ├── setupCharacteristics()
│   ├── requestMtu()
│   └── enableNotifications()
├── Data Operations
│   ├── sendCommand()
│   ├── startMonitorPolling()
│   ├── startPropertyPolling()
│   └── stopPolling()
├── Data Handlers
│   ├── handleMonitorData()
│   ├── handleRepNotification()
│   └── analyzeHandleState()
└── Utilities
    ├── uint8ArrayToBase64()
    ├── base64ToUint8Array()
    └── bufferToHex()
```

## Constants

### BLE UUIDs

All UUIDs are defined in `types.ts`:

- NUS Service: `6e400001-b5a3-f393-e0a9-e50e24dcca9e`
- NUS RX (Command): `6e400002-b5a3-f393-e0a9-e50e24dcca9e`
- Monitor: `90e991a6-c548-44ed-969b-eb541014eae3`
- Property: `5fa538ec-d041-42f6-bbd6-c30d475387b7`
- Rep Notify: `8308f2a6-0875-4a94-a86f-5c5c5e1b068a`

### Polling Intervals

- Monitor polling: 100ms (during workout)
- Property polling: 500ms (keep-alive, always active when connected)

### MTU Size

- Requested MTU: 247 bytes (required for 96-byte program parameter frames)

## Error Handling

The manager includes comprehensive error handling:

- All async operations use try/catch
- Errors are logged and emitted via `onError` callback
- Non-critical errors (e.g., property polling) don't stop execution
- Permissions errors are handled gracefully
- Connection timeouts are enforced

## Performance Considerations

1. **Buffer Management**: Uses Uint8Array and DataView for efficient binary data handling
2. **Polling Optimization**: Monitor polling only runs during active workouts
3. **Notification Buffering**: Subscriptions are cleaned up on disconnect
4. **Memory Management**: All resources are cleaned up in `cleanup()`

## Testing

The BLE manager can be tested with:

```typescript
// Enable debug logging
bleManager.setDebugLogging(true);

// Check connection state
const state = bleManager.getConnectionState();
console.log('Current state:', state);

// Check if connected
const connected = bleManager.isConnected();
console.log('Connected:', connected);

// Get current handle state
const handleState = bleManager.getHandleState();
console.log('Handle state:', handleState);
```

## Troubleshooting

### Common Issues

1. **"Bluetooth is powered off"**
   - Ensure Bluetooth is enabled on the device
   - Check iOS/Android settings

2. **"NUS service not found"**
   - Ensure you're connecting to a Vitruvian device (name starts with "Vee")
   - Check device firmware version

3. **"MTU request failed"**
   - This is non-critical, connection will continue with default MTU
   - Some devices don't support large MTU sizes

4. **Monitor data not received**
   - Ensure `startMonitorPolling()` has been called
   - Check that device is connected (status === ConnectionStatus.Ready)
   - Verify monitor characteristic is available

5. **Rep notifications not working**
   - This is a known issue with some firmware versions
   - Rep notify characteristic may not be available
   - Check logs for "Rep notify characteristic not found" warning

## Future Enhancements

Potential improvements for the BLE manager:

- [ ] Add reconnection logic for dropped connections
- [ ] Implement connection retry with exponential backoff
- [ ] Add data validation and CRC checking
- [ ] Implement queue for command sending
- [ ] Add metrics for connection quality (RSSI, latency)
- [ ] Support for multiple device connections
- [ ] Add automated testing with mock BLE device

## References

- [react-native-ble-plx Documentation](https://github.com/Polidea/react-native-ble-plx)
- Android Nordic BLE Library (original implementation)
- Vitruvian Web App (protocol reference)
- Official Vitruvian App (HCI logs for protocol analysis)
