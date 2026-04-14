CREATE TABLE events (
  slug        TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  theme       TEXT NOT NULL CHECK (theme IN ('eating','hiking','shopping','games')),
  start_date  TEXT NOT NULL,
  end_date    TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);

CREATE TABLE submissions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  event_slug  TEXT NOT NULL REFERENCES events(slug) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  updated_at  INTEGER NOT NULL,
  UNIQUE (event_slug, name)
);

CREATE TABLE availability (
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  date          TEXT NOT NULL,
  PRIMARY KEY (submission_id, date)
);

CREATE INDEX idx_submissions_event ON submissions(event_slug);
CREATE INDEX idx_availability_submission ON availability(submission_id);
