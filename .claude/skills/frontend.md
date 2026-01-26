# Frontend Development Skill

## Capability
Develop React TypeScript components with Tailwind CSS, following mobile-first design principles.

## Tech Stack
- React 18 with TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- React Router v7 for navigation
- Axios for API calls
- React DatePicker for date inputs

## File Locations
- Components: `frontend/src/components/`
- Mobile components: `frontend/src/components/mobile/`
- Pages: `frontend/src/pages/`
- API Services: `frontend/src/services/api.ts`
- Types: `frontend/src/types/index.ts`
- Hooks: `frontend/src/hooks/`

## Creating a New Component

### Step 1: Define Types
```typescript
// frontend/src/types/index.ts
export interface NewFeature {
  _id: string;
  name: string;
  // ... other fields
}
```

### Step 2: Create Component
```typescript
// frontend/src/components/NewComponent.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getData } from '../services/api';
import { Loader2, AlertCircle } from 'lucide-react';

interface NewComponentProps {
  id: string;
  onClose?: () => void;
}

const NewComponent: React.FC<NewComponentProps> = ({ id, onClose }) => {
  const { user } = useAuth();
  const [data, setData] = useState<DataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getData(id);
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 text-rose-400 bg-rose-500/20 rounded-lg">
        <AlertCircle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-lg border border-white/10 p-4">
      {/* Mobile layout */}
      <div className="sm:hidden">
        {/* Compact mobile content */}
      </div>
      
      {/* Desktop layout */}
      <div className="hidden sm:block">
        {/* Full desktop content */}
      </div>
    </div>
  );
};

export default NewComponent;
```

### Step 3: Add API Method
```typescript
// frontend/src/services/api.ts
export const getData = async (id: string): Promise<DataType> => {
  const response = await api.get(`/resource/${id}`);
  return response.data;
};
```

## Mobile-First Patterns

### Responsive Classes
```typescript
// Padding
<div className="p-3 sm:p-4 md:p-6">

// Text size
<h1 className="text-xl sm:text-2xl md:text-3xl">

// Grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// Show/hide
<div className="sm:hidden">Mobile only</div>
<div className="hidden sm:block">Desktop only</div>
```

### Mobile Component Pattern
For complex mobile UIs, create separate mobile components:
```
components/
├── FeatureTab.tsx           # Desktop version
└── mobile/
    └── MobileFeatureTab.tsx  # Mobile version
```

## Design System

### Cards
```typescript
<div className="bg-slate-800/50 backdrop-blur-xl rounded-lg border border-white/10 p-4">
```

### Buttons
```typescript
// Primary
<button className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-lg transition-all">

// Secondary
<button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all">

// Icon button
<button className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors">
  <Icon className="w-5 h-5" />
</button>
```

### Status Badges
```typescript
// Success
<span className="px-2 py-1 text-xs rounded-full text-emerald-400 bg-emerald-500/20">

// Warning
<span className="px-2 py-1 text-xs rounded-full text-amber-400 bg-amber-500/20">

// Error
<span className="px-2 py-1 text-xs rounded-full text-rose-400 bg-rose-500/20">
```

## Role-Based Rendering
```typescript
const { user } = useAuth();

return (
  <>
    {/* Everyone sees this */}
    <PublicContent />

    {/* Editor+ only */}
    {['editor', 'admin'].includes(user?.role) && <EditorContent />}

    {/* Admin only */}
    {user?.role === 'admin' && <AdminActions />}
  </>
);
```

## Common Pitfalls

1. **Forgetting loading states** - Always show loading spinner
2. **Missing error handling** - Always catch and display errors
3. **Desktop-first design** - Always start with mobile layout
4. **Inline styles** - Use Tailwind classes instead
5. **Hardcoded URLs** - Use environment variables
