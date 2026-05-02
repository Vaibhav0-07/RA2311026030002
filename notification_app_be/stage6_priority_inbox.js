const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const NOTIF_API_URL = process.env.NOTIF_API_URL || 'http://20.207.122.201/evaluation-service/notifications';

const TYPE_WEIGHTS = {
  Placement: 100,
  Result: 70,
  Event: 50
};

function getTypeWeight(type) {
  return TYPE_WEIGHTS[type] ?? 10;
}

function getRecencyWeight(timestamp) {
  const created = new Date(timestamp);
  if (Number.isNaN(created.getTime())) {
    return 0;
  }

  const ageSeconds = (Date.now() - created.getTime()) / 1000;
  if (ageSeconds <= 0) {
    return 1;
  }

  const days = ageSeconds / 86400;
  return Math.max(0, 1 - days / 7);
}

function scoreNotification(notification) {
  const base = getTypeWeight(notification.Type);
  const recency = getRecencyWeight(notification.Timestamp);
  return base + recency * 10;
}

function getTopNotifications(notifications, topN) {
  const top = [];

  for (const notification of notifications) {
    const score = scoreNotification(notification);
    const item = { ...notification, score };

    if (top.length < topN) {
      top.push(item);
      top.sort((a, b) => a.score - b.score);
      continue;
    }

    if (score <= top[0].score) {
      continue;
    }

    top[0] = item;
    top.sort((a, b) => a.score - b.score);
  }

  return top.sort((a, b) => b.score - a.score);
}

async function fetchNotifications(apiToken) {
  if (!apiToken) {
    throw new Error('Missing API token. Set Authorization header or NOTIF_API_TOKEN environment variable.');
  }

  const response = await fetch(NOTIF_API_URL, {
    headers: {
      Authorization: apiToken,
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Notification API error ${response.status}: ${payload}`);
  }

  const body = await response.json();
  return body.notifications || [];
}

app.get('/priority-inbox', async (req, res) => {
  try {
    const topN = Math.max(1, Math.min(100, parseInt(req.query.topN, 10) || 10));
    const apiToken = req.headers.authorization || process.env.NOTIF_API_TOKEN;
    const notifications = await fetchNotifications(apiToken);
    const topNotifications = getTopNotifications(notifications, topN);

    res.json({
      source: NOTIF_API_URL,
      topN,
      totalNotifications: notifications.length,
      topNotifications
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Priority inbox service listening on http://localhost:${PORT}`);
  console.log(`Fetching notifications from: ${NOTIF_API_URL}`);
});
