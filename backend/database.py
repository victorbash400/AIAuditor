import sqlite3
import os
from contextlib import contextmanager
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), 'procurement.db')

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tenders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tender_id TEXT UNIQUE NOT NULL,
                procuring_entity TEXT NOT NULL,
                tender_title TEXT NOT NULL,
                category TEXT NOT NULL,
                procurement_method TEXT NOT NULL,
                tender_duration_days INTEGER NOT NULL,
                number_of_bidders INTEGER NOT NULL,
                tender_description TEXT NOT NULL,
                technical_specs TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS contracts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                contract_id TEXT UNIQUE NOT NULL,
                tender_id TEXT NOT NULL,
                supplier_name TEXT NOT NULL,
                item_description TEXT NOT NULL,
                unit_price REAL NOT NULL,
                quantity INTEGER NOT NULL,
                total_value REAL NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tender_id) REFERENCES tenders(tender_id)
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS market_prices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_name TEXT NOT NULL,
                category TEXT NOT NULL,
                unit_price REAL NOT NULL,
                source TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS audit_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tender_id TEXT NOT NULL,
                contract_id TEXT,
                model_type TEXT NOT NULL,
                is_anomaly BOOLEAN NOT NULL,
                anomaly_score REAL,
                explanation TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tender_id) REFERENCES tenders(tender_id)
            )
        ''')

        cursor.execute('CREATE INDEX IF NOT EXISTS idx_tender_id ON audit_results(tender_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_contract_tender ON contracts(tender_id)')

def row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    return dict(row)

class TenderDB:
    @staticmethod
    def get_all() -> List[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM tenders ORDER BY created_at DESC')
            return [row_to_dict(row) for row in cursor.fetchall()]

    @staticmethod
    def get_by_id(tender_id: str) -> Optional[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM tenders WHERE tender_id = ?', (tender_id,))
            row = cursor.fetchone()
            return row_to_dict(row) if row else None

    @staticmethod
    def insert(tender: Dict[str, Any]) -> int:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO tenders (tender_id, procuring_entity, tender_title, category,
                                   procurement_method, tender_duration_days, number_of_bidders,
                                   tender_description, technical_specs)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                tender['tender_id'], tender['procuring_entity'], tender['tender_title'],
                tender['category'], tender['procurement_method'], tender['tender_duration_days'],
                tender['number_of_bidders'], tender['tender_description'], tender.get('technical_specs')
            ))
            return cursor.lastrowid

    @staticmethod
    def delete_all():
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM tenders')

class ContractDB:
    @staticmethod
    def get_all() -> List[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM contracts ORDER BY created_at DESC')
            return [row_to_dict(row) for row in cursor.fetchall()]

    @staticmethod
    def get_by_tender(tender_id: str) -> List[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM contracts WHERE tender_id = ?', (tender_id,))
            return [row_to_dict(row) for row in cursor.fetchall()]

    @staticmethod
    def insert(contract: Dict[str, Any]) -> int:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO contracts (contract_id, tender_id, supplier_name, item_description,
                                     unit_price, quantity, total_value)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                contract['contract_id'], contract['tender_id'], contract['supplier_name'],
                contract['item_description'], contract['unit_price'], contract['quantity'],
                contract['total_value']
            ))
            return cursor.lastrowid

    @staticmethod
    def delete_all():
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM contracts')

class MarketPriceDB:
    @staticmethod
    def get_all() -> List[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM market_prices')
            return [row_to_dict(row) for row in cursor.fetchall()]

    @staticmethod
    def get_by_category(category: str) -> List[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM market_prices WHERE category = ?', (category,))
            return [row_to_dict(row) for row in cursor.fetchall()]

    @staticmethod
    def insert(price: Dict[str, Any]) -> int:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO market_prices (item_name, category, unit_price, source)
                VALUES (?, ?, ?, ?)
            ''', (price['item_name'], price['category'], price['unit_price'], price['source']))
            return cursor.lastrowid

    @staticmethod
    def delete_all():
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM market_prices')

class AuditResultDB:
    @staticmethod
    def get_all() -> List[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM audit_results ORDER BY created_at DESC')
            return [row_to_dict(row) for row in cursor.fetchall()]

    @staticmethod
    def get_by_tender(tender_id: str) -> List[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM audit_results WHERE tender_id = ?', (tender_id,))
            return [row_to_dict(row) for row in cursor.fetchall()]

    @staticmethod
    def insert(result: Dict[str, Any]) -> int:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO audit_results (tender_id, contract_id, model_type, is_anomaly,
                                         anomaly_score, explanation)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                result['tender_id'], result.get('contract_id'), result['model_type'],
                result['is_anomaly'], result.get('anomaly_score'), result['explanation']
            ))
            return cursor.lastrowid

    @staticmethod
    def delete_all():
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM audit_results')

init_db()
