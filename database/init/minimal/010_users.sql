-- Minimal seed: Insert minimal user data
INSERT INTO users (name, title, profileImage, bio) VALUES
('Jane Smith', 'Software Engineer',
 '/images/placeholder-profile.png',
 'Software engineer with experience in web development.');

-- Insert contact info for Jane Smith (user id 1)
INSERT INTO contact_info (user_id, type, value, display_order) VALUES
(1, 'email', 'jane.smith@example.com', 1),
(1, 'phone', '+44 7700 900002', 2),
(1, 'website', 'https://www.janesmith.example.com', 3),
(1, 'github', 'https://github.com/janesmith', 4),
(1, 'linkedin', 'https://www.linkedin.com/in/janesmith', 5);
