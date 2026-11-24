import { supabase } from './supabase.js';

const list = document.getElementById('applicantList');
const message = document.getElementById('adminMessage');
const dialog = document.getElementById('editDialog');
const editForm = document.getElementById('editForm');
let registrations = [];

function notify(text, type = 'error') {
  message.textContent = text;
  message.className = `form-message ${type}`;
}
function statusLabel(status) {
  return ({ pending: 'รอตรวจสอบ', approved: 'อนุมัติแล้ว', rejected: 'ไม่อนุมัติ' })[status] || status;
}
function safeText(value) { return value ?? '-'; }

async function guardAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    location.href = 'login.html';
    return false;
  }
  const { data: profile, error } = await supabase.from('profiles')
    .select('role').eq('id', user.id).single();
  if (error || profile?.role !== 'admin') {
    await supabase.auth.signOut();
    location.href = 'login.html';
    return false;
  }
  return true;
}

function updateStats(data) {
  document.getElementById('total').textContent = data.length;
  document.getElementById('pending').textContent = data.filter(x => x.status === 'pending').length;
  document.getElementById('approved').textContent = data.filter(x => x.status === 'approved').length;
  document.getElementById('rejected').textContent = data.filter(x => x.status === 'rejected').length;
  document.getElementById('summary').textContent = `พบผู้สมัครทั้งหมด ${data.length} รายการ`;
}

function renderRows() {
  const keyword = document.getElementById('search').value.trim().toLowerCase();
  const status = document.getElementById('statusFilter').value;
  const filtered = registrations.filter(row => {
    const name = `${row.prefix || ''}${row.first_name} ${row.last_name}`.toLowerCase();
    const matchesText = [name, row.email, row.phone, row.department].some(v => (v || '').toLowerCase().includes(keyword));
    return matchesText && (!status || row.status === status);
  });
  list.replaceChildren();

  if (!filtered.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.textContent = 'ไม่พบข้อมูลผู้สมัคร';
    tr.append(td); list.append(tr); return;
  }

  filtered.forEach(row => {
    const tr = document.createElement('tr');
    const name = document.createElement('td');
    const strong = document.createElement('strong');
    strong.textContent = `${row.prefix || ''}${row.first_name} ${row.last_name}`;
    const email = document.createElement('small');
    email.className = 'table-sub';
    email.textContent = row.email || '';
    name.append(strong, email);

    const course = document.createElement('td');
    course.textContent = `${safeText(row.education_level)} / ${safeText(row.department)}`;
    const phone = document.createElement('td'); phone.textContent = safeText(row.phone);
    const date = document.createElement('td'); date.textContent = new Date(row.created_at).toLocaleDateString('th-TH');
    const statusCell = document.createElement('td');
    const badge = document.createElement('span'); badge.className = `status ${row.status}`; badge.textContent = statusLabel(row.status);
    statusCell.append(badge);

    const actions = document.createElement('td');
    actions.className = 'action-cell';
    const edit = document.createElement('button'); edit.className = 'btn tiny light'; edit.textContent = 'ดู / แก้ไข';
    edit.addEventListener('click', () => openEdit(row));
    const approve = document.createElement('button'); approve.className = 'btn tiny success'; approve.textContent = 'อนุมัติ';
    approve.addEventListener('click', () => changeStatus(row.id, 'approved'));
    const reject = document.createElement('button'); reject.className = 'btn tiny danger'; reject.textContent = 'ไม่อนุมัติ';
    reject.addEventListener('click', () => changeStatus(row.id, 'rejected'));
    const del = document.createElement('button'); del.className = 'btn tiny danger-outline'; del.textContent = 'ลบ';
    del.addEventListener('click', () => deleteApplication(row.id));
    actions.append(edit, approve, reject, del);
    tr.append(name, course, phone, date, statusCell, actions);
    list.append(tr);
  });
}

async function loadData() {
  notify('กำลังโหลดข้อมูล...', 'info');
  const { data, error } = await supabase.from('registrations')
    .select('*').order('created_at', { ascending: false });
  if (error) { notify(error.message); return; }
  registrations = data || [];
  updateStats(registrations);
  renderRows();
  notify('โหลดข้อมูลเรียบร้อย', 'success');
}

async function changeStatus(id, status) {
  const label = statusLabel(status);
  if (!confirm(`ยืนยันเปลี่ยนสถานะเป็น "${label}" หรือไม่?`)) return;
  const { error } = await supabase.from('registrations').update({ status }).eq('id', id);
  if (error) return notify(error.message);
  notify('เปลี่ยนสถานะเรียบร้อย', 'success');
  await loadData();
}

async function deleteApplication(id) {
  if (!confirm('ต้องการลบใบสมัครนี้ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้')) return;
  const { error } = await supabase.from('registrations').delete().eq('id', id);
  if (error) return notify(error.message);
  notify('ลบใบสมัครเรียบร้อย', 'success');
  await loadData();
}

function openEdit(row) {
  for (const [key, value] of Object.entries(row)) {
    const field = editForm.elements.namedItem(key);
    if (field && value !== null) field.value = value;
  }
  dialog.showModal();
}
function closeEdit() { dialog.close(); }

editForm.addEventListener('submit', async event => {
  event.preventDefault();
  const button = editForm.querySelector('button[type="submit"]');
  button.disabled = true;
  const raw = Object.fromEntries(new FormData(editForm).entries());
  const id = Number(raw.id);
  delete raw.id;
  const allowed = [
    'prefix','first_name','last_name','birth_date','gender','phone','email',
    'education_level','department','previous_school','academic_year','address_no',
    'village','subdistrict','district','province','postal_code','guardian_name',
    'guardian_phone','status','admin_note'
  ];
  const payload = {};
  allowed.forEach(key => payload[key] = raw[key] === '' ? null : raw[key]);
  const { error } = await supabase.from('registrations').update(payload).eq('id', id);
  button.disabled = false;
  if (error) { notify(error.message); return; }
  closeEdit();
  notify('บันทึกการแก้ไขเรียบร้อย', 'success');
  await loadData();
});

document.getElementById('closeDialog').addEventListener('click', closeEdit);
document.getElementById('cancelEdit').addEventListener('click', closeEdit);
document.getElementById('search').addEventListener('input', renderRows);
document.getElementById('statusFilter').addEventListener('change', renderRows);
document.getElementById('refresh').addEventListener('click', loadData);
document.getElementById('adminLogout').addEventListener('click', async () => {
  await supabase.auth.signOut();
  location.href = '../index.html';
});

if (await guardAdmin()) await loadData();
