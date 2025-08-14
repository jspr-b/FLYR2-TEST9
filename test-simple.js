// Simple test to check date handling
const { getAmsterdamDateString } = require('./lib/amsterdam-time');

console.log('Current Amsterdam date:', getAmsterdamDateString());
console.log('Current local date:', new Date().toISOString().split('T')[0]);
console.log('Current time:', new Date().toString());