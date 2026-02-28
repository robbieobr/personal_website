-- Full seed: Insert complete user data with extended job history
INSERT INTO users (name, title, profileImage, bio) VALUES
('John Doe', 'Full Stack Developer',
 '/images/placeholder-profile.png',
 'Passionate full-stack developer with a focus on creating scalable and user-friendly web applications. Experienced with TypeScript, React, Node.js, and MySQL.');

INSERT INTO users (name, title, profileImage, bio) VALUES
('Jane Smith', 'DevOps Engineer',
 '/images/placeholder-profile.png',
 'Experienced DevOps engineer specializing in cloud infrastructure and containerization.');

INSERT INTO users (name, title, profileImage, bio) VALUES
('Alice Johnson', 'Product Manager',
 '/images/placeholder-profile.png',
 'Product manager with passion for building innovative solutions and leading cross-functional teams.');

-- Insert contact info for John Doe (user id 1)
INSERT INTO contact_info (user_id, type, value, display_order) VALUES
(1, 'email', 'john.doe@example.com', 1),
(1, 'phone', '+44 7700 900001', 2),
(1, 'website', 'https://www.johndoe.example.com', 3),
(1, 'github', 'https://github.com/johndoe', 4),
(1, 'linkedin', 'https://www.linkedin.com/in/johndoe', 5);

-- Insert contact info for Jane Smith (user id 2)
INSERT INTO contact_info (user_id, type, value, display_order) VALUES
(2, 'email', 'jane.smith@example.com', 1),
(2, 'phone', '+44 7700 900002', 2),
(2, 'website', 'https://www.janesmith.example.com', 3),
(2, 'github', 'https://github.com/janesmith', 4),
(2, 'linkedin', 'https://www.linkedin.com/in/janesmith', 5);

-- Insert contact info for Alice Johnson (user id 3)
INSERT INTO contact_info (user_id, type, value, display_order) VALUES
(3, 'email', 'alice.johnson@example.com', 1),
(3, 'phone', '+44 7700 900003', 2),
(3, 'website', 'https://www.alicejohnson.example.com', 3),
(3, 'github', 'https://github.com/alicejohnson', 4),
(3, 'linkedin', 'https://www.linkedin.com/in/alicejohnson', 5);
