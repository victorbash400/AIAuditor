/*
  # Create AI Auditor Database Schema

  1. New Tables
    - `tenders`
      - `id` (uuid, primary key)
      - `tender_id` (text, unique)
      - `procuring_entity` (text)
      - `tender_title` (text)
      - `category` (text)
      - `procurement_method` (text) - Open or Restricted
      - `tender_duration_days` (integer)
      - `number_of_bidders` (integer)
      - `tender_description` (text)
      - `technical_specs` (text)
      - `created_at` (timestamptz)
    
    - `contracts`
      - `id` (uuid, primary key)
      - `contract_id` (text, unique)
      - `tender_id` (text, foreign key)
      - `supplier_name` (text)
      - `item_description` (text)
      - `unit_price` (numeric)
      - `quantity` (integer)
      - `total_value` (numeric)
      - `created_at` (timestamptz)
    
    - `market_prices`
      - `id` (uuid, primary key)
      - `item_name` (text)
      - `category` (text)
      - `unit_price` (numeric)
      - `source` (text)
      - `created_at` (timestamptz)
    
    - `audit_results`
      - `id` (uuid, primary key)
      - `tender_id` (text)
      - `contract_id` (text)
      - `model_type` (text) - process, price, or text
      - `is_anomaly` (boolean)
      - `anomaly_score` (numeric)
      - `explanation` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access (audit data is public)
*/

-- Create tenders table
CREATE TABLE IF NOT EXISTS tenders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id text UNIQUE NOT NULL,
  procuring_entity text NOT NULL,
  tender_title text NOT NULL,
  category text NOT NULL,
  procurement_method text NOT NULL,
  tender_duration_days integer NOT NULL,
  number_of_bidders integer NOT NULL,
  tender_description text NOT NULL,
  technical_specs text,
  created_at timestamptz DEFAULT now()
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id text UNIQUE NOT NULL,
  tender_id text NOT NULL,
  supplier_name text NOT NULL,
  item_description text NOT NULL,
  unit_price numeric NOT NULL,
  quantity integer NOT NULL,
  total_value numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create market_prices table
CREATE TABLE IF NOT EXISTS market_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  category text NOT NULL,
  unit_price numeric NOT NULL,
  source text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create audit_results table
CREATE TABLE IF NOT EXISTS audit_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id text,
  contract_id text,
  model_type text NOT NULL,
  is_anomaly boolean NOT NULL DEFAULT false,
  anomaly_score numeric,
  explanation text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tenders_tender_id ON tenders(tender_id);
CREATE INDEX IF NOT EXISTS idx_contracts_tender_id ON contracts(tender_id);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_id ON contracts(contract_id);
CREATE INDEX IF NOT EXISTS idx_market_prices_category ON market_prices(category);
CREATE INDEX IF NOT EXISTS idx_audit_results_tender_id ON audit_results(tender_id);
CREATE INDEX IF NOT EXISTS idx_audit_results_model_type ON audit_results(model_type);

-- Enable RLS
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_results ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (audit data should be transparent)
CREATE POLICY "Public can view all tenders"
  ON tenders FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can view all contracts"
  ON contracts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can view all market prices"
  ON market_prices FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can view all audit results"
  ON audit_results FOR SELECT
  TO anon
  USING (true);

-- Service role can insert data (for data ingestion)
CREATE POLICY "Service role can insert tenders"
  ON tenders FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can insert contracts"
  ON contracts FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can insert market prices"
  ON market_prices FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can insert audit results"
  ON audit_results FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Service role can delete data (for re-running pipeline)
CREATE POLICY "Service role can delete tenders"
  ON tenders FOR DELETE
  TO service_role
  USING (true);

CREATE POLICY "Service role can delete contracts"
  ON contracts FOR DELETE
  TO service_role
  USING (true);

CREATE POLICY "Service role can delete market prices"
  ON market_prices FOR DELETE
  TO service_role
  USING (true);

CREATE POLICY "Service role can delete audit results"
  ON audit_results FOR DELETE
  TO service_role
  USING (true);