import moment from 'moment'

/**
 * Add support for keepCharPositions
 * Add check for valid date with moment.js
 * Breaking change (v 3.7.2): now use ISO-8601 format (https://en.wikipedia.org/wiki/ISO_8601)
 * Fork from https://github.com/text-mask/text-mask/blob/master/addons/src/createAutoCorrectedDatePipe.js
 * @param dateFormat
 * @returns {Function}
 */
export default function createAutoCorrectedDatePipe(dateFormat = 'MM-DD-YYYY') {
  return function(conformedValue, config) {
    const indexesOfPipedChars = []
    const dateFormatArray = dateFormat.split(/[^DMYHhmsSZAa]+/)
    const maxValue = {
      'DD': 31, 'MM': 12, 'YY': 99, 'YYYY': 9999, 'HH': 23, 'hh': 12, 'mm': 59, 'ss': 59, 'SSS': 999, 'ZZ': 1400
    }
    const minValue = {
      'DD': 1, 'MM': 1, 'YY': 0, 'YYYY': 1, 'HH': 0, 'hh': 0, 'mm': 0, 'ss': 0, 'SSS': 0, 'ZZ': -1200
    }
    const conformedValueArr = conformedValue.split('')

    // Check first digit
    dateFormatArray.forEach((format) => {
      const position = dateFormat.indexOf(format)
      // custom format could contains non-numerical value, such as A to refers to 'am' 'pm', at the end of the format
      // check only if a maxValue is defined for the current format
      const _maxValue = maxValue[format]
      if (_maxValue) {
        const maxFirstDigit = parseInt(_maxValue.toString().substr(0, 1), 10)

        if (parseInt(conformedValueArr[position], 10) > maxFirstDigit) {
          if (!config || !config.keepCharPositions) {
            conformedValueArr[position + 1] = conformedValueArr[position]
            conformedValueArr[position] = 0
            indexesOfPipedChars.push(position)
          }
        }
      }
    })

    // Check for invalid date
    let isInvalid = dateFormatArray.some((format) => {
      const position = dateFormat.indexOf(format)
      const length = format.length
      const textValue = conformedValue.substr(position, length).replace(/\D/g, '')
      const value = parseInt(textValue, 10)

      return value > maxValue[format] || (textValue.length === length && value < minValue[format])
    })

    // format is valid, and each values are valid separately, but is this date an existing date?
    // TODO: we need to know if the selection is 'complete'. It works only if placeholderChar isn't a whitespace
    // For now checking the presence of a placeholder is not safe as the placeholder could be a whitespace
    if (!isInvalid && config && conformedValue.indexOf(config.placeholderChar) === -1) {
      // now verify if the date itself is an existing date
      const _moment = moment(conformedValue, dateFormat)
      isInvalid = !_moment.isValid()
    }

    if (isInvalid) {
      return false
    }

    return {
      value: conformedValueArr.join(''),
      indexesOfPipedChars
    }
  }
}
