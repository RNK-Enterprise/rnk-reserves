import { emitSocketMessage } from '../socket.js';

export function addHeroPointButtons(message, html, data) {
  // Only add if actor has Hero Points
  const actor = getActorFromMessage(message);
  if (!actor) return;

  const heroPoints = actor.getFlag('rnk-reserves', 'heroPoints') || 0;
  if (heroPoints <= 0) return;

  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'rnk-reserves-buttons';
  buttonContainer.innerHTML = `
    <div class="rnk-reserves-header">
      <span>Hero Points: ${heroPoints}</span>
    </div>
    <div class="rnk-reserves-actions">
      <button class="rnk-reserves-btn" data-action="reroll">Reroll (1)</button>
      <button class="rnk-reserves-btn" data-action="bonus">+10 (1)</button>
      <button class="rnk-reserves-btn" data-action="heal">Heal (1)</button>
    </div>
  `;

  // Add to chat message
  if (html.find('.message-content').length) {
    html.find('.message-content').append(buttonContainer);
  } else {
    html.append(buttonContainer);
  }

  // Add event listeners
  buttonContainer.addEventListener('click', (event) => {
    const action = event.target.dataset.action;
    if (action) {
      handleHeroPointAction(actor, action, message);
    }
  });
}

/**
 * Get actor from chat message
 */
function getActorFromMessage(message) {
  if (message.speaker?.actor) {
    return game.actors.get(message.speaker.actor);
  }
  if (message.speaker?.token) {
    const token = canvas.tokens.get(message.speaker.token);
    return token?.actor;
  }
  return null;
}

/**
 * Handle Hero Point spending actions
 */
async function handleHeroPointAction(actor, action, message) {
  const heroPoints = actor.getFlag('rnk-reserves', 'heroPoints') || 0;
  if (heroPoints <= 0) {
    ui.notifications.warn('No Hero Points available!');
    return;
  }

  // Confirm spending
  const confirmed = await Dialog.confirm({
    title: 'Spend Hero Point?',
    content: `Spend 1 Hero Point to ${getActionDescription(action)}?`
  });

  if (!confirmed) return;

  // Spend the point
  await actor.setFlag('rnk-reserves', 'heroPoints', heroPoints - 1);

  // Emit socket to sync
  emitSocketMessage('spendHeroPoint', {
    actorId: actor.id,
    action: action
  });

  // Apply the action
  switch (action) {
    case 'reroll':
      await handleReroll(message);
      break;
    case 'bonus':
      await handleBonus(message);
      break;
    case 'heal':
      await handleHeal(actor);
      break;
  }
}

/**
 * Get description for action
 */
function getActionDescription(action) {
  switch (action) {
    case 'reroll': return 'reroll this roll';
    case 'bonus': return 'add +10 to this roll';
    case 'heal': return 'regain hit points';
    default: return 'perform action';
  }
}

/**
 * Handle reroll action
 */
async function handleReroll(message) {
  // For now, just notify - would need to re-roll the original roll
  ui.notifications.info('Hero Point spent for reroll! (Re-roll manually)');
  // Future: Implement automatic reroll if possible
}

/**
 * Handle bonus action
 */
async function handleBonus(message) {
  // For now, just notify - would need to modify the roll result
  ui.notifications.info('Hero Point spent for +10 bonus! (Apply manually)');
  // Future: Implement automatic bonus if possible
}

/**
 * Handle heal action
 */
async function handleHeal(actor) {
  const level = actor.system.details?.level || 1;
  const healAmount = new Roll('1d6 + @level', { level }).evaluate({ async: false });
  await actor.update({
    'system.attributes.hp.value': Math.min(
      actor.system.attributes.hp.value + healAmount.total,
      actor.system.attributes.hp.max
    )
  });
  ui.notifications.info(`Hero Point spent! Regained ${healAmount.total} HP.`);
}