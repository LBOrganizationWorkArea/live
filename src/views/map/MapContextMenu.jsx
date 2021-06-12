/**
 * @file Context menu using a Popover element that displays connands to send to the
 * currently selected UAVs.
 */

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Divider from '@material-ui/core/Divider';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import MenuItem from '@material-ui/core/MenuItem';

import ActionDelete from '@material-ui/icons/Delete';
import Assignment from '@material-ui/icons/Assignment';
import Edit from '@material-ui/icons/Edit';
import Flight from '@material-ui/icons/Flight';
import FlightTakeoff from '@material-ui/icons/FlightTakeoff';
import FlightLand from '@material-ui/icons/FlightLand';
import Grain from '@material-ui/icons/Grain';
import Home from '@material-ui/icons/Home';
import ActionPowerSettingsNew from '@material-ui/icons/PowerSettingsNew';
import PinDrop from '@material-ui/icons/PinDrop';
import Refresh from '@material-ui/icons/Refresh';

import { createSelector } from '@reduxjs/toolkit';

import { showFeatureEditorDialog } from '~/actions/feature-editor';
import { removeFeatures } from '~/actions/features';
import { setFlatEarthCoordinateSystemOrigin } from '~/actions/map-origin';

import ContextMenu from '~/components/ContextMenu';

import {
  clearGeofencePolygonId,
  setGeofencePolygonId,
} from '~/features/mission/slice';
import { getGeofencePolygonId } from '~/features/mission/selectors';
import { updateOutdoorShowSettings } from '~/features/show/actions';
import { openFlyToTargetDialogWithCoordinate } from '~/features/uav-control/actions';
import { openUAVDetailsDialog } from '~/features/uavs/details';

import {
  getSelectedFeatureIds,
  getSelectedFeatureLabels,
  getSelectedFeatureTypes,
  getSelectedUAVIds,
} from '~/selectors/selection';

import { hasFeature } from '~/utils/configuration';
import * as messaging from '~/utils/messaging';

/**
 * Context menu that shows the menu items that should appear when the
 * user right-clicks on the map.
 */
class MapContextMenu extends React.Component {
  static propTypes = {
    clearGeofencePolygonId: PropTypes.func,
    contextProvider: PropTypes.func,
    editFeature: PropTypes.func,
    openUAVDetailsDialog: PropTypes.func,
    removeFeaturesByIds: PropTypes.func,
    setGeofencePolygonId: PropTypes.func,
    setMapCoordinateSystemOrigin: PropTypes.func,
    setShowCoordinateSystemOrigin: PropTypes.func,
    showFlyToTargetDialog: PropTypes.func,
  };

  constructor() {
    super();
    this._contextMenu = React.createRef();
  }

  /**
   * Public method to open the context menu.
   *
   * @param {Object} position Coordinates where the absolutely positioned popup
   * should appear.
   * @property {number} x The value to forward as `left` into the style object.
   * @property {number} y The value to forward as `top` into the style object.
   * @param {Object} context  Context object to pass to the click handlers of
   *        the menu items in the context menu as their second argument
   */
  open = (position, context) => {
    if (this._contextMenu.current) {
      this._contextMenu.current.open(position, context);
    }
  };

