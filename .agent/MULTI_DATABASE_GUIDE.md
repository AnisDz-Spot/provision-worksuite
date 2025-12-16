# 🗄️ Multi-Database Support Guide

## ✅ Supported Databases

ProVision WorkSuite now supports **ANY** database type compatible with Prisma:

| Database          | Auto-Detected | Adapter                 | Installation                                        |
| ----------------- | ------------- | ----------------------- | --------------------------------------------------- |
| **PostgreSQL**    | ✅            | Neon (serverless) or pg | ✅ Pre-installed                                    |
| **MySQL**         | ✅            | mysql2                  | `npm install mysql2 @prisma/adapter-mysql`          |
| **SQLite**        | ✅            | better-sqlite3          | `npm install better-sqlite3 @prisma/adapter-sqlite` |
| **MS SQL Server** | ✅            | mssql                   | `npm install mssql @prisma/adapter-mssql`           |

---

## 🎯 How It Works

### Automatic Detection

The system automatically detects your database type from the connection string:

```typescript
postgresql://... → PostgreSQL (with Neon optimization if Neon URL)
mysql://...      → MySQL
file:///...      → SQLite
sqlserver://...  → MS SQL Server
```

No manual configuration needed! Just provide the connection string.

---

## 📝 Connection String Examples

### PostgreSQL

**Neon (Serverless)**:

```env
POSTGRES_URL=postgres://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/dbname
```

**Standard PostgreSQL**:

```env
POSTGRES_URL=postgresql://user:pass@localhost:5432/dbname
DATABASE_URL=postgresql://user:pass@host.com/dbname
```

**Supabase**:

```env
POSTGRES_URL=postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres
```

### MySQL

**Standard MySQL**:

```env
MYSQL_URL=mysql://user:pass@localhost:3306/dbname
DATABASE_URL=mysql://user:pass@host.com/dbname
```

**PlanetScale**:

```env
MYSQL_URL=mysql://user:pass@aws.connect.psdb.cloud/dbname?sslaccept=strict
```

### SQLite

**Local File**:

```env
SQLITE_URL=file:./data/app.db
DATABASE_URL=file:./database.sqlite
```

**Turso (LibSQL)**:

```env
DATABASE_URL=libsql://[db]-[org].turso.io?authToken=...
```

### MS SQL Server

**Azure SQL**:

```env
SQLSERVER_URL=sqlserver://user:pass@server.database.windows.net:1433;database=dbname;encrypt=true
```

**Standard SQL Server**:

```env
SQLSERVER_URL=mssql://user:pass@localhost:1433/dbname
```

---

## 🚀 Setup for Different Databases

### Option 1: UI Configuration (Recommended)

Works for **ALL** database types:

1. Login as Global Admin
2. Settings → Data Source
3. Select your database type (auto-detected from URL)
4. Paste connection string
5. Test connection
6. Save

The system automatically:

- Detects database type
- Loads appropriate adapter
- Configures Prisma client
- Runs migrations

### Option 2: Environment Variables

```env
# For PostgreSQL
POSTGRES_URL=postgresql://...

# For MySQL
MYSQL_URL=mysql://...

# For SQLite
SQLITE_URL=file:./data.db

# Or use generic DATABASE_URL (works for all)
DATABASE_URL=postgresql://...
```

---

## 📦 Optional Adapter Installation

### PostgreSQL

**Pre-installed!** No action needed.

Includes:

- `@prisma/adapter-neon` (Neon serverless)
- `@prisma/adapter-pg` (standard PostgreSQL)
- `pg` driver

### MySQL

**Install when needed**:

```bash
npm install mysql2 @prisma/adapter-mysql
```

**Features**:

- Connection pooling
- Prepared statements
- Full Prisma compatibility

### SQLite

**Install when needed**:

```bash
npm install better-sqlite3 @prisma/adapter-sqlite
```

**Features**:

- File-based storage
- No server needed
- Perfect for local/embedded use

### MS SQL Server

**Install when needed**:

```bash
npm install mssql @prisma/adapter-mssql
```

**Features**:

- Azure SQL support
- Enterprise features
- Windows authentication

---

## 🔄 Switching Databases

### During Development

1. Change connection string in `.env.local`
2. Restart dev server
3. System auto-detects new database type
4. Run migrations: `npx prisma migrate dev`

