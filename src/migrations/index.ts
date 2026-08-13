import * as migration_20260804_155259_initial from './20260804_155259_initial';
import * as migration_20260811_135850_add_excursions from './20260811_135850_add_excursions';
import * as migration_20260811_154856_add_masterclasses from './20260811_154856_add_masterclasses';
import * as migration_20260813_155149_add_partners from './20260813_155149_add_partners';

export const migrations = [
  {
    up: migration_20260804_155259_initial.up,
    down: migration_20260804_155259_initial.down,
    name: '20260804_155259_initial',
  },
  {
    up: migration_20260811_135850_add_excursions.up,
    down: migration_20260811_135850_add_excursions.down,
    name: '20260811_135850_add_excursions',
  },
  {
    up: migration_20260811_154856_add_masterclasses.up,
    down: migration_20260811_154856_add_masterclasses.down,
    name: '20260811_154856_add_masterclasses',
  },
  {
    up: migration_20260813_155149_add_partners.up,
    down: migration_20260813_155149_add_partners.down,
    name: '20260813_155149_add_partners'
  },
];
