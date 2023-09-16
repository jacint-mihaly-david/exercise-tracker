const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const { DB_URL } = process.env;
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.use(bodyParser.urlencoded({ extended: "false" }));


// DB conneciton
mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

// DB schemas
const exerciseSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: String
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: String,
  log: [exerciseSchema]
}, { versionKey: false });

// DB models
mongoose.model('Exercise', exerciseSchema);
const User = mongoose.model('User', userSchema);

app.get('/api/users', async (req, res) => {
  const users = await User.find();
  const response = users.map(user => ({ username: user.username, _id: user._id }));
  res.json(response);
  return;
});

app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  const user = await User.create({ username });
  const { _id } = user;
  const response = { username, _id };
  res.json(response);
  return;
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  const { _id } = req.params;
  let {
    description,
    duration,
    date
  } = req.body;
  duration = Number(duration);
  if (!date) {
    date = new Date();
    date = date.toDateString();
  } else {
    date = new Date(date);
    date = date.toDateString();
  }
  const user = await User.findOneAndUpdate(
    { _id },
    { $push: { "log": { description, duration, date } } },
    { new: true }
  );
  const { username } = user;
  const response = { username, description, duration, date, _id }
  res.json(response);
  return;
});

app.get('/api/users/:_id/logs?', async (req, res) => {
  const { from, to, limit } = req.query;
  const { _id } = req.params;
  let user = await User.findOne({ _id });
  if (!user.log) user.log = [];
  const count = user.log.length;
  let { username, log } = user;
  if (from) log = log.filter(exercise => Date.parse(exercise.date) > Date.parse(from));
  if (to) log = log.filter(exercise => Date.parse(exercise.date) < Date.parse(to));
  if (limit) log = log.slice(-Number(limit));
  const response = { username, _id, log, count };
  res.json(response);
  return;
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
