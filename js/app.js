// ==================== DATA FUNCTIONS ====================
function getEvents() {
  try { return JSON.parse(localStorage.getItem('ef_events') || '[]'); }
  catch { return []; }
}

function saveEvents(events) {
  try {
    localStorage.setItem('ef_events', JSON.stringify(events));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      toast('Storage full: Event data too large. Try removing images or clear old events.', 'error');
    } else {
      toast('Error saving event: ' + e.message, 'error');
    }
    throw e;
  }
}

function getRegs() {
  try { return JSON.parse(localStorage.getItem('ef_regs') || '[]'); }
  catch { return []; }
}

function saveRegs(regs) {
  localStorage.setItem('ef_regs', JSON.stringify(regs));
}

function isAdmin() {
  return sessionStorage.getItem('ef_admin') === '1';
}

function getOrganizerId() {
  let orgId = localStorage.getItem('ef_organizer_id');
  if (!orgId) {
    orgId = 'ORG' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
    localStorage.setItem('ef_organizer_id', orgId);
  }
  return orgId;
}

function getMyEvents() {
  const orgId = getOrganizerId();
  return getEvents().filter(e => e.organizerId === orgId);
}

// ==================== GLOBAL VARIABLES ====================
let currentFilter = 'All';
let editingEventId = null;
let currentDetailEvent = null;
let currentConfirmData = null;
let currentShareEventId = null;
let uploadedBannerData = null;
let eventCategories = new Set();

// ==================== URL ROUTING ====================
function parseUrl() {
  const hash = window.location.hash.slice(1);
  if (hash.startsWith('event/')) {
    const eventId = hash.replace('event/', '');
    const ev = getEvents().find(e => e.id === eventId);
    if (ev) {
      showDetail(eventId, true);
    } else {
      toast('Event not found', 'error');
      showPage('home');
    }
  }
}

window.addEventListener('hashchange', parseUrl);
window.addEventListener('DOMContentLoaded', function() {
  parseUrl();
  renderEvents();
});

// ==================== NAVIGATION ====================
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById('page-' + name);
  if (page) page.classList.add('active');

  // Footer visibility - only show on home page
  const footer = document.getElementById('mainFooter');
  if (footer) {
    footer.style.display = (name === 'home') ? 'block' : 'none';
  }

  if (name === 'home') {
    window.location.hash = '';
    renderEvents();
  }
  if (name === 'adminDash') {
    renderAdminDash();
    document.getElementById('logoutBtn').classList.remove('hidden');
    document.getElementById('adminNavBtn').classList.add('hidden');
  }
  if (name === 'adminLogin') {
    document.getElementById('logoutBtn').classList.add('hidden');
    document.getElementById('adminNavBtn').classList.remove('hidden');
  }
  window.scrollTo(0, 0);
}

function toggleSearch() {
  document.getElementById('eventsSection').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => document.getElementById('searchInput').focus(), 500);
}

// ==================== AUTH ====================
function getOrganizers() {
  try { return JSON.parse(localStorage.getItem('ef_organizers') || '{}'); }
  catch { return {}; }
}

function saveOrganizers(organizers) {
  localStorage.setItem('ef_organizers', JSON.stringify(organizers));
}

function doLogin() {
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value;

  if (!u || !p) {
    document.getElementById('loginError').classList.remove('hidden');
    document.getElementById('loginErrorMsg').textContent = 'Please enter both username and password.';
    return;
  }

  const organizers = getOrganizers();

  if (organizers[u] && organizers[u] === p) {
    sessionStorage.setItem('ef_admin', '1');
    sessionStorage.setItem('ef_admin_user', u);
    document.getElementById('loginError').classList.add('hidden');
    showPage('adminDash');
    toast('Welcome back, ' + u + '!', 'success');
  } else {
    document.getElementById('loginError').classList.remove('hidden');
    document.getElementById('loginErrorMsg').textContent = 'Invalid username or password.';
  }
}

function showSignup() {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('signupForm').classList.remove('hidden');
  document.getElementById('loginError').classList.add('hidden');
  document.getElementById('signupError').classList.add('hidden');
  document.getElementById('signupSuccess').classList.add('hidden');
}

function showLogin() {
  document.getElementById('signupForm').classList.add('hidden');
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('loginError').classList.add('hidden');
  document.getElementById('signupError').classList.add('hidden');
  document.getElementById('signupSuccess').classList.add('hidden');
}

function doSignup() {
  const u = document.getElementById('signupUser').value.trim();
  const p = document.getElementById('signupPass').value;
  const pc = document.getElementById('signupPassConfirm').value;

  document.getElementById('signupError').classList.add('hidden');
  document.getElementById('signupSuccess').classList.add('hidden');

  if (!u || !p) {
    document.getElementById('signupError').classList.remove('hidden');
    document.getElementById('signupErrorMsg').textContent = 'Please fill in all required fields.';
    return;
  }

  if (p.length < 6) {
    document.getElementById('signupError').classList.remove('hidden');
    document.getElementById('signupErrorMsg').textContent = 'Password must be at least 6 characters.';
    return;
  }

  if (p !== pc) {
    document.getElementById('signupError').classList.remove('hidden');
    document.getElementById('signupErrorMsg').textContent = 'Passwords do not match.';
    return;
  }

  const organizers = getOrganizers();

  if (organizers[u]) {
    document.getElementById('signupError').classList.remove('hidden');
    document.getElementById('signupErrorMsg').textContent = 'Username already exists. Please choose another.';
    return;
  }

  // Save new organizer
  organizers[u] = p;
  saveOrganizers(organizers);

  document.getElementById('signupSuccess').classList.remove('hidden');
  document.getElementById('signupUser').value = '';
  document.getElementById('signupPass').value = '';
  document.getElementById('signupPassConfirm').value = '';

  // Switch to login after 2 seconds
  setTimeout(() => {
    showLogin();
    document.getElementById('loginUser').value = u;
    document.getElementById('loginPass').focus();
  }, 2000);
}

