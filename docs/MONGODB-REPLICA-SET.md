# MongoDB

This app uses the **native MongoDB driver** (not Prisma). A **replica set is not required** — your Coolify or other MongoDB URL works as-is for all reads and writes.

For local development, use `DATABASE_URL` pointing to any MongoDB instance (standalone or Atlas). No replica set setup needed.
