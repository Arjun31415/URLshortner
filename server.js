/* eslint-disable consistent-return */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const validUrl = require('valid-url');
const shortid = require('shortid');
const dns = require('dns');
const mongoose = require('mongoose');
// Basic Configuration
const app = express();
const port = process.env.PORT || 3000;
const Url = require('./models/url');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', (_, res) => res.sendFile(`${process.cwd()}/views/index.html`));

// Your first API endpoint
app.get('/api/hello', (req, res) => res.json({ greeting: 'hello API' }));

async function initDb() {
  // console.log(encodeURIComponent(process.env.PASSWORD));
  console.log(mongoose.connection.readyState); // logs 0
  mongoose.connection.on('connecting', () => {
    console.log('connecting');
    console.log(mongoose.connection.readyState); // logs 2
  });
  mongoose.connection.on('connected', () => {
    console.log('connected');
    console.log(mongoose.connection.readyState); // logs 1
  });
  mongoose.connection.on('disconnecting', () => {
    console.log('disconnecting');
    console.log(mongoose.connection.readyState); // logs 3
  });
  mongoose.connection.on('disconnected', () => {
    console.log('disconnected');
    console.log(mongoose.connection.readyState); // logs 0
  });
  mongoose.connect(
    `mongodb+srv://${process.env.USERNAME}:${encodeURIComponent(
      process.env.PASSWORD,
    )}@main.fjpwk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`,
    { useNewUrlParser: true },
  );
}

app.post('/api/shorturl', async (req, res) => {
  console.log(req.body);
  const longUrl = req.body.url;
  if (!validUrl.isHttpUri(longUrl) && !validUrl.isHttpsUri(longUrl)) {
    return res.status(401).json({ error: 'invalid url' });
  }
  const f = 0;

  try {
    const domain = new URL(longUrl).hostname;
    console.log({ domain });
    await dns.lookup(domain, (error) => {
      console.log(error);
      if (error) throw error;
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({ error: 'invalid url' });
  }
  if (f) {
    return res.status(401).json({ error: 'invalid url' });
  }

  const urlCode = shortid.generate();
  try {
    let url = await Url.findOne({ longUrl });

    // url exist and return the respose
    if (url) {
      return res.json({ original_url: url.longUrl, short_url: url.urlCode });
    }
    url = new Url({
      longUrl,
      urlCode,
      date: new Date(),
    });
    await url.save();
    return res.json({ original_url: url.longUrl, short_url: url.urlCode });
  } catch (err) {
    // exception handler
    console.log(err);
    res.status(500).json('Server Error');
  }
});

app.get('/api/shorturl/:urlCode', async (req, res) => {
  const { urlCode } = req.params;
  Url.findOne({ urlCode }).then((value) => {
    console.log({ value });
    return res.redirect(value.longUrl);
  });
});

app.listen(port, async () => {
  console.log(`Listening on port ${port}`);
  await initDb();
  console.log('Initialized Database');
});
