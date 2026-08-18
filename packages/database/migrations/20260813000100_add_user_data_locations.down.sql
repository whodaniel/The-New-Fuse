DROP INDEX IF EXISTS "user_data_locations_external_location_uq";
DROP INDEX IF EXISTS "user_data_locations_verification_idx";
DROP INDEX IF EXISTS "user_data_locations_provider_status_idx";
DROP INDEX IF EXISTS "user_data_locations_project_idx";
DROP INDEX IF EXISTS "user_data_locations_workspace_idx";
DROP INDEX IF EXISTS "user_data_locations_user_idx";

DROP TABLE IF EXISTS "user_data_locations";

DROP TYPE IF EXISTS "UserDataLocationSyncStatus";
DROP TYPE IF EXISTS "UserDataLocationConsentStatus";
DROP TYPE IF EXISTS "UserDataClassification";
DROP TYPE IF EXISTS "UserDataLocationKind";
DROP TYPE IF EXISTS "UserDataLocationProvider";
