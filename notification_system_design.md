# Stage 1

## Campus Notification Microservice Design

I have designed a campus notification microservice architecture to deliver campus notifications to authenticated students for Placements, Events, Results, and other administrative updates. It provides REST endpoints for listing student notifications, reading/unreading notifications, counting unread items, and supporting real-time delivery while students are logged in.

### Core actions

- Retrieve a student’s notifications feed
- Retrieve unread notification count for badge updates
- Mark a notification read or unread
- Mark all notifications read
- Delete a notification
- Deliver real-time student notification events

---

## API Endpoints

### 1. Get student notifications list

`GET /api/v1/students/{studentId}/notifications`

Headers:

- `Authorization: Bearer <token>`
- `Accept: application/json`

Query parameters:

- `page` (integer, optional, default=1)
- `pageSize` (integer, optional, default=20)
- `status` (string, optional, values: `all`, `unread`, `read`)
- `category` (string, optional, values: `placement`, `event`, `result`, `admin`, `academic`)
- `sortBy` (string, optional, values: `createdAt`, `priority`, default=`createdAt`)
- `sortOrder` (string, optional, values: `desc`, `asc`, default=`desc`)

Request body: none

Response:

```json
{
  "studentId": "student-123",
  "page": 1,
  "pageSize": 20,
  "total": 42,
  "notifications": [
    {
      "notificationId": "notif-567",
      "type": "placement.call",
      "title": "Placement drive registration open",
      "message": "The Campus Placement Drive registration is now open for eligible students.",
      "category": "placement",
      "status": "unread",
      "priority": "high",
      "createdAt": "2026-05-02T09:15:00Z",
      "updatedAt": "2026-05-02T09:15:00Z",
      "metadata": {
        "department": "Computer Science",
        "semester": "6",
        "actionUrl": "/placements/registration"
      }
    }
  ]
}
```

### 2. Get unread notification count

`GET /api/v1/students/{studentId}/notifications/count`

Headers:

- `Authorization: Bearer <token>`
- `Accept: application/json`

Response:

```json
{
  "studentId": "student-123",
  "unreadCount": 7
}
```

### 3. Mark a notification as read or unread

`PATCH /api/v1/students/{studentId}/notifications/{notificationId}`

Headers:

- `Authorization: Bearer <token>`
- `Content-Type: application/json`
- `Accept: application/json`

Request body:

```json
{
  "status": "read"
}
```

Response:

```json
{
  "notificationId": "notif-567",
  "status": "read",
  "updatedAt": "2026-05-02T09:20:30Z"
}
```

If the client sends `"status": "unread"`, the same response shape applies.

### 4. Mark all notifications as read

`POST /api/v1/students/{studentId}/notifications/mark-all-read`

Headers:

- `Authorization: Bearer <token>`
- `Content-Type: application/json`
- `Accept: application/json`

Request body: none

Response:

```json
{
  "studentId": "student-123",
  "markedCount": 18,
  "updatedAt": "2026-05-02T09:30:00Z"
}
```

### 5. Delete a notification

`DELETE /api/v1/students/{studentId}/notifications/{notificationId}`

Headers:

- `Authorization: Bearer <token>`
- `Accept: application/json`

Response:

```json
{
  "notificationId": "notif-567",
  "deleted": true
}
```

---

## JSON Schemas

### Notification object

```json
{
  "notificationId": "string",
  "type": "string",
  "title": "string",
  "message": "string",
  "category": "string",
  "status": "string",
  "priority": "string",
  "createdAt": "string",
  "updatedAt": "string",
  "metadata": {
    "department": "string",
    "semester": "string",
    "courseCode": "string",
    "actionUrl": "string"
  }
}
```

Field definitions:

- `notificationId`: unique notification identifier
- `type`: campus event type, e.g. `placement.call`, `event.reminder`, `result.published`
- `title`: short headline displayed in the student UI
- `message`: notification body text
- `category`: `placement`, `event`, `result`, `admin`, or `academic`
- `status`: `unread` or `read`
- `priority`: `low`, `medium`, `high`
- `createdAt`: ISO 8601 timestamp when notification was generated
- `updatedAt`: ISO 8601 timestamp when notification or status last changed
- `metadata`: optional contextual fields for campus-specific routing and deep links

