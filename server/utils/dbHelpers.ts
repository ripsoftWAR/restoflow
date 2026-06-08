import db from '../db/database';

export const hasColumn = async (tableName: string, columnName: string): Promise<boolean> => {
  const result = await db.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2 LIMIT 1`,
    [tableName.toLowerCase(), columnName.toLowerCase()]
  );
  return result.rowCount > 0;
};
