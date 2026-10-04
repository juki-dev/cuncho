import { MigrationInterface, QueryRunner } from 'typeorm';

/** Cuentas federadas (Google vía Cognito): sin contraseña y con el `sub` del pool. Compatible hacia atrás. */
export class CognitoIdentity1790900000000 implements MigrationInterface {
  name = 'CognitoIdentity1790900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ADD "cognito_sub" character varying(64)`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_users_cognito_sub" ON "users" ("cognito_sub") WHERE "cognito_sub" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."uq_users_cognito_sub"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "cognito_sub"`);
    // Falla si hay cuentas sin contraseña (Google): borrarlas o asignarles una antes de revertir.
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL`);
  }
}
