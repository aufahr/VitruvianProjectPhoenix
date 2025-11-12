/**
 * Data Access Object for connection logs
 * Migrated from Android Room ConnectionLogDao
 */

import { executeSql } from '../database';
import { ConnectionLogEntity } from '../entities';

/**
 * Insert a new connection log entry
 */
export const insert = async (log: ConnectionLogEntity): Promise<void> => {
  const sql = `
    INSERT INTO connection_logs
    (timestamp, eventType, level, deviceAddress, deviceName, message, details, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await executeSql(sql, [
    log.timestamp,
    log.eventType,
    log.level,
    log.deviceAddress,
    log.deviceName,
    log.message,
    log.details,
    log.metadata,
  ]);
};

/**
 * Get all logs ordered by timestamp (most recent first)
 */
export const getAllLogs = async (): Promise<ConnectionLogEntity[]> => {
  const results = await executeSql('SELECT * FROM connection_logs ORDER BY timestamp DESC');
  return mapLogResults(results);
};

/**
 * Get logs for a specific device
 */
export const getLogsForDevice = async (deviceAddress: string): Promise<ConnectionLogEntity[]> => {
  const results = await executeSql(
    'SELECT * FROM connection_logs WHERE deviceAddress = ? ORDER BY timestamp DESC',
    [deviceAddress]
  );
  return mapLogResults(results);
};

/**
 * Get logs by event type
 */
export const getLogsByEventType = async (eventType: string): Promise<ConnectionLogEntity[]> => {
  const results = await executeSql(
    'SELECT * FROM connection_logs WHERE eventType = ? ORDER BY timestamp DESC',
    [eventType]
  );
  return mapLogResults(results);
};

/**
 * Get logs by severity level
 */
export const getLogsByLevel = async (level: string): Promise<ConnectionLogEntity[]> => {
  const results = await executeSql(
    'SELECT * FROM connection_logs WHERE level = ? ORDER BY timestamp DESC',
    [level]
  );
  return mapLogResults(results);
};

/**
 * Get recent logs (last N entries)
 */
export const getRecentLogs = async (limit: number): Promise<ConnectionLogEntity[]> => {
  const results = await executeSql(
    'SELECT * FROM connection_logs ORDER BY timestamp DESC LIMIT ?',
    [limit]
  );
  return mapLogResults(results);
};

/**
 * Get logs within a time range
 */
export const getLogsBetween = async (
  startTime: number,
  endTime: number
): Promise<ConnectionLogEntity[]> => {
  const results = await executeSql(
    'SELECT * FROM connection_logs WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC',
    [startTime, endTime]
  );
  return mapLogResults(results);
};

/**
 * Get count of logs by level
 */
export const getCountByLevel = async (level: string): Promise<number> => {
  const results = await executeSql('SELECT COUNT(*) as count FROM connection_logs WHERE level = ?', [
    level,
  ]);

  if (results && results.length > 0) {
    const resultSet = results[0];
    if (resultSet.rows.length > 0) {
      return resultSet.rows.item(0).count;
    }
  }

  return 0;
};

/**
 * Delete logs older than specified timestamp
 * Returns the number of rows deleted
 */
export const deleteOlderThan = async (timestamp: number): Promise<number> => {
  const results = await executeSql('DELETE FROM connection_logs WHERE timestamp < ?', [timestamp]);

  if (results && results.length > 0) {
    const resultSet = results[0];
    return resultSet.rowsAffected;
  }

  return 0;
};

/**
 * Delete all logs
 */
export const deleteAll = async (): Promise<void> => {
  await executeSql('DELETE FROM connection_logs');
};

/**
 * Get logs for export (all data, oldest first)
 */
export const getAllLogsForExport = async (): Promise<ConnectionLogEntity[]> => {
  const results = await executeSql('SELECT * FROM connection_logs ORDER BY timestamp ASC');
  return mapLogResults(results);
};

// ========== Helper Functions for Mapping Results ==========

/**
 * Map SQL results to ConnectionLogEntity array
 */
const mapLogResults = (results: any[]): ConnectionLogEntity[] => {
  const logs: ConnectionLogEntity[] = [];

  if (results && results.length > 0) {
    const resultSet = results[0];
    for (let i = 0; i < resultSet.rows.length; i++) {
      const row = resultSet.rows.item(i);
      logs.push({
        id: row.id,
        timestamp: row.timestamp,
        eventType: row.eventType,
        level: row.level,
        deviceAddress: row.deviceAddress,
        deviceName: row.deviceName,
        message: row.message,
        details: row.details,
        metadata: row.metadata,
      });
    }
  }

  return logs;
};
