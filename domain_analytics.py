"""
Domain-specific analytics for Diagrams and Resource Groups datasets.
Provides specialized metrics, aggregations, and insights.
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import json


class DiagramAnalyzer:
    """Analyzer for diagram metadata datasets"""

    # Expected columns for diagram data
    REQUIRED_COLUMNS = ['Map Name', 'Diagram Type', 'Owner', 'Status', 'Percent Done']
    OPTIONAL_COLUMNS = [
        'Level', 'Diagram Title', 'Diagram Notation', 'Author', 'Version',
        'Date', 'Authorization', 'Review Date', 'Template', 'Type',
        'Modified', 'User Modified', 'Contains Drill Down?', 'Description',
        'Org', 'Objects', 'Last Promoted Date', 'Last Changed Date',
        'Changes Since Last Promotion', 'Max Activity Count'
    ]

    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()
        self._preprocess()

    def _preprocess(self):
        """Preprocess the dataframe for analysis"""
        # Convert date columns
        date_cols = ['Date', 'Review Date', 'Last Promoted Date', 'Last Changed Date']
        for col in date_cols:
            if col in self.df.columns:
                self.df[col] = pd.to_datetime(self.df[col], errors='coerce')

        # Convert Modified to datetime
        if 'Modified' in self.df.columns:
            self.df['Modified'] = pd.to_datetime(self.df['Modified'], errors='coerce')

        # Convert numeric columns
        numeric_cols = ['Percent Done', 'Objects', 'Changes Since Last Promotion',
                       'Max Activity Count', 'Version']
        for col in numeric_cols:
            if col in self.df.columns:
                self.df[col] = pd.to_numeric(self.df[col], errors='coerce')

        # Extract hierarchy level
        if 'Level' in self.df.columns:
            self.df['Level_Depth'] = self.df['Level'].apply(
                lambda x: len(str(x).split('.')) if pd.notna(x) else 0
            )
            self.df['Top_Level'] = self.df['Level'].apply(
                lambda x: str(x).split('.')[0] if pd.notna(x) else 'Unknown'
            )

    def get_overview_metrics(self) -> Dict[str, Any]:
        """Get high-level overview metrics"""
        total = len(self.df)

        metrics = {
            'total_diagrams': total,
            'unique_owners': self.df['Owner'].nunique() if 'Owner' in self.df.columns else 0,
            'unique_types': self.df['Diagram Type'].nunique() if 'Diagram Type' in self.df.columns else 0,
            'avg_completion': round(self.df['Percent Done'].mean(), 1) if 'Percent Done' in self.df.columns else 0,
            'fully_complete': int((self.df['Percent Done'] == 100).sum()) if 'Percent Done' in self.df.columns else 0,
            'in_progress': int((self.df['Percent Done'] < 100).sum()) if 'Percent Done' in self.df.columns else 0,
            'with_drill_down': int((self.df['Contains Drill Down?'] == 'Yes').sum()) if 'Contains Drill Down?' in self.df.columns else 0,
            'total_objects': int(self.df['Objects'].sum()) if 'Objects' in self.df.columns else 0,
            'avg_objects': round(self.df['Objects'].mean(), 1) if 'Objects' in self.df.columns else 0,
            'total_changes': int(self.df['Changes Since Last Promotion'].sum()) if 'Changes Since Last Promotion' in self.df.columns else 0
        }

        return metrics

    def get_status_distribution(self) -> List[Dict]:
        """Get distribution of diagrams by status"""
        if 'Status' not in self.df.columns:
            return []

        dist = self.df['Status'].value_counts().reset_index()
        dist.columns = ['status', 'count']
        return dist.to_dict(orient='records')

    def get_type_distribution(self) -> List[Dict]:
        """Get distribution of diagrams by type"""
        if 'Diagram Type' not in self.df.columns:
            return []

        dist = self.df['Diagram Type'].value_counts().reset_index()
        dist.columns = ['type', 'count']
        return dist.to_dict(orient='records')

    def get_authorization_distribution(self) -> List[Dict]:
        """Get distribution by authorization status"""
        if 'Authorization' not in self.df.columns:
            return []

        dist = self.df['Authorization'].value_counts().reset_index()
        dist.columns = ['authorization', 'count']
        return dist.to_dict(orient='records')

    def get_owner_workload(self) -> List[Dict]:
        """Get diagram count and average completion by owner"""
        if 'Owner' not in self.df.columns:
            return []

        workload = self.df.groupby('Owner').agg({
            'Map Name': 'count',
            'Percent Done': 'mean',
            'Objects': 'sum' if 'Objects' in self.df.columns else 'count'
        }).reset_index()

        workload.columns = ['owner', 'diagram_count', 'avg_completion', 'total_objects']
        workload['avg_completion'] = workload['avg_completion'].round(1)
        return workload.to_dict(orient='records')

    def get_completion_by_type(self) -> List[Dict]:
        """Get average completion percentage by diagram type"""
        if 'Diagram Type' not in self.df.columns or 'Percent Done' not in self.df.columns:
            return []

        completion = self.df.groupby('Diagram Type').agg({
            'Percent Done': ['mean', 'count']
        }).reset_index()

        completion.columns = ['type', 'avg_completion', 'count']
        completion['avg_completion'] = completion['avg_completion'].round(1)
        return completion.to_dict(orient='records')

    def get_notation_distribution(self) -> List[Dict]:
        """Get distribution by diagram notation"""
        if 'Diagram Notation' not in self.df.columns:
            return []

        dist = self.df['Diagram Notation'].value_counts().reset_index()
        dist.columns = ['notation', 'count']
        return dist.to_dict(orient='records')

    def get_hierarchy_summary(self) -> List[Dict]:
        """Get summary by hierarchy level"""
        if 'Top_Level' not in self.df.columns:
            return []

        summary = self.df.groupby('Top_Level').agg({
            'Map Name': 'count',
            'Percent Done': 'mean'
        }).reset_index()

        summary.columns = ['level', 'count', 'avg_completion']
        summary['avg_completion'] = summary['avg_completion'].round(1)
        return summary.to_dict(orient='records')

    def get_change_activity(self) -> List[Dict]:
        """Get diagrams with most changes since last promotion"""
        if 'Changes Since Last Promotion' not in self.df.columns:
            return []

        top_changes = self.df.nlargest(10, 'Changes Since Last Promotion')[
            ['Map Name', 'Diagram Title', 'Owner', 'Changes Since Last Promotion', 'Status']
        ].copy()

        top_changes.columns = ['map_name', 'title', 'owner', 'changes', 'status']
        return top_changes.to_dict(orient='records')

    def get_org_distribution(self) -> List[Dict]:
        """Get distribution by organization"""
        if 'Org' not in self.df.columns:
            return []

        dist = self.df['Org'].value_counts().reset_index()
        dist.columns = ['org', 'count']
        return dist.to_dict(orient='records')

    def get_lifecycle_summary(self) -> List[Dict]:
        """Get summary by lifecycle type (Draft, Approved, etc.)"""
        if 'Type' not in self.df.columns:
            return []

        summary = self.df.groupby('Type').agg({
            'Map Name': 'count',
            'Percent Done': 'mean'
        }).reset_index()

        summary.columns = ['lifecycle_type', 'count', 'avg_completion']
        summary['avg_completion'] = summary['avg_completion'].round(1)
        return summary.to_dict(orient='records')

    def get_full_analysis(self) -> Dict[str, Any]:
        """Get complete analysis of diagram data"""
        return {
            'overview': self.get_overview_metrics(),
            'status_distribution': self.get_status_distribution(),
            'type_distribution': self.get_type_distribution(),
            'authorization_distribution': self.get_authorization_distribution(),
            'owner_workload': self.get_owner_workload(),
            'completion_by_type': self.get_completion_by_type(),
            'notation_distribution': self.get_notation_distribution(),
            'hierarchy_summary': self.get_hierarchy_summary(),
            'change_activity': self.get_change_activity(),
            'org_distribution': self.get_org_distribution(),
            'lifecycle_summary': self.get_lifecycle_summary()
        }


class ResourceGroupAnalyzer:
    """Analyzer for resource group datasets"""

    REQUIRED_COLUMNS = ['Resource Group', 'Role Title']
    OPTIONAL_COLUMNS = ['Hours', 'Skill Area', 'Additional Info', 'ID', 'Assignment Status']

    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()
        self._preprocess()

    def _preprocess(self):
        """Preprocess the dataframe for analysis"""
        # Convert hours to numeric
        if 'Hours' in self.df.columns:
            self.df['Hours'] = pd.to_numeric(self.df['Hours'], errors='coerce').fillna(0)

        # Parse assignment status
        if 'Assignment Status' in self.df.columns:
            self.df['Is_Assignable'] = self.df['Assignment Status'].apply(
                lambda x: 'Assignable' in str(x) if pd.notna(x) else True
            )
            self.df['Not_Assigned_Reason'] = self.df['Assignment Status'].apply(
                lambda x: str(x).split('Reason:')[1].strip() if 'Reason:' in str(x) else None
            )

        # Parse skill areas (semicolon-separated)
        if 'Skill Area' in self.df.columns:
            self.df['Skill_List'] = self.df['Skill Area'].apply(
                lambda x: [s.strip() for s in str(x).split(';')] if pd.notna(x) else []
            )

    def get_overview_metrics(self) -> Dict[str, Any]:
        """Get high-level overview metrics"""
        total_roles = len(self.df)

        metrics = {
            'total_roles': total_roles,
            'unique_groups': self.df['Resource Group'].nunique() if 'Resource Group' in self.df.columns else 0,
            'unique_titles': self.df['Role Title'].nunique() if 'Role Title' in self.df.columns else 0,
            'total_hours': int(self.df['Hours'].sum()) if 'Hours' in self.df.columns else 0,
            'avg_hours': round(self.df['Hours'].mean(), 1) if 'Hours' in self.df.columns else 0,
            'assignable_count': int(self.df['Is_Assignable'].sum()) if 'Is_Assignable' in self.df.columns else total_roles,
            'not_assignable_count': int((~self.df['Is_Assignable']).sum()) if 'Is_Assignable' in self.df.columns else 0,
            'assignable_rate': round(
                (self.df['Is_Assignable'].sum() / total_roles * 100) if 'Is_Assignable' in self.df.columns else 100, 1
            )
        }

        # Count unique skill areas
        if 'Skill_List' in self.df.columns:
            all_skills = set()
            for skills in self.df['Skill_List']:
                all_skills.update(skills)
            metrics['unique_skill_areas'] = len(all_skills)

        return metrics

    def get_group_distribution(self) -> List[Dict]:
        """Get distribution of roles by resource group"""
        if 'Resource Group' not in self.df.columns:
            return []

        dist = self.df['Resource Group'].value_counts().reset_index()
        dist.columns = ['group', 'count']
        return dist.to_dict(orient='records')

    def get_group_details(self) -> List[Dict]:
        """Get detailed breakdown by resource group"""
        if 'Resource Group' not in self.df.columns:
            return []

        details = self.df.groupby('Resource Group').agg({
            'Role Title': 'count',
            'Hours': 'sum' if 'Hours' in self.df.columns else 'count',
            'Is_Assignable': 'sum' if 'Is_Assignable' in self.df.columns else 'count'
        }).reset_index()

        details.columns = ['group', 'role_count', 'total_hours', 'assignable']
        details['total_hours'] = details['total_hours'].astype(int)
        details['assignable'] = details['assignable'].astype(int)
        return details.to_dict(orient='records')

    def get_assignment_status_distribution(self) -> List[Dict]:
        """Get distribution by assignment status"""
        if 'Assignment Status' not in self.df.columns:
            return []

        # Simplify to Assignable vs Not Assignable
        simple_status = self.df['Assignment Status'].apply(
            lambda x: 'Assignable' if 'Assignable' in str(x) and 'Not' not in str(x) else 'Not Assignable'
        )

        dist = simple_status.value_counts().reset_index()
        dist.columns = ['status', 'count']
        return dist.to_dict(orient='records')

    def get_not_assigned_reasons(self) -> List[Dict]:
        """Get breakdown of reasons for not being assignable"""
        if 'Not_Assigned_Reason' not in self.df.columns:
            return []

        reasons = self.df[self.df['Not_Assigned_Reason'].notna()]['Not_Assigned_Reason'].value_counts().reset_index()
        reasons.columns = ['reason', 'count']
        return reasons.to_dict(orient='records')

    def get_skill_area_distribution(self) -> List[Dict]:
        """Get distribution of roles by skill area"""
        if 'Skill_List' not in self.df.columns:
            return []

        # Flatten skill lists and count
        skill_counts = {}
        for skills in self.df['Skill_List']:
            for skill in skills:
                skill = skill.strip()
                if skill:
                    skill_counts[skill] = skill_counts.get(skill, 0) + 1

        result = [{'skill': k, 'count': v} for k, v in sorted(skill_counts.items(), key=lambda x: -x[1])]
        return result

    def get_roles_by_group(self) -> Dict[str, List[str]]:
        """Get list of role titles per group"""
        if 'Resource Group' not in self.df.columns or 'Role Title' not in self.df.columns:
            return {}

        roles_by_group = self.df.groupby('Resource Group')['Role Title'].apply(list).to_dict()
        return roles_by_group

    def get_full_analysis(self) -> Dict[str, Any]:
        """Get complete analysis of resource group data"""
        return {
            'overview': self.get_overview_metrics(),
            'group_distribution': self.get_group_distribution(),
            'group_details': self.get_group_details(),
            'assignment_status': self.get_assignment_status_distribution(),
            'not_assigned_reasons': self.get_not_assigned_reasons(),
            'skill_areas': self.get_skill_area_distribution(),
            'roles_by_group': self.get_roles_by_group()
        }


def detect_dataset_type(df: pd.DataFrame) -> str:
    """
    Detect the type of dataset based on columns.
    Returns: 'diagrams', 'resource_groups', or 'generic'
    """
    columns = set(df.columns.str.lower())

    # Check for diagram indicators
    diagram_indicators = {'map name', 'diagram type', 'diagram title', 'percent done', 'authorization'}
    if len(columns.intersection(diagram_indicators)) >= 3:
        return 'diagrams'

    # Check for resource group indicators
    resource_indicators = {'resource group', 'role title', 'skill area', 'assignment status'}
    if len(columns.intersection(resource_indicators)) >= 2:
        return 'resource_groups'

    return 'generic'


def analyze_dataset(df: pd.DataFrame, dataset_type: Optional[str] = None) -> Dict[str, Any]:
    """
    Analyze a dataset and return comprehensive metrics.

    Args:
        df: The pandas DataFrame to analyze
        dataset_type: Optional type hint ('diagrams', 'resource_groups', or None for auto-detect)

    Returns:
        Dictionary containing analysis results
    """
    if dataset_type is None:
        dataset_type = detect_dataset_type(df)

    result = {
        'dataset_type': dataset_type,
        'row_count': len(df),
        'column_count': len(df.columns),
        'columns': list(df.columns)
    }

    if dataset_type == 'diagrams':
        analyzer = DiagramAnalyzer(df)
        result['analysis'] = analyzer.get_full_analysis()
    elif dataset_type == 'resource_groups':
        analyzer = ResourceGroupAnalyzer(df)
        result['analysis'] = analyzer.get_full_analysis()
    else:
        # Generic analysis
        result['analysis'] = {
            'overview': {
                'total_rows': len(df),
                'total_columns': len(df.columns),
                'memory_usage': int(df.memory_usage(deep=True).sum())
            },
            'column_types': df.dtypes.astype(str).to_dict(),
            'null_counts': df.isna().sum().to_dict()
        }

    return result
