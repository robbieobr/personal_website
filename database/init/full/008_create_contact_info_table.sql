-- Contact info table (BCNF refactoring of email/phone from users)
CREATE TABLE IF NOT EXISTS contact_info (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('email','phone','website','github','linkedin') NOT NULL,
  value VARCHAR(500) NOT NULL,
  display_order INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_contact_type (user_id, type),
  INDEX idx_contact_info_user_id (user_id)
);
