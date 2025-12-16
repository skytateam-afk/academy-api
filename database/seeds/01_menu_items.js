/**
 * Menu Items Seed with User Type Mappings
 * Created from actual production database
 * Complete: 61 menu items + 238 user type mappings
 */

exports.seed = async function(knex) {
  console.log('🔗 Seeding menu items and user type mappings...');

  // Delete existing data
  await knex('menu_item_user_types').del();
  await knex('menu_items').del();

  // Insert all 61 menu items
  const menuItems = [
  {
    "id": 105,
    "menu_key": "settings",
    "label": "Settings",
    "description": "System settings",
    "route_path": "/settings",
    "route_name": "settings",
    "icon": "Settings",
    "parent_id": null,
    "display_order": 0,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 61,
    "menu_key": "public-home",
    "label": "Home",
    "description": "Public home page",
    "route_path": "/open",
    "route_name": "public-home",
    "icon": "Home",
    "parent_id": null,
    "display_order": 1,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": false,
    "metadata": null
  },
  {
    "id": 66,
    "menu_key": "home-dashboard",
    "label": "Dashboard",
    "description": "Main dashboard",
    "route_path": "/home/dashboard",
    "route_name": "HomeDashboard",
    "icon": "Home",
    "parent_id": 109,
    "display_order": 1,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 69,
    "menu_key": "users",
    "label": "User Management",
    "description": "Manage system users",
    "route_path": "/users",
    "route_name": "users",
    "icon": "Users",
    "parent_id": 110,
    "display_order": 1,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 72,
    "menu_key": "courses",
    "label": "Courses",
    "description": "Course management",
    "route_path": "/courses",
    "route_name": "courses",
    "icon": "BookOpen",
    "parent_id": 111,
    "display_order": 1,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 76,
    "menu_key": "library",
    "label": "Library",
    "description": "Library management",
    "route_path": "/library",
    "route_name": "library",
    "icon": "Library",
    "parent_id": 112,
    "display_order": 1,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 84,
    "menu_key": "shop",
    "label": "Shop",
    "description": "Browse shop",
    "route_path": "/shop",
    "route_name": "shop",
    "icon": "ShoppingBag",
    "parent_id": 113,
    "display_order": 1,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 91,
    "menu_key": "classrooms",
    "label": "Classrooms",
    "description": "Classroom management",
    "route_path": "/classrooms",
    "route_name": "classrooms",
    "icon": "School",
    "parent_id": 114,
    "display_order": 1,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 96,
    "menu_key": "staff",
    "label": "Staff Management",
    "description": "Manage staff members",
    "route_path": "/staff",
    "route_name": "staff",
    "icon": "Users",
    "parent_id": 115,
    "display_order": 1,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 109,
    "menu_key": "group-dashboard",
    "label": "Dashboard",
    "description": null,
    "route_path": null,
    "route_name": null,
    "icon": "LayoutDashboard",
    "parent_id": null,
    "display_order": 1,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 62,
    "menu_key": "public-courses",
    "label": "Courses",
    "description": "Browse available courses",
    "route_path": "/open/courses",
    "route_name": "open-courses",
    "icon": "BookOpen",
    "parent_id": null,
    "display_order": 2,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": false,
    "metadata": null
  },
  {
    "id": 67,
    "menu_key": "home-overview",
    "label": "Overview",
    "description": "System overview",
    "route_path": "/home/overview",
    "route_name": "HomeOverview",
    "icon": "LayoutDashboard",
    "parent_id": 109,
    "display_order": 2,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 70,
    "menu_key": "roles",
    "label": "Role Management",
    "description": "Manage user roles",
    "route_path": "/roles",
    "route_name": "roles",
    "icon": "Shield",
    "parent_id": 110,
    "display_order": 2,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 73,
    "menu_key": "categories",
    "label": "Categories",
    "description": "Manage course categories",
    "route_path": "/categories",
    "route_name": "categories",
    "icon": "Layers",
    "parent_id": 111,
    "display_order": 2,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 77,
    "menu_key": "documents",
    "label": "Documents",
    "description": "Document management",
    "route_path": "/documents",
    "route_name": "documents",
    "icon": "FolderOpen",
    "parent_id": 112,
    "display_order": 2,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 85,
    "menu_key": "shop-products",
    "label": "Product Management",
    "description": "Manage shop products",
    "route_path": "/shop/products",
    "route_name": "shop-products",
    "icon": "Package",
    "parent_id": 113,
    "display_order": 2,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 92,
    "menu_key": "parents",
    "label": "Parents & Guardians",
    "description": "Parent management",
    "route_path": "/parents",
    "route_name": "parents",
    "icon": "UserPlus",
    "parent_id": 114,
    "display_order": 2,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 110,
    "menu_key": "group-user-access",
    "label": "User & Access",
    "description": null,
    "route_path": null,
    "route_name": null,
    "icon": "Users",
    "parent_id": null,
    "display_order": 2,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 63,
    "menu_key": "public-jobs",
    "label": "Jobs",
    "description": "Browse job opportunities",
    "route_path": "/open/jobs",
    "route_name": "open-jobs",
    "icon": "Briefcase",
    "parent_id": null,
    "display_order": 3,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": false,
    "metadata": null
  },
  {
    "id": 68,
    "menu_key": "home-analytics",
    "label": "Analytics",
    "description": "Analytics dashboard",
    "route_path": "/home/analytics",
    "route_name": "HomeAnalytics",
    "icon": "BarChart3",
    "parent_id": 109,
    "display_order": 3,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 71,
    "menu_key": "permissions",
    "label": "Permission Management",
    "description": "Manage permissions",
    "route_path": "/permissions",
    "route_name": "permissions",
    "icon": "Key",
    "parent_id": 110,
    "display_order": 3,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 74,
    "menu_key": "pathways",
    "label": "Career Pathways",
    "description": "Career pathway management",
    "route_path": "/pathways",
    "route_name": "pathways",
    "icon": "Map",
    "parent_id": 111,
    "display_order": 3,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 78,
    "menu_key": "jobs",
    "label": "Jobs",
    "description": "Job management",
    "route_path": "/jobs",
    "route_name": "jobs",
    "icon": "Briefcase",
    "parent_id": 112,
    "display_order": 3,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 86,
    "menu_key": "shop-categories",
    "label": "Shop Categories",
    "description": "Manage shop categories",
    "route_path": "/shop/categories",
    "route_name": "shop-categories",
    "icon": "Layers",
    "parent_id": 113,
    "display_order": 3,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 93,
    "menu_key": "results",
    "label": "Results",
    "description": "Academic results management",
    "route_path": "/results",
    "route_name": "results",
    "icon": "FileText",
    "parent_id": 114,
    "display_order": 3,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 98,
    "menu_key": "subscriptions",
    "label": "Subscription Management",
    "description": "Manage subscriptions",
    "route_path": "/subscriptions",
    "route_name": "subscriptions",
    "icon": "CreditCard",
    "parent_id": 115,
    "display_order": 3,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 111,
    "menu_key": "group-course-content",
    "label": "Course Content",
    "description": null,
    "route_path": null,
    "route_name": null,
    "icon": "BookOpen",
    "parent_id": null,
    "display_order": 3,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 64,
    "menu_key": "public-shop",
    "label": "Shop",
    "description": "Browse shop products",
    "route_path": "/open/shop",
    "route_name": "open-shop",
    "icon": "ShoppingBag",
    "parent_id": null,
    "display_order": 4,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": false,
    "metadata": null
  },
  {
    "id": 75,
    "menu_key": "pathway-applications",
    "label": "Pathway Applications",
    "description": "Review pathway applications",
    "route_path": "/pathway-applications",
    "route_name": "pathway-applications",
    "icon": "FileText",
    "parent_id": 111,
    "display_order": 4,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 79,
    "menu_key": "announcements",
    "label": "Announcements",
    "description": "Announcement management",
    "route_path": "/announcements",
    "route_name": "announcements",
    "icon": "Megaphone",
    "parent_id": 112,
    "display_order": 4,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 87,
    "menu_key": "shop-orders",
    "label": "Orders",
    "description": "Manage shop orders",
    "route_path": "/shop/orders",
    "route_name": "shop-orders",
    "icon": "CreditCard",
    "parent_id": 113,
    "display_order": 4,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 94,
    "menu_key": "result-configuration",
    "label": "Result Configuration",
    "description": "Configure result settings",
    "route_path": "/results/configuration",
    "route_name": "result-configuration",
    "icon": "Settings",
    "parent_id": 114,
    "display_order": 4,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 99,
    "menu_key": "subscription-plans",
    "label": "Subscription Plans",
    "description": "View subscription plans",
    "route_path": "/subscription-plans",
    "route_name": "subscription-plans",
    "icon": "CreditCard",
    "parent_id": 115,
    "display_order": 4,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 108,
    "menu_key": "xp-management",
    "label": "XP Management",
    "description": null,
    "route_path": "/xp",
    "route_name": "xp",
    "icon": "Trophy",
    "parent_id": 110,
    "display_order": 4,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 112,
    "menu_key": "group-institution",
    "label": "Institution",
    "description": null,
    "route_path": null,
    "route_name": null,
    "icon": "Building2",
    "parent_id": null,
    "display_order": 4,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 65,
    "menu_key": "public-contact",
    "label": "Contact",
    "description": "Contact us",
    "route_path": "/open/contact",
    "route_name": "open-contact",
    "icon": "Mail",
    "parent_id": null,
    "display_order": 5,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": false,
    "metadata": null
  },
  {
    "id": 80,
    "menu_key": "promotions",
    "label": "Promotions",
    "description": "Promotion management",
    "route_path": "/promotions",
    "route_name": "promotions",
    "icon": "Tag",
    "parent_id": 112,
    "display_order": 5,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 88,
    "menu_key": "shop-analytics",
    "label": "Shop Analytics",
    "description": "Shop sales analytics",
    "route_path": "/shop/analytics",
    "route_name": "shop-analytics",
    "icon": "BarChart3",
    "parent_id": 113,
    "display_order": 5,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 100,
    "menu_key": "my-subscription",
    "label": "My Subscription",
    "description": "Manage my subscription",
    "route_path": "/subscription",
    "route_name": "subscription-management",
    "icon": "CreditCard",
    "parent_id": 115,
    "display_order": 5,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 113,
    "menu_key": "group-shop",
    "label": "Shop",
    "description": null,
    "route_path": null,
    "route_name": null,
    "icon": "ShoppingBag",
    "parent_id": null,
    "display_order": 5,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 81,
    "menu_key": "notifications",
    "label": "Notifications",
    "description": "View notifications",
    "route_path": "/notifications",
    "route_name": "notifications",
    "icon": "Bell",
    "parent_id": 112,
    "display_order": 6,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 89,
    "menu_key": "cart",
    "label": "Cart",
    "description": "Shopping cart",
    "route_path": "/cart",
    "route_name": "cart",
    "icon": "ShoppingCart",
    "parent_id": 113,
    "display_order": 6,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 114,
    "menu_key": "group-academic",
    "label": "Academic",
    "description": null,
    "route_path": null,
    "route_name": null,
    "icon": "GraduationCap",
    "parent_id": null,
    "display_order": 6,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 83,
    "menu_key": "contact-submissions",
    "label": "Contact Submissions",
    "description": "View contact form submissions",
    "route_path": "/contact-submissions",
    "route_name": "contact-submissions",
    "icon": "Mail",
    "parent_id": 112,
    "display_order": 7,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 90,
    "menu_key": "wishlist",
    "label": "Wishlist",
    "description": "My wishlist",
    "route_path": "/wishlist",
    "route_name": "wishlist",
    "icon": "Heart",
    "parent_id": 113,
    "display_order": 7,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 115,
    "menu_key": "group-operations",
    "label": "Operations",
    "description": null,
    "route_path": null,
    "route_name": null,
    "icon": "Settings",
    "parent_id": null,
    "display_order": 7,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 116,
    "menu_key": "student-courses",
    "label": "Courses",
    "description": null,
    "route_path": "/courses",
    "route_name": null,
    "icon": "BookOpen",
    "parent_id": null,
    "display_order": 10,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": false,
    "metadata": null
  },
  {
    "id": 117,
    "menu_key": "student-pathways",
    "label": "Pathways",
    "description": null,
    "route_path": "/pathways",
    "route_name": null,
    "icon": "Map",
    "parent_id": null,
    "display_order": 11,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": false,
    "metadata": null
  },
  {
    "id": 118,
    "menu_key": "student-library",
    "label": "Library",
    "description": null,
    "route_path": "/library",
    "route_name": null,
    "icon": "Library",
    "parent_id": null,
    "display_order": 12,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": false,
    "metadata": null
  },
  {
    "id": 119,
    "menu_key": "student-shop",
    "label": "Shop",
    "description": null,
    "route_path": "/shop",
    "route_name": null,
    "icon": "ShoppingBag",
    "parent_id": null,
    "display_order": 13,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": false,
    "metadata": null
  },
  {
    "id": 120,
    "menu_key": "student-jobs",
    "label": "Jobs",
    "description": null,
    "route_path": "/jobs",
    "route_name": null,
    "icon": "Briefcase",
    "parent_id": null,
    "display_order": 14,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": false,
    "metadata": null
  },
  {
    "id": 121,
    "menu_key": "student-certificates",
    "label": "Certificates",
    "description": null,
    "route_path": "/certificates",
    "route_name": null,
    "icon": "Award",
    "parent_id": null,
    "display_order": 15,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": false,
    "metadata": null
  },
  {
    "id": 122,
    "menu_key": "student-subscriptions",
    "label": "Subscriptions",
    "description": "View and subscribe to plans",
    "route_path": "/subscription-plans",
    "route_name": "subscription-plans",
    "icon": "CreditCard",
    "parent_id": null,
    "display_order": 16,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": false,
    "metadata": null
  },
  {
    "id": 123,
    "menu_key": "student-announcements",
    "label": "Announcements",
    "description": null,
    "route_path": "/announcements",
    "route_name": null,
    "icon": "Megaphone",
    "parent_id": null,
    "display_order": 17,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": false,
    "metadata": null
  },
  {
    "id": 124,
    "menu_key": "student-notifications",
    "label": "Notifications",
    "description": null,
    "route_path": "/notifications",
    "route_name": null,
    "icon": "Bell",
    "parent_id": null,
    "display_order": 18,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": false,
    "metadata": null
  },
  {
    "id": 125,
    "menu_key": "student-profile",
    "label": "Profile",
    "description": null,
    "route_path": "/profile",
    "route_name": null,
    "icon": "User",
    "parent_id": null,
    "display_order": 19,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": false,
    "metadata": null
  },
  {
    "id": 126,
    "menu_key": "student-documents",
    "label": "Documents",
    "description": null,
    "route_path": "/documents",
    "route_name": null,
    "icon": "FolderOpen",
    "parent_id": null,
    "display_order": 20,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": false,
    "metadata": null
  },
  {
    "id": 127,
    "menu_key": "student-settings",
    "label": "Settings",
    "description": null,
    "route_path": "/settings",
    "route_name": null,
    "icon": "Settings",
    "parent_id": null,
    "display_order": 21,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": false,
    "metadata": null
  },
  {
    "id": 101,
    "menu_key": "profile",
    "label": "Profile",
    "description": "My profile",
    "route_path": "/profile",
    "route_name": "profile",
    "icon": "User",
    "parent_id": null,
    "display_order": 80,
    "is_active": false,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 102,
    "menu_key": "work-profile",
    "label": "Work Profile",
    "description": "Professional work profile",
    "route_path": "/work-profile",
    "route_name": "work-profile",
    "icon": "Briefcase",
    "parent_id": null,
    "display_order": 81,
    "is_active": true,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  },
  {
    "id": 104,
    "menu_key": "certificates",
    "label": "My Certificates",
    "description": "View my certificates",
    "route_path": "/certificates",
    "route_name": "certificates",
    "icon": "Award",
    "parent_id": null,
    "display_order": 83,
    "is_active": false,
    "is_external": false,
    "target": "_self",
    "badge_text": null,
    "badge_variant": null,
    "requires_auth": true,
    "metadata": null
  }
];

  await knex('menu_items').insert(menuItems);
  console.log(`✓ Created ${menuItems.length} menu items`);

  // Insert all 238 user type mappings
  const userTypeMappings = [
  {
    "menu_item_id": 61,
    "user_type": "instructor",
    "is_visible": true
  },
  {
    "menu_item_id": 61,
    "user_type": "parent",
    "is_visible": true
  },
  {
    "menu_item_id": 61,
    "user_type": "public",
    "is_visible": true
  },
  {
    "menu_item_id": 61,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 61,
    "user_type": "student",
    "is_visible": true
  },
  {
    "menu_item_id": 61,
    "user_type": "teacher",
    "is_visible": true
  },
  {
    "menu_item_id": 61,
    "user_type": "user",
    "is_visible": true
  },
  {
    "menu_item_id": 62,
    "user_type": "instructor",
    "is_visible": true
  },
  {
    "menu_item_id": 62,
    "user_type": "public",
    "is_visible": true
  },
  {
    "menu_item_id": 62,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 62,
    "user_type": "student",
    "is_visible": true
  },
  {
    "menu_item_id": 62,
    "user_type": "teacher",
    "is_visible": true
  },
  {
    "menu_item_id": 62,
    "user_type": "user",
    "is_visible": true
  },
  {
    "menu_item_id": 63,
    "user_type": "instructor",
    "is_visible": true
  },
  {
    "menu_item_id": 63,
    "user_type": "public",
    "is_visible": true
  },
  {
    "menu_item_id": 63,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 63,
    "user_type": "student",
    "is_visible": true
  },
  {
    "menu_item_id": 63,
    "user_type": "teacher",
    "is_visible": true
  },
  {
    "menu_item_id": 63,
    "user_type": "user",
    "is_visible": true
  },
  {
    "menu_item_id": 64,
    "user_type": "instructor",
    "is_visible": true
  },
  {
    "menu_item_id": 64,
    "user_type": "public",
    "is_visible": true
  },
  {
    "menu_item_id": 64,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 64,
    "user_type": "student",
    "is_visible": true
  },
  {
    "menu_item_id": 64,
    "user_type": "teacher",
    "is_visible": true
  },
  {
    "menu_item_id": 64,
    "user_type": "user",
    "is_visible": true
  },
  {
    "menu_item_id": 65,
    "user_type": "instructor",
    "is_visible": true
  },
  {
    "menu_item_id": 65,
    "user_type": "public",
    "is_visible": true
  },
  {
    "menu_item_id": 65,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 65,
    "user_type": "student",
    "is_visible": true
  },
  {
    "menu_item_id": 65,
    "user_type": "teacher",
    "is_visible": true
  },
  {
    "menu_item_id": 65,
    "user_type": "user",
    "is_visible": true
  },
  {
    "menu_item_id": 66,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 66,
    "user_type": "instructor",
    "is_visible": true
  },
  {
    "menu_item_id": 66,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 66,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 66,
    "user_type": "teacher",
    "is_visible": true
  },
  {
    "menu_item_id": 67,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 67,
    "user_type": "instructor",
    "is_visible": true
  },
  {
    "menu_item_id": 67,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 67,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 67,
    "user_type": "teacher",
    "is_visible": true
  },
  {
    "menu_item_id": 68,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 68,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 68,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 69,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 69,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 70,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 70,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 71,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 71,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 72,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 72,
    "user_type": "instructor",
    "is_visible": true
  },
  {
    "menu_item_id": 72,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 72,
    "user_type": "student",
    "is_visible": true
  },
  {
    "menu_item_id": 72,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 72,
    "user_type": "teacher",
    "is_visible": true
  },
  {
    "menu_item_id": 72,
    "user_type": "user",
    "is_visible": true
  },
  {
    "menu_item_id": 73,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 73,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 73,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 74,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 74,
    "user_type": "instructor",
    "is_visible": true
  },
  {
    "menu_item_id": 74,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 74,
    "user_type": "student",
    "is_visible": true
  },
  {
    "menu_item_id": 74,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 74,
    "user_type": "teacher",
    "is_visible": true
  },
  {
    "menu_item_id": 74,
    "user_type": "user",
    "is_visible": true
  },
  {
    "menu_item_id": 75,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 75,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 75,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 76,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 76,
    "user_type": "instructor",
    "is_visible": true
  },
  {
    "menu_item_id": 76,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 76,
    "user_type": "student",
    "is_visible": true
  },
  {
    "menu_item_id": 76,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 76,
    "user_type": "teacher",
    "is_visible": true
  },
  {
    "menu_item_id": 76,
    "user_type": "user",
    "is_visible": true
  },
  {
    "menu_item_id": 77,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 77,
    "user_type": "instructor",
    "is_visible": true
  },
  {
    "menu_item_id": 77,
    "user_type": "parent",
    "is_visible": true
  },
  {
    "menu_item_id": 77,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 77,
    "user_type": "student",
    "is_visible": true
  },
  {
    "menu_item_id": 77,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 77,
    "user_type": "teacher",
    "is_visible": true
  },
  {
    "menu_item_id": 77,
    "user_type": "user",
    "is_visible": true
  },
  {
    "menu_item_id": 78,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 78,
    "user_type": "instructor",
    "is_visible": true
  },
  {
    "menu_item_id": 78,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 78,
    "user_type": "student",
    "is_visible": true
  },
  {
    "menu_item_id": 78,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 78,
    "user_type": "teacher",
    "is_visible": true
  },
  {
    "menu_item_id": 78,
    "user_type": "user",
    "is_visible": true
  },
  {
    "menu_item_id": 79,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 79,
    "user_type": "instructor",
    "is_visible": true
  },
  {
    "menu_item_id": 79,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 79,
    "user_type": "student",
    "is_visible": true
  },
  {
    "menu_item_id": 79,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 79,
    "user_type": "teacher",
    "is_visible": true
  },
  {
    "menu_item_id": 79,
    "user_type": "user",
    "is_visible": true
  },
  {
    "menu_item_id": 80,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 80,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 80,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 81,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 81,
    "user_type": "instructor",
    "is_visible": true
  },
  {
    "menu_item_id": 81,
    "user_type": "parent",
    "is_visible": true
  },
  {
    "menu_item_id": 81,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 81,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 81,
    "user_type": "teacher",
    "is_visible": true
  },
  {
    "menu_item_id": 81,
    "user_type": "user",
    "is_visible": true
  },
  {
    "menu_item_id": 83,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 83,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 83,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 84,
    "user_type": "instructor",
    "is_visible": true
  },
  {
    "menu_item_id": 84,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 84,
    "user_type": "user",
    "is_visible": true
  },
  {
    "menu_item_id": 85,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 85,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 85,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 86,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 86,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 86,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 87,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 87,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 87,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 88,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 88,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 88,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 89,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 89,
    "user_type": "instructor",
    "is_visible": true
  },
  {
    "menu_item_id": 89,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 89,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 89,
    "user_type": "teacher",
    "is_visible": true
  },
  {
    "menu_item_id": 89,
    "user_type": "user",
    "is_visible": true
  },
  {
    "menu_item_id": 90,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 90,
    "user_type": "instructor",
    "is_visible": true
  },
  {
    "menu_item_id": 90,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 90,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 90,
    "user_type": "teacher",
    "is_visible": true
  },
  {
    "menu_item_id": 90,
    "user_type": "user",
    "is_visible": true
  },
  {
    "menu_item_id": 91,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 91,
    "user_type": "instructor",
    "is_visible": true
  },
  {
    "menu_item_id": 91,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 91,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 91,
    "user_type": "teacher",
    "is_visible": true
  },
  {
    "menu_item_id": 92,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 92,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 92,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 93,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 93,
    "user_type": "instructor",
    "is_visible": true
  },
  {
    "menu_item_id": 93,
    "user_type": "parent",
    "is_visible": true
  },
  {
    "menu_item_id": 93,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 93,
    "user_type": "student",
    "is_visible": true
  },
  {
    "menu_item_id": 93,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 93,
    "user_type": "teacher",
    "is_visible": true
  },
  {
    "menu_item_id": 94,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 94,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 96,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 96,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 98,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 98,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 98,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 99,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 99,
    "user_type": "instructor",
    "is_visible": true
  },
  {
    "menu_item_id": 99,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 99,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 99,
    "user_type": "teacher",
    "is_visible": true
  },
  {
    "menu_item_id": 99,
    "user_type": "user",
    "is_visible": true
  },
  {
    "menu_item_id": 100,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 100,
    "user_type": "instructor",
    "is_visible": true
  },
  {
    "menu_item_id": 100,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 100,
    "user_type": "student",
    "is_visible": true
  },
  {
    "menu_item_id": 100,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 100,
    "user_type": "teacher",
    "is_visible": true
  },
  {
    "menu_item_id": 100,
    "user_type": "user",
    "is_visible": true
  },
  {
    "menu_item_id": 101,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 101,
    "user_type": "instructor",
    "is_visible": true
  },
  {
    "menu_item_id": 101,
    "user_type": "parent",
    "is_visible": true
  },
  {
    "menu_item_id": 101,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 101,
    "user_type": "student",
    "is_visible": true
  },
  {
    "menu_item_id": 101,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 101,
    "user_type": "teacher",
    "is_visible": true
  },
  {
    "menu_item_id": 101,
    "user_type": "user",
    "is_visible": true
  },
  {
    "menu_item_id": 102,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 102,
    "user_type": "instructor",
    "is_visible": true
  },
  {
    "menu_item_id": 102,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 102,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 102,
    "user_type": "teacher",
    "is_visible": true
  },
  {
    "menu_item_id": 102,
    "user_type": "user",
    "is_visible": true
  },
  {
    "menu_item_id": 104,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 104,
    "user_type": "instructor",
    "is_visible": true
  },
  {
    "menu_item_id": 104,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 104,
    "user_type": "student",
    "is_visible": true
  },
  {
    "menu_item_id": 104,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 104,
    "user_type": "teacher",
    "is_visible": true
  },
  {
    "menu_item_id": 104,
    "user_type": "user",
    "is_visible": true
  },
  {
    "menu_item_id": 105,
    "user_type": "Super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 105,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 105,
    "user_type": "instructor",
    "is_visible": true
  },
  {
    "menu_item_id": 105,
    "user_type": "parent",
    "is_visible": true
  },
  {
    "menu_item_id": 105,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 105,
    "user_type": "student",
    "is_visible": true
  },
  {
    "menu_item_id": 105,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 105,
    "user_type": "teacher",
    "is_visible": true
  },
  {
    "menu_item_id": 105,
    "user_type": "user",
    "is_visible": true
  },
  {
    "menu_item_id": 108,
    "user_type": "Super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 108,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 108,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 109,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 109,
    "user_type": "student",
    "is_visible": true
  },
  {
    "menu_item_id": 109,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 109,
    "user_type": "teacher",
    "is_visible": true
  },
  {
    "menu_item_id": 110,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 110,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 111,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 111,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 111,
    "user_type": "teacher",
    "is_visible": true
  },
  {
    "menu_item_id": 112,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 112,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 113,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 113,
    "user_type": "student",
    "is_visible": true
  },
  {
    "menu_item_id": 113,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 114,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 114,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 114,
    "user_type": "teacher",
    "is_visible": true
  },
  {
    "menu_item_id": 115,
    "user_type": "admin",
    "is_visible": true
  },
  {
    "menu_item_id": 115,
    "user_type": "super_admin",
    "is_visible": true
  },
  {
    "menu_item_id": 116,
    "user_type": "student",
    "is_visible": true
  },
  {
    "menu_item_id": 117,
    "user_type": "student",
    "is_visible": true
  },
  {
    "menu_item_id": 118,
    "user_type": "student",
    "is_visible": true
  },
  {
    "menu_item_id": 119,
    "user_type": "staff",
    "is_visible": true
  },
  {
    "menu_item_id": 120,
    "user_type": "student",
    "is_visible": true
  },
  {
    "menu_item_id": 121,
    "user_type": "student",
    "is_visible": true
  },
  {
    "menu_item_id": 122,
    "user_type": "student",
    "is_visible": true
  },
  {
    "menu_item_id": 123,
    "user_type": "student",
    "is_visible": true
  },
  {
    "menu_item_id": 124,
    "user_type": "student",
    "is_visible": true
  },
  {
    "menu_item_id": 125,
    "user_type": "student",
    "is_visible": true
  },
  {
    "menu_item_id": 126,
    "user_type": "student",
    "is_visible": true
  },
  {
    "menu_item_id": 127,
    "user_type": "student",
    "is_visible": true
  }
];

  await knex('menu_item_user_types').insert(userTypeMappings);
  console.log(`✓ Created ${userTypeMappings.length} user type mappings`);
  
  console.log('\n📊 Summary:');
  console.log('  - Total Menu Items: ' + menuItems.length);
  console.log('  - Total User Type Mappings: ' + userTypeMappings.length);
  console.log('  - User Types: admin, super_admin, instructor, teacher, staff, student, user, parent, public');
};