function adminLogout() {
  sessionStorage.removeItem('ef_admin');
  sessionStorage.removeItem('ef_admin_user');
  document.getElementById('logoutBtn').classList.add('hidden');
  document.getElementById('adminNavBtn').classList.remove('hidden');
  showPage('home');
  toast('Logged out successfully', 'success');
}

// ==================== TOAST ====================
function toast(msg, type) {
  if (type === undefined) type = 'success';
  const t = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = 'toast flex items-center gap-3 bg-white border-l-4 rounded-xl shadow-lg px-5 py-4 min-w-[300px]';
  if (type === 'success') {
    el.classList.add('border-primary');
  } else {
    el.classList.add('border-error');
  }
  const iconClass = type === 'success' ? 'check_circle' : 'error';
  const iconColor = type === 'success' ? 'text-primary' : 'text-error';
  el.innerHTML = '<span class="material-symbols-outlined ' + iconColor + ' text-xl">' + iconClass + '</span><span class="font-medium text-on-surface text-sm">' + msg + '</span>';
  el.style.cssText = 'animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;';
  t.appendChild(el);

  // Remove with animation
  setTimeout(function() {
    el.style.animation = 'slideOut 0.3s ease-in forwards';
    setTimeout(function() { el.remove(); }, 300);
  }, 3500);
}

// ==================== HELPERS ====================
function formatDate(d) {
  if (!d) return 'TBD';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) + ' at ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function isToday(d) {
  const dt = new Date(d);
  const now = new Date();
  return dt.toDateString() === now.toDateString();
}

function isDeadlinePassed(ev) {
  return new Date() > new Date(ev.deadline);
}

function getCountdown(d) {
  const diff = new Date(d) - new Date();
  if (diff <= 0) return 'Started';
  const days = Math.floor(diff / 86400000);
  const hrs = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return 'In ' + days + 'd ' + hrs + 'h';
  if (hrs > 0) return 'In ' + hrs + 'h ' + mins + 'm';
  return 'In ' + mins + 'm';
}

function genId() {
  return Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
}

// ==================== FILE UPLOAD ====================
function handleBannerUpload(input) {
  const file = input.files[0];
  if (!file) return;

  // Check file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    toast('Image too large. Max 2MB. Please resize or use a smaller image.', 'error');
    input.value = '';
    return;
  }

  // Check file type
  if (!file.type.startsWith('image/')) {
    toast('Please select a valid image file.', 'error');
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    uploadedBannerData = e.target.result;
    document.getElementById('bannerPreview').textContent = 'Selected: ' + file.name + ' (' + Math.round(file.size/1024) + 'KB)';
    document.getElementById('removeBannerBtn').classList.remove('hidden');
    toast('Image uploaded successfully', 'success');
  };
  reader.onerror = function() {
    toast('Error reading image file.', 'error');
    uploadedBannerData = null;
  };
  reader.readAsDataURL(file);
}

function clearBanner() {
  uploadedBannerData = null;
  document.getElementById('evBannerFile').value = '';
  document.getElementById('bannerPreview').textContent = '';
  document.getElementById('removeBannerBtn').classList.add('hidden');
  toast('Image removed', 'success');
}

// ==================== RENDER EVENTS ====================
let isFirstLoad = true;

function showSkeleton() {
  const grid = document.getElementById('eventsGrid');
  const skeleton = document.getElementById('skeletonGrid');
  if (grid) grid.style.display = 'none';
  if (skeleton) skeleton.style.display = 'grid';
}

function hideSkeleton() {
  const grid = document.getElementById('eventsGrid');
  const skeleton = document.getElementById('skeletonGrid');
  if (skeleton) skeleton.style.display = 'none';
  if (grid) grid.style.display = 'grid';
}

function setFilter(f, el) {
  currentFilter = f;
  document.querySelectorAll('#filterChips button').forEach(c => {
    c.classList.remove('bg-primary', 'text-white');
    c.classList.add('bg-white', 'text-slate-600');
  });
  el.classList.remove('bg-white', 'text-slate-600');
  el.classList.add('bg-primary', 'text-white');
  renderEvents();
}

function updateFilterChips() {
  const chipsContainer = document.getElementById('filterChips');
  let html = '<button class="px-4 py-2 rounded-full text-sm font-semibold ' + (currentFilter === 'All' ? 'bg-primary text-white' : 'bg-white text-slate-600') + '" onclick="setFilter(\'All\', this)">All</button>';
  eventCategories.forEach(function(cat) {
    html += '<button class="px-4 py-2 rounded-full text-sm font-semibold ' + (currentFilter === cat ? 'bg-primary text-white' : 'bg-white text-slate-600') + '" onclick="setFilter(\'' + cat + '\', this)">' + cat + '</button>';
  });
  chipsContainer.innerHTML = html;
}

function renderEvents() {
  const grid = document.getElementById('eventsGrid');
  if (!grid) return;

  // Show skeleton on first load or when filtering
  if (isFirstLoad) {
    showSkeleton();
    // Simulate loading delay for smoother UX
    setTimeout(() => {
      isFirstLoad = false;
      hideSkeleton();
      renderEventsContent();
    }, 600);
    return;
  }

  renderEventsContent();
}

