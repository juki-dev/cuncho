import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Esquema inicial. Generada con migration:generate y revisada a mano para
 * añadir lo que TypeORM no expresa en decoradores:
 *  - extensión PostGIS,
 *  - índice GIN en places.descriptors,
 *  - índice compuesto descendente de la bitácora (user_id, created_at DESC, id DESC).
 */

export class InitialSchema1790727838936 implements MigrationInterface {
  name = 'InitialSchema1790727838936';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis`);
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "email" character varying(254) NOT NULL, "password_hash" character varying(255) NOT NULL, "display_name" character varying(80) NOT NULL, "role" character varying(16) NOT NULL DEFAULT 'user', CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_users_email" ON "users" ("email") `);
    await queryRunner.query(
      `CREATE TABLE "tastings" ("id" uuid NOT NULL, "user_id" uuid NOT NULL, "place_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "received_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "variety" character varying(80) NOT NULL, "farm" character varying(120), "region" character varying(120), "process" character varying(16) NOT NULL, "method" character varying(24) NOT NULL, "acidity_level" smallint NOT NULL, "acidity_type" character varying(16) NOT NULL, "notes" text array NOT NULL, "descriptors" text array NOT NULL, "score" numeric(5,2) NOT NULL, "scale" character varying(10) NOT NULL, "normalized_score" numeric(5,2) NOT NULL, CONSTRAINT "chk_tastings_normalized_score" CHECK ("normalized_score" BETWEEN 0 AND 100), CONSTRAINT "chk_tastings_scale" CHECK ("scale" IN ('SCA', 'Personal')), CONSTRAINT "chk_tastings_acidity_type" CHECK ("acidity_type" IN ('Láctica', 'Málica', 'Cítrica', 'Tartárica', 'Fosfórica')), CONSTRAINT "chk_tastings_acidity_level" CHECK ("acidity_level" BETWEEN 1 AND 5), CONSTRAINT "chk_tastings_method" CHECK ("method" IN ('V60', 'Aeropress', 'Espresso', 'Chemex', 'Prensa Francesa')), CONSTRAINT "chk_tastings_process" CHECK ("process" IN ('Lavado', 'Natural', 'Honey', 'Anaeróbico')), CONSTRAINT "PK_1b29076ad06774b7b3cd95327c3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_tastings_place" ON "tastings" ("place_id") `);
    await queryRunner.query(
      `CREATE TABLE "places" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(120) NOT NULL, "location" geography(Point,4326) NOT NULL, "address" character varying(200), "created_by" uuid, "avg_score" numeric(5,2), "tastings_count" integer NOT NULL DEFAULT '0', "descriptors" text array NOT NULL DEFAULT '{}', "notes" text array NOT NULL DEFAULT '{}', "featured" jsonb, CONSTRAINT "PK_1afab86e226b4c3bc9a74465c12" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_places_location" ON "places" USING GiST ("location") `);
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL, "user_id" uuid NOT NULL, "family_id" uuid NOT NULL, "token_hash" character(64) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, "replaced_by" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_refresh_tokens_user" ON "refresh_tokens" ("user_id") `);
    await queryRunner.query(`CREATE INDEX "idx_refresh_tokens_family" ON "refresh_tokens" ("family_id") `);
    await queryRunner.query(
      `ALTER TABLE "tastings" ADD CONSTRAINT "fk_tastings_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tastings" ADD CONSTRAINT "fk_tastings_place" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "places" ADD CONSTRAINT "fk_places_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "fk_refresh_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`CREATE INDEX "idx_places_descriptors" ON "places" USING GIN ("descriptors")`);
    await queryRunner.query(
      `CREATE INDEX "idx_tastings_user_created" ON "tastings" ("user_id", "created_at" DESC, "id" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_tastings_user_created"`);
    await queryRunner.query(`DROP INDEX "public"."idx_places_descriptors"`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "fk_refresh_tokens_user"`);
    await queryRunner.query(`ALTER TABLE "places" DROP CONSTRAINT "fk_places_created_by"`);
    await queryRunner.query(`ALTER TABLE "tastings" DROP CONSTRAINT "fk_tastings_place"`);
    await queryRunner.query(`ALTER TABLE "tastings" DROP CONSTRAINT "fk_tastings_user"`);
    await queryRunner.query(`DROP INDEX "public"."idx_refresh_tokens_family"`);
    await queryRunner.query(`DROP INDEX "public"."idx_refresh_tokens_user"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP INDEX "public"."idx_places_location"`);
    await queryRunner.query(`DROP TABLE "places"`);
    await queryRunner.query(`DROP INDEX "public"."idx_tastings_place"`);
    await queryRunner.query(`DROP TABLE "tastings"`);
    await queryRunner.query(`DROP INDEX "public"."uq_users_email"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
