"""
File parsers for CSV, JSON, and Excel files with statistics generation
"""
import csv
import json
import hashlib
import os
from datetime import datetime
from typing import Dict, List, Any, Tuple
import pandas as pd
import numpy as np


def calculate_checksum(filepath: str) -> str:
    """Calculate MD5 checksum of a file"""
    hash_md5 = hashlib.md5()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b''):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()


def infer_column_type(series: pd.Series) -> str:
    """Infer the data type of a pandas series"""
    if series.dtype == 'int64' or series.dtype == 'int32':
        return 'integer'
    elif series.dtype == 'float64' or series.dtype == 'float32':
        return 'float'
    elif series.dtype == 'bool':
        return 'boolean'
    elif pd.api.types.is_datetime64_any_dtype(series):
        return 'datetime'
    else:
        # Check if string column might be dates
        sample = series.dropna().head(100)
        if len(sample) > 0:
            try:
                pd.to_datetime(sample)
                return 'datetime'
            except (ValueError, TypeError):
                pass
            # Check if numeric strings
            try:
                pd.to_numeric(sample)
                if all('.' in str(x) for x in sample if pd.notna(x)):
                    return 'float'
                return 'integer'
            except (ValueError, TypeError):
                pass
        return 'string'


def calculate_column_statistics(df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
    """Calculate comprehensive statistics for each column"""
    stats = {}

    for col in df.columns:
        series = df[col]
        col_type = infer_column_type(series)

        col_stats = {
            'type': col_type,
            'null_count': int(series.isna().sum()),
            'unique_count': int(series.nunique()),
            'min_value': None,
            'max_value': None,
            'avg_value': None
        }

        # Calculate type-specific statistics
        non_null = series.dropna()
        if len(non_null) > 0:
            if col_type in ('integer', 'float'):
                try:
                    numeric = pd.to_numeric(non_null, errors='coerce')
                    col_stats['min_value'] = float(numeric.min()) if pd.notna(numeric.min()) else None
                    col_stats['max_value'] = float(numeric.max()) if pd.notna(numeric.max()) else None
                    col_stats['avg_value'] = float(numeric.mean()) if pd.notna(numeric.mean()) else None
                except (ValueError, TypeError):
                    pass
            elif col_type == 'datetime':
                try:
                    dates = pd.to_datetime(non_null, errors='coerce')
                    col_stats['min_value'] = str(dates.min())
                    col_stats['max_value'] = str(dates.max())
                except (ValueError, TypeError):
                    pass
            elif col_type == 'string':
                try:
                    str_series = non_null.astype(str)
                    col_stats['min_value'] = str(min(str_series, key=len))
                    col_stats['max_value'] = str(max(str_series, key=len))
                except (ValueError, TypeError):
                    pass

        stats[col] = col_stats

    return stats


def parse_csv(filepath: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """Parse a CSV file and return DataFrame with metadata"""
    # Try different encodings
    encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
    df = None

    for encoding in encodings:
        try:
            # First, try to detect the delimiter
            with open(filepath, 'r', encoding=encoding) as f:
                sample = f.read(4096)
                dialect = csv.Sniffer().sniff(sample)
                delimiter = dialect.delimiter
        except Exception:
            delimiter = ','

        try:
            df = pd.read_csv(filepath, encoding=encoding, delimiter=delimiter)
            break
        except Exception:
            continue

    if df is None:
        raise ValueError("Could not parse CSV file with any supported encoding")

    metadata = {
        'row_count': len(df),
        'column_count': len(df.columns),
        'columns': list(df.columns),
        'file_size': os.path.getsize(filepath),
        'checksum': calculate_checksum(filepath)
    }

    return df, metadata


def parse_json(filepath: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """Parse a JSON file and return DataFrame with metadata"""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Handle different JSON structures
    if isinstance(data, list):
        df = pd.DataFrame(data)
    elif isinstance(data, dict):
        # Check if it's a single record or nested structure
        if all(isinstance(v, (str, int, float, bool, type(None))) for v in data.values()):
            df = pd.DataFrame([data])
        elif 'data' in data and isinstance(data['data'], list):
            df = pd.DataFrame(data['data'])
        elif 'records' in data and isinstance(data['records'], list):
            df = pd.DataFrame(data['records'])
        elif 'items' in data and isinstance(data['items'], list):
            df = pd.DataFrame(data['items'])
        else:
            # Try to normalize nested JSON
            df = pd.json_normalize(data)
    else:
        raise ValueError("Unsupported JSON structure")

    metadata = {
        'row_count': len(df),
        'column_count': len(df.columns),
        'columns': list(df.columns),
        'file_size': os.path.getsize(filepath),
        'checksum': calculate_checksum(filepath)
    }

    return df, metadata


def parse_excel(filepath: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """Parse an Excel file and return DataFrame with metadata"""
    # Determine the engine based on file extension
    if filepath.endswith('.xlsx'):
        engine = 'openpyxl'
    else:
        engine = 'xlrd'

    # Read all sheets
    excel_file = pd.ExcelFile(filepath, engine=engine)
    sheets = excel_file.sheet_names

    # If multiple sheets, concatenate them with a sheet indicator
    if len(sheets) > 1:
        dfs = []
        for sheet in sheets:
            sheet_df = pd.read_excel(filepath, sheet_name=sheet, engine=engine)
            sheet_df['_sheet_name'] = sheet
            dfs.append(sheet_df)
        df = pd.concat(dfs, ignore_index=True)
    else:
        df = pd.read_excel(filepath, engine=engine)

    metadata = {
        'row_count': len(df),
        'column_count': len(df.columns),
        'columns': list(df.columns),
        'file_size': os.path.getsize(filepath),
        'checksum': calculate_checksum(filepath),
        'sheets': sheets
    }

    return df, metadata


def parse_file(filepath: str, file_type: str) -> Tuple[List[Dict], Dict[str, Any], Dict[str, Dict]]:
    """
    Main entry point for parsing files.
    Returns: (data_rows, metadata, column_statistics)
    """
    parsers = {
        'csv': parse_csv,
        'json': parse_json,
        'xlsx': parse_excel,
        'xls': parse_excel
    }

    if file_type not in parsers:
        raise ValueError(f"Unsupported file type: {file_type}")

    df, metadata = parsers[file_type](filepath)

    # Calculate column statistics
    column_stats = calculate_column_statistics(df)

    # Convert DataFrame to list of dicts, handling NaN values
    df = df.replace({np.nan: None})
    data_rows = df.to_dict(orient='records')

    return data_rows, metadata, column_stats


def get_data_preview(data_rows: List[Dict], num_rows: int = 10) -> List[Dict]:
    """Get a preview of the data"""
    return data_rows[:num_rows]


def get_data_summary(df: pd.DataFrame) -> Dict[str, Any]:
    """Get a comprehensive summary of the DataFrame"""
    summary = {
        'shape': {'rows': len(df), 'columns': len(df.columns)},
        'memory_usage': int(df.memory_usage(deep=True).sum()),
        'dtypes': df.dtypes.astype(str).to_dict(),
        'null_counts': df.isna().sum().to_dict(),
        'numeric_summary': {},
        'categorical_summary': {}
    }

    # Numeric columns summary
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    if len(numeric_cols) > 0:
        summary['numeric_summary'] = df[numeric_cols].describe().to_dict()

    # Categorical columns summary (top 5 values)
    categorical_cols = df.select_dtypes(include=['object']).columns
    for col in categorical_cols[:10]:  # Limit to first 10 categorical columns
        value_counts = df[col].value_counts().head(5).to_dict()
        summary['categorical_summary'][col] = value_counts

    return summary