### Mark status payload

```json
{
  "status": "read"
}
```

### Real-time notification event payload

```json
{
  "event": "notification.received",
  "studentId": "student-123",
  "notification": {
    "notificationId": "notif-890",
    "type": "result.published",
    "title": "Result published for Data Structures",
    "message": "Your Data Structures final exam result is now available.",
    "category": "result",
    "status": "unread",
    "priority": "high",
    "createdAt": "2026-05-02T10:00:00Z",
    "updatedAt": "2026-05-02T10:00:00Z",
    "metadata": {
      "department": "Computer Science",
      "semester": "6",
      "courseCode": "CS306",
      "actionUrl": "/results/cs306"
    }
  }
}
```

---

## Headers and Authentication

All endpoints are protected and require bearer token authorization. The notification microservice should validate that the authenticated student matches the `studentId` path parameter and enforce tenant access controls.

Required headers:

- `Authorization: Bearer <token>`
- `Accept: application/json`
- `Content-Type: application/json` for POST/PATCH requests
- `X-Correlation-Id` (optional, for tracing)

Optional headers:

- `Accept-Language` to localize notification text
- `X-Client-Version` for client compatibility

---

## Real-time Notification Mechanism

The microservice should expose a real-time channel to deliver campus notifications immediately while students are logged in.

### Recommended approach

- Use WebSocket or Server-Sent Events (SSE) for browser/mobile clients.
- Authenticate the real-time session using the same `Authorization: Bearer <token>` header or token handshake.
- After connection, subscribe the client to `student:{studentId}:notifications`.
- Send events when new placement, event, result, or admin notifications arrive.

---

## Stage 2

### Persistent storage recommendation

For this campus notification microservice, the first choice is a NoSQL document store such as MongoDB, DynamoDB, or Cosmos DB.

Reasons:

- Notification records are naturally document-shaped and student-scoped.
- Write-heavy ingestion from placement, events, results, and admin systems is easier in NoSQL.
- Query patterns are simple: fetch by `studentId`, filter by `status`/`category`, update read state, count unread.
- Schemas can evolve over time with additional campus metadata fields.
- NoSQL supports horizontal scaling across shards for large volumes of student feeds.

### NoSQL schema

Collection/table: `notifications`

Document shape:

```json
{
  "notificationId": "notif-567",
  "studentId": "student-123",
  "type": "placement.call",
  "category": "placement",
  "title": "Placement drive registration open",
  "message": "The Campus Placement Drive registration is now open for eligible students.",
  "status": "unread",
  "priority": "high",
  "createdAt": "2026-05-02T09:15:00Z",
  "updatedAt": "2026-05-02T09:15:00Z",
  "metadata": {
    "department": "Computer Science",
    "semester": "6",
    "courseCode": "CS306",
    "actionUrl": "/placements/registration"
  }
}
```

Recommended indexes:

- Partition/primary key: `studentId`
- Sort key: `createdAt` or `notificationId`
- Secondary index on `(studentId, status)` for unread badge count
- Optional index on `(studentId, category)` for category filtering

### NoSQL query examples

MongoDB-style queries:

- Fetch student notifications:

```js
db.notifications.find({ studentId: "student-123" })
  .sort({ createdAt: -1 })
  .skip(0)
  .limit(20)
```

- Fetch filtered notifications:

```js
db.notifications.find({
  studentId: "student-123",
  status: "unread",
  category: "result"
})
  .sort({ createdAt: -1 })
```

- Count unread notifications:

```js
db.notifications.countDocuments({ studentId: "student-123", status: "unread" })
```

- Update read status:

```js
db.notifications.updateOne(
  { studentId: "student-123", notificationId: "notif-567" },
  { $set: { status: "read", updatedAt: new Date() } }
)
```

- Mark all notifications read:

```js
db.notifications.updateMany(
  { studentId: "student-123", status: "unread" },
  { $set: { status: "read", updatedAt: new Date() } }
)
```

- Delete a notification:

```js
db.notifications.deleteOne({ studentId: "student-123", notificationId: "notif-567" })
```

### NoSQL scaling issues and mitigation

Potential problems as volume increases:

