import { supabase } from './supabase.js';

const form = document.getElementById('adminLoginForm');
const message = document.getElementById('message');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = form.querySelector('button');
  button.disabled = true;
  message.textContent = 'กำลังตรวจสอบบัญชี...';
  message.className = 'form-message info';

  const { data, error } = await supabase.auth.signInWithPassword({
    email: document.getElementById('email').value.trim(),
    password: document.getElementById('password').value
  });

  if (error) {
    button.disabled = false;
    message.textContent = error.message;
    message.className = 'form-message error';
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('role').eq('id', data.user.id).single();

  if (profileError || profile?.role !== 'admin') {
    await supabase.auth.signOut();
    button.disabled = false;
    message.textContent = 'บัญชีนี้ไม่มีสิทธิ์ผู้ดูแลระบบ';
    message.className = 'form-message error';
    return;
  }
  location.href = 'dashboard.html';
});
