import { supabase } from './supabase.js';

const message = document.getElementById('message');
const showMessage = (text, type = 'error') => {
  if (!message) return;
  message.textContent = text;
  message.className = `form-message ${type}`;
};

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const button = loginForm.querySelector('button[type="submit"]');
    button.disabled = true;
    showMessage('กำลังเข้าสู่ระบบ...', 'info');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    button.disabled = false;

    if (error) return showMessage(error.message);
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', data.user.id).single();

    if (profile?.role === 'admin') {
      location.href = 'admin/dashboard.html';
    } else {
      location.href = 'user.html';
    }
  });
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fullName = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const button = registerForm.querySelector('button[type="submit"]');
    button.disabled = true;
    showMessage('กำลังสร้างบัญชี...', 'info');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } }
    });
    button.disabled = false;

    if (error) return showMessage(error.message);
    if (data.session) {
      location.href = 'user.html';
    } else {
      showMessage('สมัครสำเร็จ กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชีก่อนเข้าสู่ระบบ', 'success');
    }
  });
}