- Hot partitioning if a single student receives extremely frequent notifications.
- Growing storage and slower scans for old notifications.
- Increasing read latency when filters require scanning large student feeds.
- Secondary index costs for high-cardinality queries.

Mitigations:

- Shard by `studentId` and use a sorted key such as `createdAt` or `notificationId`.
- Use TTL or archive old notifications to cheaper storage after a retention window.
- Keep current feed and unread count in a separate fast-access cache or materialized counter.
- Use a partial index for `status: unread` to support badge counts efficiently.
- Store only student-scoped notifications; avoid global scans.

### When to migrate to SQL

If the campus system later requires complex relational queries, transactional multi-row updates, or strong joins across students, courses, and results, migrating the notification store to SQL becomes a good design choice.

Migration triggers:

- Need for analytics/reporting that joins notifications with `students`, `courses`, `placements`, or `events`.
- Requirement for ACID transactions spanning notification creation and student enrollment updates.
- Need to enforce stronger foreign key relationships between notifications and enrolled entities.
- Complex filtering/reporting across many students and categories that are hard to index efficiently in NoSQL.

In that case, a relational schema might look like:

Table: `notifications`

- `notification_id` VARCHAR PRIMARY KEY
- `student_id` VARCHAR NOT NULL
- `type` VARCHAR NOT NULL
- `category` VARCHAR NOT NULL
- `title` TEXT NOT NULL
- `message` TEXT NOT NULL
- `status` VARCHAR NOT NULL
- `priority` VARCHAR NOT NULL
- `created_at` TIMESTAMP NOT NULL
- `updated_at` TIMESTAMP NOT NULL
- `metadata` JSONB NULL

Indexes:

- `idx_notifications_student` on `(student_id, created_at DESC)`
- `idx_notifications_unread` on `(student_id, status)`
- `idx_notifications_category` on `(student_id, category)`

SQL query examples:

- Fetch student notifications:

```sql
SELECT *
FROM notifications
WHERE student_id = 'student-123'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

- Count unread notifications:

```sql
SELECT COUNT(*) AS unread_count
FROM notifications
WHERE student_id = 'student-123'
  AND status = 'unread';
```

- Update read status:

```sql
UPDATE notifications
SET status = 'read', updated_at = NOW()
WHERE student_id = 'student-123'
  AND notification_id = 'notif-567';
```

- Mark all read:

```sql
UPDATE notifications
SET status = 'read', updated_at = NOW()
WHERE student_id = 'student-123'
  AND status = 'unread';
```

### Hybrid approach

A good design can also be combination of both NoSQL and SQL:

- Keep NoSQL as the primary notification store for ingestion and student feed reads.
- Use SQL for analytics, reporting, and cross-entity joins if required later.
- Archive old notifications from NoSQL into SQL or data warehouse for historical reporting.

This gives the campus notification service the fast, flexible ingestion and horizontal scalability of NoSQL first, with a clear path to SQL when relational requirements or analytics needs make it a better fit.

### Example WebSocket workflow

1. Client connects to `wss://api.example.com/realtime`.
2. Client sends auth token and student ID.
3. Server validates student identity and subscribes the socket to the student notification stream.
4. Server sends events such as `notification.received`, `notification.updated`, or `notification.count.updated`.

### Example event types

- `notification.received`
- `notification.updated`
- `notification.count.updated`
- `notification.deleted`

### Real-time response sample

```json
{
  "event": "notification.count.updated",
  "studentId": "student-123",
  "unreadCount": 8
}
```

### Fallback strategy

- Support periodic polling of the notifications list and unread count when real-time is unavailable.
- Recommended poll interval: 10–30 seconds, depending on the UI responsiveness requirements.

---

## Campus-specific integration notes

- The microservice should consume events from Placement, Event, Result, and Admin systems.
- Store notifications as student-scoped records and only return notifications for the authenticated student.
- Use `category` and `type` to let the frontend render badges, icons, and action links.
- Always refresh the unread badge via `GET /api/v1/students/{studentId}/notifications/count`.
- Prefer real-time events for campus alerts and result publications to keep the student dashboard current.
- Provide stable `actionUrl` values so the frontend can route students to the right page in the portal.

