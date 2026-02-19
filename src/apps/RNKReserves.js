/**
 * RNK Reserves Application Class
 * Placeholder for future GM controls or additional UI
 */

export class RNKReserves extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'rnk-reserves',
      title: 'RNK Reserves',
      template: 'modules/rnk-reserves/templates/settings.html',
      width: 400,
      height: 300,
      resizable: false
    });
  }

  getData() {
    return {
      // Future: Add data for GM controls
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    // Future: Add event listeners for GM controls
  }
}