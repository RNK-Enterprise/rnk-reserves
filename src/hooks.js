import { emitSocketMessage } from './socket.js';

/**
 * Get actor from chat message
 */
function getActorFromMessage(message) {
  if (!game?.actors || !message?.speaker) return null;
  
  if (message.speaker.actor) {
    return game.actors.get(message.speaker.actor);
  }
  if (message.speaker.token && canvas?.tokens) {
    const token = canvas.tokens.get(message.speaker.token);
    return token?.actor;
  }
  return null;
}

/**
 * Add Hero Point buttons to chat messages and roll dialogs
 */
function addHeroPointButtons(message, html, data) {
  // Only add if actor has Hero Points (for display)
  if (!html || !message) return;
  
  const actor = getActorFromMessage(message);
  if (!actor) return;

  // Skip NPCs unless explicitly enabled
  if (actor.type === 'npc' && !actor.getFlag('rnk-reserves', 'heroPointsEnabled')) return;

  const heroPoints = actor.getFlag ? (actor.getFlag('rnk-reserves', 'heroPoints') || 0) : 0;

  // Check if heal button is enabled (global setting + per-actor flag)
  const globalHeal = game.settings.get('rnk-reserves', 'enableHealButton');
  const actorHeal = actor.getFlag('rnk-reserves', 'healEnabled') ?? true;
  const showHeal = globalHeal && actorHeal;

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
      ${showHeal ? '<button class="rnk-reserves-btn" data-action="heal">Heal (1)</button>' : ''}
    </div>
  `;

  // Add to chat message
  const messageContent = html.querySelector('.message-content');
  if (messageContent) {
    messageContent.appendChild(buttonContainer);
  } else {
    html.appendChild(buttonContainer);
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
  ui.notifications.info('Hero Point spent for reroll! (Re-roll manually)');
}

/**
 * Handle bonus action
 */
async function handleBonus(message) {
  ui.notifications.info('Hero Point spent for +10 bonus! (Apply manually)');
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

export function registerHooks() {
  // Add buttons to chat messages
  Hooks.on('renderChatMessageHTML', (message, html, data) => {
    if (!game || !game.users) return;
    
    // GM always sees, players only if they have points
    if (!game.user.isGM) {
      const actor = getActorFromMessage(message);
      if (!actor) return;
      const heroPoints = actor.getFlag('rnk-reserves', 'heroPoints') || 0;
      if (heroPoints <= 0) return;
    }
    addHeroPointButtons(message, html, data);
  });

  // Add buttons to roll dialogs
  Hooks.on('renderDialog', (dialog, html, data) => {
    // GM always sees, players only if they have points
    if (!game.user.isGM) {
      // For dialogs, check if there's an actor context
      // This might need adjustment based on dialog type
      return; // Skip for now, focus on chat messages
    }
    if (dialog.title?.includes('Roll') || dialog.title?.includes('Check')) {
      addHeroPointButtons(dialog, html, data);
    }
  });

  // Add GM controls to actor sheets
  Hooks.on('renderActorSheet5e', (sheet, html, data) => {
    if (!game.user.isGM) return;
    addGMControls(sheet, html, data);
  });

  // Initialize Hero Points on actors
  Hooks.on('ready', () => {
    // Auto-award points if enabled
    if (game.settings.get('rnk-reserves', 'autoAward') && game.user.isGM) {
      awardSessionPoints();
    }

    // Ensure all actors have Hero Points initialized
    game.actors.forEach(actor => {
      initializeHeroPoints(actor);
    });
  });

  // Sync Hero Points when actor updates
  Hooks.on('updateActor', (actor, data, options, userId) => {
    // Handle Hero Points updates
    if (data.flags?.['rnk-reserves']?.heroPoints !== undefined) {
      // Update UI if needed
      updateHeroPointsDisplay(actor);
    }
  });
}

/**
 * Award session points to all player characters
 */
function awardSessionPoints() {
  const points = game.settings.get('rnk-reserves', 'pointsPerSession');
  const maxPoints = game.settings.get('rnk-reserves', 'maxPoints');

  game.actors.forEach(actor => {
    if (actor.type === 'character' && actor.hasPlayerOwner) {
      const currentPoints = actor.getFlag('rnk-reserves', 'heroPoints') || 0;
      const newPoints = Math.min(currentPoints + points, maxPoints);
      actor.setFlag('rnk-reserves', 'heroPoints', newPoints);
    }
  });
}

/**
 * Initialize Hero Points on an actor
 */
function initializeHeroPoints(actor) {
  // Skip NPCs — they must be explicitly enabled via the API
  if (actor.type === 'npc') return;

  if (!actor.getFlag('rnk-reserves', 'heroPoints')) {
    actor.setFlag('rnk-reserves', 'heroPoints', 0);
  }
}

/**
 * Update Hero Points display (placeholder for future UI)
 */
function updateHeroPointsDisplay(actor) {
  // Future: Update any UI elements showing Hero Points
}

/**
 * Add GM controls to actor sheet
 */
function addGMControls(sheet, html, data) {
  const actor = sheet.actor;

  // Skip NPCs unless explicitly enabled
  if (actor.type === 'npc' && !actor.getFlag('rnk-reserves', 'heroPointsEnabled')) return;

  const heroPoints = actor.getFlag('rnk-reserves', 'heroPoints') || 0;
  const healEnabled = actor.getFlag('rnk-reserves', 'healEnabled') ?? true;

  // Create GM controls container
  const gmControls = document.createElement('div');
  gmControls.className = 'rnk-reserves-gm-controls';
  gmControls.innerHTML = `
    <div class="rnk-reserves-gm-header">
      <span>Hero Points: ${heroPoints}</span>
    </div>
    <div class="rnk-reserves-gm-actions">
      <button class="rnk-reserves-gm-btn" data-action="award-1">+1</button>
      <button class="rnk-reserves-gm-btn" data-action="award-2">+2</button>
      <button class="rnk-reserves-gm-btn" data-action="award-3">+3</button>
      <button class="rnk-reserves-gm-btn" data-action="reset">Reset</button>
      <button class="rnk-reserves-gm-btn" data-action="set-zero">Set 0</button>
      <button class="rnk-reserves-gm-btn ${healEnabled ? 'active' : ''}" data-action="toggle-heal">${healEnabled ? 'Heal: ON' : 'Heal: OFF'}</button>
    </div>
  `;

  // Add to sheet header or appropriate location
  const header = html.find('.window-header');
  if (header.length) {
    header.append(gmControls);
  }

  // Add event listeners
  gmControls.addEventListener('click', async (event) => {
    const action = event.target.dataset.action;
    if (action) {
      await handleGMAction(actor, action);
    }
  });
}

/**
 * Handle GM actions for awarding/resetting Hero Points
 */
async function handleGMAction(actor, action) {
  const maxPoints = game.settings.get('rnk-reserves', 'maxPoints');
  let newPoints;

  switch (action) {
    case 'award-1':
      newPoints = Math.min((actor.getFlag('rnk-reserves', 'heroPoints') || 0) + 1, maxPoints);
      break;
    case 'award-2':
      newPoints = Math.min((actor.getFlag('rnk-reserves', 'heroPoints') || 0) + 2, maxPoints);
      break;
    case 'award-3':
      newPoints = Math.min((actor.getFlag('rnk-reserves', 'heroPoints') || 0) + 3, maxPoints);
      break;
    case 'reset':
      newPoints = game.settings.get('rnk-reserves', 'pointsPerSession');
      break;
    case 'set-zero':
      newPoints = 0;
      break;
    case 'toggle-heal': {
      const currentHeal = actor.getFlag('rnk-reserves', 'healEnabled') ?? true;
      await actor.setFlag('rnk-reserves', 'healEnabled', !currentHeal);
      ui.notifications.info(`Heal for ${actor.name} is now ${!currentHeal ? 'enabled' : 'disabled'}`);
      return;
    }
    default:
      return;
  }

  await actor.setFlag('rnk-reserves', 'heroPoints', newPoints);

  // Emit socket to sync
  emitSocketMessage('updateHeroPoints', {
    actorId: actor.id,
    points: newPoints
  });

  ui.notifications.info(`Hero Points for ${actor.name} set to ${newPoints}`);
}