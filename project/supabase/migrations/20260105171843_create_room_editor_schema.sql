/*
  # Room Editor Schema

  ## Overview
  This migration creates the database schema for a 2D room editor application.
  Users can create projects, draw room layouts with walls, and add objects like
  windows, doors, and furniture.

  ## New Tables

  1. **projects**
     - `id` (uuid, primary key) - Unique project identifier
     - `name` (text) - Project name
     - `created_at` (timestamptz) - Creation timestamp
     - `updated_at` (timestamptz) - Last update timestamp
     - `data` (jsonb) - Complete project data including canvas state

  2. **room_objects**
     - `id` (uuid, primary key) - Unique object identifier
     - `project_id` (uuid, foreign key) - Reference to project
     - `type` (text) - Object type: 'wall', 'window', 'door', 'furniture'
     - `properties` (jsonb) - Object properties (position, size, rotation, etc.)
     - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - Enable RLS on all tables
  - Public access for demo purposes (no authentication required)
  - In production, restrict to authenticated users only
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Untitled Project',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  data jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS room_objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  type text NOT NULL,
  properties jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to projects"
  ON projects FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to projects"
  ON projects FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to projects"
  ON projects FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to projects"
  ON projects FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to room_objects"
  ON room_objects FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to room_objects"
  ON room_objects FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to room_objects"
  ON room_objects FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to room_objects"
  ON room_objects FOR DELETE
  TO anon
  USING (true);