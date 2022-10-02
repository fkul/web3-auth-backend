export const mapToArray = <K, V>(map: Map<K, V>) =>
  [...map].map(([, value]) => value);
