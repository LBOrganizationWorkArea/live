/**
 * @file Slice of the state object that handles the state of the current
 * mission, i.e. a set of trajectories and commands that a group of UAVs must
 * perform, as well as a mapping from the mission-specific identifiers of
 * the UAVs to the real, physicaly identifiers of the UAVs that participate
 * in the mission.
 */

import isNil from 'lodash-es/isNil';

import { createSlice } from '@reduxjs/toolkit';

import { getNewEditIndex } from './utils';

const { actions, reducer } = createSlice({
  name: 'mission',

  initialState: {
    // Stores a mapping from the mission-specific consecutive identifiers
    // to the IDs of the UAVs that participate in the mission with that
    // mission-specific identifier. The mapping may store UAV IDs and
    // null values for identifiers where the corresponding physical UAV
    // is not assigned yet.
    mapping: ['03', null, '01', '02', null],

    mappingEditor: {
      // Stores whether the mapping is currently being edited on the UI
      enabled: false,

      // Stores the index of the slot in the mapping that is being edited;
      // -1 if no slot is being edited
      indexBeingEdited: -1
    }
  },

  reducers: {
    adjustMissionMapping(state, action) {
      const { uavId, to } = action.payload;
      const from = state.mapping.indexOf(uavId);
      const uavIdToReplace = isNil(to) ? null : state.mapping[to];

      if (uavIdToReplace === undefined) {
        uavIdToReplace = null;
      }

      if (from >= 0) {
        state.mapping[from] = uavIdToReplace;
      }

      if (!isNil(to)) {
        state.mapping[to] = uavId;
      }
    },

    /**
     * Cancels the current editing session of the mapping at the current slot.
     */
    cancelMappingEditorSessionAtCurrentSlot(state) {
      state.mappingEditor.indexBeingEdited = -1;
    },

    /**
     * Clears the entire mission mapping.
     */
    clearMapping(state) {
      const numItems = state.mapping.length;
      state.mapping = new Array(numItems).fill(undefined);
    },

    /**
     * Clears a single slot in the mission mapping.
     */
    clearMappingSlot(state, action) {
      const index = action.payload;
      const numItems = state.mapping.length;
      if (index >= 0 && index < numItems) {
        state.mapping[index] = undefined;
      }
    },

    /**
     * Finishes the current editing session of the mapping.
     */
    finishMappingEditorSession: {
      prepare: () => ({}), // this is to swallow event arguments
      reducer(state) {
        state.mappingEditor.enabled = false;
        state.mappingEditor.indexBeingEdited = -1;
      }
    },

    /**
     * Commits the new value in the mapping editor to the current slot being
     * edited, and optionally continues with the next slot.
     */
    commitMappingEditorSessionAtCurrentSlot(state, action) {
      const { continuation, value } = action.payload;
      const validatedValue =
        typeof value === 'string' && value.length > 0 ? value : null;
      const index = state.mappingEditor.indexBeingEdited;
      const numItems = state.mapping.length;

      if (index >= 0 && index < numItems) {
        const oldValue = state.mapping[index];
        const existingIndex = state.mapping.indexOf(validatedValue);

        // Prevent duplicates: if the value being entered already exists
        // elsewhere in the mapping, swap it with the old value of the
        // slot being edited.
        if (existingIndex >= 0) {
          state.mapping[existingIndex] = oldValue;
        }

        state.mapping[index] = validatedValue;
      }

      state.mappingEditor.indexBeingEdited = getNewEditIndex(
        state,
        continuation
      );
    },

    /**
     * Removes a single UAV from the mission mapping.
     */
    removeUAVsFromMapping(state, action) {
      for (const uavId of action.payload) {
        const index = state.mapping.indexOf(uavId);
        if (index >= 0) {
          state.mapping[index] = null;
        }
      }
    },

    /**
     * Starts the current editing session of the mapping, and marks the
     * given slot in the mapping as the one being edited.
     */
    startMappingEditorSessionAtSlot(state, action) {
      const tentativeIndex =
        typeof action.payload === 'number' ? action.payload : -1;
      const numItems = state.mapping.length;
      const index =
        tentativeIndex < 0 || tentativeIndex >= numItems ? -1 : tentativeIndex;

      state.mappingEditor.enabled = true;
      state.mappingEditor.indexBeingEdited = index;
    },

    /**
     * Starts the current editing session of the mapping.
     */
    startMappingEditorSession: {
      prepare: () => ({}), // this is to swallow event arguments
      reducer(state) {
        state.mappingEditor.enabled = true;
        state.mappingEditor.indexBeingEdited = -1;
      }
    }
  }
});

export const {
  adjustMissionMapping,
  cancelMappingEditorSessionAtCurrentSlot,
  clearMapping,
  clearMappingSlot,
  commitMappingEditorSessionAtCurrentSlot,
  finishMappingEditorSession,
  removeUAVsFromMission,
  startMappingEditorSession,
  startMappingEditorSessionAtSlot
} = actions;

export default reducer;
