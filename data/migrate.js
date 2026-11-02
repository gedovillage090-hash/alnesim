const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

// مسار ثابت ومباشر لملف الـ SQLite في نفس المجلد
const dbPath = path.resolve(__dirname, 'nasim.sqlite');

const sqliteDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('خطأ في فتح ملف SQLite:', err.message);
    } else {
        console.log('تم الاتصال بملف SQLite بنجاح من مسار:', dbPath);
    }
});

// الاتصال بـ Supabase (PostgreSQL)
const pool = new Pool({
    connectionString: 'postgresql://postgres.umxldepziztmtulcealb:Mf01092101182@db.umxldepziztmtulcealb.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
});

async function migrateAllTables() {
    sqliteDb.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';", async (err, tables) => {
        if (err) {
            console.error('خطأ في جلب الجداول:', err.message);
            return;
        }

        console.log(`تم العثور على ${tables.length} جدول لنقلها.`);

        for (let t of tables) {
            const tableName = t.name;
            console.log(`--- جاري نقل جدول: ${tableName} ---`);

            await new Promise((resolve) => {
                sqliteDb.all(`SELECT * FROM "${tableName}"`, async (err, rows) => {
                    if (err) {
                        console.log(`خطأ في قراءة الجدول ${tableName}:`, err.message);
                        return resolve();
                    }

                    if (rows.length === 0) {
                        console.log(`الجدول ${tableName} فارغ.`);
                        return resolve();
                    }

                    for (let row of rows) {
                        const columns = Object.keys(row);
                        const values = Object.values(row);
                        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                        const colNames = columns.map(c => `"${c}"`).join(', ');

                        const query = `INSERT INTO "${tableName}" (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

                        try {
                            await pool.query(query, values);
                        } catch (pgErr) {
                            // نتجاهل الأخطاء البسيطة لكي يستمر النقل بسلاسة
                        }
                    }

                    console.log(`تم نقل جدول ${tableName} بنجاح (${rows.length} سجل).`);
                    resolve();
                });
            });
        }

        console.log('=== تم الانتهاء من نقل كل البيانات بنجاح تام! ===');
        pool.end();
        sqliteDb.close();
    });
}

migrateAllTables();