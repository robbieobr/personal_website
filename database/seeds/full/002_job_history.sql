-- Full seed: Extended job history data
INSERT INTO job_history (userId, company, position, startDate, endDate, description) VALUES
(1, 'Tech Corp', 'Senior Software Engineer', '2021-03-15', NULL, 'Led development of microservices architecture, mentored junior developers, and improved system performance by 40%.'),
(1, 'StartUp Inc', 'Full Stack Developer', '2019-06-01', '2021-02-28', 'Built and maintained web applications using React and Node.js. Implemented CI/CD pipelines and improved code quality.'),
(1, 'Web Solutions Ltd', 'Junior Developer', '2018-01-15', '2019-05-31', 'Developed frontend components and assisted with backend API development using Express.js and MySQL.'),
(2, 'Cloud Systems Inc', 'Senior DevOps Engineer', '2020-08-15', NULL, 'Managed Kubernetes clusters and automated deployment pipelines. Reduced infrastructure costs by 35%.'),
(2, 'Infrastructure Co', 'DevOps Engineer', '2018-12-01', '2020-07-31', 'Implemented Docker containerization and CI/CD solutions.'),
(3, 'Innovation Labs', 'Senior Product Manager', '2021-05-01', NULL, 'Led product strategy for SaaS platform. Increased user adoption by 200%.'),
(3, 'Digital Solutions', 'Product Manager', '2019-02-15', '2021-04-30', 'Managed product roadmap and coordinated feature releases.');
