# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## 📦 Required Libraries for Sprint Backlog Feature

### Core Dependencies
The Sprint Backlog feature requires the following npm packages:

```bash
# Install all required dependencies
npm install
# or
yarn install
```

### Key Libraries for Sprint Backlog:

1. **Drag & Drop**
   - `react-beautiful-dnd@^13.1.1` - Drag and drop tasks between sprints and backlog
   - `@types/react-beautiful-dnd@^13.1.8` - TypeScript definitions

2. **UI Components**
   - `react-bootstrap@^2.10.10` - Bootstrap components (Modal, Button, Form, Dropdown, etc.)
   - `reactstrap@^9.2.3` - Additional Bootstrap components
   - `bootstrap@5.3.7` - Bootstrap CSS framework

3. **Icons**
   - `lucide-react@^0.460.0` - Icon library (used for sprint/task icons)
   - `feather-icons-react@^0.7.0` - Alternative icon set

4. **Notifications**
   - `react-toastify@^10.0.5` - Toast notifications for success/error messages

5. **HTTP Client**
   - `axios@^1.7.7` - API calls to backend

6. **Routing**
   - `react-router-dom@^6.27.0` - Navigation and URL management

7. **State Management**
   - `@tanstack/react-query@^5.90.2` - Server state management and data fetching
   - `@reduxjs/toolkit@^2.2.8` - Global state management (if needed)

8. **Forms & Validation**
   - `formik@^2.4.6` - Form handling
   - `yup@^1.4.0` - Form validation

9. **Date Handling**
   - `moment@^2.30.1` - Date manipulation for sprint dates
   - `react-flatpickr@^3.10.13` - Date picker component

10. **Utilities**
    - `lodash` - Utility functions (optional)
    - `classnames` - Conditional CSS classes

### TypeScript Support
- `typescript@^5.3.3`
- `@types/react@^19.0.0`
- `@types/react-dom@^19.0.0`
- `@types/node@^22.7.5`

### Development Dependencies
```bash
yarn add -D @types/react-beautiful-dnd
```

## 🚀 Sprint Backlog Features

The Sprint Backlog page includes:
- ✅ Drag & Drop tasks between Backlog and Sprints
- ✅ Create/Edit/Delete Sprints
- ✅ Create/Edit/Delete Tasks
- ✅ Task status management (TO DO, IN PROGRESS, DONE)
- ✅ Assign tasks to team members
- ✅ Set priority (LOW, MEDIUM, HIGH, URGENT)
- ✅ Sprint dates with validation
- ✅ Auto-disable start button when another sprint is active
- ✅ Task detail modal with time tracking
- ✅ Optimistic UI updates with rollback on error

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## 🛠️ Setup Instructions for Sprint Backlog

### 1. Install Dependencies
```bash
# Install all required packages
npm install
# or
yarn install
```

### 2. Verify Key Packages
Check if these packages are installed:
```bash
npm list react-beautiful-dnd
npm list react-bootstrap
npm list react-toastify
npm list @tanstack/react-query
```

### 3. Configure Backend API
Make sure your backend is running on `http://localhost:8088` or update the API base URL in:
- `src/apiCaller/caller/axiosClient.ts`

### 4. Start Development Server
```bash
npm start
# or
yarn start
```

## 🐛 Troubleshooting

### Issue: Drag & Drop not working
**Solution:** Ensure `react-beautiful-dnd` is installed correctly
```bash
yarn add react-beautiful-dnd@^13.1.1
yarn add -D @types/react-beautiful-dnd@^13.1.8
```

### Issue: Icons not displaying
**Solution:** Install missing icon libraries
```bash
yarn add lucide-react@^0.460.0
```

### Issue: Toast notifications not showing
**Solution:** 
1. Check if `react-toastify` is installed
2. Verify ToastContainer is rendered in `App.tsx`
3. Import CSS: `import 'react-toastify/dist/ReactToastify.css'`

### Issue: Sprint dates validation errors
**Solution:** Ensure date format is consistent (YYYY-MM-DD)
```typescript
// Correct format
startDate: "2025-10-29"
endDate: "2025-11-12"
```

### Issue: Tasks not updating after drag & drop
**Solution:** 
1. Check backend API is running
2. Verify API endpoints in `src/apiCaller/backlogSprint.ts`
3. Check browser console for errors

## 📁 Sprint Backlog File Structure

```
src/
├── pages/
│   └── BacklogSprint/
│       ├── BacklogSprint.tsx         # Main component (drag & drop logic)
│       ├── CreateSprintModal.tsx     # Create sprint modal
│       ├── EditSprintModal.tsx       # Edit sprint modal (set dates)
│       ├── CreateTaskModal.tsx       # Create task modal
│       └── TaskDetailModal.tsx       # Task detail modal
├── apiCaller/
│   ├── backlogSprint.ts              # Sprint & Task API calls
│   └── caller/
│       └── apiCaller.tsx             # HTTP client wrapper
└── assets/
    └── scss/
        └── pages/
            ├── BacklogSprint.scss    # Sprint page styles
            └── TaskDetailModal.scss  # Task modal styles
```

## 📚 Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
cd