function renderEventsContent() {
  const grid = document.getElementById('eventsGrid');
  if (!grid) return;

  // Force cards visible after animation completes
  setTimeout(function() {
    document.querySelectorAll('.event-card').forEach(function(card) {
      card.style.opacity = '1';
    });
  }, 1000);

  let events = getEvents();
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const q = searchInput ? searchInput.value.toLowerCase() : '';
  const sort = sortSelect ? sortSelect.value : 'date';

  // Collect categories
  eventCategories = new Set();
  events.forEach(function(e) { eventCategories.add(e.category); });
  updateFilterChips();

  // Filter
  if (currentFilter !== 'All') {
    events = events.filter(function(e) { return e.category === currentFilter; });
  }
  if (q) {
    events = events.filter(function(e) {
      return e.name.toLowerCase().indexOf(q) >= 0 || e.category.toLowerCase().indexOf(q) >= 0;
    });
  }

  // Sort
  if (sort === 'date') {
    events.sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
  } else if (sort === 'popular') {
    const regs = getRegs();
    events.sort(function(a, b) {
      return regs.filter(function(r) { return r.eventId === b.id; }).length - regs.filter(function(r) { return r.eventId === a.id; }).length;
    });
  }

  if (events.length === 0) {
    grid.innerHTML = '<div class="col-span-full text-center py-16"><div class="material-symbols-outlined text-6xl text-slate-300 mb-4">event_busy</div><h3 class="text-xl font-bold text-slate-600 mb-2">No events found</h3><p class="text-slate-400">Check back later or create your first event!</p></div>';
    return;
  }

  const regs = getRegs();
  let html = '';
  events.forEach(function(ev) {
    const evRegs = regs.filter(function(r) { return r.eventId === ev.id; });
    const today = isToday(ev.date);
    const badgeColor = today ? 'bg-secondary text-white' : 'bg-primary text-white';
    const badgeText = today ? 'TODAY' : 'FREE';

    const bannerHtml = ev.banner && ev.banner.startsWith('data:image/')
      ? '<img src="' + ev.banner + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" alt="' + ev.name + '" decoding="async">'
      : '<div class="w-full h-full flex items-center justify-center bg-surface-variant"><span class="material-symbols-outlined text-6xl text-slate-400">image</span></div>';

    html += '<div class="event-card glass-card rounded-2xl overflow-hidden group cursor-pointer" style="animation-delay: ' + (events.indexOf(ev) * 0.05) + 's" onclick="showDetail(\'' + ev.id + '\')">' +
      '<div class="relative h-48 overflow-hidden bg-slate-200">' +
      bannerHtml +
      '<span class="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold ' + badgeColor + '">' + badgeText + '</span>' +
      '</div>' +
      '<div class="p-6">' +
      '<div class="text-xs font-bold text-primary uppercase tracking-wider mb-2">' + ev.category + '</div>' +
      '<h3 class="text-xl font-bold text-on-surface mb-3 line-clamp-2">' + ev.name + '</h3>' +
      '<div class="space-y-2 text-sm text-on-surface-variant">' +
      '<div class="flex items-center gap-2"><span class="material-symbols-outlined text-base">calendar_today</span>' + formatDate(ev.date) + '</div>' +
      '<div class="flex items-center gap-2"><span class="material-symbols-outlined text-base">location_on</span>' + ev.location + '</div>' +
      '</div>' +
      '<div class="flex items-center justify-between mt-4 pt-4 border-t border-surface-variant">' +
      '<span class="text-sm text-slate-500">' + evRegs.length + ' registered</span>' +
      '<span class="text-sm font-semibold text-primary">' + getCountdown(ev.date) + '</span>' +
      '</div>' +
      '</div>' +
      '</div>';
  });
  grid.innerHTML = html;
}

