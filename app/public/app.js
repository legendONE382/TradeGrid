const offlineQueueKey = 'tradegrid_offline_queue';

function getQueue() {
  return JSON.parse(localStorage.getItem(offlineQueueKey) || '[]');
}
function setQueue(items) {
  localStorage.setItem(offlineQueueKey, JSON.stringify(items));
}

async function api(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function saveListing() {
  const payload = {
    seller_id: Number(document.getElementById('sellerId').value),
    title: document.getElementById('title').value,
    category: document.getElementById('category').value,
    quantity: Number(document.getElementById('quantity').value),
    unit: document.getElementById('unit').value,
    price: Number(document.getElementById('price').value),
    town: document.getElementById('town').value
  };
  const saveState = document.getElementById('saveState');
  try {
    await api('/api/listings', payload);
    saveState.textContent = 'Listing synced.';
  } catch {
    const queue = getQueue();
    queue.push({ type: 'create_listing', payload });
    setQueue(queue);
    saveState.textContent = 'No network. Listing saved offline.';
  }
}

async function syncQueue() {
  const queue = getQueue();
  if (!queue.length) return;
  const remaining = [];
  for (const item of queue) {
    try {
      if (item.type === 'create_listing') await api('/api/listings', item.payload);
    } catch {
      remaining.push(item);
    }
  }
  setQueue(remaining);
}

async function loadListings() {
  const town = document.getElementById('searchTown').value;
  const res = await fetch('/api/listings?town=' + encodeURIComponent(town));
  const data = await res.json();
  const container = document.getElementById('listings');
  container.innerHTML = data.map(item => `<div class="card"><strong>${item.title}</strong><br/>₦${item.price} / ${item.unit}<br/>Seller: ${item.seller_name} (${item.phone})</div>`).join('');
}

window.addEventListener('online', syncQueue);
syncQueue();
loadListings();
