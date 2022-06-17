import { dockIdToGlobalId } from '~/model/identifiers';
import { setSelectedFeatures } from '~/features/map/selection';

/**
 * Action factory that creates an action that sets the set of selected
 * dock IDs in the map.
 *
 * @param {Array.<string>} ids  the IDs of the selected docking stations.
 *        Any docking stations whose ID is not in this set will be deselected,
 *        and so will be any feature that is not a docking station.
 * @return {Object} an appropriately constructed action
 */
export const setSelectedDockIds = (ids) =>
  setSelectedFeatures(ids.map(dockIdToGlobalId));