// ==================== EVENT DETAIL ====================
function showDetail(id, fromUrl) {
  const ev = getEvents().find(function(e) { return e.id === id; });
  if (!ev) return;

  currentDetailEvent = ev;
  const regs = getRegs().filter(function(r) { return r.eventId === id; });
  const deadlinePassed = isDeadlinePassed(ev);
  const mapsLink = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(ev.location);

  const detailContent = document.getElementById('detailContent');
  const detailBannerHtml = ev.banner && ev.banner.startsWith('data:image/')
    ? '<img src="' + ev.banner + '" class="w-full h-full object-cover" alt="' + ev.name + '">'
    : '<div class="w-full h-full flex items-center justify-center bg-surface-variant"><span class="material-symbols-outlined text-8xl text-slate-400">image</span></div>';

  detailContent.innerHTML = '' +
    '<div class="glass-card rounded-2xl overflow-hidden mb-8">' +
    '<div class="relative h-80 overflow-hidden">' +
    detailBannerHtml +
    '<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>' +
    '<div class="absolute bottom-0 left-0 right-0 p-8">' +
    '<div class="text-sm font-bold text-primary-container uppercase tracking-wider mb-2">' + ev.category + '</div>' +
    '<h1 class="text-4xl md:text-5xl font-bold text-white">' + ev.name + '</h1>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">' +
    '<div class="lg:col-span-2 space-y-8">' +
    '<div class="glass-card p-8 rounded-2xl">' +
    '<h3 class="text-xl font-bold text-on-surface mb-4">About Event</h3>' +
    '<p class="text-on-surface-variant leading-relaxed">' + ev.description + '</p>' +
    '</div>' +
    '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">' +
    '<div class="glass-card p-6 rounded-3xl border border-white/50 shadow-sm">' +
    '<div class="flex items-center gap-3 mb-2"><span class="material-symbols-outlined text-primary">calendar_today</span><span class="text-sm font-semibold text-slate-500">Date & Time</span></div>' +
    '<p class="text-lg font-bold text-on-surface">' + formatDate(ev.date) + '</p>' +
    '</div>' +
    '<div class="glass-card p-6 rounded-3xl border border-white/50 shadow-sm">' +
    '<div class="flex items-center gap-3 mb-2"><span class="material-symbols-outlined text-primary">location_on</span><span class="text-sm font-semibold text-slate-500">Location</span></div>' +
    '<a href="' + mapsLink + '" target="_blank" class="text-lg font-bold text-primary hover:underline">' + ev.location + '</a>' +
    '</div>' +
    '<div class="glass-card p-6 rounded-3xl border border-white/50 shadow-sm">' +
    '<div class="flex items-center gap-3 mb-2"><span class="material-symbols-outlined text-primary">check_circle</span><span class="text-sm font-semibold text-slate-500">Entry Type</span></div>' +
    '<p class="text-lg font-bold text-primary">Free Entry</p>' +
    '</div>' +
    '<div class="glass-card p-6 rounded-3xl border border-white/50 shadow-sm">' +
    '<div class="flex items-center gap-3 mb-2"><span class="material-symbols-outlined text-primary">schedule</span><span class="text-sm font-semibold text-slate-500">Register By</span></div>' +
    '<p class="text-lg font-bold text-on-surface">' + formatDate(ev.deadline) + '</p>' +
    '</div>' +
    (ev.contactEmail ? '<div class="glass-card p-6 rounded-3xl border border-white/50 shadow-sm"><div class="flex items-center gap-3 mb-2"><span class="material-symbols-outlined text-primary">email</span><span class="text-sm font-semibold text-slate-500">Contact Email</span></div><a href="mailto:' + ev.contactEmail + '" class="text-lg font-bold text-primary hover:underline">' + ev.contactEmail + '</a></div>' : '') +
    (ev.contactPhone ? '<div class="glass-card p-6 rounded-3xl border border-white/50 shadow-sm"><div class="flex items-center gap-3 mb-2"><span class="material-symbols-outlined text-primary">phone</span><span class="text-sm font-semibold text-slate-500">Contact Phone</span></div><a href="tel:' + ev.contactPhone + '" class="text-lg font-bold text-primary hover:underline">' + ev.contactPhone + '</a></div>' : '') +
    '<div class="glass-card p-6 rounded-3xl border border-white/50 shadow-sm">' +
    '<div class="flex items-center gap-3 mb-2"><span class="material-symbols-outlined text-primary">people</span><span class="text-sm font-semibold text-slate-500">Registered</span></div>' +
    '<p class="text-lg font-bold text-on-surface">' + regs.length + ' students</p>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<div class="lg:col-span-1">' +
    '<div class="glass-card p-8 rounded-3xl sticky border border-white/50 top-24">' +
    '<h3 class="text-2xl font-bold text-on-surface mb-2">Student Registration</h3>' +
    '<p class="text-3xl font-black text-primary mb-4">FREE</p>' +
    '<p class="text-sm text-slate-500 mb-6 flex items-center gap-2"><span class="material-symbols-outlined">info</span>Open to all students</p>' +
    (deadlinePassed ? '<button class="w-full bg-slate-200 text-slate-400 py-4 rounded-xl font-bold cursor-not-allowed" disabled>Registration Closed</button>' : '<button class="w-full bg-primary text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95" onclick="goToRegister(\'' + ev.id + '\')">Register Now</button>') +
    '</div>' +
    '</div>' +
    '</div>';

  if (!fromUrl) {
    showPage('detail');
  }
}

let currentEventId = null;

function goToRegister(eventId) {
  currentEventId = eventId;
  const ev = getEvents().find(function(e) { return e.id === eventId; });
  document.getElementById('regEventName').textContent = ev ? ev.name : 'Fill in your details to register';
  // Clear form fields
  document.getElementById('regName').value = '';
  document.getElementById('regRegNo').value = '';
  document.getElementById('regSection').value = '';
  document.getElementById('regDept').value = '';
  document.getElementById('regEmail').value = '';
  document.getElementById('regPhone').value = '';
  showPage('register');
}

