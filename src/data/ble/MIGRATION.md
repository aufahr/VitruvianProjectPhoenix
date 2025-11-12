# BLE Migration Checklist

This document outlines the complete migration from Android Nordic BLE to React Native BLE PLX.

## ✅ Completed Migration Tasks

### 1. Type Definitions (types.ts)
- [x] BLE Constants (UUIDs, timeouts, device prefix)
- [x] ConnectionStatus enum
- [x] ConnectionState type
- [x] HandleState enum for Just Lift detection
- [x] WorkoutMetric interface
- [x] RepNotification interface
- [x] BleManagerCallbacks interface
- [x] BlePermissionsStatus interface
- [x] Handle detection parameters
- [x] Polling intervals
- [x] MTU size constant

### 2. BLE Manager (BleManager.ts)
- [x] Device scanning with timeout
- [x] Connection management (connect/disconnect)
- [x] Service and characteristic discovery
- [x] MTU request for large frames (247 bytes)
- [x] Notification subscription handling
- [x] Monitor data polling (100ms interval)
- [x] Property data polling (500ms keep-alive)
- [x] Command sending (protocol frames)
- [x] Monitor data parsing (16-byte packets)
- [x] Rep notification parsing (6-byte packets)
- [x] Handle state detection algorithm
- [x] Position spike filtering (>50000)
- [x] Velocity calculation for handle detection
- [x] EventEmitter pattern for data events
- [x] Callback pattern for React integration
- [x] Error handling and logging
- [x] Resource cleanup
- [x] Singleton pattern with getBleManager()

### 3. iOS/Android Permissions
- [x] iOS permission handling (Info.plist configuration)
- [x] Android 12+ permissions (BLUETOOTH_SCAN, BLUETOOTH_CONNECT)
- [x] Android location permissions (ACCESS_FINE_LOCATION)
- [x] Permission checking and requesting logic
- [x] Bluetooth state monitoring

### 4. Data Conversion Utilities
- [x] Uint8Array ↔ Base64 conversion (BLE PLX requirement)
- [x] Little-endian data parsing with DataView
- [x] Hex dump formatting for debugging
- [x] Buffer to hex string conversion

### 5. Protocol Implementation
- [x] Monitor data frame parsing (ticks, position, load)
- [x] Rep notification frame parsing (top/complete counters)
- [x] Command frame transmission (no splitting!)
- [x] Position spike filtering
- [x] Load conversion (device sends kg * 100)

### 6. State Management
- [x] Connection state tracking
- [x] Handle state tracking
- [x] Position range tracking for tuning
- [x] Last good position tracking
- [x] Velocity calculation state

### 7. Documentation
- [x] README.md with usage instructions
- [x] Example usage component (example-usage.tsx)
- [x] API documentation
- [x] Protocol documentation
- [x] Troubleshooting guide
- [x] Migration notes

## 📋 Integration Checklist

When integrating the migrated BLE manager into your app:

### Package Installation
- [ ] Install react-native-ble-plx: `npm install react-native-ble-plx`
- [ ] Install dependencies: `npm install`
- [ ] Link native modules: `npx pod-install` (iOS)

### iOS Configuration
- [ ] Add Bluetooth usage descriptions to Info.plist:
  - NSBluetoothAlwaysUsageDescription
  - NSBluetoothPeripheralUsageDescription

### Android Configuration
- [ ] Add Bluetooth permissions to AndroidManifest.xml:
  - BLUETOOTH
  - BLUETOOTH_ADMIN
  - ACCESS_FINE_LOCATION (Android < 12)
  - BLUETOOTH_SCAN (Android 12+)
  - BLUETOOTH_CONNECT (Android 12+)
- [ ] Set minSdkVersion to 21 or higher
- [ ] Set targetSdkVersion appropriately

### Code Integration
- [ ] Import BLE manager: `import { getBleManager } from './data/ble'`
- [ ] Initialize manager in app startup
- [ ] Check and request permissions
- [ ] Setup connection state callbacks
- [ ] Setup monitor data callbacks
- [ ] Setup rep notification callbacks
- [ ] Setup handle state callbacks
- [ ] Implement connection flow (scan → connect)
- [ ] Implement workout flow (start → monitor → stop)
- [ ] Implement disconnect and cleanup on unmount

### Protocol Integration
- [ ] Import ProtocolBuilder (if migrated separately)
- [ ] Integrate command building (INIT, PROGRAM, etc.)
- [ ] Test command sending
- [ ] Verify monitor data reception
- [ ] Verify rep counting
- [ ] Test handle detection

