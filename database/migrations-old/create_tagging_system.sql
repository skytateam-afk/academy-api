-- ============================================
-- System-Wide Tagging/Metadata System
-- Polymorphic tagging that can be applied to any resource
-- ============================================

-- Tags table - stores all tag definitions (both keys and values)
CREATE TABLE IF NOT EXISTS system_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag_key VARCHAR(100) NOT NULL,
    tag_value VARCHAR(255) NOT NULL,
    description TEXT,
    tag_type VARCHAR(20) DEFAULT 'custom' CHECK (tag_type IN ('system', 'custom', 'auto')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tag_key_value UNIQUE (tag_key, tag_value)
);

-- Resource tags - polymorphic table linking tags to any resource
CREATE TABLE IF NOT EXISTS resource_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag_id UUID NOT NULL REFERENCES system_tags(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL, -- 'user', 'course', 'document', 'library_item', etc.
    resource_id UUID NOT NULL,
    tagged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    tagged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_resource_tag UNIQUE (resource_type, resource_id, tag_id)
);

-- Tag categories for organization (optional)
CREATE TABLE IF NOT EXISTS tag_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code for UI
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Link tags to categories
ALTER TABLE system_tags ADD COLUMN category_id UUID REFERENCES tag_categories(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_tags_key ON system_tags(tag_key);
CREATE INDEX IF NOT EXISTS idx_system_tags_value ON system_tags(tag_value);
CREATE INDEX IF NOT EXISTS idx_system_tags_key_value ON system_tags(tag_key, tag_value);
CREATE INDEX IF NOT EXISTS idx_system_tags_created_by ON system_tags(created_by);

CREATE INDEX IF NOT EXISTS idx_resource_tags_tag_id ON resource_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_resource_tags_resource ON resource_tags(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_tags_type ON resource_tags(resource_type);
CREATE INDEX IF NOT EXISTS idx_resource_tags_tagged_by ON resource_tags(tagged_by);

-- Trigger to update updated_at
CREATE TRIGGER update_system_tags_updated_at 
BEFORE UPDATE ON system_tags
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed some common tag categories
INSERT INTO tag_categories (name, description, color, icon) VALUES
('Department', 'Organizational departments', '#3b82f6', 'building'),
('Location', 'Geographic locations', '#10b981', 'map-pin'),
('Status', 'Status indicators', '#f59e0b', 'flag'),
('Project', 'Project associations', '#8b5cf6', 'briefcase'),
('Priority', 'Priority levels', '#ef4444', 'star'),
('Environment', 'Environment types', '#06b6d4', 'server')
ON CONFLICT (name) DO NOTHING;

-- Seed some common system tags
INSERT INTO system_tags (tag_key, tag_value, description, tag_type, category_id) VALUES
-- Departments
('department', 'engineering', 'Engineering department', 'system', (SELECT id FROM tag_categories WHERE name = 'Department')),
('department', 'sales', 'Sales department', 'system', (SELECT id FROM tag_categories WHERE name = 'Department')),
('department', 'marketing', 'Marketing department', 'system', (SELECT id FROM tag_categories WHERE name = 'Department')),
('department', 'hr', 'Human Resources', 'system', (SELECT id FROM tag_categories WHERE name = 'Department')),
('department', 'finance', 'Finance department', 'system', (SELECT id FROM tag_categories WHERE name = 'Department')),

-- Locations
('location', 'lagos', 'Lagos, Nigeria', 'system', (SELECT id FROM tag_categories WHERE name = 'Location')),
('location', 'abuja', 'Abuja, Nigeria', 'system', (SELECT id FROM tag_categories WHERE name = 'Location')),
('location', 'remote', 'Remote/Online', 'system', (SELECT id FROM tag_categories WHERE name = 'Location')),

-- Status
('status', 'active', 'Active status', 'system', (SELECT id FROM tag_categories WHERE name = 'Status')),
('status', 'archived', 'Archived status', 'system', (SELECT id FROM tag_categories WHERE name = 'Status')),
('status', 'pending', 'Pending status', 'system', (SELECT id FROM tag_categories WHERE name = 'Status')),

-- Priority
('priority', 'high', 'High priority', 'system', (SELECT id FROM tag_categories WHERE name = 'Priority')),
('priority', 'medium', 'Medium priority', 'system', (SELECT id FROM tag_categories WHERE name = 'Priority')),
('priority', 'low', 'Low priority', 'system', (SELECT id FROM tag_categories WHERE name = 'Priority')),

-- Environment
('environment', 'production', 'Production environment', 'system', (SELECT id FROM tag_categories WHERE name = 'Environment')),
('environment', 'staging', 'Staging environment', 'system', (SELECT id FROM tag_categories WHERE name = 'Environment')),
('environment', 'development', 'Development environment', 'system', (SELECT id FROM tag_categories WHERE name = 'Environment'))
ON CONFLICT (tag_key, tag_value) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE system_tags IS 'System-wide tags that can be applied to any resource';
COMMENT ON TABLE resource_tags IS 'Polymorphic table linking tags to resources (users, courses, documents, etc.)';
COMMENT ON TABLE tag_categories IS 'Categories for organizing tags';
COMMENT ON COLUMN resource_tags.resource_type IS 'Type of resource: user, course, document, library_item, etc.';
COMMENT ON COLUMN resource_tags.resource_id IS 'UUID of the resource being tagged';
COMMENT ON COLUMN system_tags.tag_type IS 'system=predefined, custom=user-created, auto=automatically generated';