function submitRegistration() {
  const name = document.getElementById('regName').value.trim();
  const regNo = document.getElementById('regRegNo').value.trim();
  const section = document.getElementById('regSection').value.trim();
  const dept = document.getElementById('regDept').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const phone = document.getElementById('regPhone').value.trim();

  if (!name || !regNo || !section || !dept || !email || !phone) {
    toast('Please fill all required fields', 'error');
    return;
  }
  if (regNo.length !== 12) {
    toast('Registration number must be 12 digits', 'error');
    return;
  }
  if (phone.length !== 10) {
    toast('Phone number must be 10 digits', 'error');
    return;
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    toast('Please enter a valid email', 'error');
    return;
  }

  if (!currentEventId) {
    toast('No event selected', 'error');
    return;
  }

  const ev = getEvents().find(function(e) { return e.id === currentEventId; });
  const regId = genId();

  const reg = {
    id: regId,
    eventId: currentEventId,
    eventName: ev.name,
    name: name,
    regNo: regNo,
    section: section,
    dept: dept,
    email: email,
    phone: phone,
    time: new Date().toISOString(),
    seen: false
  };

  const regs = getRegs();
  regs.push(reg);
  saveRegs(regs);

  currentConfirmData = { reg: reg, ev: ev };

  document.getElementById('confirmRegId').textContent = regId;
  document.getElementById('regCardDetails').innerHTML = '' +
    '<div class="flex justify-between"><span>Event:</span><span class="font-semibold">' + ev.name + '</span></div>' +
    '<div class="flex justify-between"><span>Name:</span><span class="font-semibold">' + name + '</span></div>' +
    '<div class="flex justify-between"><span>Date:</span><span class="font-semibold">' + formatDate(ev.date) + '</span></div>';
  document.getElementById('confirmDetails').innerHTML = '' +
    '<div class="space-y-3 text-sm">' +
    '<div class="flex justify-between"><span class="text-slate-500">Event</span><span class="font-semibold text-on-surface">' + ev.name + '</span></div>' +
    '<div class="flex justify-between"><span class="text-slate-500">Date</span><span class="font-semibold text-on-surface">' + formatDate(ev.date) + '</span></div>' +
    '<div class="flex justify-between"><span class="text-slate-500">Location</span><span class="font-semibold text-on-surface">' + ev.location + '</span></div>' +
    '<div class="border-t border-surface-variant my-3"></div>' +
    '<div class="flex justify-between"><span class="text-slate-500">Name</span><span class="font-semibold text-on-surface">' + name + '</span></div>' +
    '<div class="flex justify-between"><span class="text-slate-500">Reg No</span><span class="font-semibold text-on-surface">' + regNo + '</span></div>' +
    '<div class="flex justify-between"><span class="text-slate-500">Section</span><span class="font-semibold text-on-surface">' + section + ' - ' + dept + '</span></div>' +
    '<div class="flex justify-between"><span class="text-slate-500">Email</span><span class="font-semibold text-on-surface">' + email + '</span></div>' +
    '</div>';

  document.getElementById('qrcode').innerHTML = '';
  const qrData = 'AU Events|' + regId + '|' + ev.name + '|' + name + '|' + regNo + '|' + section;
  new QRCode(document.getElementById('qrcode'), { text: qrData, width: 180, height: 180, colorDark: '#476500', colorLight: '#ffffff' });

  showPage('confirm');
  toast('Registration confirmed!', 'success');
}

function downloadQRCode() {
  const qrCanvas = document.querySelector('#qrcode canvas');
  if (!qrCanvas) {
    toast('QR code not found', 'error');
    return;
  }
  const link = document.createElement('a');
  link.download = 'AU-Events-QR-' + document.getElementById('confirmRegId').textContent + '.png';
  link.href = qrCanvas.toDataURL('image/png');
  link.click();
  toast('QR code downloaded!', 'success');
}

function downloadRegCard() {
  const qrCanvas = document.querySelector('#qrcode canvas');
  if (!qrCanvas) {
    toast('QR code not found', 'error');
    return;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const regId = document.getElementById('confirmRegId').textContent;

  // Higher resolution for crisp output - taller to fit all details
  canvas.width = 800;
  canvas.height = 1300;

  // Clear canvas with white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top gradient banner
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 200);
  gradient.addColorStop(0, '#476500');
  gradient.addColorStop(1, '#7ee8fa');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(40, 40, canvas.width - 80, 160, 20);
  ctx.fill();

  // Header text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AU Events', canvas.width / 2, 95);
  ctx.font = '300 26px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Registration Pass', canvas.width / 2, 135);

  // Main card background
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.roundRect(40, 220, canvas.width - 80, 800, 20);
  ctx.fill();

  // Card border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(40, 220, canvas.width - 80, 800, 20);
  ctx.stroke();

  // Registration ID section
  ctx.fillStyle = '#64748b';
  ctx.font = '500 18px "Segoe UI", Arial, sans-serif';
  ctx.fillText('REGISTRATION ID', canvas.width / 2, 280);
  ctx.fillStyle = '#476500';
  ctx.font = 'bold 52px "Segoe UI", Arial, sans-serif';
  ctx.fillText(regId, canvas.width / 2, 335);

  // QR code background
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(250, 365, 300, 300, 16);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(250, 365, 300, 300, 16);
  ctx.stroke();

  // Draw QR code centered
  ctx.drawImage(qrCanvas, 275, 390, 250, 250);

  // All registration details section
  const detailsY = 720;
  const leftCol = 80;
  const rightCol = 420;
  let currentY = detailsY;

  if (currentConfirmData) {
    // Event Info Header
    ctx.fillStyle = '#476500';
    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('EVENT INFORMATION', leftCol, currentY);
    currentY += 35;

    // Event Name
    ctx.fillStyle = '#64748b';
    ctx.font = '500 16px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Event Name', leftCol, currentY);
    ctx.fillStyle = '#1e293b';
    ctx.font = '600 22px "Segoe UI", Arial, sans-serif';
    ctx.fillText(currentConfirmData.ev.name, leftCol, currentY + 28);
    currentY += 65;

    // Date
    ctx.fillStyle = '#64748b';
    ctx.font = '500 16px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Date', leftCol, currentY);
    ctx.fillStyle = '#1e293b';
    ctx.font = '600 20px "Segoe UI", Arial, sans-serif';
    ctx.fillText(formatDate(currentConfirmData.ev.date), leftCol, currentY + 26);

    // Location (right column)
    ctx.fillStyle = '#64748b';
    ctx.font = '500 16px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Location', rightCol, currentY);
    ctx.fillStyle = '#1e293b';
    ctx.font = '600 20px "Segoe UI", Arial, sans-serif';
    ctx.fillText(currentConfirmData.ev.location, rightCol, currentY + 26);
    currentY += 70;

    // Horizontal separator
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, currentY - 10);
    ctx.lineTo(canvas.width - 60, currentY - 10);
    ctx.stroke();

    // Attendee Info Header
    ctx.fillStyle = '#476500';
    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.fillText('ATTENDEE DETAILS', leftCol, currentY + 20);
    currentY += 55;

    // Full Name
    ctx.fillStyle = '#64748b';
    ctx.font = '500 16px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Full Name', leftCol, currentY);
    ctx.fillStyle = '#1e293b';
    ctx.font = '600 20px "Segoe UI", Arial, sans-serif';
    ctx.fillText(currentConfirmData.reg.name, leftCol, currentY + 26);
    currentY += 55;

    // Registration Number
    ctx.fillStyle = '#64748b';
    ctx.font = '500 16px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Registration Number', leftCol, currentY);
    ctx.fillStyle = '#1e293b';
    ctx.font = '600 20px "Segoe UI", Arial, sans-serif';
    ctx.fillText(currentConfirmData.reg.regNo, leftCol, currentY + 26);

    // Section (right column)
    ctx.fillStyle = '#64748b';
    ctx.font = '500 16px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Section', rightCol, currentY);
    ctx.fillStyle = '#1e293b';
    ctx.font = '600 20px "Segoe UI", Arial, sans-serif';
    ctx.fillText(currentConfirmData.reg.section, rightCol, currentY + 26);
    currentY += 55;

    // Department
    ctx.fillStyle = '#64748b';
    ctx.font = '500 16px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Department', leftCol, currentY);
    ctx.fillStyle = '#1e293b';
    ctx.font = '600 20px "Segoe UI", Arial, sans-serif';
    ctx.fillText(currentConfirmData.reg.dept, leftCol, currentY + 26);

    // Phone (right column)
    ctx.fillStyle = '#64748b';
    ctx.font = '500 16px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Phone', rightCol, currentY);
    ctx.fillStyle = '#1e293b';
    ctx.font = '600 20px "Segoe UI", Arial, sans-serif';
    ctx.fillText(currentConfirmData.reg.phone, rightCol, currentY + 26);
    currentY += 55;

    // Email
    ctx.fillStyle = '#64748b';
    ctx.font = '500 16px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Email', leftCol, currentY);
    ctx.fillStyle = '#1e293b';
    ctx.font = '600 20px "Segoe UI", Arial, sans-serif';
    ctx.fillText(currentConfirmData.reg.email, leftCol, currentY + 26);
  }

  // Footer note background
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.roundRect(40, 1050, canvas.width - 80, 80, 12);
  ctx.fill();

  // Footer note
  ctx.fillStyle = '#64748b';
  ctx.font = '500 18px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Present this pass at the event entrance for check-in', canvas.width / 2, 1090);
  ctx.font = '400 16px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Generated by AU Events Portal', canvas.width / 2, 1115);

  // Download
  const link = document.createElement('a');
  link.download = 'AU-Events-Pass-' + regId + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  toast('Registration pass downloaded!', 'success');
}

