// Node 24 includes node:sqlite. The project's current @types/node 20 does not.
declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    close(): void;
    prepare(sql: string): {
      run(...params: (string | number | null)[]): { changes: number | bigint };
      get(...params: (string | number | null)[]): unknown;
      all(...params: (string | number | null)[]): unknown[];
    };
  }
}
