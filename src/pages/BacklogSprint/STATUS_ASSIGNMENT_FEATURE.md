# Task Status & Assignment Feature

## ✨ Features Added

### 1. Status Dropdown (Màn Hình Board)
- **Vị trí**: Header của Task Detail Modal, bên phải title
- **Icon**: CheckCircle (✓)
- **Chức năng**: 
  - Hiển thị status hiện tại của task
  - Click để mở dropdown với danh sách status
  - Màu sắc tự động theo status (TO DO, IN PROGRESS, IN REVIEW, DONE)
  - Update real-time khi chọn status mới

### 2. Assignee Dropdown
- **Vị trí**: Header của Task Detail Modal, bên cạnh Status dropdown
- **Icon**: User (👤)
- **Chức năng**:
  - Hiển thị người được assign hiện tại
  - Click để mở dropdown với danh sách members
  - Option "Unassigned" để bỏ assign
  - Hiển thị email của member trong dropdown
  - Update real-time khi chọn assignee mới

### 3. Task Card Enhancement
- **Status Badge**: Hiển thị status ngay trên task card (nhỏ, màu light)
- **Assignee Indicator**: Icon "Assigned" nếu task có người được assign
- **Priority Badge**: Giữ nguyên ở góc phải

## 🎨 UI/UX Design

### Status Colors
```typescript
const statusColumns = [
  { id: 1, name: 'TO DO', color: '#6b7280' },        // Gray
  { id: 2, name: 'IN PROGRESS', color: '#3b82f6' },  // Blue
  { id: 3, name: 'IN REVIEW', color: '#f59e0b' },    // Orange
  { id: 4, name: 'DONE', color: '#10b981' }          // Green
]
```

### Dropdown Styles
- **Button**: Outline style với màu sắc theo status
- **Split Button**: Cho phép click vào text hoặc arrow
- **Active Item**: Highlighted với background color
- **Hover Effect**: Subtle background change

### Task Card Layout
```
┌─────────────────────────────────────┐
│ #123  [TO DO] [HIGH]                │  ← Header with Status & Priority
│                                     │
│ Task Title Here                     │  ← Title
│ Brief description...                │  ← Description
│                                     │
│ 👤 Assigned  ⏱ 5h  📅 Oct 25       │  ← Footer with meta info
└─────────────────────────────────────┘
```

## 📱 Components Updated

### 1. TaskDetailModal.tsx
**New Imports:**
```typescript
import { CheckCircle, User } from 'lucide-react';
import { Dropdown, ButtonGroup } from 'react-bootstrap';
```

**New State:**
```typescript
const [statusColumns] = useState<StatusColumn[]>([...]);
const [projectMembers] = useState<ProjectMember[]>([...]);
```

**New Functions:**
```typescript
handleStatusChange(statusColumnId, statusName)
handleAssigneeChange(userId, displayName)
getCurrentStatus()
getCurrentAssignee()
getStatusColor(statusName)
```

**New UI:**
- Status Dropdown in Modal Header
- Assignee Dropdown in Modal Header
- Auto-update on selection

### 2. BacklogSprint.tsx
**renderTask() Enhancement:**
- Status badge hiển thị trên card
- Assignee indicator với icon

### 3. BacklogSprint.scss
**New Styles:**
```scss
.modal-header .btn-group { ... }
.dropdown-menu .dropdown-item { ... }
```

## 🔄 Data Flow

### Status Change Flow
```
User clicks Status Dropdown
  → Selects new status
    → handleStatusChange() called
      → Update formData state
        → Call taskAPI.update()
          → Toast notification
            → Reload data via onUpdate()
              → UI reflects new status
```

### Assignee Change Flow
```
User clicks Assignee Dropdown
  → Selects member
    → handleAssigneeChange() called
      → Update formData state
        → Call taskAPI.update()
          → Toast notification
            → Reload data via onUpdate()
              → UI reflects new assignee
```

## 🛠️ API Integration

### Current Implementation (Mock Data)
```typescript
// Mock status columns
const [statusColumns] = useState<StatusColumn[]>([...]);

// Mock project members
const [projectMembers] = useState<ProjectMember[]>([...]);
```

