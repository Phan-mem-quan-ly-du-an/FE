# Backlog & Sprint Validation Rules

## ✅ Create Sprint Validations

### 1. Sprint Name
- **Required**: Sprint name cannot be empty
- **Minimum length**: 3 characters
- **Maximum length**: 100 characters
- **Error messages**:
  - "Sprint name is required"
  - "Sprint name must be at least 3 characters"
  - "Sprint name must not exceed 100 characters"

### 2. Start Date
- **Required**: Start date must be selected
- **Cannot be in the past**: Start date must be today or in the future
- **HTML validation**: `min={getTodayDate()}` prevents selecting past dates
- **Error message**: "Start date cannot be in the past. Please select today or a future date."

### 3. End Date
- **Required**: End date must be selected
- **Must be after start date**: End date > Start date
- **HTML validation**: `min={formData.startDate || getTodayDate()}` enforces this
- **Error message**: "End date must be after start date"

### 4. Sprint Duration
- **Minimum**: 1 day
- **Maximum**: 90 days (3 months)
- **Recommended**: 7-30 days (1-4 weeks)
- **Warning for unusual duration**: User confirmation required if < 7 days or > 30 days
- **Error messages**:
  - "Sprint duration must be at least 1 day"
  - "Sprint duration cannot exceed 90 days (3 months)"
  - Confirmation dialog: "Sprint duration is X days. Typical sprints are 1-4 weeks (7-30 days). Do you want to continue?"

### 5. Active Sprint Start Date
- **Auto-adjust**: If creating an "active" sprint, start date should be today
- **Warning message**: "Active sprints should start today. Adjusting start date to today."

### 6. Visual Feedback
- **Duration display**: Shows sprint duration in days with color-coded warnings
  - 🟢 Green checkmark: 7-30 days (optimal)
  - ⚠️ Yellow warning: < 7 days (too short) or > 30 days (too long)
- **Date constraints**: HTML min attributes prevent invalid date selection

---

## ✅ Start Sprint Validations

### 1. Active Sprint Check
- **Rule**: Only one active sprint allowed at a time
- **Error message**: "You already have an active sprint. Please complete it before starting a new one."

### 2. Empty Sprint Warning
- **Warning**: If sprint has no tasks
- **Confirmation dialog**: "This sprint has no tasks. Do you want to start it anyway?"
- **Allows proceeding**: User can choose to start empty sprint

### 3. Early Start Warning
- **Warning**: If starting before planned start date
- **Confirmation dialog**: "This sprint is scheduled to start on [date]. Do you want to start it early?"
- **Allows proceeding**: User can choose to start early

### 4. Button Display
- **Only shown when**: `sprint.status === 'planned'`
- **Button style**: Success (green) with Play icon
- **Tooltip**: "Start this sprint"

---

## ✅ Complete Sprint Validations

### 1. Status Check
- **Rule**: Only active sprints can be completed
- **Error message**: "Only active sprints can be completed. Please start the sprint first."

### 2. Incomplete Tasks Warning
- **Check**: Counts tasks not in "Done" or "Completed" status
- **Warning**: Shows count of incomplete tasks
- **Confirmation dialog**: "This sprint has X incomplete task(s). These tasks will be moved back to the backlog. Do you want to complete this sprint?"
- **Allows proceeding**: User can complete sprint with incomplete tasks

### 3. Button Display
- **Only shown when**: `sprint.status === 'active'`
- **Button style**: Primary (blue) with Check icon
- **Tooltip**: "Complete this sprint and move incomplete tasks to backlog"

### 4. Completed Sprint Display
- **Badge shown**: "✓ Completed" (gray badge)
- **Add Task button hidden**: Cannot add tasks to completed sprints

---

## 🎯 UI/UX Improvements

### Date Input Constraints
```tsx
// Start Date
min={getTodayDate()}  // Cannot select past dates

// End Date
min={formData.startDate || getTodayDate()}  // Must be after start date
```

### Sprint Duration Indicator
```tsx
{sprintDuration !== null && (
  <div className="alert alert-info mb-3">
    <strong>Sprint Duration:</strong> {sprintDuration} day(s)
    {/* Color-coded warnings */}
  </div>
)}
```

### Button States
- **Start Sprint**: Only visible for `planned` sprints
- **Complete Sprint**: Only visible for `active` sprints
- **Add Task**: Hidden for `completed` sprints
- **Tooltips**: Added to all action buttons

---

## 📋 Additional Validation Suggestions

### Future Enhancements
1. **Sprint Name Uniqueness**: Check if sprint name already exists in project
2. **Overlapping Sprints**: Warn if date ranges overlap with other sprints
3. **Team Capacity**: Validate against team member availability
4. **Task Estimation**: Warn if total estimated hours exceed sprint capacity
5. **Sprint Velocity**: Compare with historical sprint velocity
6. **Backlog Size**: Warn if moving too many tasks into a sprint
7. **Sprint Goal**: Require sprint goal/objective (optional field made required)
8. **Task Dependencies**: Validate task dependencies before completing sprint

### Backend Validations (Should Also Implement)
1. Validate dates on server side
2. Check user permissions for sprint actions
3. Validate sprint transitions (planned → active → completed)
4. Prevent deleting sprints with completed tasks
5. Audit log for all sprint status changes

---

## 🐛 Bug Fixes

### Complete Sprint Button Issue
**Problem**: Button not clickable
**Root Cause**: Only shown when `sprint.status === 'active'`
**Solution**: 
- Added validation to check sprint status before completing
- Show clear error if trying to complete non-active sprint
- Added tooltip explaining the requirement

### Date Validation Issue
**Problem**: Could create sprints with past dates
**Root Cause**: No frontend validation for past dates
**Solution**:
- Added `min={getTodayDate()}` to date inputs
- Added explicit validation in handleSubmit
- Clear error messages guide user to correct dates

---

## 📝 Testing Checklist

- [ ] Try creating sprint with empty name
- [ ] Try creating sprint with 2-character name
- [ ] Try creating sprint with 101-character name
- [ ] Try selecting start date in the past
- [ ] Try selecting end date before start date
- [ ] Try creating 1-day sprint (should work with warning)
- [ ] Try creating 91-day sprint (should be blocked)
- [ ] Try creating 5-day sprint (should warn but allow)
- [ ] Try starting sprint when another is active
- [ ] Try starting sprint with no tasks (should warn)
- [ ] Try starting sprint before its start date (should warn)
- [ ] Try completing planned sprint (should error)
- [ ] Try completing active sprint with incomplete tasks (should warn)
- [ ] Verify completed sprint shows badge instead of buttons
- [ ] Verify cannot add tasks to completed sprint

