# Task List View

## Overview
Task List View provides a comprehensive table-based view of all tasks in a project with advanced filtering, sorting, and management capabilities.

## Features

### 📊 Statistics Dashboard
- **Total Tasks**: Overview of all tasks in the project
- **High Priority**: Count of high-priority tasks
- **Assigned**: Number of tasks with assignees
- **Unassigned**: Tasks without assignees

### 🔍 Search & Filter
- **Search**: Search by task title or description
- **Priority Filter**: Filter by LOW, MEDIUM, or HIGH priority
- **Assignee Filter**: Filter by project member
- **Status Filter**: Filter by status column

### 📋 Table Features
- **Sortable Columns**: Click column headers to sort
  - Task title
  - Priority
  - Status
  - Assignee
  - Due date
  - Estimated hours
  - Created date
- **Inline Assignee**: Assign tasks directly from the table
- **Visual Indicators**:
  - Priority badges (color-coded)
  - Status badges
  - Overdue date highlights (red with warning icon)

### ✏️ Task Management
- **Create Task**: Create new tasks with the "+ Create Task" button
- **View Details**: Click on task title or View button to open detail modal
- **Assign Members**: Click assignee dropdown to assign/reassign/unassign
- **Update Tasks**: Full CRUD operations through detail modal

### 🎨 UI/UX Features
- **Responsive Design**: Works on desktop and mobile
- **Hover Effects**: Visual feedback on interactive elements
- **Loading States**: Spinners and skeleton screens
- **Empty States**: Helpful messages when no data
- **Toast Notifications**: Success/error feedback

## Usage

### Accessing List View
1. Navigate to a project
2. Click on the "List" tab (with list icon)

### Creating a Task
1. Click "+ Create Task" button
2. Fill in task details
3. Click "Create"

### Assigning a Task
1. Click on the assignee dropdown (or "Assign" button)
2. Select a team member
3. Assignment is saved immediately

### Filtering Tasks
1. Use the search box to find specific tasks
2. Use Priority dropdown to filter by priority
3. Use Assignee dropdown to filter by member

### Sorting Tasks
1. Click on any column header to sort
2. Click again to reverse sort direction
3. Sort indicator shows current sort field and direction

## Component Structure

```
TaskList/
├── index.tsx              # Entry point
├── TaskListView.tsx       # Main component
└── TaskList.scss          # Styles
```

## Dependencies

### Required Components
- `CreateTaskModal` - From BacklogSprint
- `TaskDetailModal` - From BacklogSprint

### API Calls
- `taskAPI.listByProject()` - Fetch all tasks
- `taskAPI.update()` - Update task assignee
- `getProjectMembers()` - Fetch project members

### UI Libraries
- Reactstrap (Cards, Tables, Badges, Dropdowns)
- React Toastify (Notifications)
- React Icons (Remix Icons)

## Styling

### Color Scheme
- **Priority Badges**:
  - HIGH: Red (danger)
  - MEDIUM: Yellow (warning)
  - LOW: Blue (info)
  
- **Status Badges**:
  - Done/Completed: Green (success)
  - In Progress/Doing: Blue (primary)
  - Review: Yellow (warning)
  - Other: Gray (secondary)

### Animations
- Card hover: Lift effect
- Table row hover: Highlight with shadow
- Overdue dates: Pulsing animation

## Technical Notes

### Performance
- Tasks loaded once on component mount
- Client-side filtering and sorting (no extra API calls)
- Optimized re-renders with useMemo for statistics

### State Management
- Local state for tasks, filters, and modals
- No global state required
- Reload tasks after CRUD operations

### Error Handling
- Try-catch blocks for all API calls
- Toast notifications for errors
- Loading states during async operations
- Graceful empty states

## Future Enhancements

Potential improvements:
- [ ] Bulk operations (multi-select)
- [ ] Export to CSV/Excel
- [ ] Advanced filters (date range, tags)
- [ ] Column customization (show/hide)
- [ ] Pagination for large datasets
- [ ] Drag-to-reorder tasks
- [ ] Quick edit inline
- [ ] Task templates

## Browser Support
- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Mobile browsers: ✅
