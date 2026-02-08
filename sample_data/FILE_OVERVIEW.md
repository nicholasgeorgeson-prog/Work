# File Overview - Sample Data Set

This repository contains two CSV files that model the structure of diagram metadata and resource group information for analytics and dashboard visualization.

## Files Included

| File | Description |
|------|-------------|
| `sample_diagrams.csv` | 35 columns of diagram metadata (see Section 2) |
| `sample_resource_groups.csv` | 7 columns describing resource group roles (see Section 3) |
| `FILE_OVERVIEW.md` | This documentation |

---

## Diagram Metadata CSV (`sample_diagrams.csv`)

### Column Summary

| Column | Data Type | Description |
|--------|-----------|-------------|
| Map Name | text | Logical name of the diagram collection |
| Level | text | Hierarchical level string (e.g., 1.1, 2.3) |
| Diagram Type | text | Type/category (Process Flow, Data Flow, System Context) |
| Diagram Title | text | Title of the diagram |
| Diagram Notation | text | Notation style (Simple, BPMN) |
| Author | text | Person who authored the entry |
| Owner | text | Current responsible owner/team |
| Version | numeric | Version identifier (e.g., 0.35) |
| Date | date | Export/creation date (YYYY-MM-DD) |
| Authorization | text | Current approval state |
| Review Date | date | Date of last review |
| Template | text | Visual template applied |
| Type | text | Lifecycle type (Draft, Approved) |
| Percent Done | integer | Completion percent (0-100) |
| Modified | datetime | Timestamp of last modification |
| User Modified | text | User who performed last modification |
| Contains Drill Down? | Yes/No | Whether drill-down links exist |
| Description | text | Free-form description |
| Status | text | Current status (Active, In Progress, Unclaimed) |
| Org | text | Owning organization |
| URL | URL | Internal diagram URL |
| Diagram Attachments | text | IDs of attached artifacts |
| Primary Contact | text | Point of contact |
| Parent GUID | text | GUID of parent diagram |
| Objects | integer | Number of objects in the diagram |
| Map Path | text | Logical folder hierarchy |
| GUID | text | Unique identifier |
| Last Promoted Date | date | Date of last promotion |
| Last Changed Date | date | Date of last change |
| Changes Since Last Promotion | integer | Count of changes since promotion |
| Change Log | text | Short change-log entry |
| DSLID | text | Identifier for DSL used |
| Max Activity Count | integer | Max activity count |
| Hyperlink | URL | Hyperlink to the diagram |

---

## Resource Group CSV (`sample_resource_groups.csv`)

### Column Summary

| Column | Data Type | Description |
|--------|-----------|-------------|
| Resource Group | text | Functional group name |
| Role Title | text | Job title within the group |
| Hours | integer | Allocated hours |
| Skill Area | text | Required skill areas (semicolon-separated) |
| Additional Info | text | Additional role information |
| ID | integer | Unique role identifier |
| Assignment Status | text | Assignable or Not to be Assigned with reason |

---

## Typical Analytic Scenarios

### Diagram Analytics

| Metric | Calculation | Business Value |
|--------|-------------|----------------|
| Diagrams per Owner | COUNT(*) GROUP BY Owner | Workload distribution |
| Average % Done by Type | AVG(Percent Done) GROUP BY Diagram Type | Identify lagging types |
| Version Distribution | Histogram of Version | Detect outdated diagrams |
| Status Breakdown | COUNT(*) GROUP BY Status | Overall health check |
| Change Frequency | Changes Since Last Promotion / Days | Highlight volatile diagrams |
| Authorization Pipeline | COUNT(*) GROUP BY Authorization | Approval bottlenecks |

### Resource Group Analytics

| Metric | Calculation | Business Value |
|--------|-------------|----------------|
| Roles per Group | COUNT(*) GROUP BY Resource Group | Team sizing |
| Skill Area Coverage | COUNT(*) GROUP BY Skill Area | Capability mapping |
| Assignment Availability | COUNT(*) GROUP BY Assignment Status | Resource planning |
| Unique Roles | COUNT(DISTINCT Role Title) | Role diversity |

---

## Data Loading Example

```python
import pandas as pd

# Load the datasets
diagrams = pd.read_csv('sample_diagrams.csv')
resources = pd.read_csv('sample_resource_groups.csv')

# Basic analysis
print(diagrams.groupby('Diagram Type').size())
print(diagrams.groupby('Status')['Percent Done'].mean())
print(resources.groupby('Resource Group').size())
```
