export namespace SQLiteHelper {
  export enum SQLiteColumnType {
    INTEGER = 'INTEGER',
    TEXT = 'TEXT',
    REAL = 'REAL',
    BLOB = 'BLOB',
  }

  export enum AggregationType {
      SUM = "SUM",
      MIN = "MIN",
      MAX = "MAX",
      AVG = "AVG"
  }

  export interface ColumnSchema {
    type: SQLiteColumnType;
    optional?: boolean;
    indexed?: boolean;
    primary?: boolean;
  }

  export interface TableSchema {
    name: string;
    ifNotExists?: boolean;
    columns: {[columnName: string]: ColumnSchema};
  }

  export function genCreateTableQuery(
    schema: TableSchema,
  ): {createQuery: string; indexQueries: string[]} {
    const result = {
      createQuery: '',
      indexQueries: new Array<string>(),
    };

    //CREATE TABLE query
    const sb: Array<string> = [];
    sb.push('CREATE TABLE ');
    if (schema.ifNotExists !== false) {
      sb.push('IF NOT EXISTS ');
    }
    sb.push(schema.name);
    sb.push('(');

    //columns
    const columnNames = Object.keys(schema.columns);
    Object.keys(schema.columns).forEach((columnName, i) => {
      const columnSchema = schema.columns[columnName];
      sb.push(' ', columnName + ' ' + columnSchema.type);

      if (columnSchema.primary === true) {
        sb.push(' PRIMARY KEY');
      }

      if (columnSchema.optional !== true) {
        sb.push(' NOT NULL');
      }
      if (i < columnNames.length - 1) {
        sb.push(',');
      }
    });

    sb.push(')');

    result.createQuery = sb.join('');

    sb.splice(0, sb.length);

    //make index queries
    const indexedColumnNames = columnNames.filter(c => schema.columns[c].indexed === true)
    result.indexQueries = indexedColumnNames.map((columnName, i)=>{
        return `CREATE INDEX IF NOT EXISTS idx_${columnName} ON ${schema.name} (${columnName})`
    })

    return result;
  }
}