/**
 * Hero Points Logging System
 * Tracks all hero point spending and updates
 */

const LOG_STORAGE_KEY = 'rnk-reserves-log';
const MAX_LOG_ENTRIES = 500;

/**
 * Initialize the logging system
 */
export function initializeLogger() {
  if (!game.user.isGM) return;
  
  // Create game world flag if it doesn't exist
  if (!game.settings.get('rnk-reserves', 'heroPointsLog')) {
    game.settings.set('rnk-reserves', 'heroPointsLog', []);
  }
}

/**
 * Add a log entry for hero point spending
 * @param {string} actorId - The actor's ID
 * @param {string} actorName - The actor's name
 * @param {number} pointsSpent - Number of points spent
 * @param {number} pointsRemaining - Points left after spending
 * @param {string} action - Type of action (deathSuccess, addD6, award, etc)
 * @param {string} [userId] - Who triggered the action (defaults to current user)
 */
export function logHeroPointSpending(actorId, actorName, pointsSpent, pointsRemaining, action, userId = null) {
  if (!game.user.isGM) return;

  const entry = {
    id: foundry.utils.randomID(),
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleString(),
    actorId: actorId,
    actorName: actorName,
    pointsSpent: pointsSpent,
    pointsRemaining: pointsRemaining,
    action: action,
    userId: userId || game.user.id,
    userName: (game.users.get(userId || game.user.id))?.name || 'Unknown'
  };

  const currentLog = game.settings.get('rnk-reserves', 'heroPointsLog') || [];
  
  // Keep log size manageable
  const newLog = [entry, ...currentLog].slice(0, MAX_LOG_ENTRIES);
  
  game.settings.set('rnk-reserves', 'heroPointsLog', newLog);
  
  return entry;
}

/**
 * Get all log entries
 */
export function getHeroPointsLog() {
  return game.settings.get('rnk-reserves', 'heroPointsLog') || [];
}

/**
 * Get log entries for a specific actor
 */
export function getActorLog(actorId) {
  const fullLog = getHeroPointsLog();
  return fullLog.filter(entry => entry.actorId === actorId);
}

/**
 * Clear the entire log (GM only)
 */
export function clearHeroPointsLog() {
  if (!game.user.isGM) return;
  game.settings.set('rnk-reserves', 'heroPointsLog', []);
}

/**
 * Clear logs for a specific actor (GM only)
 */
export function clearActorLog(actorId) {
  if (!game.user.isGM) return;
  const currentLog = game.settings.get('rnk-reserves', 'heroPointsLog') || [];
  const filtered = currentLog.filter(entry => entry.actorId !== actorId);
  game.settings.set('rnk-reserves', 'heroPointsLog', filtered);
}

/**
 * Get summary of current hero points for all actors that have them
 */
export function getActorsSummary() {
  const summary = {};
  
  // Check all actors
  game.actors.forEach(actor => {
    const heroPoints = actor.getFlag('rnk-reserves', 'heroPoints');
    const isEnabled = actor.getFlag('rnk-reserves', 'heroPointsEnabled');
    
    // Include if they have points or are NPCs with enabled flag
    if (heroPoints !== undefined && heroPoints !== null) {
      summary[actor.id] = {
        id: actor.id,
        name: actor.name,
        type: actor.type,
        heroPoints: Math.max(0, heroPoints),
        isEnabled: isEnabled || false,
        lastSpend: getLatestActorAction(actor.id)
      };
    }
  });
  
  return summary;
}

/**
 * Get the latest log entry for an actor
 */
function getLatestActorAction(actorId) {
  const log = getActorLog(actorId);
  return log.length > 0 ? log[0] : null;
}

/**
 * Export log as JSON
 */
export function exportLogAsJSON() {
  const log = getHeroPointsLog();
  const summary = getActorsSummary();
  
  return {
    exported: new Date().toISOString(),
    totalEntries: log.entries,
    summary: summary,
    entries: log
  };
}
