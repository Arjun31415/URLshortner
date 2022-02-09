const dns = require('dns');

const dnsLookup = (...args) =>
  new Promise((resolve, reject) => {
    dns.lookup(...args, (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
module.exports = dnsLookup;
