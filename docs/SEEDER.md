# NexusCRM — Demo Data Seeder

Populates a fresh database with realistic demo data:
- 1 demo organisation
- 5 users (1 admin + 4 reps/managers)
- 30 company accounts
- 120 contacts
- 80 leads
- 60 deals across all pipeline stages
- 200 activities (calls, emails, meetings, tasks)

## Usage
```bash
# With Docker Compose running:
bash seed.sh

# Or directly:
cd backend && python -m app.seed.seeder
```

## Demo Admin Login
```
Email:    admin@demo.nexuscrm.io
Password: Demo1234!
```