### In Production

**Via UI**:

1. Settings → Data Source
2. Enter new database URL
3. System reconnects automatically
4. No restart needed!

**Via Environment**:

1. Update platform environment variables
2. Redeploy or restart
3. Migrations run automatically

---

## ⚡ Performance Optimizations

### PostgreSQL

**Neon Detection**:
System automatically uses Neon serverless adapter if URL contains:

- `neon.tech`
- `neon.`
- `-pooler.`

**Benefits**:

- WebSocket connections
- HTTP fallback
- 4-6x faster cold starts
- Edge function compatible

**Standard PostgreSQL**:
Uses `pg` adapter with connection pooling.

### MySQL

- Automatic connection pooling
- Prepared statement caching
- Optimized for serverless

### SQLite

- In-memory caching
- WAL mode enabled
- Fast for local development

### MS SQL Server

- Connection pooling
- Azure-optimized
- Enterprise features

---

## 🎯 Use Cases

### Development: SQLite

```env
SQLITE_URL=file:./dev.db
```

**Why**: Fast, no server, easy reset

### Staging: MySQL

```env
MYSQL_URL=mysql://user:pass@staging-db.com/dbname
```

**Why**: Cost-effective, widely available

### Production: PostgreSQL (Neon)

```env
POSTGRES_URL=postgres://user:pass@...neon.tech/dbname
```

**Why**: Serverless, scalable, optimized

### Enterprise: MS SQL Server

```env
SQLSERVER_URL=sqlserver://...database.windows.net/dbname
```

**Why**: Enterprise features, compliance, Windows integration

---

## 📊 Adapter Selection Logic

```
1. Detect database type from connection string
   ↓
2. Check if specialized adapter available
   ↓ If PostgreSQL + Neon URL
3. Use Neon serverless adapter
   ↓ Else if standard PostgreSQL
4. Use pg adapter
   ↓ Else if MySQL
5. Use mysql2 adapter (install if needed)
   ↓ Else if SQLite
6. Use better-sqlite3 adapter (install if needed)
   ↓ Else if SQL Server
7. Use mssql adapter (install if needed)
   ↓ If adapter not available
8. Fallback to Prisma default drivers
```

---

## 🛠️ Troubleshooting

### "Adapter not available" Warning

**Cause**: Optional adapter not installed

**Fix**:

```bash
# For MySQL
npm install mysql2 @prisma/adapter-mysql

# For SQLite
npm install better-sqlite3 @prisma/adapter-sqlite

# For SQL Server
npm install mssql @prisma/adapter-mssql
```

### Connection Failed

**Check**:

1. Connection string format correct
2. Database server accessible
3. Credentials valid
4. Firewall allows connections

### Migration Errors

**Solution**:

```bash
# Reset and recreate
npx prisma migrate reset

# Or create fresh migration
npx prisma migrate dev --name init
```

---

## 🎁 Benefits

### For End Users

✅ **Use ANY database**:

- Cloud providers (Neon, PlanetScale, Supabase)
- Self-hosted (PostgreSQL, MySQL, SQL Server)
- Embedded (SQLite)

✅ **Zero configuration**:

- Paste connection string
- System handles the rest
- No adapter selection needed

✅ **Easy switching**:

- Change URL in settings
- No code changes
- Automatic reconnection

### For Developers

✅ **Flexible development**:

- SQLite for local dev
- PostgreSQL for staging
- Any DB for production

✅ **Optional dependencies**:

- Only install what you need
- Smaller bundle size
- Faster installs

✅ **Auto-optimization**:

- Neon serverless for Neon
- Connection pooling for others
- Best performance automatically

---

## 📝 Summary

| Feature            | Status              |
| ------------------ | ------------------- |
| PostgreSQL support | ✅ Pre-installed    |
| Neon optimization  | ✅ Auto-detected    |
| MySQL support      | ✅ Optional install |
| SQLite support     | ✅ Optional install |
| SQL Server support | ✅ Optional install |
| Auto-detection     | ✅ Built-in         |
| UI configuration   | ✅ Works for all    |
| Migration support  | ✅ All databases    |

**Your customers can use ANY database they want!** 🎉

Just paste the connection string and go!
