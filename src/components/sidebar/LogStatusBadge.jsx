/**
 * @file Smart badge component that shows itself if there are unread
 * log messages with a given minimum severity level.
 */

import { connect } from 'react-redux'

import SidebarBadge from './SidebarBadge'

import { colorForLogLevel, LogLevel } from '../../utils/logging'

/**
 * Smart badge component that colors and shows itself according to the
 * status of all the connections reported by the server.
 */
export default connect(
  // mapStateToProps
  (state, ownProps) => {
    const level = state.log.highestUnseenMessageLevel
    return {
      color: colorForLogLevel(level),
      visible: level >= (ownProps.level || LogLevel.WARNING)
    }
  }
)(SidebarBadge)