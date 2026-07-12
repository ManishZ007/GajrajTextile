# 🛠️ Worker Service

> A service responsible for handling all worker-related operations, including profile management and interaction with other system services.

---

## 📖 Overview

The **Worker Service** manages users with the **Worker role**.  
It follows a similar architecture to the Customer Service, ensuring consistency across the system.

This service is divided into two main controllers:

1. **Internal Worker Controller** (Service-to-Service Communication)
2. **Worker Controller** (User-Facing APIs)

---

## 🧩 Architecture

Worker Service
│
├── Internal Worker Controller (No Authentication Required)
└── Worker Controller (Authentication Required)

---

## 🔐 Internal Worker Controller

> Used for **inter-service communication**.  
> Does **not require authentication**, as it is only accessed by trusted services like the Authentication Service.

---

### ⚙️ Purpose

- Handles worker-related operations triggered by other services
- Skips JWT validation for internal system calls

---

### 🚀 Operations

#### 1. 📝 Save New Worker

- Triggered when a new user is registered with the role **Worker**

##### 🔄 Flow:

1. User registers via Authentication Service
2. Auth Service detects role = `Worker`
3. Internal request is sent to Worker Service
4. Worker data is saved

---

#### 2. ✏️ Update Worker

- Triggered when a worker updates their profile

##### 🔄 Flow:

1. Worker sends update request → Authentication Service
2. Auth Service validates and processes role
3. If role = `Worker`, request is forwarded
4. Worker Service updates the data
5. Updated response is returned to the user

---

### 📌 Notes

- No authentication required
- Only accessible internally by trusted services
- Ensures separation between internal logic and public APIs

---

## 👷 Worker Controller

> Handles **worker-facing APIs**.  
> Requires **authentication (JWT / Access Token)**.

---

### 🔑 Authentication

- Requires a valid **Access Token**
- Only users with **Worker role** are authorized
- Token is issued by the Authentication Service

---

### 🚀 Operations

#### 1. 👷 Get Worker

- Returns worker profile information

##### 🔄 Flow:

1. Worker sends request with access token
2. Worker Service processes request
3. Calls Authentication Service for additional/sensitive data
4. Authentication Service executes `getUserInfo`
5. Combined data is returned to the worker

---

### ✅ Key Points

- Works similarly to **Customer `getProfile`**
- Ensures role-based filtered data
- Sensitive data is securely managed by Authentication Service

---

## 🧠 Key Concepts

- **Role-Based Access Control (RBAC)**
  - Only Workers can access Worker Controller endpoints

- **Service-to-Service Communication**
  - Internal controller enables seamless interaction with Authentication Service

- **Consistent Architecture**
  - Follows the same pattern as Customer and Manager services

- **Secure Data Handling**
  - Sensitive data is fetched via Authentication Service

---

## ⚙️ Flow Summary

1. Worker registers → Auth Service → Worker Service (Save Worker)
2. Worker updates profile → Auth Service → Worker Service (Update Worker)
3. Worker requests profile → Worker Service → Auth Service → Response

---

## 📌 Notes

- Internal APIs are **not publicly accessible**
- Worker Controller endpoints are **secured via JWT**
- Designed for **scalable microservice architecture**

---

## 🛠️ Future Improvements

- Task assignment and tracking
- Work progress updates
- Performance metrics
- Notifications system
- Integration with Manager and Production services

---