  render() {
    return (
      <ContextMenu
        ref={this._contextMenu}
        contextProvider={this.props.contextProvider}
      >
        {({
          selectedFeatureIds,
          selectedFeatureTypes,
          selectedUAVIds,
          geofencePolygonId,
        }) => {
          const result = [];
          const hasSelectedUAVs = selectedUAVIds && selectedUAVIds.length > 0;
          const hasSingleSelectedFeature =
            selectedFeatureIds && selectedFeatureIds.length === 1;
          const hasSingleSelectedUAV =
            selectedUAVIds && selectedUAVIds.length === 1;
          const hasSelectedFeatures =
            selectedFeatureIds && selectedFeatureIds.length > 0;

          if (hasSelectedUAVs) {
            result.push(
              <MenuItem
                key='fly'
                dense
                onClick={this._moveSelectedUAVsAtCurrentAltitude}
              >
                <ListItemIcon>
                  <Flight />
                </ListItemIcon>
                Fly here
              </MenuItem>,
              <MenuItem
                key='flyAtAltitude'
                dense
                onClick={this._moveSelectedUAVsAtGivenAltitude}
              >
                <ListItemIcon>
                  <Flight />
                </ListItemIcon>
                Fly here at altitude…
              </MenuItem>,
              <Divider key='div1' />,
              <MenuItem key='takeoff' dense onClick={this._takeoffUAVs}>
                <ListItemIcon>
                  <FlightTakeoff />
                </ListItemIcon>
                Takeoff
              </MenuItem>,
              <MenuItem key='land' dense onClick={this._landUAVs}>
                <ListItemIcon>
                  <FlightLand />
                </ListItemIcon>
                Land
              </MenuItem>,
              <MenuItem key='home' dense onClick={this._returnSelectedUAVs}>
                <ListItemIcon>
                  <Home />
                </ListItemIcon>
                Return to home
              </MenuItem>,
              <MenuItem
                key='message'
                dense
                disabled={!hasSingleSelectedUAV}
                onClick={this._openDetailsDialogForSelectedUAVs}
              >
                <ListItemIcon>
                  <Assignment />
                </ListItemIcon>
                Properties...
              </MenuItem>,
              <Divider key='div2' />,
              <MenuItem key='reset' dense onClick={this._resetUAVs}>
                <ListItemIcon>
                  <Refresh color='secondary' />
                </ListItemIcon>
                Reboot
              </MenuItem>,
              <MenuItem
                key='shutdown'
                dense
                onClick={this._shutdownSelectedUAVs}
              >
                <ListItemIcon>
                  <ActionPowerSettingsNew color='secondary' />
                </ListItemIcon>
                Halt
              </MenuItem>,
              <Divider key='div3' />
            );
          }

          if (this.props.setMapCoordinateSystemOrigin) {
            result.push(
              <MenuItem
                key='setMapCoordinateSystemOrigin'
                dense
                onClick={this._setMapCoordinateSystemOrigin}
              >
                <ListItemIcon>
                  <PinDrop />
                </ListItemIcon>
                Set map origin here
              </MenuItem>
            );
          }

          if (this.props.setShowCoordinateSystemOrigin) {
            result.push(
              <MenuItem
                key='setShowCoordinateSystemOrigin'
                dense
                onClick={this._setShowCoordinateSystemOrigin}
              >
                <ListItemIcon>
                  <Grain />
                </ListItemIcon>
                Set show origin here
              </MenuItem>
            );
          }

          if (hasSingleSelectedFeature) {
            const geofenceCompatibleFeatureTypes = [
              /* 'circle', */
              'lineString',
              'polygon',
            ];

            const featureSuitableForGeofence =
              geofenceCompatibleFeatureTypes.includes(selectedFeatureTypes[0]);
            const isCurrentGeofence =
              selectedFeatureIds[0] === geofencePolygonId;
            result.push(
              <Divider key='div5' />,
              <MenuItem
                key='geofence'
                dense
                disabled={!featureSuitableForGeofence}
                onClick={
                  isCurrentGeofence
                    ? this._unsetSelectedFeatureAsGeofence
                    : this._setSelectedFeatureAsGeofence
                }
              >
                <ListItemIcon>{null}</ListItemIcon>
                {isCurrentGeofence ? 'Clear geofence' : 'Use as geofence'}
              </MenuItem>
            );
          }

          if (hasSelectedFeatures) {
            result.push(
              <Divider key='div4' />,
              <MenuItem
                key='setProperties'
                dense
                disabled={
                  !selectedFeatureIds || selectedFeatureIds.length !== 1
                }
                onClick={this._editSelectedFeature}
              >
                <ListItemIcon>
                  <Edit />
                </ListItemIcon>
                Properties…
              </MenuItem>,
              <MenuItem
                key='remove'
                dense
                disabled={
                  !selectedFeatureIds || selectedFeatureIds.length === 0
                }
                onClick={this._removeSelectedFeatures}
              >
                <ListItemIcon>
                  <ActionDelete />
                </ListItemIcon>
                Remove
              </MenuItem>
            );
          }

          return result;
        }}
      </ContextMenu>
    );
  }

  _moveSelectedUAVsAtCurrentAltitude = (_event, context) => {
    const { coords, selectedUAVIds } = context;
    messaging.moveUAVs(selectedUAVIds, {
      target: {
        lat: coords[1],
        lon: coords[0],
      },
    });
  };

  _moveSelectedUAVsAtGivenAltitude = async (_event, context) => {
    const coords = [...context.coords];
    const selectedUAVIds = [...context.selectedUAVIds];
    /* TODO(ntamas): use AGL of selected UAVs */
    this.props.showFlyToTargetDialog({ coords, uavIds: selectedUAVIds });
  };

