-- Insert sample user
INSERT INTO users (name, title, profileImage, bio) VALUES
('John Doe', 'Full Stack Developer',
 '/images/placeholder-profile.png',
 'Passionate full-stack developer with a focus on creating scalable and user-friendly web applications. Experienced with TypeScript, React, Node.js, and MySQL.');

-- Insert contact info for John Doe (user id 1)
INSERT INTO contact_info (user_id, type, value, display_order) VALUES
(1, 'email', 'john.doe@example.com', 1),
(1, 'phone', '+44 7700 900001', 2),
(1, 'website', 'https://www.johndoe.example.com', 3),
(1, 'github', 'https://github.com/johndoe', 4),
(1, 'linkedin', 'https://www.linkedin.com/in/johndoe', 5);
