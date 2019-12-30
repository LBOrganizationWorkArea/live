/**
 * @file Utility file for sharing messaging related code between components.
 */

import isNil from 'lodash-es/isNil';

import messageHub from '../message-hub';
import makeLogger from './logging';

const logger = makeLogger('messaging');

const processResponse = (expectedType, commandName) => response => {
  if (response) {
    const { body } = response;
    if (body) {
      const { failure, reason, type } = body;
      if (type === 'ACK-NAK') {
        logger.error(
          `${commandName} execution rejected by server; ` +
            `reason: ${reason || 'unknown'}`
        );
      } else if (type !== expectedType) {
        logger.error(
          `${commandName} response has an unexpected type: ` +
            `${type}, expected ${expectedType}`
        );
      } else if (failure) {
        logger.error(
          `${commandName} execution failed for ${failure.join(', ')}`
        );
      } else {
        logger.info(`${commandName} execution was successful`);
      }
    } else {
      logger.error(`${commandName} response has no body`);
    }
  } else {
    logger.error(`${commandName} response should not be empty`);
  }
};

export const takeoffUAVs = uavs =>
  messageHub
    .sendMessage({
      type: 'UAV-TAKEOFF',
      ids: uavs
    })
    .then(processResponse('UAV-TAKEOFF', 'Takeoff command'));

export const landUAVs = uavs =>
  messageHub
    .sendMessage({
      type: 'UAV-LAND',
      ids: uavs
    })
    .then(processResponse('UAV-LAND', 'Landing command'));

export const returnToHomeUAVs = uavs =>
  messageHub
    .sendMessage({
      type: 'UAV-RTH',
      ids: uavs
    })
    .then(processResponse('UAV-RTH', 'Return to home command'));

export const haltUAVs = uavs =>
  messageHub
    .sendMessage({
      type: 'UAV-HALT',
      ids: uavs
    })
    .then(processResponse('UAV-HALT', 'Halt command'));

export const moveUAVs = (uavs, target) =>
  messageHub
    .sendMessage({
      type: 'UAV-FLY',
      ids: uavs,
      target: [
        Math.round(target.lat * 1e7),
        Math.round(target.lon * 1e7),
        isNil(target.amsl) ? null : Math.round(target.amsl * 1e3),
        isNil(target.agl) ? null : Math.round(target.agl * 1e3)
      ]
    })
    .then(processResponse('UAV-FLY', 'Fly to target command'));

export const toggleErrorUAVs = (() => {
  let currentError = [];

  return async uavs => {
    currentError =
      currentError.length === 0 ? [Math.floor(Math.random() * 256)] : [];

    await messageHub.sendMessage({
      type: 'CMD-REQ',
      ids: uavs,
      command: 'error',
      args: currentError
    });

    logger.info(
      currentError.length === 0
        ? `The error state of UAVs ${uavs} were cleared.`
        : `UAVs ${uavs} were sent to error state ${currentError}.`
    );
  };
})();
