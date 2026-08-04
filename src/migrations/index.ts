import * as migration_20260804_155259_initial from './20260804_155259_initial';

export const migrations = [
  {
    up: migration_20260804_155259_initial.up,
    down: migration_20260804_155259_initial.down,
    name: '20260804_155259_initial'
  },
];
