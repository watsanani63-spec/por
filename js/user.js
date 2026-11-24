import { supabase } from './supabase.js';

const form = document.getElementById('applicationForm');
const message = document.getElementById('formMessage');
const statusBadge = document.getElementById('statusBadge');
const myApplication = document.getElementById('myApplication');
let currentUser;
let existingApplication;

function say(text, type = 'error') {
  message.textContent = text;
  message.className = `form-message ${type}`;
}

function setFormValues(data) {
  for (const [key, value] of Object.entries(data || {})) {
    const field = form.elements.namedItem(key);
    if (field && value !== null) field.value = value;
  }
}

function formData() {
  const data = Object.fromEntries(new FormData(form).entries());
  for (const key of Object.keys(data)) {
    data[key] = typeof data[key] === 'string' ? data[key].trim() : data[key];
    if (data[key] === '') data[key] = null;
  }
  return data;
}

function showStatus(row) {
  const labels = { pending: 'รอตรวจสอบ', approved: 'อนุมัติแล้ว', rejected: 'ไม่อนุมัติ' };
  const status = row?.status || 'pending';
  statusBadge.textContent = labels[status] || status;
  statusBadge.className = `status ${status}`;
  myApplication.replaceChildren();

  const items = [
    ['เลขที่ใบสมัคร', row.application_no || '-'],
    ['ระดับการศึกษา', row.education_level],
    ['สาขาวิชา', row.department],
    ['ปีการศึกษา', row.academic_year],
    ['หมายเหตุจากผู้ดูแล', row.admin_note || 'ไม่มีหมายเหตุ']
  ];
  const grid = document.createElement('div');
  grid.className = 'detail-grid';
  items.forEach(([label, value]) => {
    const box = document.createElement('div');
    box.className = 'detail-item';
    const small = document.createElement('small');
    small.textContent = label;
    const strong = document.createElement('strong');
    strong.textContent = value || '-';
    box.append(small, strong);
    grid.append(box);
  });
  myApplication.append(grid);
}

async function init() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    location.href = 'index.html';
    return;
  }
  currentUser = user;
  const { data: profile } = await supabase.from('profiles')
    .select('full_name, role').eq('id', user.id).single();

  if (profile?.role === 'admin') {
    location.href = 'admin/dashboard.html';
    return;
  }
  document.getElementById('welcomeName').textContent = profile?.full_name || user.email;

  const { data, error: loadError } = await supabase.from('registrations')
    .select('*').eq('user_id', user.id).maybeSingle();
  if (loadError) return say(loadError.message);
  existingApplication = data;
  if (data) {
    setFormValues(data);
    showStatus(data);
    if (data.status !== 'pending') {
      form.querySelectorAll('input, select, button[type="submit"]').forEach(el => el.disabled = true);
      say('ใบสมัครได้รับการพิจารณาแล้ว หากต้องการแก้ไข กรุณาติดต่อผู้ดูแลระบบ', 'info');
    }
  } else {
    statusBadge.textContent = 'ยังไม่ได้ส่งใบสมัคร';
    statusBadge.className = 'status pending';
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!currentUser) return;
  const button = document.getElementById('saveApplication');
  button.disabled = true;
  say('กำลังบันทึกข้อมูล...', 'info');

  const payload = {
    ...formData(),
    user_id: currentUser.id,
    status: 'pending'
  };

  let result;
  if (existingApplication) {
    result = await supabase.from('registrations')
      .update(payload).eq('id', existingApplication.id).select().single();
  } else {
    result = await supabase.from('registrations')
      .insert(payload).select().single();
  }

  button.disabled = false;
  if (result.error) return say(result.error.message);
  existingApplication = result.data;
  showStatus(result.data);
  say('บันทึกใบสมัครเรียบร้อยแล้ว', 'success');
});

document.getElementById('logout').addEventListener('click', async () => {
  await supabase.auth.signOut();
  location.href = 'index.html';
});

init();
