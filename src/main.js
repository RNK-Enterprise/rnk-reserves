/**
 * RNK Reserves - Hero Points System for D&D 2024
 * Main entry point for the module
 */

import { RNKReserves } from './apps/RNKReserves.js';
import { registerSettings } from './settings.js';
import { registerHooks } from './hooks.js';
import { registerSocket } from './socket.js';

class RNKReservesModule {
  static ID = 'rnk-reserves';

  static init() {
    console.log('RNK Reserves | Initializing module');

    // Register settings
    registerSettings();

    // Register hooks
    registerHooks();

    // Register socket
    registerSocket();
  }

  static ready() {
    console.log('RNK Reserves | Module ready');

    // Initialize the main application if needed
    // For now, just ensure settings are loaded
  }
}

// Initialize on Foundry ready
Hooks.once('init', RNKReservesModule.init);
Hooks.once('ready', RNKReservesModule.ready);

// Export for global access
window.RNKReserves = RNKReservesModule;