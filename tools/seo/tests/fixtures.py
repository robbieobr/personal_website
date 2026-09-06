"""Invented deployment sources the tests run against."""

from __future__ import annotations

from tools.seo.metadata import SiteMetadata, build_metadata
from tools.seo.seed import ContactEntry, SiteOwner

HOST = "sample-person.test"

CADDYFILE = """# Reverse proxy for the site
(hardening) {
    encode zstd gzip
    header {
        X-Frame-Options "DENY"
    }
}

sample-person.test {
    import hardening
    reverse_proxy frontend:3000
}

www.sample-person.test {
    import hardening
    redir https://sample-person.test{uri} permanent
}

rugby.sample-person.test {
    import hardening
    reverse_proxy other_app:3000
}
"""

PLACEHOLDER_CADDYFILE = """example.com {
    reverse_proxy frontend:3000
}

www.example.com {
    redir https://example.com{uri} permanent
}
"""

SEED_SQL = """-- Production seed data
USE personal_website;

-- The site owner
INSERT INTO users (name, title, profileImage, bio) VALUES
('Sam O''Toole', 'Staff Platform Engineer',
 'images/sam-profile.jpg',
 'Sam builds resilient delivery platforms for large teams. Previously a backend
engineer, now focused on developer experience, observability and the boring
reliability work that keeps releases dull.');

INSERT INTO contact_info (user_id, type, value, display_order) VALUES
(1, 'phone', '(+353) 000-0000-000', 1),
(1, 'email', 'sam@sample-person.test', 2),
(1, 'website', 'https://www.sample-person.test', 3),
(1, 'github', 'https://github.com/sample-person', 4),
(1, 'linkedin', 'https://www.linkedin.com/in/sample-person', 5);

INSERT INTO job_history (userId, company, position, startDate, endDate, description) VALUES
(1, 'Older Employer', 'Engineer', '2016-01-01', '2019-12-31', 'Did things.'),
(1, 'Northwind Platforms', 'Staff Platform Engineer', '2020-01-01', NULL, 'Does things.');

INSERT INTO education (userId, institution, degree, field, startDate, endDate, description) VALUES
(1, 'Earlier College', 'Certificate', 'Computing', '2010-09-01', '2011-05-31', 'Notes.'),
(1, 'Sample University', 'BSc', 'Computer Science', '2011-09-01', '2015-05-31', 'Notes.');

INSERT INTO skills (userId, skill) VALUES
(1, 'Kubernetes'),
(1, 'Go'),
(1, 'Terraform'),
(1, 'PostgreSQL');
"""

PLACEHOLDER_SEED_SQL = """USE personal_website;

INSERT INTO users (name, title, profileImage, bio) VALUES
('Your Name', 'Your Title', '/images/your-profile.png', 'A short bio about yourself.');

INSERT INTO contact_info (user_id, type, value, display_order) VALUES
(1, 'email', 'you@example.com', 1);
"""

INDEX_HTML = """<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Personal Website</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
"""

OWNER = SiteOwner(
    name="Sam O'Toole",
    title="Staff Platform Engineer",
    bio="Sam builds resilient delivery platforms for large teams.",
    profile_image="images/sam-profile.jpg",
    contacts=(
        ContactEntry(type="phone", value="(+353) 000-0000-000"),
        ContactEntry(type="email", value="sam@sample-person.test"),
        ContactEntry(type="website", value="https://www.sample-person.test"),
        ContactEntry(type="github", value="https://github.com/sample-person"),
        ContactEntry(type="linkedin", value="https://www.linkedin.com/in/sample-person"),
    ),
    skills=("Kubernetes", "Go", "Terraform", "PostgreSQL"),
    employer="Northwind Platforms",
    institution="Sample University",
)

METADATA: SiteMetadata = build_metadata(OWNER, HOST)
