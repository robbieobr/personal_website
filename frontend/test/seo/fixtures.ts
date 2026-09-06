import type { SiteOwner } from '../../seo/seed';
import { buildMetadata, type SiteMetadata } from '../../seo/metadata';

export const caddyfile = `# Reverse proxy for the site
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
`;

export const placeholderCaddyfile = `example.com {
    reverse_proxy frontend:3000
}

www.example.com {
    redir https://example.com{uri} permanent
}
`;

export const seedSql = `-- Production seed data
USE personal_website;

-- The site owner
INSERT INTO users (name, title, profileImage, bio) VALUES
('Sam O''Toole', 'Staff Platform Engineer',
 'images/sam-profile.jpg',
 'Sam builds resilient delivery platforms for large teams. Previously a backend engineer, now focused on developer experience, observability and the boring reliability work that keeps releases dull.');

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
`;

export const owner: SiteOwner = {
  name: "Sam O'Toole",
  title: 'Staff Platform Engineer',
  bio: 'Sam builds resilient delivery platforms for large teams.',
  profileImage: 'images/sam-profile.jpg',
  contacts: [
    { type: 'phone', value: '(+353) 000-0000-000' },
    { type: 'email', value: 'sam@sample-person.test' },
    { type: 'website', value: 'https://www.sample-person.test' },
    { type: 'github', value: 'https://github.com/sample-person' },
    { type: 'linkedin', value: 'https://www.linkedin.com/in/sample-person' },
  ],
  skills: ['Kubernetes', 'Go', 'Terraform', 'PostgreSQL'],
  employer: 'Northwind Platforms',
  institution: 'Sample University',
};

export const metadata: SiteMetadata = buildMetadata(owner, 'sample-person.test');
