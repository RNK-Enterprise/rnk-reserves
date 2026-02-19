/**
 * Socket communication for RNK Reserves
 */

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
    actor.setFlag('rnk-reserves', 'heroPoints', data.points);
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
      actor.setFlag('rnk-reserves', 'heroPoints', currentPoints - 1);
    }
  }
}