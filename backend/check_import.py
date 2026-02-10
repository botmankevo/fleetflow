"""Check what's in the Excel files vs what was imported"""
import pandas as pd
from sqlalchemy import create_engine, text
import os

# Check Excel files
print("=" * 60)
print("EXCEL FILES ANALYSIS")
print("=" * 60)

brokers_df = pd.read_excel('../seed_data/brokers.xlsx')
print(f'\nBrokers file: {len(brokers_df)} total rows')
print(f'Columns: {brokers_df.columns.tolist()}')
print(f'Empty company names: {brokers_df["Company"].isna().sum()}')
print(f'Valid rows: {len(brokers_df) - brokers_df["Company"].isna().sum()}')

print(f'\nFirst 10 company names:')
for i, name in enumerate(brokers_df['Company'].head(10)):
    print(f'  {i+1}. {name}')

print(f'\nLast 10 company names:')
for i, name in enumerate(brokers_df['Company'].tail(10)):
    print(f'  {len(brokers_df) - 10 + i + 1}. {name}')

print('\n' + '='*60)

shippers_df = pd.read_excel('../seed_data/shippers.xlsx')
print(f'\nShippers file: {len(shippers_df)} total rows')
print(f'Columns: {shippers_df.columns.tolist()}')
print(f'Empty company names: {shippers_df["Company"].isna().sum()}')
print(f'Valid rows: {len(shippers_df) - shippers_df["Company"].isna().sum()}')

print(f'\nFirst 10 company names:')
for i, name in enumerate(shippers_df['Company'].head(10)):
    print(f'  {i+1}. {name}')

# Check database
print('\n' + "=" * 60)
print("DATABASE ANALYSIS")
print("=" * 60)

DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./app.db')
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text('SELECT customer_type, COUNT(*) as count FROM customers GROUP BY customer_type'))
    print('\nDatabase counts:')
    for row in result:
        print(f'  {row[0]}: {row[1]}')
    
    result = conn.execute(text('SELECT COUNT(*) FROM customers'))
    total = result.scalar()
    print(f'\nTotal in database: {total}')

print('\n' + "=" * 60)
print("COMPARISON")
print("=" * 60)
print(f'\nBrokers:')
print(f'  In Excel: {len(brokers_df)}')
print(f'  Imported: 100')
print(f'  Missing: {len(brokers_df) - 100}')

print(f'\nShippers:')
print(f'  In Excel: {len(shippers_df)}')
print(f'  Imported: 55')
print(f'  Missing: {len(shippers_df) - 55}')
