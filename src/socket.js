/**
 * Socket communication for RNK Reserves
 */
import { logHeroPointSpending } from './logger.js';

export function registerSocket() {
  // Register socket handler
  game.socket.on('module.rnk-reserves', (data) => {
    handleSocketMessage(data);
  });
}

/**
 * Handle incoming socket messages
 */
function handleSocketMessage(data) {
  switch (data.type) {
    case 'updateHeroPoints':
      handleHeroPointsUpdate(data);
      break;
    case 'spendHeroPoint':
      handleHeroPointSpend(data);
      break;
  }
}

/**
 * Send socket message to all clients
 */
export function emitSocketMessage(type, data) {
  game.socket.emit('module.rnk-reserves', {
    type,
    ...data
  });
}

/**
 * Handle Hero Points update from socket
 */
function handleHeroPointsUpdate(data) {
  const actor = game.actors.get(data.actorId);
  if (actor) {
    const oldPoints = actor.getFlag('rnk-reserves', 'heroPoints') || 0;
    const newPoints = data.points;
    actor.setFlag('rnk-reserves', 'heroPoints', newPoints);
    
    // Log the update
    if (game.user.isGM) {
      logHeroPointSpending(
        data.actorId,
        actor.name,
        Math.max(0, oldPoints - newPoints),
        newPoints,
        'awarded',
        data.userId
      );
    }
  }
}

/**
 * Handle Hero Point spend from socket
 */
function handleHeroPointSpend(data) {
  const actor = game.actors.get(data.actorId);
  if (actor) {
    const currentPoints = actor.getFlag('rnk-reserves', 'heroPoints') || 0;
    if (currentPoints > 0) {
      const newPoints = currentPoints - 1;
      actor.setFlag('rnk-reserves', 'heroPoints', newPoints);
      
      // Log the spending
      if (game.user.isGM) {
        logHeroPointSpending(
          data.actorId,
          actor.name,
          1,
          newPoints,
          data.action || 'spent',
          data.userId
        );
      }
    }
  }
}