function addToCalendar() {
  if (!currentConfirmData) return;
  const ev = currentConfirmData.ev;
  const start = new Date(ev.date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const end = new Date(new Date(ev.date).getTime() + 2 * 3600000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const url = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(ev.name) + '&dates=' + start + '/' + end + '&details=' + encodeURIComponent(ev.description) + '&location=' + encodeURIComponent(ev.location);
  window.open(url, '_blank');
}

// ==================== ADMIN DASHBOARD ====================
function renderAdminDash() {
  adminSection('overview');
}

function adminSection(sec) {
  if (!isAdmin()) {
    showPage('adminLogin');
    return;
  }

  document.querySelectorAll('.sidebar-link').forEach(function(l) {
    l.classList.remove('bg-primary', 'text-white');
    l.classList.add('text-on-surface', 'hover:bg-white/50');
  });
  const activeLink = document.getElementById('sbl-' + sec);
  if (activeLink) {
    activeLink.classList.remove('text-on-surface', 'hover:bg-white/50');
    activeLink.classList.add('bg-primary', 'text-white');
  }

  const main = document.getElementById('adminMain');
  const myEvents = getMyEvents();
  const regs = getRegs();

  if (sec === 'overview') {
    const totalRegs = regs.filter(function(r) { return myEvents.some(function(e) { return e.id === r.eventId; }); }).length;
    const newRegs = regs.filter(function(r) { return myEvents.some(function(e) { return e.id === r.eventId; }) && !r.seen; }).length;

    main.innerHTML = '' +
      '<div class="space-y-8">' +
      '<div class="flex justify-between items-center"><h2 class="text-3xl font-bold text-on-surface">Overview</h2><button class="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95" onclick="adminSection(\'create\')"><span class="material-symbols-outlined mr-2">add</span>New Event</button></div>' +
      '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">' +
      '<div class="glass-card p-6 rounded-2xl"><div class="text-4xl font-black text-primary mb-1">' + myEvents.length + '</div><div class="text-sm font-semibold text-slate-500 uppercase tracking-wider">My Events</div></div>' +
      '<div class="glass-card p-6 rounded-2xl"><div class="text-4xl font-black text-primary mb-1">' + totalRegs + '</div><div class="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Registrations</div></div>' +
      '<div class="glass-card p-6 rounded-2xl"><div class="text-4xl font-black text-secondary mb-1">' + newRegs + '</div><div class="text-sm font-semibold text-slate-500 uppercase tracking-wider">New (Unread)</div></div>' +
      '<div class="glass-card p-6 rounded-2xl"><div class="text-4xl font-black text-primary mb-1">' + myEvents.filter(function(e) { return !isDeadlinePassed(e); }).length + '</div><div class="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Events</div></div>' +
      '</div>' +
      '<div class="glass-card p-8 rounded-2xl">' +
      '<h3 class="text-xl font-bold text-on-surface mb-6">Recent Registrations</h3>' +
      (totalRegs === 0 ? '<div class="text-center py-12"><div class="material-symbols-outlined text-6xl text-slate-300 mb-4">people</div><h3 class="text-xl font-bold text-slate-600 mb-2">No registrations yet</h3><p class="text-slate-400">Share your events to get registrations</p></div>' :
      '<div class="overflow-x-auto"><table class="w-full"><thead><tr><th>Name</th><th>Reg No</th><th>Event</th><th>Time</th></tr></thead><tbody>' + regs.filter(function(r) { return myEvents.some(function(e) { return e.id === r.eventId; }); }).slice(-10).reverse().map(function(r) {
        return '<tr><td>' + r.name + '</td><td class="font-mono text-sm">' + r.regNo + '</td><td>' + r.eventName + '</td><td class="text-slate-500 text-sm">' + new Date(r.time).toLocaleDateString('en-IN') + '</td></tr>';
      }).join('') + '</tbody></table></div>') +
      '</div>' +
      '</div>';
    return;
  }

  if (sec === 'events') {
    main.innerHTML = '' +
      '<div class="space-y-8">' +
      '<div class="flex justify-between items-center"><h2 class="text-3xl font-bold text-on-surface">My Events</h2><button class="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95" onclick="adminSection(\'create\')"><span class="material-symbols-outlined mr-2">add</span>New Event</button></div>' +
      (myEvents.length === 0 ? '<div class="text-center py-16"><div class="material-symbols-outlined text-6xl text-slate-300 mb-4">event_busy</div><h3 class="text-xl font-bold text-slate-600 mb-2">No events yet</h3><p class="text-slate-400">Create your first event!</p></div>' :
      '<div class="glass-card rounded-2xl overflow-hidden"><table class="w-full"><thead><tr><th>Event</th><th>Date</th><th>Category</th><th>Registered</th><th>Status</th><th>Actions</th></tr></thead><tbody>' + myEvents.map(function(ev) {
        const cnt = regs.filter(function(r) { return r.eventId === ev.id; }).length;
        const status = isDeadlinePassed(ev) ? '<span class="px-3 py-1 rounded-full text-xs font-bold bg-error/10 text-error">Closed</span>' : '<span class="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">Active</span>';
        return '<tr><td><strong>' + ev.name + '</strong></td><td class="text-slate-500 text-sm">' + new Date(ev.date).toLocaleDateString('en-IN') + '</td><td><span class="font-semibold text-primary text-sm">' + ev.category + '</span></td><td>' + cnt + ' students</td><td>' + status + '</td><td><div class="flex gap-2"><button class="p-2 hover:bg-surface-variant rounded-lg transition-colors" onclick="openShareModal(\'' + ev.id + '\')"><span class="material-symbols-outlined">share</span></button><button class="p-2 hover:bg-surface-variant rounded-lg transition-colors" onclick="editEvent(\'' + ev.id + '\')"><span class="material-symbols-outlined">edit</span></button><button class="p-2 hover:bg-error/10 text-error rounded-lg transition-colors" onclick="deleteEvent(\'' + ev.id + '\')"><span class="material-symbols-outlined">delete</span></button></div></td></tr>';
      }).join('') + '</tbody></table></div>') +
      '</div>';
    return;
  }

  if (sec === 'create') {
    editingEventId = null;
    uploadedBannerData = null;
    document.getElementById('modalTitle').textContent = 'Create New Event';
    clearEventForm();
    document.getElementById('eventModal').classList.add('open');
    return;
  }

  if (sec === 'regs') {
    const myRegs = regs.filter(function(r) { return myEvents.some(function(e) { return e.id === r.eventId; }); }).map(function(r) {
      return { id: r.id, eventId: r.eventId, eventName: r.eventName, name: r.name, regNo: r.regNo, section: r.section, dept: r.dept, email: r.email, phone: r.phone, time: r.time, seen: true };
    });
    saveRegs(myRegs);

    main.innerHTML = '' +
      '<div class="space-y-8">' +
      '<div class="flex justify-between items-center"><h2 class="text-3xl font-bold text-on-surface">All Registrations</h2><button class="glass-card text-on-surface px-6 py-3 rounded-xl font-bold hover:bg-white/80 transition-all" onclick="exportCSV()"><span class="material-symbols-outlined mr-2">download</span>Export CSV</button></div>' +
      (myRegs.length === 0 ? '<div class="text-center py-16"><div class="material-symbols-outlined text-6xl text-slate-300 mb-4">people</div><h3 class="text-xl font-bold text-slate-600 mb-2">No registrations yet</h3></div>' :
      '<div class="glass-card rounded-2xl overflow-hidden"><table class="w-full"><thead><tr><th>Reg ID</th><th>Name</th><th>Reg No</th><th>Section</th><th>Event</th><th>Email</th><th>Phone</th><th>Registered</th></tr></thead><tbody>' + myRegs.reverse().map(function(r) {
        return '<tr><td class="text-xs text-slate-400 font-mono">' + r.id + '</td><td><strong>' + r.name + '</strong></td><td class="font-mono">' + r.regNo + '</td><td>' + r.section + ' - ' + r.dept + '</td><td>' + r.eventName + '</td><td>' + r.email + '</td><td>' + r.phone + '</td><td class="text-slate-500 text-sm">' + new Date(r.time).toLocaleString('en-IN') + '</td></tr>';
      }).join('') + '</tbody></table></div>') +
      '</div>';
  }
}

function clearEventForm() {
  const fields = ['evName', 'evDesc', 'evLocation', 'evContactEmail', 'evContactPhone', 'evBannerFile', 'evCategory', 'evDate', 'evDeadline'];
  fields.forEach(function(id) {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('bannerPreview').textContent = '';
  document.getElementById('removeBannerBtn').classList.add('hidden');
  uploadedBannerData = null;
}

function saveEvent() {
  console.log('saveEvent() called');

  const name = document.getElementById('evName').value.trim();
  const desc = document.getElementById('evDesc').value.trim();
  const date = document.getElementById('evDate').value;
  const deadline = document.getElementById('evDeadline').value;
  const location = document.getElementById('evLocation').value.trim();
  const category = document.getElementById('evCategory').value.trim();
  const contactEmail = document.getElementById('evContactEmail').value.trim();
  const contactPhone = document.getElementById('evContactPhone').value.trim();

  console.log('Form values:', { name, desc, date, deadline, location, category });

  if (!name || !desc || !date || !deadline || !location || !category) {
    console.log('Validation failed - missing fields');
    toast('Please fill all required fields', 'error');
    return;
  }

  const ev = {
    id: editingEventId || genId(),
    name: name,
    description: desc,
    date: date,
    deadline: deadline,
    location: location,
    category: category,
    contactEmail: contactEmail,
    contactPhone: contactPhone,
    banner: uploadedBannerData,
    organizerId: getOrganizerId(),
    createdAt: editingEventId ? undefined : new Date().toISOString()
  };

  const events = getEvents();
  if (editingEventId) {
    const idx = events.findIndex(function(e) { return e.id === editingEventId; });
    if (idx !== -1) {
      ev.createdAt = events[idx].createdAt;
      ev.organizerId = events[idx].organizerId;
      events[idx] = ev;
    }
  } else {
    events.push(ev);
  }

  console.log('Saving events:', events);
  try {
    saveEvents(events);
    console.log('Events saved to localStorage');
  } catch (e) {
    console.error('Failed to save event:', e);
    return;
  }

  document.getElementById('eventModal').classList.remove('open');
  console.log('Modal closed');
  editingEventId = null;
  uploadedBannerData = null;
  clearEventForm();

  toast('Event created!', 'success');
  adminSection('events');
}

function editEvent(id) {
  const ev = getEvents().find(function(e) { return e.id === id; });
  if (!ev) return;

  editingEventId = id;
  document.getElementById('modalTitle').textContent = 'Edit Event';
  document.getElementById('evName').value = ev.name;
  document.getElementById('evDesc').value = ev.description;
  document.getElementById('evDate').value = ev.date;
  document.getElementById('evDeadline').value = ev.deadline;
  document.getElementById('evLocation').value = ev.location;
  document.getElementById('evCategory').value = ev.category;
  document.getElementById('evContactEmail').value = ev.contactEmail || '';
  document.getElementById('evContactPhone').value = ev.contactPhone || '';
  uploadedBannerData = ev.banner || null;
  if (ev.banner) {
    document.getElementById('bannerPreview').textContent = 'Current banner loaded';
    document.getElementById('removeBannerBtn').classList.remove('hidden');
  } else {
    document.getElementById('bannerPreview').textContent = '';
    document.getElementById('removeBannerBtn').classList.add('hidden');
  }
  document.getElementById('eventModal').classList.add('open');
}

function deleteEvent(id) {
  if (!confirm('Are you sure you want to delete this event and all its registrations?')) return;

  const events = getEvents().filter(function(e) { return e.id !== id; });
  const regs = getRegs().filter(function(r) { return r.eventId !== id; });
  saveEvents(events);
  saveRegs(regs);
  toast('Event deleted', 'error');
  adminSection('events');
}

function closeModal() {
  document.getElementById('eventModal').classList.remove('open');
  editingEventId = null;
  uploadedBannerData = null;
}

// ==================== SHARE MODAL ====================
function openShareModal(eventId) {
  currentShareEventId = eventId;
  const shareUrl = window.location.origin + window.location.pathname + '#event/' + eventId;
  document.getElementById('shareLinkInput').value = shareUrl;
  document.getElementById('shareModal').classList.add('open');
}

function closeShareModal() {
  document.getElementById('shareModal').classList.remove('open');
  currentShareEventId = null;
}

function copyShareLink() {
  const input = document.getElementById('shareLinkInput');
  input.select();
  document.execCommand('copy');
  toast('Link copied to clipboard!', 'success');
}

// ==================== EXPORT CSV ====================
function exportCSV() {
  const myEvents = getMyEvents();
  const regs = getRegs().filter(function(r) { return myEvents.some(function(e) { return e.id === r.eventId; }); });

  if (regs.length === 0) {
    toast('No registrations to export', 'error');
    return;
  }

  const headers = ['Reg ID', 'Name', 'Reg No', 'Section', 'Dept', 'Email', 'Phone', 'Event', 'Registered On'];
  const rows = regs.map(function(r) {
    return [r.id, r.name, r.regNo, r.section, r.dept, r.email, r.phone, r.eventName, new Date(r.time).toLocaleString('en-IN')];
  });

  const csv = [headers].concat(rows).map(function(r) {
    return r.map(function(c) { return '"' + c + '"'; }).join(',');
  }).join('\n');

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'au_events_registrations.csv';
  a.click();
  toast('CSV exported!', 'success');
}

// ==================== MODAL CLICK OUTSIDE ====================
document.addEventListener('click', function(e) {
  const eventModal = document.getElementById('eventModal');
  const shareModal = document.getElementById('shareModal');

  if (e.target === eventModal) {
    closeModal();
  }
  if (e.target === shareModal) {
    closeShareModal();
  }
});

// ==================== INIT ====================
setInterval(renderEvents, 60000);
