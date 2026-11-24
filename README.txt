ระบบลงทะเบียนสมัครเรียน (Supabase)
====================================

ไฟล์หลัก
- index.html          เข้าสู่ระบบ
- register.html       สมัครบัญชีผู้ใช้
- user.html           แบบฟอร์มสมัครเรียนและติดตามสถานะ
- admin/login.html    เข้าสู่ระบบผู้ดูแล
- admin/dashboard.html จัดการข้อมูลผู้สมัคร
- css/style.css       รูปแบบหน้าจอ
- js/supabase.js      เชื่อม Supabase
- js/auth.js          เข้าสู่ระบบ/สมัครบัญชี
- js/user.js          ฟอร์มสมัครเรียน
- js/admin.js         จัดการผู้สมัคร
- database.sql        สร้างตารางและสิทธิ์ฐานข้อมูล

เริ่มต้นใช้งาน
1. สร้างโปรเจกต์ Supabase
2. เปิด SQL Editor แล้วรันไฟล์ database.sql ทั้งหมด
3. เปิด Project Settings > Data API แล้วคัดลอก Project URL
4. เปิด Project Settings > API Keys แล้วคัดลอก Publishable key (sb_publishable_...)
5. ใส่ค่าใน js/supabase.js
6. สร้างบัญชีผ่าน register.html หนึ่งบัญชีสำหรับผู้ดูแล (หรือสมัครบัญชีแอดมินแยก)
7. ไปที่ Supabase > Table Editor > profiles หาแถวบัญชีนั้น แล้วเปลี่ยน role จาก user เป็น admin
   หรือใช้ SQL:
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'อีเมลแอดมิน');
8. เปิดโฟลเดอร์นี้ใน VS Code แล้วใช้ Live Server เปิด index.html

หมายเหตุ
- ห้ามใส่ Secret key หรือ service_role key ในเว็บไซต์เด็ดขาด
- Publishable key ใช้ฝั่งเว็บได้ โดยต้องตั้ง RLS ตาม database.sql
- อีเมลผู้ใช้ต้องยืนยันตามการตั้งค่า Auth ของ Supabase หากเปิด Confirm email
- เปลี่ยนชื่อวิทยาลัย/สาขา/ปีการศึกษาในหน้า user.html ให้ตรงกับงานจริง
- ระบบนี้ยังไม่รวมการอัปโหลดเอกสาร หากต้องการเพิ่ม ต้องตั้งค่า Supabase Storage และสิทธิ์แยกต่างหาก
- ไม่เก็บเลขบัตรประชาชนในตัวอย่างนี้ เพื่อลดความเสี่ยงข้อมูลส่วนบุคคล
