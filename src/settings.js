/**
 * Settings registration for RNK Reserves
 */
import { RNKReserves } from './apps/RNKReserves.js';

export function registerSettings() {
  // Register the Settings Menu
  game.settings.registerMenu('rnk-reserves', 'reservesMenu', {
    name: 'Hero Point Management',
    label: 'Open Management UI',
    hint: 'Configure Hero Points and manage actor assignments.',
    icon: 'fas fa-shield-alt',
    type: RNKReserves,
    restricted: true
  });

  // Target Actor UUID for point management
  game.settings.register('rnk-reserves', 'targetActorUuid', {
    scope: 'world',
    config: false,
    type: String,
    default: ''
  });

  // Auto-award at session start
  game.settings.register('rnk-reserves', 'autoAward', {
    name: 'Auto-Award Points',
    hint: 'If enabled, checks for point refresh on login/session start based on level.',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  });
}