/**
 * Settings registration for RNK Reserves
 */
import { RNKReserves } from './apps/RNKReserves.js';
import { RNKReservesLogViewer } from './apps/LogViewer.js';

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

  // Register the Log Viewer Menu
  game.settings.registerMenu('rnk-reserves', 'logViewerMenu', {
    name: 'Hero Point Activity Log',
    label: 'View Activity Log',
    hint: 'View all hero point spending history and actor summaries.',
    icon: 'fas fa-book',
    type: RNKReservesLogViewer,
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

  // Hero Points Activity Log (hidden setting for storing log data)
  game.settings.register('rnk-reserves', 'heroPointsLog', {
    scope: 'world',
    config: false,
    type: Array,
    default: []
  });
}