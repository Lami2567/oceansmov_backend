INSERT INTO users (username, password, is_admin)
VALUES (
  'adminuser',
  '$2b$10$QSWoKB3eEiiLkSzAG00PguOZ6MceTE7rSmGT4PEdoqRr3jyl0oNeS',
  TRUE
)
ON CONFLICT (username) DO UPDATE SET is_admin = TRUE; 