  _editSelectedFeature = (_event, context) => {
    const { editFeature } = this.props;
    const { selectedFeatureIds } = context;
    if (!editFeature || selectedFeatureIds.length !== 1) {
      return;
    }

    editFeature(selectedFeatureIds[0]);
  };

  _takeoffUAVs = (_event, context) => {
    const { selectedUAVIds } = context;
    messaging.takeoffUAVs(selectedUAVIds);
  };

  _landUAVs = (_event, context) => {
    const { selectedUAVIds } = context;
    messaging.landUAVs(selectedUAVIds);
  };

  _unsetSelectedFeatureAsGeofence = (_event, _context) => {
    const { clearGeofencePolygonId } = this.props;
    if (clearGeofencePolygonId) {
      clearGeofencePolygonId();
    }
  };

  _setSelectedFeatureAsGeofence = (_event, context) => {
    const { setGeofencePolygonId } = this.props;
    const { selectedFeatureIds } = context;

    if (setGeofencePolygonId) {
      setGeofencePolygonId(selectedFeatureIds[0]);
    }

    // this.props.setFeatureAsGeofence(selectedFeatureIds[0]);
  };

  _openDetailsDialogForSelectedUAVs = (_event, context) => {
    const { selectedUAVIds } = context;
    const { openUAVDetailsDialog } = this.props;

    if (openUAVDetailsDialog && selectedUAVIds.length > 0) {
      openUAVDetailsDialog(selectedUAVIds[0]);
    }
  };

  _removeSelectedFeatures = (_event, context) => {
    const { selectedFeatureIds } = context;
    const { removeFeaturesByIds } = this.props;

    if (removeFeaturesByIds) {
      removeFeaturesByIds(selectedFeatureIds);
    }
  };

  _resetUAVs = (_event, context) => {
    const { selectedUAVIds } = context;
    messaging.resetUAVs(selectedUAVIds);
  };

  _returnSelectedUAVs = (_event, context) => {
    const { selectedUAVIds } = context;
    messaging.returnToHomeUAVs(selectedUAVIds);
  };

  _setMapCoordinateSystemOrigin = (_event, context) => {
    const { coords } = context;
    if (coords) {
      this.props.setMapCoordinateSystemOrigin(coords);
    }
  };

  _setShowCoordinateSystemOrigin = (_event, context) => {
    const { coords } = context;
    if (coords) {
      this.props.setShowCoordinateSystemOrigin(coords);
    }
  };

  _shutdownSelectedUAVs = (_event, context) => {
    const { selectedUAVIds } = context;
    messaging.shutdownUAVs(selectedUAVIds);
  };
}

const hasFeatures = hasFeature('features');
const hasGeofence = hasFeature('geofence');
const hasShowControl = hasFeature('showControl');

const getContextProvider = createSelector(
  getSelectedFeatureIds,
  getSelectedFeatureLabels,
  getSelectedFeatureTypes,
  getSelectedUAVIds,
  getGeofencePolygonId,
  (
      selectedFeatureIds,
      selectedFeatureLabels,
      selectedFeatureTypes,
      selectedUAVIds,
      geofencePolygonId
    ) =>
    (context) => ({
      selectedFeatureIds,
      selectedFeatureLabels,
      selectedFeatureTypes,
      selectedUAVIds,
      geofencePolygonId,
      ...context,
    })
);

const MapContextMenuContainer = connect(
  // mapStateToProps
  (state) => ({
    contextProvider: getContextProvider(state),
  }),
  // mapDispatchToProps
  {
    clearGeofencePolygonId: hasGeofence ? clearGeofencePolygonId : null,
    editFeature: hasFeatures ? showFeatureEditorDialog : null,
    openUAVDetailsDialog,
    removeFeaturesByIds: hasFeatures ? removeFeatures : null,
    setGeofencePolygonId: hasGeofence ? setGeofencePolygonId : null,
    setMapCoordinateSystemOrigin: setFlatEarthCoordinateSystemOrigin,
    setShowCoordinateSystemOrigin: hasShowControl
      ? (coords) =>
          updateOutdoorShowSettings({ origin: coords, setupMission: true })
      : null,
    showFlyToTargetDialog: openFlyToTargetDialogWithCoordinate,
  },
  null,
  { forwardRef: true }
)(MapContextMenu);

export default MapContextMenuContainer;
