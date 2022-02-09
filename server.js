/* eslint-disable consistent-return */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const validUrl = require('valid-url');
const shortid = require('shortid');
const mongoose = require('mongoose');
const logger = require('pino')();
const dnsLookup = require('./myDns');

// Basic Configuration
const app = express();
const port = process.env.PORT || 3000;
const Url = require('./models/url');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());
app.use('/public', express.static(`${process.cwd()}/public`));
// logger

app.get('/', (_, res) => res.sendFile(`${process.cwd()}/views/index.html`));

// Your first API endpoint
app.get('/api/hello', (req, res) => res.json({ greeting: 'hello API' }));

async function initDb() {
  logger.info(mongoose.connection.readyState); // logs 0
  mongoose.connection.on('connecting', () => {
    logger.info('connecting');
    logger.info(mongoose.connection.readyState); // logs 2
  });
  mongoose.connection.on('connected', () => {
    logger.info('connected');
    logger.info(mongoose.connection.readyState); // logs 1
  });
  mongoose.connection.on('disconnecting', () => {
    logger.info('disconnecting');
    logger.info(mongoose.connection.readyState); // logs 3
  });
  mongoose.connection.on('disconnected', () => {
    logger.info('disconnected');
    logger.info(mongoose.connection.readyState); // logs 0
  });
  mongoose.connect(
    `mongodb+srv://${process.env.USERNAME}:${encodeURIComponent(
      process.env.PASSWORD,
    )}@main.fjpwk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`,
    { useNewUrlParser: true },
  );
}

app.post('/api/shorturl', async (req, res) => {
  logger.info('recieving URLs');
  const longUrl = req.body.url;
  if (!validUrl.isHttpUri(longUrl) && !validUrl.isHttpsUri(longUrl)) {
    return res.json({ error: 'invalid url' });
  }
  const domain = new URL(longUrl).hostname;
  logger.info({ domain });
  dnsLookup(domain)
    .then((resource) => {
      logger.info(resource);
    })
    .catch((err) => res.json({ error: 'invalid url' }));

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
    logger.error(err);
    res.status(500).json('Server Error');
  }
});

app.get('/api/shorturl/:urlCode', async (req, res) => {
  const { urlCode } = req.params;
  Url.findOne({ urlCode }).then((value) => {
    logger.info({ value });
    return res.redirect(value.longUrl);
  });
});

app.listen(port, async () => {
  logger.info(`Listening on port ${port}`);
  await initDb();
  logger.info('Initialized Database');
});
