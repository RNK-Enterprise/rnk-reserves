/**
 * Settings registration for RNK Reserves
 */

export function registerSettings() {
  // Points awarded per session
  game.settings.register('rnk-reserves', 'pointsPerSession', {
    name: 'Points Per Session',
    hint: 'Number of Hero Points awarded at the start of each session (1-3)',
    scope: 'world',
    config: true,
    type: Number,
    default: 2,
    range: {
      min: 1,
      max: 3,
      step: 1
    }
  });

  // Maximum Hero Points
  game.settings.register('rnk-reserves', 'maxPoints', {
    name: 'Maximum Hero Points',
    hint: 'Maximum number of Hero Points a character can have',
    scope: 'world',
    config: true,
    type: Number,
    default: 5,
    range: {
      min: 1,
      max: 10,
      step: 1
    }
  });

  // Enable Heal button on chat cards
  game.settings.register('rnk-reserves', 'enableHealButton', {
    name: 'Enable Heal Button',
    hint: 'Show the Heal button on Hero Point chat cards (spends 1 point to regain 1d6 + level HP)',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  });

  // Auto-award at session start
  game.settings.register('rnk-reserves', 'autoAward', {
    name: 'Auto-Award Points',
    hint: 'Automatically award points to players at session start',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false
  });
}