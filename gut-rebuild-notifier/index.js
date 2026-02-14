const https = require('https');

// === CONFIG ===
const USER_KEY = 'uzw2pfxcjohf159w8jir29u4a5f3s5';
const API_TOKEN = 'a9wxwbgdo7qxte9rz2f8wp5jkdcgew';

// === SCHEDULE (CET times) ===
const SCHEDULE = [
  {
    hour: 6, min: 30,
    title: 'NALACNO -- 6:30',
    msg: 'L-Glutamin 5g do vody\nProbiotika 1 kapsle\nVlazna voda s citronem 300ml'
  },
  {
    hour: 7, min: 0,
    title: 'SNIDANE -- 7:00',
    msg: 'Vitamin D3+K2 + B-komplex + Omega-3\nPriprav si snidani\nZacni pit vodu - cil 500ml do 9:00'
  },
  {
    hour: 10, min: 0,
    title: 'DOPOLEDNI SVACINA -- 10:00',
    msg: 'Matcha z termosky\nKreatin 5g do vody\nSezrat svacinu\nVoda 500ml do 12:00'
  },
  {
    hour: 12, min: 30,
    title: 'OBED -- 12:30',
    msg: 'Omega-3 1g + Travici enzymy\nObed z jidelnicku\nVoda + hermankovy caj 750ml do 15:00'
  },
  {
    hour: 15, min: 30,
    title: 'SHAKE + SVACINA -- 15:30',
    msg: 'DIY gainer: whey 30g + palatinose 50g + banan\nL-Glutamin 5g v shakeru\nNebo svacina z jidelnicku'
  },
  {
    hour: 18, min: 30,
    title: 'VECERE -- 18:30',
    msg: 'Kombucha 150ml + Zinek 25mg\nVecere z jidelnicku\nZazvorovy caj 250ml'
  },
  {
    hour: 21, min: 0,
    title: 'PRED SPANIM -- 21:00',
    msg: 'Shake #2: whey 30g + palatinose 40g + mleko\nHorcik 400mg + Kolagen 10g\nPosledni voda 300ml'
  }
];

// === SEND NOTIFICATION ===
function sendPush(title, msg) {
  const data = JSON.stringify({
    token: API_TOKEN,
    user: USER_KEY,
    title: title,
    message: msg,
    priority: 1,    // high priority - shows even in DND
    sound: 'persistent',  // loud sound
    retry: 60,
    expire: 600
  });

  const options = {
    hostname: 'api.pushover.net',
    port: 443,
    path: '/1/messages.json',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      const now = new Date().toLocaleString('cs-CZ', { timeZone: 'Europe/Prague' });
      console.log('[' + now + '] Sent: ' + title + ' -> ' + res.statusCode);
    });
  });

  req.on('error', (e) => {
    console.error('Error sending push:', e.message);
  });

  req.write(data);
  req.end();
}

// === SCHEDULER ===
const sent = {};

function checkSchedule() {
  const now = new Date();
  const cet = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  const h = cet.getHours();
  const m = cet.getMinutes();
  const today = cet.toISOString().slice(0, 10);

  SCHEDULE.forEach(function(s) {
    const key = today + '_' + s.hour + '_' + s.min;
    if (h === s.hour && m === s.min && !sent[key]) {
      sent[key] = true;
      sendPush(s.title, s.msg);
    }
  });

  // clean old keys at midnight
  if (h === 0 && m === 0) {
    Object.keys(sent).forEach(function(k) {
      if (!k.startsWith(today)) delete sent[k];
    });
  }
}

// Check every 30 seconds
setInterval(checkSchedule, 30000);

// Also check immediately on start
checkSchedule();

// Keep alive log
console.log('Gut Rebuild Notifier started.');
console.log('Timezone: Europe/Prague (CET)');
console.log('Notifications scheduled:');
SCHEDULE.forEach(function(s) {
  console.log('  ' + s.hour + ':' + (s.min < 10 ? '0' : '') + s.min + ' - ' + s.title);
});

// Prevent Railway from sleeping - simple HTTP server
const http = require('http');
http.createServer(function(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Gut Rebuild Notifier is running.');
}).listen(process.env.PORT || 3000);
