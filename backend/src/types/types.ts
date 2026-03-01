export interface IColumn {
  columnName: string;
  dataType: string;
}

export interface ITable {
  tableName: string;
  columns: IColumn[];
  rows: Record<string, any>[];
}

export interface IExpectedOutput {
  type: string;
  value: any;
}
