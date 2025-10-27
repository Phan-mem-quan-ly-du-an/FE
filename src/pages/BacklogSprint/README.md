# Backlog & Sprint Management (Jira-style)

Trang quản lý Backlog và Sprint theo chuẩn Jira với đầy đủ tính năng drag & drop.

## ✨ Tính năng

### 🎯 Sprint Management
- ✅ Tạo Sprint mới
- ✅ Start Sprint (chuyển từ planned → active)
- ✅ Complete Sprint (hoàn thành sprint)
- ✅ Delete Sprint (xóa sprint và chuyển tasks về backlog)
- ✅ Hiển thị trạng thái Sprint (Planned, Active, Completed, etc.)
- ✅ Hiển thị thời gian Sprint (Start date - End date)

### 📋 Backlog Management
- ✅ Hiển thị tất cả tasks chưa được assign vào sprint
- ✅ Thêm task mới vào backlog
- ✅ Kéo thả task từ backlog vào sprint

### 🎫 Task Management
- ✅ Tạo task mới (trong backlog hoặc sprint)
- ✅ Xem chi tiết task
- ✅ Chỉnh sửa task
- ✅ Xóa task
- ✅ Drag & Drop task giữa backlog và sprint
- ✅ Drag & Drop task giữa các sprint
- ✅ Reorder task trong cùng sprint/backlog
- ✅ Hiển thị Priority (LOW, MEDIUM, HIGH, URGENT)
- ✅ Hiển thị Estimated Hours
- ✅ Hiển thị Due Date
- ✅ Tags hỗ trợ

## 🎨 Giao diện

Giao diện được thiết kế theo chuẩn Jira với:
- **Backlog Section** ở trên cùng
- **Sprint Sections** hiển thị theo thứ tự (Active sprint đầu tiên)
- **Task Cards** với đầy đủ thông tin
- **Drag & Drop** mượt mà với visual feedback
- **Modals** để tạo/chỉnh sửa sprint và task

## 🛠️ Backend API Đã Có

Trang này sử dụng các API backend đã có sẵn:

### Sprint API
```
GET    /api/projects/{projectId}/sprints          - Lấy danh sách sprint
POST   /api/projects/{projectId}/sprints          - Tạo sprint mới
PATCH  /api/projects/{projectId}/sprints/{id}     - Cập nhật sprint
DELETE /api/projects/{projectId}/sprints/{id}     - Xóa sprint
```

### Task API
```
GET    /api/projects/{projectId}/tasks            - Lấy danh sách task
POST   /api/projects/{projectId}/tasks            - Tạo task mới
PUT    /api/projects/{projectId}/tasks/{id}       - Cập nhật task
DELETE /api/projects/{projectId}/tasks/{id}       - Xóa task
GET    /api/projects/{projectId}/tasks/{id}       - Xem chi tiết task
```

## 📦 Cấu trúc Files

```
src/pages/BacklogSprint/
├── BacklogSprint.tsx          # Main component
├── BacklogSprint.scss         # Styles
├── CreateSprintModal.tsx      # Modal tạo sprint
├── CreateTaskModal.tsx        # Modal tạo task
├── TaskDetailModal.tsx        # Modal xem/sửa task
└── index.tsx                  # Export

src/apiCaller/
└── backlogSprint.ts           # API calls
```

## 🚀 Cách sử dụng

### 1. Truy cập từ Sidebar

Đã được thêm vào sidebar với icon 📋 **"Backlog & Sprint"** (có badge "New").

Click vào menu item này để mở trang demo.

### 2. Truy cập từ URL

#### Trang chính (trong project):
```
/companies/{companyId}/projects/{projectId}/backlog
```

#### Trang demo (test với project ID bất kỳ):
```
/backlog-demo
```

### 3. Import component (nếu dùng trong code)

```tsx
import BacklogSprint from '../pages/BacklogSprint';

// Trong component
<BacklogSprint projectId={projectId} />
```

### 4. Thêm route (đã có sẵn trong allRoutes.tsx)

```tsx
// Đã được thêm sẵn:
{path: '/companies/:companyId/projects/:projectId/backlog', component: <BacklogSprintPage/>}
{path: '/backlog-demo', component: <BacklogSprintDemo/>}
```

### 5. Link từ Project List (Optional)

Để thêm button "Open Backlog" trong danh sách projects:

