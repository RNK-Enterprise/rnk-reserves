/**
 * RNK Reserves Application Class
 * Placeholder for future GM controls or additional UI
 */
import { emitSocketMessage } from '../socket.js';

export class RNKReserves extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'rnk-reserves',
      title: 'RNK Reserves',
      template: 'modules/rnk-reserves/templates/settings.html',
      width: 500,
      height: 'auto',
      resizable: true,
      closeOnSubmit: false,
      submitOnChange: false,
      submitOnClose: false
    });
  }

  getData() {
    return {
      targetActorUuid: game.settings.get('rnk-reserves', 'targetActorUuid')
    };
  }

  async _updateObject(event, formData) {
    // Required by FormApplication, but handling logic manually in listeners for now
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Save UUID on change
    html.find('input[name="targetActorUuid"]').on('change', event => {
      const value = event.target.value;
      game.settings.set('rnk-reserves', 'targetActorUuid', value);
    });

    // Get UUID from selection
    html.find('.rnk-get-uuid').on('click', event => {
      const tokens = canvas.tokens.controlled;
      if (tokens.length === 0) {
        return ui.notifications.warn("No token selected on the canvas!");
      }
      const actor = tokens[0].actor;
      if (!actor) return;
      
      const uuid = actor.uuid;
      html.find('input[name="targetActorUuid"]').val(uuid).trigger('change');
      ui.notifications.info(`Target set to: ${actor.name}`);
    });

    // Award points
    html.find('.rnk-award-points').on('click', async event => {
      const uuid = game.settings.get('rnk-reserves', 'targetActorUuid');
      const pointsToAdd = parseInt(html.find('input[name="pointsToAdd"]').val()) || 0;

      if (!uuid) {
        return ui.notifications.error("No target actor UUID specified!");
      }

      try {
        const actor = await fromUuid(uuid);
        if (!actor || actor.documentName !== "Actor") {
          return ui.notifications.error("Invalid Actor UUID!");
        }

        const currentPoints = actor.getFlag('rnk-reserves', 'heroPoints') || 0;
        const level = actor.system.details?.level || 1;
        const maxPoints = 5 + Math.floor(level / 2);
        const newPoints = Math.min(currentPoints + pointsToAdd, maxPoints);

        await actor.setFlag('rnk-reserves', 'heroPoints', newPoints);
        
        // Emit socket to sync
        emitSocketMessage('updateHeroPoints', {
          actorId: actor.id,
          points: newPoints
        });
        
        ui.notifications.info(`Awarded ${pointsToAdd} Hero Points to ${actor.name}. Total: ${newPoints}`);
      } catch (err) {
        ui.notifications.error("Error retrieving actor from UUID.");
        console.error(err);
      }
    });
  }
}