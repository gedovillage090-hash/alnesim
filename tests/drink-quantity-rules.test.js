const assert = require('node:assert/strict');
const totalMealGuests = (actualMealGuests, giftMeals) =>
  Math.max(0, Number(actualMealGuests) || 0) + Math.max(0, Number(giftMeals) || 0);
const waterQty = (actualMealGuests, giftMeals = 0) => Math.ceil(totalMealGuests(actualMealGuests, giftMeals) / 5);
const softDrinkQty = (actualMealGuests, giftMeals = 0) => Math.ceil(totalMealGuests(actualMealGuests, giftMeals) / 12);
const cases = [
  [1, 0, 1, 1], [5, 0, 1, 1], [12, 0, 3, 1], [60, 0, 12, 5],
  [100, 0, 20, 9], [101, 0, 21, 9], [108, 0, 22, 9], [109, 0, 22, 10],
  [100, 1, 21, 9], [100, 5, 21, 9], [100, 10, 22, 10], [100, 12, 23, 10],
  [95, 5, 20, 9], [90, 10, 20, 9],
];
for (const [actual, gifts, expectedWater, expectedSoft] of cases) {
  assert.equal(waterQty(actual, gifts), expectedWater, `water for ${actual} actual + ${gifts} gift meals`);
  assert.equal(softDrinkQty(actual, gifts), expectedSoft, `soft drink for ${actual} actual + ${gifts} gift meals`);
}
console.log(`Passed ${cases.length * 2} drink quantity assertions, including gift meals.`);
