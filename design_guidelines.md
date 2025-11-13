# Design Guidelines: Token-Based Wi-Fi Access System

## Design Approach

**Reference-Based: Modern SaaS Security Tools**
Drawing inspiration from Stripe Dashboard (data clarity), Linear (clean typography), and enterprise security platforms (UniFi, Cisco Meraki) for trust and professionalism. This utility-focused system prioritizes clarity, quick scanning, and confident interactions while maintaining visual polish.

**Core Principles:**
- Instant comprehension: Token status visible at a glance
- Data-first hierarchy: Critical info (expiry, status) always prominent
- Mobile-optimized: Captive portal primarily mobile, admin dual-context
- Trust through clarity: Clean, authoritative interface design

---

## Typography System

**Font Families:**
- Primary: Inter (via Google Fonts CDN)
- Monospace: JetBrains Mono (for tokens/codes)

**Hierarchy:**
- Page titles: text-3xl font-bold (admin dashboard sections)
- Card headers: text-xl font-semibold
- Body text: text-base font-normal
- Tokens/codes: text-lg font-mono tracking-wide
- Labels: text-sm font-medium uppercase tracking-wide
- Timestamps/meta: text-xs text-gray-500

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8
- Component padding: p-6 to p-8
- Section spacing: space-y-6 for cards, space-y-8 for major sections
- Grid gaps: gap-4 to gap-6
- Container max-width: max-w-7xl for admin, max-w-md for captive portal

**Responsive Breakpoints:**
- Mobile-first approach
- Admin dashboard: Single column (mobile) → Two-column sidebar layout (lg:)
- Token grids: 1 column → md:grid-cols-2 → lg:grid-cols-3

---

## Component Library

### 1. Captive Portal (User Interface)

**Layout Structure:**
- Centered card: max-w-md mx-auto with generous vertical spacing (my-20)
- Card styling: rounded-2xl shadow-2xl p-8
- Full mobile viewport optimization

**Hero Section:**
- Network name/logo at top (h-16 object-contain mb-8)
- Welcome heading: text-2xl font-bold mb-2
- Subtitle: text-sm mb-8 explaining 12-hour access

**Token Input Form:**
- Large input field: h-14 rounded-lg border-2 text-center text-lg font-mono
- Placeholder: "Enter your access token"
- Submit button: w-full h-12 rounded-lg font-semibold uppercase tracking-wide
- Button on blurred background if over image

**Status Feedback:**
- Success: Prominent checkmark icon (Heroicons) + "Connected" message
- Error: Alert icon + clear error message
- Loading: Spinner animation during validation

### 2. Admin Dashboard

**Layout:**
- Fixed sidebar (w-64) with navigation on desktop
- Mobile: Collapsible hamburger menu
- Main content: pl-0 lg:pl-64 with max-w-7xl container

**Sidebar Navigation:**
- Icons from Heroicons (outline style)
- Menu items: Generate Tokens, Active Tokens, Token History, Settings
- Each item: flex items-center gap-3 px-4 py-3 rounded-lg

**Dashboard Header:**
- Stats cards row: grid grid-cols-1 md:grid-cols-3 gap-6
- Each stat: rounded-xl p-6 with large number (text-4xl font-bold) and label
- Stats: Total Active, Expiring Soon (< 2 hours), Total Generated Today

### 3. Token Generation Section

**Generator Card:**
- Prominent "Generate New Token" button: h-14 px-8 text-lg font-semibold
- Options below: Number of tokens to generate (input + buttons)
- Generated token display: Large monospace text in bordered container
- Copy button with icon (clipboard) positioned inline

### 4. Active Tokens Table

**Table Layout:**
- Responsive card-based on mobile, table on desktop
- Columns: Token (monospace), Created, Expires, Time Remaining, Status, Actions
- Sortable headers with arrow icons

**Token Display:**
- Monospace font with letter-spacing
- Status badges: rounded-full px-3 py-1 text-xs font-semibold uppercase
  - Active badge with green dot indicator
  - Expiring Soon (< 2 hours) with orange dot
  - Expired with red dot

**Time Remaining:**
- Dynamic countdown: "10h 23m remaining"
- Progress bar visual: h-2 rounded-full (filled portion showing time left)

**Actions:**
- Icon buttons: Revoke (trash icon), Copy (clipboard icon)
- Hover tooltips

### 5. Token History View

**List/Grid Hybrid:**
- Timeline-style on desktop with connecting lines
- Card stack on mobile
- Each entry: Token + creation timestamp + usage timestamp + expiry event

---

## Animations

**Minimal, Purposeful:**
- Token validation: Subtle pulse on input during check
- Success state: Scale-in animation on checkmark (transition-transform duration-200)
- Token copy: Brief success flash
- Sidebar toggle: Smooth slide (transition-all duration-300)

**No continuous animations** – battery/performance priority for mobile portal use

---

## Images

**Captive Portal:**
- Hero: Network/venue logo (h-20 to h-24, centered, mb-8)
- Optional: Subtle background pattern/gradient (low opacity geometric)

**Admin Dashboard:**
- Empty states: Illustration for "No active tokens" (max-w-xs centered)
- Optional: Organization logo in sidebar header (h-8)

**No large hero images** – functional interface prioritizing data and forms

---

## Accessibility

- Form labels explicitly tied to inputs (htmlFor/id)
- ARIA labels on icon-only buttons
- Focus states: ring-2 ring-offset-2 on all interactive elements
- Status conveyed through icons + text (not color alone)
- Keyboard navigation throughout admin interface
- High contrast for token status indicators