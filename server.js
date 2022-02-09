require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const validUrl = require("valid-url");
const shortid = require("shortid");
const dns = require("dns");
const mongoose =require("mongoose");
// Basic Configuration
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});



async function initDb(){
    await mongoose.connect("mongodb+srv://"+
        process.env["USERNAME"]+":"+
        encodeURIComponent(process.env["PASSWORD"])+
        "@main.fjpwk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority")
}

app.on('listening',async function(){
    await initDb();
})

app.post("/api/shorturl", async function (req, res) {
  console.log(req.body);
  longUrl = req.body["url"];
  if (!validUrl.is_http_uri(longUrl) && !validUrl.is_https_uri(longUrl)) {
    return res.status(401).json({ error: "invalid url" });
  }
  let f = 0;

  try {
    let domain = new URL(longUrl).hostname;
    console.log({ domain: domain });
    let _ = await dns.lookup(domain, (error) => {
      console.log(error);
      if (error) throw error;
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({ error: "invalid url" });
  }
  if (f) {
    return res.status(401).json({ error: "invalid url" });
  }

  const urlCode = shortid.generate();
  try {
    let url = await db.get(longUrl);

    // url exist and return the respose
    if (url) {
      return res.json(url);
    } else {
      await db.set(longUrl, urlCode).then(() => {});
      await db.set(urlCode, longUrl).then(() => {});
      return res.json({ original_url: longUrl, short_url: urlCode });
    }
  } catch (err) {
    // exception handler
    console.log(err);
    res.status(500).json("Server Error");
  }
});

app.get("/api/shorturl/:urlCode", async (req, res) => {
  urlCode = req.params.urlCode;
  db.get(urlCode).then((value) => {
    console.log(value);
    return res.redirect(value);
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
