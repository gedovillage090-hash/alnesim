# نظام النسيم V59.6 — اختلاف التوقيت حسب نوع أمر التشغيل

- أمر تشغيل القاعة (order_type=hall): يعرض حقل «توقيت الفرح» بالقيمتين من start_time إلى end_time.
- أوامر تشغيل المطبخ والمخزن (وأي نوع غير القاعة): تعرض عنوان «التوقيت» فقط مع مساحة فارغة، ولا تعرض أي ساعة أو وقت.
- لم يتم تعديل البيانات أو حالات أوامر التشغيل أو سجل الطباعة.

## الاختبارات
- node --check public/app.js
- node --check server.js
- npm run check
- node --test tests/drink-quantity-rules.test.js (28 assertions)
- فحص سلامة ZIP
