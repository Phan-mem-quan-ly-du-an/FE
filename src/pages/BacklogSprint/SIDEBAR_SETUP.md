# 🎉 Backlog & Sprint - Sidebar Integration

## ✅ Đã hoàn thành

### 1. **Thêm vào Sidebar**
- ✅ Menu item "Backlog & Sprint" với icon 📋
- ✅ Badge "New" màu xanh
- ✅ Link đến `/backlog-demo`

### 2. **Routes**
Đã thêm 2 routes:

```tsx
// Route chính - dùng trong project
/companies/:companyId/projects/:projectId/backlog

// Route demo - test với project ID bất kỳ  
/backlog-demo
```

### 3. **Components**
- ✅ `BacklogSprintPage.tsx` - Wrapper lấy projectId từ URL params
- ✅ `BacklogSprintDemo.tsx` - Demo page với input projectId

### 4. **Dependencies đã cài**
```json
{
  "lucide-react": "^0.460.0",
  "react-beautiful-dnd": "^13.1.1",
  "@types/react-beautiful-dnd": "^13.1.8",
  "react-bootstrap": "latest"
}
```

## 🚀 Cách sử dụng

### Option 1: Từ Sidebar (Demo)
1. Click vào menu **"Backlog & Sprint"** trong sidebar
2. Nhập Project ID vào form
3. Click "Load Project"
4. Bắt đầu quản lý backlog và sprint!

### Option 2: Từ Project (Production)
1. Vào trang Projects: `/companies/{companyId}/projects`
2. Chọn một project
3. Click button "Open Backlog" (cần thêm button này)
4. URL sẽ là: `/companies/{companyId}/projects/{projectId}/backlog`

### Option 3: URL trực tiếp
Truy cập trực tiếp:
```
http://localhost:3000/companies/YOUR_COMPANY_ID/projects/YOUR_PROJECT_ID/backlog
```

## 📝 Thêm button vào Project List (Optional)

Để thêm button "Open Backlog" vào danh sách projects:

```tsx
// Trong ProjectList.tsx hoặc ProjectCard component

import { useNavigate } from 'react-router-dom';
import { List } from 'lucide-react'; // hoặc icon khác

const ProjectCard = ({ project, companyId }) => {
  const navigate = useNavigate();
  
  return (
    <div className="project-card">
      <h3>{project.name}</h3>
      <button 
        className="btn btn-primary"
        onClick={() => navigate(`/companies/${companyId}/projects/${project.id}/backlog`)}
      >
        <List size={16} className="me-2" />
        Open Backlog
      </button>
    </div>
  );
};
```

## 🎨 Sidebar Menu Structure

```
Menu
├── 👥 CompanyMembers
├── 🛡️ CompanyRoles  
├── 📁 Projects
└── 📋 Backlog & Sprint [New] ⭐
```

## 📸 Screenshots

### Sidebar với menu mới:
```
┌──────────────────────────┐
│ Menu                     │
├──────────────────────────┤
│ 👥 CompanyMembers        │
│ 🛡️ CompanyRoles          │
│ 📁 Projects              │
│ 📋 Backlog & Sprint [New]│
└──────────────────────────┘
```

### Demo page:
```
┌─────────────────────────────────────┐
│ 🧪 Backlog & Sprint Demo            │
├─────────────────────────────────────┤
│ ℹ️ Note: Enter a valid Project ID   │
│                                     │
│ Project ID: [________________]      │
│             [Load Project]          │
│                                     │
│ ✅ Active Project: project-123      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📋 Backlog          [+ Add Task]    │
│ ─────────────────────────────────── │
│ [Task cards here...]                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🏃 Sprint 1 [ACTIVE]                │
│ [Sprint tasks here...]              │
└─────────────────────────────────────┘
```

## 🔧 Customization

### Thay đổi icon trong sidebar:

```tsx
// src/Layouts/LayoutMenuData.tsx
{
    id: 'Backlog',
    label: 'Backlog & Sprint',
    icon: <FeatherIcon icon="trello" className="icon-dual" />, // Đổi icon
    badge: {
        variant: 'danger', // Đổi màu badge
        text: 'Hot',       // Đổi text badge
    },
}
```

### Thay đổi route mặc định:

```tsx
// src/Layouts/LayoutMenuData.tsx
link: withCompany((id) => `/companies/${id}/projects/default-project/backlog`),
// Hoặc link tĩnh
link: '/backlog-demo',
```

## 🎯 Next Steps (Optional)

### 1. Thêm breadcrumbs
```tsx
Home > Companies > Projects > Project Name > Backlog & Sprint
```

### 2. Thêm project selector
```tsx
// Dropdown chọn project nhanh
<select onChange={handleProjectChange}>
  <option>Project 1</option>
  <option>Project 2</option>
</select>
```

### 3. Thêm shortcut keyboard
```
Ctrl/Cmd + B → Mở Backlog
Ctrl/Cmd + S → Tạo Sprint mới
```

### 4. Persist last viewed project
```tsx
// Lưu projectId vào localStorage
localStorage.setItem('lastViewedProject', projectId);
```

## 🐛 Troubleshooting

### Issue: "Project ID not found"
**Solution:** Đảm bảo URL có đúng format `/companies/{companyId}/projects/{projectId}/backlog`

### Issue: Badge không hiện
**Solution:** Kiểm tra version của theme/layout, một số theme cần custom badge style

### Issue: Icon không hiển thị
**Solution:** 
```tsx
import FeatherIcon from 'feather-icons-react';
// Hoặc
import { List } from 'lucide-react';
```

## 📚 Tài liệu tham khảo

- [Main README](./README.md) - Chi tiết đầy đủ về components
- [React Router Docs](https://reactrouter.com/) - URL params
- [Feather Icons](https://feathericons.com/) - Danh sách icons

---

**✨ Completed!** Bây giờ bạn có thể truy cập Backlog & Sprint trực tiếp từ sidebar! 🎊
