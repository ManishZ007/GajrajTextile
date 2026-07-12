# 🧑‍💼 Manager Service

> A service dedicated to handling manager-level operations, enabling coordination between customers, workers, and the system.

---

## 📖 Overview

The **Manager Service** is responsible for managing operations performed by users with the **Manager role**.  
Managers act as a bridge between different parts of the system (e.g., customers, workers, and internal processes).

> ⚠️ Note:  
> This service currently shares some similarities with the Customer Service, as it is still under development and will be expanded with more manager-specific features.

---

## 🧩 Architecture

Manager Service
│
├── Internal Manager Controller (No Authentication Required)
└── Manager Controller (Authentication Required)

---

## 🔐 Internal Manager Controller

> Used for **inter-service communication**.  
> Does **not require authentication**, as it is only accessed by trusted internal services (e.g., Authentication Service).

---

### ⚙️ Purpose

- Handles manager-related operations triggered by other services
- Bypasses JWT validation for internal system communication

---

### 🚀 Operations

#### 1. 📝 Save Manager

- Triggered when a new user is created with the role **Manager**

##### 🔄 Flow:

1. Owner creates a new Manager (via system flow)
2. Request goes to Authentication Service
3. Auth Service validates role = `Manager`
4. Internal call is made to Manager Service
5. Manager data is saved

##### 🔑 Key Points:

- Only **Owner** has permission to create a Manager
- Not publicly accessible
- Similar to Customer Service `saveUser` logic

---

### 📌 Notes

- No authentication required
- Only accessible internally
- Ensures secure and controlled manager creation

---

## 👨‍💼 Manager Controller

> Handles **manager-facing APIs**.  
> Requires **authentication (JWT / Access Token)**.

---

### 🔑 Authentication

- Requires a valid **Access Token**
- Only users with **Manager role** are authorized
- Token is issued by the Authentication Service

---

### 🚀 Current Status

- ⚠️ No active operations implemented yet
- This controller is reserved for future manager-specific functionalities

---

### 🛠️ Planned Features (Upcoming)

- Manage customer orders
- Assign work to workers
- Monitor production progress
- Handle customer issues and escalations
- Manage inventory and product updates
- Track worker performance

---

## 🧠 Key Concepts

- **Role-Based Access Control (RBAC)**
  - Only Managers can access Manager Controller endpoints

- **Service-to-Service Communication**
  - Internal controller allows seamless interaction with Authentication Service

- **Secure Manager Creation**
  - Managers can only be created by the Owner role

- **Scalable Design**
  - Built to support future expansion of manager responsibilities

---

## ⚙️ Flow Summary

1. Owner creates Manager → Auth Service → Manager Service (Save Manager)
2. Manager logs in → Receives access token
3. Manager accesses system → Authorized via JWT
4. Future operations → Handled via Manager Controller

---

## 📌 Notes

- Internal APIs are **not exposed publicly**
- Manager Controller endpoints are **secured via JWT**
- Designed for **future scalability and feature expansion**

---

## 🛠️ Future Improvements

- Full manager dashboard APIs
- Role-based analytics
- Task assignment system
- Notification system for managers
- Integration with Worker & Production services

---
