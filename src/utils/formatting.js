/**
 * Formats a mission-specific ID in a consistent manner that is to be used
 * everywhere throughout the UI.
 */
export function formatMissionId(index) {
  return `s${index + 1}`;
}

/**
 * Formats a list of IDs in a manner that is suitable for cases when we
 * expect the list to contain only a few items, and we are not interested in
 * all of them if there are too many.
 *
 * @param  {string[]}  uavIds  the array of IDs to format
 * @param  {number}    maxCount  the maximum number of UAV IDs to show before
 *         adding the "+X more" suffix
 * @return {string}  the formatted UAV ID list
 */
export function formatIdsAndTruncateTrailingItems(
  ids,
  { maxCount = 8, separator = ' \u00B7 ' } = {}
) {
  const length = Array.isArray(ids) ? ids.length : 0;
  if (length === 0) {
    return '';
  }

  if (length > maxCount) {
    return (
      ids.slice(0, maxCount - 1).join(separator) +
      ' and ' +
      (length - maxCount + 1) +
      ' more'
    );
  }

  return ids.join(separator);
}
