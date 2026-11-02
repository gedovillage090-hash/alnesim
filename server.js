'use strict';
const express=require('express');const path=require('path');const fs=require('fs');const { Pool }=require('pg');const bcrypt=require('bcryptjs');const jwt=require('jsonwebtoken');const cookieParser=require('cookie-parser');const helmet=require('helmet');const QRCode=require('qrcode');
const app=express();app.disable('x-powered-by');app.use(helmet({contentSecurityPolicy:false}));app.use(express.json({limit:'20mb'}));app.use(cookieParser());

app.use((req,res,next)=>{const started=process.hrtime.bigint();res.on('finish',()=>{const ms=Number(process.hrtime.bigint()-started)/1e6;if(ms>=1000)console.warn(`[أداء] ${req.method} ${req.path} استغرق ${Math.round(ms)}ms (HTTP ${res.statusCode})`)});next()});

// الاتصال بقاعدة بيانات Supabase (PostgreSQL) مباشرة عبر متغير البيئة
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const secret=process.env.JWT_SECRET||'local-dev-secret-change-before-production';

function auth(req,res,next){
 const token=req.cookies.nasim_token;
 if(!token)return res.status(401).json({error:'يلزم تسجيل الدخول'});
 try{
  req.user=jwt.verify(token,secret);
  pool.query('SELECT id,username,full_name,role,permissions,active FROM users WHERE id=$1',[req.user.id],(err,result)=>{
   if(err||!result.rows.length||!result.rows[0].active)return res.status(401).json({error:'الحساب غير فعال أو غير موجود'});
   const u=result.rows[0];
   try{ u.permissions=typeof u.permissions==='string'?JSON.parse(u.permissions):u.permissions; }catch{ u.permissions=[]; }
   req.user=u;
   next();
  });
 }catch(e){return res.status(401).json({error:'جلسة الدخول انتهت'});}
}

function permit(key){
 return (req,res,next)=>{
  const write=!['GET','HEAD','OPTIONS'].includes(req.method);
  const allowed=req.user.role==='admin'||(write?req.user.permissions.includes('edit_'+key):req.user.permissions.includes(key)||req.user.permissions.includes('edit_'+key));
  if(allowed)return next();
  res.status(403).json({error:write?'ليس لديك صلاحية تعديل هذا القسم؛ صلاحيتك قراءة فقط':'ليس لديك صلاحية لعرض هذا القسم'});
 };
}

app.post('/api/login',async(req,res)=>{
 const {username,password}=req.body||{};
 try{
  const result=await pool.query('SELECT * FROM users WHERE username=$1 AND active=1',[String(username||'')]);
  if(!result.rows.length||!bcrypt.compareSync(String(password||''),result.rows[0].password_hash))return res.status(401).json({error:'اسم المستخدم أو كلمة المرور غير صحيحة'});
  const u=result.rows[0];
  const token=jwt.sign({id:u.id},secret,{expiresIn:'10h'});
  res.cookie('nasim_token',token,{httpOnly:true,sameSite:'strict',secure:false,maxAge:10*60*60*1000});
  await pool.query('INSERT INTO audit_logs(user_id,action,entity) VALUES($1,$2,$3)',[u.id,'login','users']);
  let perms=[];try{perms=typeof u.permissions==='string'?JSON.parse(u.permissions):u.permissions;}catch{}
  res.json({id:u.id,username:u.username,name:u.full_name,role:u.role,permissions:perms});
 }catch(e){res.status(500).json({error:'خطأ في الخادم'});}
});

app.post('/api/logout',(req,res)=>{res.clearCookie('nasim_token');res.json({ok:true});});
app.get('/api/me',auth,(req,res)=>res.json({id:req.user.id,username:req.user.username,name:req.user.full_name,role:req.user.role,permissions:req.user.permissions}));

app.get('/api/health',(req,res)=>res.json({ok:true,database:'supabase-postgres',timestamp:new Date().toISOString()}));
app.use(express.static(path.join(__dirname,'public')));
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));

const port=Number(process.env.PORT||3000);
app.listen(port,'0.0.0.0',()=>console.log(`مجموعة النسيم تعمل على Vercel/Supabase: http://localhost:${port}`));