### TODO: Replace with Real API Calls
```typescript
// Fetch status columns from backend
useEffect(() => {
  const fetchStatusColumns = async () => {
    const columns = await statusAPI.listByProject(projectId);
    setStatusColumns(columns);
  };
  fetchStatusColumns();
}, [projectId]);

// Fetch project members from backend
useEffect(() => {
  const fetchMembers = async () => {
    const members = await projectMemberAPI.listByProject(projectId);
    setProjectMembers([
      { userId: 'unassigned', displayName: 'Unassigned', email: '' },
      ...members
    ]);
  };
  fetchMembers();
}, [projectId]);
```

## 🔧 Backend Requirements

### 1. Status Columns API
**Endpoint:** `GET /api/projects/{projectId}/status-columns`
**Response:**
```json
[
  {
    "id": 1,
    "name": "TO DO",
    "color": "#6b7280",
    "orderIndex": 0
  },
  {
    "id": 2,
    "name": "IN PROGRESS",
    "color": "#3b82f6",
    "orderIndex": 1
  }
]
```

### 2. Project Members API
**Endpoint:** `GET /api/projects/{projectId}/members`
**Response:**
```json
[
  {
    "userId": "user-uuid-1",
    "displayName": "John Doe",
    "email": "john@example.com",
    "role": "Developer"
  }
]
```

### 3. Update Task API (Enhanced)
**Endpoint:** `PUT /api/projects/{projectId}/tasks/{taskId}`
**Request Body:**
```json
{
  "title": "Task title",
  "statusColumn": {
    "id": 2,
    "name": "IN PROGRESS"
  },
  "assignedTo": "user-uuid-1",
  "priority": "HIGH"
}
```

## 📋 Testing Checklist

- [ ] Open task detail modal
- [ ] Click Status dropdown
- [ ] Select different status (TO DO → IN PROGRESS → DONE)
- [ ] Verify status updates on task card
- [ ] Click Assignee dropdown
- [ ] Assign task to different members
- [ ] Select "Unassigned" option
- [ ] Verify assignee indicator on task card
- [ ] Check toast notifications appear
- [ ] Verify API calls are made
- [ ] Test error handling (API failure)
- [ ] Test with multiple tasks
- [ ] Verify dropdown closes after selection

## 🎯 User Stories

### Story 1: Change Task Status
```
As a user
I want to change task status from the task detail modal
So that I can track task progress without editing other fields
```

**Acceptance Criteria:**
- ✅ Status dropdown visible in modal header
- ✅ Current status displayed with correct color
- ✅ All available statuses shown in dropdown
- ✅ Status updates immediately on selection
- ✅ Success toast shown
- ✅ Task card reflects new status

### Story 2: Assign Task to Member
```
As a user
I want to assign tasks to team members
So that everyone knows who is responsible for each task
```

**Acceptance Criteria:**
- ✅ Assignee dropdown visible in modal header
- ✅ Current assignee displayed
- ✅ All project members shown in dropdown
- ✅ "Unassigned" option available
- ✅ Assignee updates immediately on selection
- ✅ Success toast shown
- ✅ Task card shows assignee indicator

## 🚀 Future Enhancements

### 1. Avatar Display
- Show user avatar instead of just icon
- Use initials if no avatar available

### 2. Status History
- Track status changes over time
- Show timeline in Activity tab

### 3. Quick Actions
- Right-click context menu on task card
- Quick status change without opening modal

### 4. Bulk Operations
- Select multiple tasks
- Change status/assignee for all at once

### 5. Filters
- Filter tasks by status
- Filter tasks by assignee
- Combine filters

### 6. Custom Status Columns
- Admin can configure status columns
- Drag-drop to reorder columns
- Set custom colors

### 7. Assignment Notifications
- Email notification when assigned
- In-app notification
- Slack/Teams integration

### 8. Workload Indicator
- Show task count per member
- Warn when overloaded
- Balance suggestions

## 📝 Notes

- Mock data hiện tại cần thay bằng API calls thực
- Status colors có thể customize từ backend
- Project members list cần cache để improve performance
- Consider adding loading states cho dropdown actions
- Add debounce nếu API calls quá nhiều

