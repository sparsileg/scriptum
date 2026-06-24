use rusqlite::{Connection, Result};
use crate::constants::CURRENT_SCHEMA_VERSION;
use crate::db::schema;

/// Runs all pending migrations against the open connection.
/// Uses SQLite's PRAGMA user_version to track the applied schema version.
pub fn run_migrations(conn: &Connection) -> Result<()> {
    let version = get_schema_version(conn)?;
    log::info!("Database schema version: {}", version);

    if version < 1 {
        migrate_v1(conn)?;
    }

    // Add future migrations here:
    // if version < 2 { migrate_v2(conn)?; }

    Ok(())
}

/// Migration v1 — initial schema: all four tables.
fn migrate_v1(conn: &Connection) -> Result<()> {
    log::info!("Running migration v1 — creating Scriptum tables");

    conn.execute_batch(&format!(
        "BEGIN;
        {}
        {}
        {}
        {}
        PRAGMA user_version = 1;
        COMMIT;",
        schema::CREATE_BOOKS_READ,
        schema::CREATE_READING_LIST,
        schema::CREATE_MY_LIBRARY,
        schema::CREATE_SETTINGS,
    ))?;

    log::info!("Migration v1 complete");
    Ok(())
}

fn get_schema_version(conn: &Connection) -> Result<u32> {
    let version: u32 = conn.query_row(
        "PRAGMA user_version",
        [],
        |row| row.get(0),
    )?;
    Ok(version)
}

/// Returns the current schema version constant for reference.
#[allow(dead_code)]
pub fn current_version() -> u32 {
    CURRENT_SCHEMA_VERSION
}