```tsx
import { useNavigate } from 'react-router-dom';

const ProjectCard = ({ project, companyId }) => {
  const navigate = useNavigate();
  
  return (
    <button onClick={() => navigate(`/companies/${companyId}/projects/${project.id}/backlog`)}>
      📋 Open Backlog
    </button>
  );
};
```

### 6. Workflow sử dụng

#### Tạo Sprint mới
1. Click nút "Create Sprint"
2. Nhập tên sprint (hoặc click "Generate" để tự động tạo tên)
3. Chọn Start Date và End Date (hoặc click "Set 2-week sprint")
4. Chọn Initial Status (Planned hoặc Active)
5. Click "Create Sprint"

#### Quản lý Tasks trong Backlog
1. Click "Add Task" trong Backlog section
2. Điền thông tin task (Title, Description, Priority, etc.)
3. Click "Create Task"
4. Task sẽ xuất hiện trong Backlog

#### Kéo Task vào Sprint
1. Kéo task từ Backlog và thả vào Sprint section
2. Task sẽ tự động được assign vào sprint đó

#### Start Sprint
1. Tìm sprint có status "Planned"
2. Click nút "Start Sprint"
3. Sprint status chuyển thành "Active"

#### Complete Sprint
1. Tìm sprint có status "Active"
2. Click nút "Complete Sprint"
3. Sprint status chuyển thành "Completed"

## 🎯 Backend cần bổ sung (nếu có)

Hiện tại backend đã đủ để sử dụng cơ bản. Nếu cần nâng cao, có thể bổ sung:

### Optional enhancements:
- [ ] **Bulk move tasks** - API để move nhiều tasks cùng lúc
- [ ] **Sprint velocity** - Tính toán velocity của sprint
- [ ] **Burndown chart** - Biểu đồ theo dõi tiến độ sprint
- [ ] **Task comments** - Bình luận trên task
- [ ] **Task attachments** - Đính kèm files vào task
- [ ] **Task history** - Lịch sử thay đổi task
- [ ] **Sprint report** - Báo cáo khi kết thúc sprint
- [ ] **Assign user to task** - Gán task cho thành viên (API đã có field `assignedTo`)

## 🐛 Xử lý lỗi

Component đã handle các trường hợp:
- ✅ Network errors
- ✅ API errors
- ✅ Loading states
- ✅ Empty states (No tasks, No sprints)
- ✅ Validation errors
- ✅ Drag & Drop errors (reload on failure)

## 🎨 Customization

### Thay đổi màu sắc Priority

File: `BacklogSprint.tsx`
```typescript
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'URGENT': return 'danger';    // Đỏ
    case 'HIGH': return 'warning';     // Vàng
    case 'MEDIUM': return 'info';      // Xanh dương
    case 'LOW': return 'secondary';    // Xám
    default: return 'secondary';
  }
};
```

### Thay đổi màu sắc Sprint Status

```typescript
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'success';      // Xanh lá
    case 'completed': return 'secondary'; // Xám
    case 'planned': return 'primary';     // Xanh dương
    case 'paused': return 'warning';      // Vàng
    case 'cancelled': return 'danger';    // Đỏ
    default: return 'secondary';
  }
};
```

## 📝 Notes

1. **Drag & Drop** sử dụng `react-beautiful-dnd` - thư viện được Atlassian (maker of Jira) tạo ra
2. **Icons** sử dụng `lucide-react` - clean và modern
3. **Styling** sử dụng Bootstrap + SCSS
4. **API Caller** sử dụng class `ApiCaller` đã có trong project
5. Component **hoàn toàn độc lập**, không phụ thuộc vào context hay state global

## 🎓 Best Practices đã áp dụng

- ✅ TypeScript strict types
- ✅ Component composition
- ✅ Error handling
- ✅ Loading states
- ✅ Optimistic updates
- ✅ Accessibility (keyboard navigation)
- ✅ Responsive design
- ✅ Clean code & comments
- ✅ Reusable modals

## 📸 Screenshots

(Khi chạy app, bạn sẽ thấy giao diện tương tự Jira với:)
- Backlog section có thể collapse/expand
- Sprint cards với header chứa thông tin và actions
- Task cards với priority badges, icons, và metadata
- Smooth drag & drop animations
- Professional look & feel

---

**Tác giả:** AI Assistant  
**Ngày tạo:** 2025-10-24  
**Version:** 1.0.0
