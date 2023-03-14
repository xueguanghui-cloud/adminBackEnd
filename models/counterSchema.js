/**
 * 维护员工ID自增长
 * @format */

const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  _id: String,
  squence_value: Number
});

module.exports = mongoose.model('counter', userSchema, 'counter');
