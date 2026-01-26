# Code Style Rules

## TypeScript/React

### Component Structure
```typescript
interface ComponentProps {
  prop1: string;
  prop2?: number;
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // 1. State hooks first
  const [state, setState] = useState<Type>();
  
  // 2. Context hooks
  const { user } = useAuth();
  
  // 3. Effect hooks
  useEffect(() => {
    // Side effects
  }, []);
  
  // 4. Event handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // 5. Render
  return (
    <div className="responsive-classes">
      {/* JSX content */}
    </div>
  );
};
```

### Async Data Fetching
```typescript
const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);
    const result = await apiCall();
    setData(result);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

## JavaScript/Node.js

### Route Handler Structure
```javascript
/**
 * GET /api/resource
 * @route GET /api/resource
 * @access Private (requires authentication)
 */
router.get('/', auth, async (req, res) => {
  try {
    // 1. Validation
    const { param } = req.query;
    
    // 2. Business logic (use service)
    const result = await service.getData(param);
    
    // 3. Response
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Service Layer Pattern
```javascript
/**
 * Get data with role-based filtering
 * @param {string} id - Resource ID
 * @param {string} userRole - User role
 * @returns {Promise<Object>} Data
 */
const getData = async (id, userRole) => {
  const data = await Model.findById(id).lean();
  
  if (userRole === 'viewer') {
    return redactData(data);
  }
  
  return data;
};

module.exports = { getData };
```

## Python

### Type Hints Required
```python
from typing import Optional, Tuple

def validate_image(
    image_base64: str,
    max_size_mb: float = 10.0
) -> Tuple[bool, Optional[str]]:
    """
    Validate image for processing.
    
    Args:
        image_base64: Base64 encoded image data
        max_size_mb: Maximum file size in MB
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Implementation
    return True, None
```

## Tailwind CSS

### Mobile-First Responsive
```typescript
// ✅ GOOD - Mobile first
<div className="p-3 sm:p-6">
<h1 className="text-xl sm:text-3xl">
<button className="w-full sm:w-auto">

// ❌ BAD - Desktop first
<div className="p-6">
```

### Design System Colors
```typescript
// Cards
"bg-slate-800/50 backdrop-blur-xl border border-white/10"

// Primary buttons
"bg-gradient-to-r from-emerald-500 to-teal-600"

// Status colors
// Success: "text-emerald-400 bg-emerald-500/20"
// Warning: "text-amber-400 bg-amber-500/20"
// Error: "text-rose-400 bg-rose-500/20"
// Info: "text-blue-400 bg-blue-500/20"
```

## Anti-Patterns to Avoid

```typescript
// ❌ BAD - Inline styles
<div style={{ color: 'red' }}>

// ❌ BAD - Hardcoded values
const api = "https://api.example.com";

// ❌ BAD - No error handling
const data = await fetch('/api/data');

// ❌ BAD - Duplicate logic in routes
const redact = (list) => { ... }; // Should use service
```
