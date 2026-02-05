/*
  # Add Lead Status Tracking Fields

  ## Description
  Adds fields to support lead status tracking with callback and not interested reasons.

  ## Changes
  1. New Tables
    - `leads` - Main leads table
      - Basic info: id, name, email, phone, city
      - Value and categorization: value, source, stage, priority, status, category
      - Assignment: assigned_caller_id, assigned_caller_name
      - Callback tracking: callback_reason, callback_scheduled_at
      - Not interested tracking: not_interested_reason
      - Project info: project_name
      - Timestamps: created_at, updated_at, next_follow_up
      - Notes: notes

    - `call_logs` - Call history tracking
      - Basic info: id, lead_id, caller_id, caller_name
      - Call details: type, duration, notes, status
      - Timestamps: created_at, next_follow_up

    - `activities` - Activity timeline
      - Basic info: id, lead_id, type, description
      - User info: user_id, user_name
      - Timestamp: created_at

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users

  ## Notes
  - Lead status now includes: interested, callback, not_interested
  - Callback reasons: on_request, not_picked, not_reachable, switched_off
  - Not interested reasons: low_budget, not_a_property_seeker, location_mismatch, dnd, already_bought
*/

-- Create enum types
CREATE TYPE lead_source AS ENUM ('website', 'google_ads', 'referral', 'social_media', 'walk_in', 'other');
CREATE TYPE lead_stage AS ENUM ('new', 'qualified', 'proposal', 'negotiation', 'won', 'lost');
CREATE TYPE lead_priority AS ENUM ('hot', 'warm', 'cold');
CREATE TYPE lead_status AS ENUM ('interested', 'callback', 'not_interested', 'active', 'inactive', 'paused');
CREATE TYPE lead_category AS ENUM ('dubai_property', 'australia_property', 'india_property', 'loans');
CREATE TYPE call_type AS ENUM ('inbound', 'outbound');
CREATE TYPE call_status AS ENUM ('completed', 'missed', 'in_progress');
CREATE TYPE activity_type AS ENUM ('created', 'assigned', 'stage_changed', 'status_changed', 'call_logged', 'note_added', 'edited', 'deleted');
CREATE TYPE callback_reason AS ENUM ('on_request', 'not_picked', 'not_reachable', 'switched_off', 'other');
CREATE TYPE not_interested_reason AS ENUM ('low_budget', 'not_a_property_seeker', 'location_mismatch', 'dnd', 'already_bought', 'other');

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  city text,
  value numeric DEFAULT 0,
  source lead_source DEFAULT 'other',
  stage lead_stage DEFAULT 'new',
  priority lead_priority DEFAULT 'warm',
  status lead_status DEFAULT 'active',
  category lead_category DEFAULT 'india_property',
  assigned_caller_id uuid,
  assigned_caller_name text,
  callback_reason callback_reason,
  callback_scheduled_at timestamptz,
  not_interested_reason not_interested_reason,
  project_name text,
  notes text,
  next_follow_up timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Call logs table
CREATE TABLE IF NOT EXISTS call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  caller_id uuid,
  caller_name text,
  type call_type NOT NULL,
  duration integer DEFAULT 0,
  notes text,
  status call_status DEFAULT 'completed',
  next_follow_up timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type activity_type NOT NULL,
  description text NOT NULL,
  user_id uuid,
  user_name text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads
CREATE POLICY "Users can view all leads"
  ON leads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete leads"
  ON leads FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for call_logs
CREATE POLICY "Users can view all call logs"
  ON call_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert call logs"
  ON call_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update call logs"
  ON call_logs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete call logs"
  ON call_logs FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for activities
CREATE POLICY "Users can view all activities"
  ON activities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert activities"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_caller ON leads(assigned_caller_id);
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up ON leads(next_follow_up);
CREATE INDEX IF NOT EXISTS idx_call_logs_lead_id ON call_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON activities(lead_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for leads
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
