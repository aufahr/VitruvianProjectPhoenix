declare module 'react-native-sqlite-storage' {
  export interface ResultSet {
    insertId?: number;
    rowsAffected: number;
    rows: {
      length: number;
      item: (index: number) => any;
      raw: () => any[];
    };
  }

  export interface Transaction {
    executeSql: (
      sql: string,
      params?: any[],
      success?: (transaction: Transaction, resultSet: ResultSet) => void,
      error?: (transaction: Transaction, error: any) => void
    ) => void;
  }

  export interface Database {
    transaction: (
      scope: (transaction: Transaction) => void,
      error?: (error: any) => void,
      success?: () => void
    ) => void;
    executeSql: (
      sql: string,
      params?: any[]
    ) => Promise<[ResultSet]>;
    close: (success?: () => void, error?: (error: any) => void) => void;
  }

  export interface SQLiteFactory {
    enablePromise: (enable: boolean) => void;
    openDatabase: (
      config: {
        name: string;
        location?: string;
        createFromLocation?: string;
      },
      success?: (db: Database) => void,
      error?: (error: any) => void
    ) => Database;
    deleteDatabase: (
      config: { name: string; location?: string },
      success?: () => void,
      error?: (error: any) => void
    ) => void;
    DEBUG: (debug: boolean) => void;
  }

  const SQLitePlugin: SQLiteFactory & {
    SQLite: {
      SQLiteDatabase: Database;
      SQLiteTransaction: Transaction;
      SQLiteResultSet: ResultSet;
    };
  };

  export default SQLitePlugin;

  // Export namespace for SQLite.* usage
  export namespace SQLite {
    export type SQLiteDatabase = Database;
    export type SQLiteTransaction = Transaction;
    export type SQLiteResultSet = ResultSet;
  }
}
