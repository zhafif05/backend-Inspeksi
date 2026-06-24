# Architecture Overview

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT LAYER                          │
│        (Frontend: Next.js / Web Browser)                   │
└────────────────────┬────────────────────────────────────────┘
                     │
         HTTP/HTTPS with JWT Token
                     │
┌────────────────────▼────────────────────────────────────────┐
│                     API GATEWAY                              │
│              (Express.js Server Port 5000)                   │
├─────────────────────────────────────────────────────────────┤
│  Routes Layer                                                │
│  ├─ /api/auth       (Authentication)                        │
│  ├─ /api/users      (User Management)                       │
│  ├─ /api/labs       (Laboratory)                            │
│  ├─ /api/items      (Equipment)                             │
│  ├─ /api/inspections (Inspection)                           │
│  └─ /api/schedules  (Schedule)                              │
├─────────────────────────────────────────────────────────────┤
│  Middleware Layer                                            │
│  ├─ Authentication (JWT Verification)                       │
│  ├─ Authorization (Role-Based)                              │
│  ├─ Validation (Input Validation)                           │
│  ├─ CORS (Cross-Origin)                                    │
│  └─ Error Handling                                          │
├─────────────────────────────────────────────────────────────┤
│  Controller Layer (Business Logic)                          │
│  ├─ authController                                          │
│  ├─ userController                                          │
│  ├─ laboratoryController                                    │
│  ├─ itemController                                          │
│  ├─ inspectionController                                    │
│  └─ scheduleController                                      │
├─────────────────────────────────────────────────────────────┤
│  Data Layer (Database)                                       │
│  └─ MySQL2 Connection Pool                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              DATABASE LAYER (MySQL)                          │
├─────────────────────────────────────────────────────────────┤
│  Tables:                                                     │
│  ├─ users (id, name, email, password, role, ...)          │
│  ├─ laboratories (id, nama_lab, lokasi, ...)              │
│  ├─ items (id, laboratory_id, nama_barang, ...)           │
│  ├─ inspections (id, laboratory_id, item_id, ...)         │
│  └─ schedules (id, laboratory_id, tanggal, ...)           │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Authentication Flow

```
1. USER LOGIN
   │
   └─> POST /api/auth/login
       ├─ Check email exists
       ├─ Compare password (bcryptjs)
       └─> Generate JWT Token

2. JWT TOKEN CREATED
   │
   ├─ Header: {alg: 'HS256', typ: 'JWT'}
   ├─ Payload: {id, email, role, exp}
   └─> Secret: JWT_SECRET from .env

3. CLIENT STORES TOKEN
   │
   └─> localStorage or session storage

4. API REQUEST with TOKEN
   │
   ├─> Authorization: Bearer <token>
   └─> API checks middleware

5. MIDDLEWARE VERIFICATION
   │
   ├─ Extract token from header
   ├─ Verify signature
   ├─ Check expiration
   └─> Success: Continue to controller
   └─> Error: 401/403 Response

6. ROLE AUTHORIZATION
   │
   ├─ Check user.role
   ├─ Compare with required role
   └─> Success: Execute controller
   └─> Error: 403 Forbidden
```

## 📊 Request-Response Cycle

```
┌─ CLIENT REQUEST ─────────────────────────────────────────┐
│ GET /api/items                                            │
│ Headers: Authorization: Bearer <jwt_token>               │
│ Body: (if applicable)                                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌─ REQUEST PROCESSING ─────────────────┐
        │ 1. Parse request                     │
        │ 2. Extract headers & body            │
        │ 3. Match route                       │
        └──────────────┬─────────────────────┘
                       │
                       ▼
        ┌─ MIDDLEWARE CHAIN ────────────────────┐
        │ 1. verifyToken middleware             │
        │    └─> Extract & verify JWT           │
        │    └─> Attach user to req.user        │
        │ 2. authorizeRole middleware           │
        │    └─> Check user.role matches        │
        │ 3. Validation middleware              │
        │    └─> Validate input data            │
        └──────────────┬─────────────────────┘
                       │
                       ▼
        ┌─ CONTROLLER EXECUTION ──────────────┐
        │ 1. itemController.getAllItems()      │
        │ 2. Query database                    │
        │ 3. Format response                   │
        │ 4. Return JSON                       │
        └──────────────┬─────────────────────┘
                       │
                       ▼
┌─ SERVER RESPONSE ────────────────────────────────────────┐
│ Status: 200                                              │
│ Headers: Content-Type: application/json                 │
│ Body: {                                                  │
│   "success": true,                                       │
│   "data": [...],                                         │
│   "total": 5                                             │
│ }                                                        │
└────────────────────────────────────────────────────────┘
```

## 🗂️ File Organization Logic

```
backend/
│
├── server.js
│   └─> Main entry point
│       ├─> Require dotenv
│       ├─> Require express
│       ├─> Mount routes
│       └─> Listen on port
│
├── src/
│   │
│   ├── config/
│   │   └─> database.js
│   │       └─> MySQL pool connection
│   │
│   ├── middleware/
│   │   ├─> authMiddleware.js
│   │   │   ├─ verifyToken()
│   │   │   └─ authorizeRole()
│   │   ├─> validation.js
│   │   │   └─ Validation rules
│   │   └─> multerConfig.js
│   │       └─ File upload config
│   │
│   ├── controllers/
│   │   ├─> authController.js
│   │   ├─> userController.js
│   │   ├─> laboratoryController.js
│   │   ├─> itemController.js
│   │   ├─> inspectionController.js
│   │   └─> scheduleController.js
│   │
│   ├── routes/
│   │   ├─> authRoutes.js
│   │   ├─> userRoutes.js
│   │   ├─> laboratoryRoutes.js
│   │   ├─> itemRoutes.js
│   │   ├─> inspectionRoutes.js
│   │   └─> scheduleRoutes.js
│   │
│   └── models/
│       └─> (Database models structure)
│
├── uploads/
│   └─> Folder penyimpanan foto
│
├── .env
├── package.json
└── database.sql
```