### Testing
- [ ] Test device scanning
- [ ] Test connection/disconnection
- [ ] Test monitor data polling
- [ ] Test rep notifications
- [ ] Test handle detection (Just Lift)
- [ ] Test command sending
- [ ] Test error handling
- [ ] Test permission flows (iOS/Android)
- [ ] Test Bluetooth off scenario
- [ ] Test connection loss/recovery

## 🔄 API Mapping Reference

### Connection Management

| Android Nordic BLE | React Native BLE PLX |
|-------------------|---------------------|
| `BleManager(context)` | `new BleManagerPLX()` |
| `connect(device).useAutoConnect(false).enqueue()` | `device.connect({ timeout })` |
| `cancelConnection()` | `device.cancelConnection()` |
| `isConnected` | `connectionState.status === Ready` |

### Characteristic Operations

| Android Nordic BLE | React Native BLE PLX |
|-------------------|---------------------|
| `readCharacteristic(char).with { }.enqueue()` | `characteristic.read()` |
| `writeCharacteristic(char, data).enqueue()` | `characteristic.writeWithoutResponse(base64)` |
| `setNotificationCallback(char).with { }` | `characteristic.monitor(callback)` |
| `enableNotifications(char).enqueue()` | Automatic with `monitor()` |

### Data Handling

| Android (Kotlin) | React Native (TypeScript) |
|-----------------|--------------------------|
| `ByteBuffer.wrap(bytes).order(LITTLE_ENDIAN)` | `new DataView(buffer)` |
| `buffer.getShort(offset)` | `view.getUint16(offset, true)` |
| `data.value?.toHexString()` | `bufferToHex(uint8Array)` |
| `Flow<WorkoutMetric>` | `EventEmitter.on('monitorData')` |

### Asynchronous Patterns

| Android (Kotlin) | React Native (TypeScript) |
|-----------------|--------------------------|
| `launch { delay(100) }` | `setInterval(() => {}, 100)` |
| `MutableStateFlow<T>` | `useState<T>()` / `EventEmitter` |
| `MutableSharedFlow<T>` | `EventEmitter.emit()` |
| `flow.asStateFlow()` | `state` variable |

## 🚧 Known Limitations

1. **Rep Notifications**: May not work on all firmware versions. The rep notify characteristic (0x8308f2a6) is sometimes not available.

2. **MTU Request**: May fail on some Android devices but is not critical. The app will continue with default MTU (23 bytes), which may cause issues with large frames (>20 bytes).

3. **Background Execution**: iOS restricts BLE operations in background. Connection may be suspended when app is backgrounded.

4. **Connection Recovery**: Automatic reconnection is not implemented. App must manually reconnect if connection is lost.

5. **Multiple Devices**: Currently designed for single device connection. Would need refactoring for multi-device support.

## 🔮 Future Enhancements

### High Priority
- [ ] Add automatic reconnection on connection loss
- [ ] Implement command queue with retry logic
- [ ] Add connection quality metrics (RSSI monitoring)
- [ ] Implement data validation and checksums

### Medium Priority
- [ ] Add support for multiple simultaneous connections
- [ ] Implement background mode handling
- [ ] Add connection state persistence
- [ ] Implement data buffering for network sync

### Low Priority
- [ ] Add BLE mock for testing without device
- [ ] Implement advanced debugging tools
- [ ] Add connection performance profiling
- [ ] Create automated integration tests

## 📊 Migration Statistics

| Metric | Value |
|--------|-------|
| Lines of Kotlin code | ~750 |
| Lines of TypeScript code | ~800 |
| Number of methods migrated | 25+ |
| Number of characteristics | 7+ notify, 8+ command |
| Data packet formats | 2 (monitor, rep) |
| Polling intervals | 2 (100ms, 500ms) |
| Test coverage | Manual testing required |

## 📞 Support

For issues or questions about the migration:

1. Check the README.md for usage examples
2. Review the example-usage.tsx for integration patterns
3. Enable debug logging: `bleManager.setDebugLogging(true)`
4. Check device logs for BLE errors
5. Verify permissions are granted
6. Ensure device is running compatible firmware

## ✨ Credits

- **Original Implementation**: Android Nordic BLE (VitruvianBleManager.kt)
- **Migration**: React Native BLE PLX
- **Protocol Reference**: Vitruvian Web App (device.js)
- **Testing Reference**: Official Vitruvian App (HCI logs)
