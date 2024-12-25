export function calculateNewCost(currentCost: number, count: number) {
  const additionalCost = 0.01 * Math.pow(2, count);
  return currentCost + additionalCost;
}
export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