## 🔄 Data Flow Example: Create Inspection

```
1. USER ACTION (Frontend)
   └─> Click "Buat Inspeksi" button
       └─> Form data: {laboratory_id, item_id, kondisi, catatan, foto}

2. HTTP REQUEST
   └─> POST /api/inspections
       └─> Headers: Authorization: Bearer <token>
       └─> Body: form-data with file

3. SERVER RECEIVES REQUEST
   └─> Express parses request
       └─> Multer handles file upload
       └─> Express parses JSON body

4. ROUTE MATCHING
   └─> Matches POST /api/inspections route
       └─> Applies middleware chain

5. MIDDLEWARE EXECUTION
   a) verifyToken
      └─> Check token exists
      └─> Verify signature & expiration
      └─> Attach user to req.user
   
   b) authorizeRole('admin', 'kalab')
      └─> Check req.user.role
      └─> Must be admin or kalab
   
   c) upload.single('foto')
      └─> Process file upload
      └─> Validate file type (image)
      └─> Validate file size (5MB)
      └─> Store file to /uploads/
   
   d) validateInspection
      └─> body validation
      └─> handleValidationErrors

6. CONTROLLER EXECUTION
   └─> inspectionController.createInspection()
       a) Check laboratory_id exists (SELECT)
       b) Check item_id exists (SELECT)
       c) Insert inspection record (INSERT)
       d) Format response

7. DATABASE OPERATIONS
   a) SELECT laboratories WHERE id = ?
      └─> Verify lab exists
   
   b) SELECT items WHERE id = ?
      └─> Verify item exists
   
   c) INSERT INTO inspections
      └─> Add new inspection record
      └─> Set timestamps
      └─> Store foto path

8. RESPONSE SENT
   └─> Status 201 Created
   └─> JSON Response:
       {
         "success": true,
         "message": "Inspeksi berhasil dibuat",
         "data": {
           "id": 1,
           "laboratory_id": 1,
           "item_id": 1,
           "inspector_id": 2,
           "kondisi": "baik",
           "catatan": "...",
           "foto": "/uploads/foto-12345.jpg"
         }
       }

9. CLIENT RECEIVES RESPONSE
   └─> Parse JSON
   └─> Show success message
   └─> Update UI
```

## 🛡️ Security Layers

```
┌─────────────────────────────────────────────────┐
│ Layer 1: HTTPS/TLS (Transport Security)         │
│ └─> Encrypt data in transit                     │
├─────────────────────────────────────────────────┤
│ Layer 2: CORS (Cross-Origin Protection)         │
│ └─> Restrict requests from other origins        │
├─────────────────────────────────────────────────┤
│ Layer 3: Authentication (JWT)                   │
│ └─> Verify user identity                        │
├─────────────────────────────────────────────────┤
│ Layer 4: Authorization (Role-Based)             │
│ └─> Check user permissions                      │
├─────────────────────────────────────────────────┤
│ Layer 5: Input Validation                       │
│ └─> Prevent invalid/malicious data              │
├─────────────────────────────────────────────────┤
│ Layer 6: SQL Prepared Statements                │
│ └─> Prevent SQL injection                       │
├─────────────────────────────────────────────────┤
│ Layer 7: Password Hashing (Bcryptjs)            │
│ └─> Encrypt passwords in database               │
├─────────────────────────────────────────────────┤
│ Layer 8: Error Handling                         │
│ └─> Hide sensitive error info                   │
└─────────────────────────────────────────────────┘
```

## 📈 Scalability Considerations

```
Current Architecture:
├─ Single Node.js process
├─ MySQL connection pool (10 connections)
├─ Suitable for: Small to medium deployments
└─ Expected: Handles 100+ concurrent users

Future Enhancements:
├─ Load balancer (nginx/HAProxy)
├─ Multiple Node.js instances
├─ Database replication
├─ Caching layer (Redis)
├─ Message queue (RabbitMQ)
└─ CDN for static files
```

## 🔌 API Integration Points

```
┌─────────────────────────────────────────────────┐
│           FRONTEND (Next.js)                    │
│  └─ API calls via fetch/axios                  │
│  └─ Base URL: http://localhost:5000            │
├─────────────────────────────────────────────────┤
│  BACKEND (Node.js + Express)                    │
│  └─ Port: 5000                                 │
│  └─ API Routes: /api/*                         │
├─────────────────────────────────────────────────┤
│  DATABASE (MySQL)                               │
│  └─ Port: 3306                                 │
│  └─ Host: localhost                            │
├─────────────────────────────────────────────────┤
│  FILE STORAGE                                   │
│  └─ Location: ./uploads                        │
│  └─ Access: /uploads/<filename>                │
└─────────────────────────────────────────────────┘
```

---

This architecture provides:
✅ Separation of concerns (MVC)
✅ Security layers
✅ Scalability
✅ Maintainability
✅ Clear data flow
✅ Role-based access control
