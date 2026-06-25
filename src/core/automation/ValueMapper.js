function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * Math.max(0, Math.min(1, color)))
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function mapToRange(normalized, min, max) {
  return min + normalized * (max - min);
}

export function mapToBoolean(normalized) {
  return normalized <= 0.5;
}

export function mapToSelect(normalized, options) {
  const index = Math.min(Math.floor(normalized * options.length), options.length - 1);
  return options[index];
}

export function mapToColor(normalized) {
  return hslToHex(normalized * 360, 70, 50);
}

export function mapValue(normalized, paramType, mappingConfig) {
  switch (paramType) {
    case 'range':
      return mapToRange(normalized, mappingConfig.min, mappingConfig.max);
    case 'boolean':
      return mapToBoolean(normalized);
    case 'select':
      return mapToSelect(normalized, mappingConfig.options);
    case 'color':
      return mapToColor(normalized);
    default:
      return normalized;
  }
}