---

## Stage 3

### Query evaluation

Original query:
```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
```

Is it accurate?
- Functionally, it retrieves all unread notifications for student `1042` and sorts them newest first.
- It is correct for the intended unread-notification API behavior, but it is not optimal at scale.

Why is it slow?
- `SELECT *` reads every column even if the API only needs a subset of fields.
- Without an efficient composite index, the database may perform a full table scan or a large index scan.
- Sorting by `createdAt DESC` adds additional work if the result set is large.
- As the table grows to 5,000,000 notifications, the scan cost increases significantly.

What would you change?
- Replace `SELECT *` with a targeted projection of only the fields required by the API.
- Add a composite index that matches the filter and sort pattern.
- Use the actual column names from the schema consistently: if the database stores `student_id`, `is_read`, and `created_at`, use those names.
- Limit the result set for pagination, e.g. `LIMIT 20 OFFSET 0`.

Likely computation cost:
- Index scan or table scan cost proportional to the number of rows for student `1042`.
- Sorting cost proportional to the number of unread rows for that student.
- If no index exists, the query may require reading all 5,000,000 rows and filtering in memory or via a slow sequential scan.

Is adding indexes on every column safe advice?
- No, it is not safe advice.
- Indexes improve read performance for specific queries, but they increase write cost and storage usage.
- Each insert/update must maintain every index, which is expensive for a write-heavy notification system.
- Indexes should be added only for fields used in WHERE, JOIN, and ORDER BY clauses with sufficient selectivity.
- A composite index on `(studentID, isRead, createdAt DESC)` or `(studentID, isRead, createdAt)` is more effective than indexing every column.

### Recommended schema and indexing

Table: `notifications`
- `notification_id` VARCHAR PRIMARY KEY
- `student_id` VARCHAR NOT NULL
- `notification_type` VARCHAR NOT NULL
- `category` VARCHAR NOT NULL
- `title` TEXT NOT NULL
- `message` TEXT NOT NULL
- `is_read` BOOLEAN NOT NULL DEFAULT FALSE
- `priority` VARCHAR NOT NULL
- `created_at` TIMESTAMP NOT NULL
- `updated_at` TIMESTAMP NOT NULL
- `metadata` JSONB NULL

Indexes:
- `idx_notifications_student_unread_created` on `(student_id, is_read, created_at DESC)`
- `idx_notifications_student_category_created` on `(student_id, category, created_at DESC)`
- Optional `idx_notifications_student_created` on `(student_id, created_at DESC)` for general feed reads

### Improved query

Fetch unread notifications for a student with pagination:

```sql
SELECT notification_id,
       notification_type,
       category,
       title,
       message,
       priority,
       created_at,
       updated_at,
       metadata
FROM notifications
WHERE student_id = '1042'
  AND is_read = FALSE
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

If pagination is required, use a cursor-based approach for better performance:

```sql
SELECT notification_id,
       notification_type,
       category,
       title,
       message,
       priority,
       created_at,
       updated_at,
       metadata
FROM notifications
WHERE student_id = '1042'
  AND is_read = FALSE
  AND created_at < '2026-05-09T00:00:00Z'
ORDER BY created_at DESC
LIMIT 20;
```

### Query for placement notifications in the last 7 days

Assuming `notification_type` can be `Event`, `Result`, or `Placement`, and there is a `created_at` timestamp:

```sql
SELECT DISTINCT student_id
FROM notifications
WHERE notification_type = 'Placement'
  AND created_at >= NOW() - INTERVAL '7 days';
```

If you need student details as well:

```sql
SELECT s.student_id,
       s.name,
       s.email
FROM students s
JOIN notifications n
  ON s.student_id = n.student_id
WHERE n.notification_type = 'Placement'
  AND n.created_at >= NOW() - INTERVAL '7 days'
GROUP BY s.student_id, s.name, s.email;
```

### Summary
- The query is functionally correct but slow without a supporting composite index and targeted column selection.
- Adding indexes on every column is not safe; use indexes only for the actual query patterns.
- Use pagination or cursor-based retrieval to avoid large result sets.
- For last-7-day placement notifications, filter by `notification_type = 'Placement'` and `created_at` with a date range.
